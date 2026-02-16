from __future__ import annotations

from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from blog.models import ObsidianSyncRun
from sync.document_pool import sync_obsidian_documents


class Command(BaseCommand):
    help = "Index all Obsidian markdown files into document pool and optionally auto-update published posts"

    def add_arguments(self, parser):
        parser.add_argument("source", help="Obsidian vault root path")
        parser.add_argument(
            "--trigger",
            choices=[choice[0] for choice in ObsidianSyncRun.Trigger.choices],
            default=ObsidianSyncRun.Trigger.MANUAL,
            help="Run trigger type for ObsidianSyncRun",
        )
        parser.add_argument(
            "--publish-tag",
            default="publish",
            help="Tag name used to mark recommended publish notes",
        )
        parser.add_argument(
            "--missing-behavior",
            choices=["draft", "none"],
            default="draft",
            help="How to process previously indexed documents missing in current scan",
        )
        parser.add_argument(
            "--auto-update-published",
            action="store_true",
            default=False,
            help="Auto overwrite linked published posts using latest Obsidian document content",
        )
        parser.add_argument("--repo-url", default="", help="Vault repo URL for run logs")
        parser.add_argument("--repo-branch", default="", help="Vault repo branch for run logs")
        parser.add_argument("--repo-commit", default="", help="Vault repo commit SHA for run logs")

    def handle(self, *args, **options):
        source = Path(options["source"]).expanduser().resolve()
        if not source.exists() or not source.is_dir():
            raise CommandError(f"Invalid source path: {source}")

        try:
            result = sync_obsidian_documents(
                source=source,
                trigger=options["trigger"],
                publish_tag=options["publish_tag"],
                missing_behavior=options["missing_behavior"],
                auto_update_published=bool(options["auto_update_published"]),
                repo_url=options["repo_url"],
                repo_branch=options["repo_branch"],
                repo_commit=options["repo_commit"],
                operator=None,
            )
        except ValueError as exc:
            raise CommandError(str(exc)) from exc

        run = result.run
        self.stdout.write(
            self.style.SUCCESS(
                "Obsidian document sync completed: "
                f"run_id={run.id}, trigger={run.trigger}, status={run.status}, "
                f"scanned={run.scanned_count}, created={run.created_count}, updated={run.updated_count}, "
                f"missing={run.missing_count}, published_updated={run.published_updated_count}, drafted={run.drafted_count}"
            )
        )
