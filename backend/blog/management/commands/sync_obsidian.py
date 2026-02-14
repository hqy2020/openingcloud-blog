from __future__ import annotations

import json
import os
from datetime import datetime
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

import frontmatter
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from blog.models import Post, SyncLog
from sync.mapper import resolve_category, resolve_slug
from sync.parser import build_excerpt, contains_publish_tag, normalize_tags, remove_publish_tag
from sync.scanner import scan_markdown_files
from sync.service import reconcile_obsidian_publications, sync_post_payload

DEFAULT_INCLUDE_ROOTS = [
    "3-Knowledge（知识库）",
    "2-Resource（参考资源）",
]


def _build_remote_url(base_url: str, endpoint: str) -> str:
    return f"{base_url.rstrip('/')}/{endpoint.lstrip('/')}"


def _post_remote_json(url: str, token: str, payload: dict, timeout_seconds: int) -> dict:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    request = Request(
        url=url,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-Obsidian-Sync-Token": token,
        },
    )
    try:
        with urlopen(request, timeout=timeout_seconds) as response:  # noqa: S310
            data = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise ValueError(f"remote request failed: {exc.code} {detail}") from exc
    except URLError as exc:
        raise ValueError(f"remote request failed: {exc.reason}") from exc

    if not isinstance(data, dict) or not data.get("ok"):
        raise ValueError(f"remote response invalid: {data}")
    return data.get("data", {})


class Command(BaseCommand):
    help = "Sync publish-tagged Obsidian markdown notes into blog posts"

    def add_arguments(self, parser):
        parser.add_argument("source", help="Obsidian vault root path")
        parser.add_argument("--force", action="store_true", default=False, help="Force full sync for local target")
        parser.add_argument("--dry-run", action="store_true", default=False, help="Preview without writing")
        parser.add_argument(
            "--mode",
            choices=["overwrite", "skip", "merge"],
            default="overwrite",
            help="Conflict strategy for existing posts",
        )
        parser.add_argument(
            "--target",
            choices=["local", "remote"],
            default="local",
            help="Sync target mode",
        )
        parser.add_argument(
            "--remote-base-url",
            default="https://blog.openingclouds.com/api",
            help="Remote API base URL (used when --target remote)",
        )
        parser.add_argument(
            "--remote-token-env",
            default="OBSIDIAN_SYNC_TOKEN",
            help="Env var name containing X-Obsidian-Sync-Token",
        )
        parser.add_argument(
            "--include-root",
            action="append",
            default=None,
            help="Relative root folder to include (repeatable)",
        )
        parser.add_argument(
            "--unpublish-behavior",
            choices=["draft", "none", "delete"],
            default="draft",
            help="How to handle previously synced posts not in current published set",
        )
        parser.add_argument(
            "--publish-tag",
            default="publish",
            help="Tag name used as publish switch",
        )
        parser.add_argument(
            "--request-timeout",
            type=int,
            default=30,
            help="Remote HTTP timeout in seconds",
        )

    def handle(self, *args, **options):
        source = Path(options["source"]).expanduser().resolve()
        force = options["force"]
        dry_run = options["dry_run"]
        mode = options["mode"]
        target = options["target"]
        publish_tag = str(options["publish_tag"]).strip() or "publish"
        include_roots = options["include_root"] or list(DEFAULT_INCLUDE_ROOTS)
        unpublish_behavior = options["unpublish_behavior"]
        remote_base_url = str(options["remote_base_url"]).strip()
        remote_token_env = str(options["remote_token_env"]).strip()
        request_timeout = int(options["request_timeout"])

        if not source.exists() or not source.is_dir():
            raise CommandError(f"Invalid source path: {source}")

        remote_token = ""
        if target == "remote":
            if not remote_base_url:
                raise CommandError("--remote-base-url is required for remote target")
            remote_token = str(os.getenv(remote_token_env, "")).strip()
            if not remote_token:
                raise CommandError(f"Missing remote sync token in env: {remote_token_env}")

        files = scan_markdown_files(str(source), include_roots=include_roots)
        if not files:
            self.stdout.write(self.style.WARNING("No markdown files found under selected roots"))
            return

        stats = {
            "created": 0,
            "updated": 0,
            "skipped_unpublished": 0,
            "skipped_unchanged": 0,
            "skipped_mode": 0,
            "skipped_invalid": 0,
            "drafted": 0,
            "deleted": 0,
            "failed": 0,
        }
        published_paths: list[str] = []

        self.stdout.write(
            (
                f"Sync start: files={len(files)}, target={target}, mode={mode}, "
                f"dry_run={dry_run}, force={force}, publish_tag={publish_tag}, "
                f"include_roots={include_roots}"
            )
        )

        for file_path in files:
            relative_path = str(file_path.relative_to(source)).replace("\\", "/")
            try:
                note = frontmatter.load(file_path)
                metadata = dict(note.metadata)
                tags = normalize_tags(metadata.get("tags", []))
                if not contains_publish_tag(tags, publish_tag):
                    stats["skipped_unpublished"] += 1
                    continue

                title = str(metadata.get("title") or file_path.stem).strip()
                slug = resolve_slug(metadata, file_path, title, fallback_key=relative_path)
                if not title or not slug:
                    stats["skipped_invalid"] += 1
                    self.stdout.write(self.style.WARNING(f"Skip invalid note: {relative_path}"))
                    continue

                category = resolve_category(metadata, relative_path)
                excerpt = build_excerpt(metadata, note.content or "")
                cover = str(metadata.get("cover") or "").strip()
                content = note.content or ""
                payload = {
                    "title": title,
                    "slug": slug,
                    "excerpt": excerpt,
                    "content": content,
                    "category": category,
                    "tags": remove_publish_tag(tags, publish_tag),
                    "cover": cover,
                    "obsidian_path": relative_path,
                    "mode": mode,
                    "dry_run": dry_run,
                }

                if target == "local":
                    modified_at = timezone.make_aware(
                        datetime.fromtimestamp(file_path.stat().st_mtime),
                        timezone.get_current_timezone(),
                    )
                    existing = Post.objects.filter(slug=slug).first()
                    if existing and not force and existing.last_synced_at and modified_at <= existing.last_synced_at:
                        stats["skipped_unchanged"] += 1
                        continue
                    if existing and mode == "skip":
                        stats["skipped_mode"] += 1
                        continue
                    outcome = sync_post_payload(
                        payload,
                        mode=mode,
                        source=SyncLog.Source.COMMAND,
                        operator=None,
                        dry_run=dry_run,
                    )
                    self._accumulate_sync_action(stats, outcome.action)
                else:
                    endpoint = _build_remote_url(remote_base_url, "admin/obsidian-sync/")
                    response = _post_remote_json(endpoint, remote_token, payload, request_timeout)
                    action = str(response.get("action") or "")
                    self._accumulate_sync_action(stats, action)

                published_paths.append(relative_path)
            except Exception as exc:  # noqa: BLE001
                stats["failed"] += 1
                self.stdout.write(self.style.WARNING(f"Failed {relative_path}: {exc}"))

        if unpublish_behavior != "none":
            if target == "local":
                reconcile = reconcile_obsidian_publications(
                    published_paths=published_paths,
                    scope_prefixes=include_roots,
                    behavior=unpublish_behavior,
                    source=SyncLog.Source.COMMAND,
                    operator=None,
                    dry_run=dry_run,
                )
                stats["drafted"] += reconcile.drafted
                stats["deleted"] += reconcile.deleted
            else:
                try:
                    endpoint = _build_remote_url(remote_base_url, "admin/obsidian-sync/reconcile/")
                    reconcile_payload = {
                        "published_paths": published_paths,
                        "scope_prefixes": include_roots,
                        "behavior": unpublish_behavior,
                        "dry_run": dry_run,
                    }
                    response = _post_remote_json(endpoint, remote_token, reconcile_payload, request_timeout)
                    stats["drafted"] += int(response.get("drafted") or 0)
                    stats["deleted"] += int(response.get("deleted") or 0)
                except Exception as exc:  # noqa: BLE001
                    stats["failed"] += 1
                    self.stdout.write(self.style.WARNING(f"Failed reconcile: {exc}"))

        self.stdout.write(
            self.style.SUCCESS(
                "Sync completed: "
                f"created={stats['created']}, "
                f"updated={stats['updated']}, "
                f"skipped_unpublished={stats['skipped_unpublished']}, "
                f"skipped_unchanged={stats['skipped_unchanged']}, "
                f"skipped_mode={stats['skipped_mode']}, "
                f"skipped_invalid={stats['skipped_invalid']}, "
                f"drafted={stats['drafted']}, "
                f"deleted={stats['deleted']}, "
                f"failed={stats['failed']}"
            )
        )

    @staticmethod
    def _accumulate_sync_action(stats: dict[str, int], action: str) -> None:
        if action == SyncLog.Action.CREATED:
            stats["created"] += 1
        elif action == SyncLog.Action.UPDATED:
            stats["updated"] += 1
        elif action == SyncLog.Action.SKIPPED:
            stats["skipped_mode"] += 1
