from __future__ import annotations

from django.core.management.base import BaseCommand
from django.utils.text import slugify

from blog.models import Post
from sync.parser import parse_markdown
from sync.scanner import scan_markdown_files


class Command(BaseCommand):
    help = "Import markdown posts into SQLite"

    def add_arguments(self, parser):
        parser.add_argument("source", help="Markdown root path")
        parser.add_argument("--dry-run", action="store_true", default=False)

    def handle(self, *args, **options):
        source = options["source"]
        dry_run = options["dry_run"]

        files = scan_markdown_files(source)
        if not files:
            self.stdout.write(self.style.WARNING("No markdown files found"))
            return

        imported = 0
        for file_path in files:
            payload = parse_markdown(file_path)
            if not payload.get("title"):
                self.stdout.write(self.style.WARNING(f"Skip missing title: {file_path}"))
                continue

            slug = payload.get("slug") or slugify(payload["title"])
            category = payload.get("category", "tech")
            valid_categories = {item[0] for item in Post.Category.choices}
            if category not in valid_categories:
                category = Post.Category.TECH
            if dry_run:
                imported += 1
                self.stdout.write(f"[dry-run] would import: {slug}")
                continue

            Post.objects.update_or_create(
                slug=slug,
                defaults={
                    "title": payload["title"],
                    "excerpt": payload.get("excerpt", ""),
                    "content": payload.get("content", ""),
                    "category": category,
                    "tags": payload.get("tags", []),
                    "cover": payload.get("cover", ""),
                    "draft": payload.get("draft", True),
                    "sync_source": Post.SyncSource.MANUAL,
                },
            )
            imported += 1

        self.stdout.write(self.style.SUCCESS(f"Imported {imported} posts"))
