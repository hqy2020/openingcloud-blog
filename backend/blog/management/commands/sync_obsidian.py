from __future__ import annotations

from datetime import datetime
from pathlib import Path

import frontmatter
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from blog.models import Post
from sync.mapper import resolve_category, resolve_slug
from sync.scanner import scan_markdown_files


class Command(BaseCommand):
    help = "Sync publishable Obsidian markdown notes into Post table"

    def add_arguments(self, parser):
        parser.add_argument("source", help="Obsidian vault root path")
        parser.add_argument("--force", action="store_true", default=False, help="Force full sync")
        parser.add_argument("--dry-run", action="store_true", default=False, help="Preview without writing")
        parser.add_argument(
            "--mode",
            choices=["overwrite", "skip", "merge"],
            default="overwrite",
            help="Conflict strategy for existing posts",
        )

    def handle(self, *args, **options):
        source = Path(options["source"]).expanduser().resolve()
        force = options["force"]
        dry_run = options["dry_run"]
        mode = options["mode"]

        if not source.exists() or not source.is_dir():
            raise CommandError(f"Invalid source path: {source}")

        files = scan_markdown_files(str(source))
        if not files:
            self.stdout.write(self.style.WARNING("No markdown files found"))
            return

        stats = {
            "created": 0,
            "updated": 0,
            "skipped_unpublished": 0,
            "skipped_unchanged": 0,
            "skipped_mode": 0,
            "skipped_invalid": 0,
        }

        self.stdout.write(
            f"Sync start: files={len(files)}, mode={mode}, dry_run={dry_run}, force={force}"
        )

        for file_path in files:
            relative_path = str(file_path.relative_to(source))
            note = frontmatter.load(file_path)
            metadata = dict(note.metadata)

            publish_flag = metadata.get("publish")
            should_publish = bool(publish_flag) if publish_flag is not None else not bool(metadata.get("draft", False))
            if not should_publish:
                stats["skipped_unpublished"] += 1
                continue

            title = str(metadata.get("title") or file_path.stem).strip()
            slug = resolve_slug(metadata, file_path, title)
            if not title or not slug:
                stats["skipped_invalid"] += 1
                self.stdout.write(self.style.WARNING(f"Skip invalid note: {relative_path}"))
                continue

            category = resolve_category(metadata)
            excerpt = str(metadata.get("description") or metadata.get("excerpt") or "").strip()
            tags_raw = metadata.get("tags", [])
            if isinstance(tags_raw, list):
                tags = [str(item).strip() for item in tags_raw if str(item).strip()]
            elif tags_raw:
                tags = [str(tags_raw).strip()]
            else:
                tags = []

            cover = str(metadata.get("cover") or "").strip()
            content = note.content or ""

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

            defaults = {
                "title": title,
                "excerpt": excerpt,
                "content": content,
                "category": category,
                "tags": tags,
                "cover": cover,
                "draft": False,
                "obsidian_path": relative_path,
                "last_synced_at": timezone.now(),
                "sync_source": Post.SyncSource.OBSIDIAN,
            }

            if dry_run:
                op = "update" if existing else "create"
                self.stdout.write(f"[dry-run] {op}: {slug} ({relative_path})")
                stats["updated" if existing else "created"] += 1
                continue

            with transaction.atomic():
                if existing and mode == "merge":
                    update_fields: list[str] = []

                    if not existing.title and title:
                        existing.title = title
                        update_fields.append("title")
                    if not existing.excerpt and excerpt:
                        existing.excerpt = excerpt
                        update_fields.append("excerpt")
                    if not existing.content and content:
                        existing.content = content
                        update_fields.append("content")
                    if not existing.tags and tags:
                        existing.tags = tags
                        update_fields.append("tags")
                    if not existing.cover and cover:
                        existing.cover = cover
                        update_fields.append("cover")

                    existing.category = category
                    existing.draft = False
                    existing.obsidian_path = relative_path
                    existing.last_synced_at = timezone.now()
                    existing.sync_source = Post.SyncSource.OBSIDIAN
                    update_fields.extend(["category", "draft", "obsidian_path", "last_synced_at", "sync_source"])
                    existing.save(update_fields=sorted(set(update_fields)))
                    stats["updated"] += 1
                else:
                    _, created = Post.objects.update_or_create(slug=slug, defaults=defaults)
                    stats["created" if created else "updated"] += 1

        self.stdout.write(
            self.style.SUCCESS(
                "Sync completed: "
                f"created={stats['created']}, "
                f"updated={stats['updated']}, "
                f"skipped_unpublished={stats['skipped_unpublished']}, "
                f"skipped_unchanged={stats['skipped_unchanged']}, "
                f"skipped_mode={stats['skipped_mode']}, "
                f"skipped_invalid={stats['skipped_invalid']}"
            )
        )
