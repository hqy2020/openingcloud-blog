from __future__ import annotations

import os
from pathlib import Path

from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Run the full one-way Obsidian -> personal website sync pipeline"

    def add_arguments(self, parser):
        parser.add_argument("source", help="Obsidian vault root path")
        parser.add_argument("--dry-run", action="store_true", default=False)
        parser.add_argument("--publish-tag", default=os.environ.get("OBSIDIAN_DOC_SYNC_PUBLISH_TAG", "publish"))
        parser.add_argument("--structured-root", default=os.environ.get("OBSIDIAN_SITE_SYNC_ROOT", "2-Resource/90_网站同步"))
        parser.add_argument("--knowledge-root", default="3-Knowledge")
        parser.add_argument(
            "--trigger",
            default="scheduled",
            help="sync_obsidian_documents trigger value when not running dry-run",
        )
        parser.add_argument(
            "--missing-behavior",
            default="draft",
            choices=["draft", "none"],
            help="Missing document handling for sync_obsidian_documents",
        )
        parser.add_argument("--repo-url", default=os.environ.get("OBSIDIAN_VAULT_REPO_URL", ""))
        parser.add_argument("--repo-branch", default=os.environ.get("OBSIDIAN_VAULT_REPO_BRANCH", "main"))
        parser.add_argument("--repo-commit", default="")
        parser.add_argument("--skip-posts", action="store_true")
        parser.add_argument("--skip-documents", action="store_true")
        parser.add_argument("--skip-knowledge", action="store_true")
        parser.add_argument("--skip-structured", action="store_true")

    def handle(self, *args, **options):
        source = Path(options["source"]).expanduser().resolve()
        if not source.exists() or not source.is_dir():
            raise CommandError(f"Invalid source path: {source}")

        dry_run = bool(options["dry_run"])
        publish_tag = str(options["publish_tag"] or "").strip() or "publish"

        self.stdout.write(f"site sync start: source={source}, dry_run={dry_run}")

        if not options["skip_posts"]:
            self.stdout.write("step 1/4: sync publish-tagged posts")
            post_args = [str(source), "--mode", "overwrite", "--publish-tag", publish_tag]
            if dry_run:
                post_args.append("--dry-run")
            call_command("sync_obsidian", *post_args)

        if not options["skip_documents"]:
            if dry_run:
                self.stdout.write("step 2/4: skip document pool in dry-run mode")
            else:
                self.stdout.write("step 2/4: sync document pool")
                call_command(
                    "sync_obsidian_documents",
                    str(source),
                    "--trigger",
                    str(options["trigger"]),
                    "--auto-update-published",
                    "--missing-behavior",
                    str(options["missing_behavior"]),
                    "--publish-tag",
                    publish_tag,
                    "--repo-url",
                    str(options["repo_url"]),
                    "--repo-branch",
                    str(options["repo_branch"]),
                    "--repo-commit",
                    str(options["repo_commit"]),
                )

        if not options["skip_knowledge"]:
            knowledge_root = (source / str(options["knowledge_root"]).strip().strip("/")).resolve()
            if knowledge_root.exists() and knowledge_root.is_dir():
                self.stdout.write("step 3/4: sync knowledge graph")
                knowledge_args = ["--local-root", str(knowledge_root)]
                if dry_run:
                    knowledge_args.append("--dry-run")
                call_command("sync_knowledge_github", *knowledge_args)
            else:
                self.stdout.write(f"step 3/4: skip knowledge graph, root missing: {knowledge_root}")

        if not options["skip_structured"]:
            self.stdout.write("step 4/4: sync structured website sources")
            structured_args = [
                "--vault",
                str(source),
                "--root",
                str(options["structured_root"]),
            ]
            if dry_run:
                structured_args.append("--dry-run")
            call_command("sync_site_structured", *structured_args)

        self.stdout.write(self.style.SUCCESS("site sync completed"))
