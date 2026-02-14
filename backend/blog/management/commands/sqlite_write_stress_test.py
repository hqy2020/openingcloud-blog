from __future__ import annotations

import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import asdict, dataclass
from datetime import date
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import OperationalError, close_old_connections, connection
from django.db.models import F
from django.utils import timezone

from blog.models import Post, PostView, TravelPlace


@dataclass
class TestResult:
    total_requests: int
    concurrency: int
    rounds: int
    locked_errors: int
    other_errors: int
    latency_p50_ms: float
    latency_p95_ms: float
    latency_max_ms: float


def percentile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    sorted_values = sorted(values)
    if len(sorted_values) == 1:
        return sorted_values[0]
    idx = int((len(sorted_values) - 1) * p)
    return sorted_values[idx]


class Command(BaseCommand):
    help = "Run SQLite concurrent write stress test"

    def add_arguments(self, parser):
        parser.add_argument("--concurrency", type=int, default=10)
        parser.add_argument("--rounds", type=int, default=20)
        parser.add_argument("--p95-threshold-ms", type=float, default=100.0)
        parser.add_argument("--report", type=str, default="")
        parser.add_argument("--strict", action="store_true", default=False)

    def handle(self, *args, **options):
        concurrency = options["concurrency"]
        rounds = options["rounds"]
        threshold = options["p95_threshold_ms"]
        report_path = options["report"]
        strict = options["strict"]

        if concurrency <= 0 or rounds <= 0:
            raise CommandError("concurrency and rounds must be > 0")

        target_size = max(10, concurrency)
        view_targets: list[int] = []
        travel_targets: list[int] = []
        sync_targets: list[int] = []

        for index in range(target_size):
            post, _ = Post.objects.get_or_create(
                slug=f"stress-view-{index}",
                defaults={
                    "title": f"Stress View {index}",
                    "excerpt": "sqlite stress target",
                    "content": "stress",
                    "category": Post.Category.TECH,
                    "tags": ["stress", "view"],
                    "draft": False,
                },
            )
            PostView.objects.get_or_create(post=post)
            view_targets.append(post.id)

            travel_place, _ = TravelPlace.objects.get_or_create(
                province="StressProvince",
                city=f"StressCity{index}",
                defaults={
                    "notes": "initial",
                    "visited_at": date.today(),
                    "sort_order": index,
                },
            )
            travel_targets.append(travel_place.id)

            sync_post, _ = Post.objects.get_or_create(
                slug=f"stress-sync-{index}",
                defaults={
                    "title": f"Stress Sync {index}",
                    "excerpt": "sync write",
                    "content": "sync content",
                    "category": Post.Category.TECH,
                    "tags": ["sync", "stress"],
                    "draft": False,
                    "sync_source": Post.SyncSource.OBSIDIAN,
                },
            )
            sync_targets.append(sync_post.id)

        with connection.cursor() as cursor:
            cursor.execute("PRAGMA journal_mode=WAL;")
            journal_mode = cursor.fetchone()[0]

        self.stdout.write(f"SQLite journal_mode={journal_mode}")

        def run_with_retry(fn, retries: int = 10):
            for attempt in range(retries):
                try:
                    return fn()
                except OperationalError as exc:
                    if "locked" not in str(exc).lower() or attempt == retries - 1:
                        raise
                    time.sleep(0.01 * (attempt + 1))

        def run_task(task_id: int):
            close_old_connections()
            start = time.perf_counter()
            try:
                operation = task_id % 3
                target_index = task_id % target_size
                if operation == 0:
                    def op():
                        PostView.objects.filter(post_id=view_targets[target_index]).update(views=F("views") + 1)

                    run_with_retry(op)
                elif operation == 1:
                    def op():
                        TravelPlace.objects.filter(id=travel_targets[target_index]).update(
                            notes=f"admin-write-{task_id}",
                            sort_order=target_index,
                        )

                    run_with_retry(op)
                else:
                    def op():
                        Post.objects.filter(id=sync_targets[target_index]).update(
                            content=f"sync-content-{task_id}",
                            sync_source=Post.SyncSource.OBSIDIAN,
                            obsidian_path=f"/vault/stress-{task_id}.md",
                            last_synced_at=timezone.now(),
                        )

                    run_with_retry(op)
                elapsed_ms = (time.perf_counter() - start) * 1000
                return elapsed_ms, None
            except Exception as exc:  # noqa: BLE001
                elapsed_ms = (time.perf_counter() - start) * 1000
                return elapsed_ms, str(exc)
            finally:
                close_old_connections()

        total_requests = concurrency * rounds
        latencies: list[float] = []
        locked_errors = 0
        other_errors = 0

        with ThreadPoolExecutor(max_workers=concurrency) as executor:
            futures = [executor.submit(run_task, i) for i in range(total_requests)]
            for future in as_completed(futures):
                latency, error = future.result()
                latencies.append(latency)
                if error:
                    if "locked" in error.lower():
                        locked_errors += 1
                    else:
                        other_errors += 1

        result = TestResult(
            total_requests=total_requests,
            concurrency=concurrency,
            rounds=rounds,
            locked_errors=locked_errors,
            other_errors=other_errors,
            latency_p50_ms=round(percentile(latencies, 0.5), 2),
            latency_p95_ms=round(percentile(latencies, 0.95), 2),
            latency_max_ms=round(max(latencies) if latencies else 0.0, 2),
        )

        self.stdout.write(self.style.SUCCESS(json.dumps(asdict(result), ensure_ascii=False)))

        if report_path:
            path = Path(report_path)
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(asdict(result), ensure_ascii=False, indent=2), encoding="utf-8")
            self.stdout.write(f"Report saved to: {path}")

        if strict and (result.locked_errors > 0 or result.latency_p95_ms > threshold):
            raise CommandError(
                f"Stress test failed: locked_errors={result.locked_errors}, p95={result.latency_p95_ms}ms (threshold={threshold}ms)"
            )
