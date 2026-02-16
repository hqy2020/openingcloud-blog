from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path

import frontmatter
from django.utils import timezone

from blog.models import ObsidianDocument, ObsidianSyncRun, Post, SyncLog
from sync.mapper import resolve_category, resolve_slug
from sync.parser import build_excerpt, contains_publish_tag, normalize_tags
from sync.scanner import scan_markdown_files
from sync.service import sync_post_payload

DOCUMENT_POOL_EXCLUDED_DIR_NAMES = (
    ".obsidian",
    ".git",
    ".trash",
    ".ai-team",
    ".claude",
    ".cursor",
    ".smart-env",
    ".serena",
    "Templates",
    "模版",
)


@dataclass
class DocumentPoolSyncResult:
    run: ObsidianSyncRun
    status: str
    message: str


def _read_markdown_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8", errors="ignore")


def _extract_first_heading(content: str) -> str:
    match = re.search(r"^\s*#\s+(.+?)\s*$", content or "", re.MULTILINE)
    if not match:
        return ""
    return match.group(1).strip().strip("#").strip()


def _resolve_title(metadata: dict, content: str, file_stem: str) -> str:
    explicit = str(metadata.get("title") or "").strip()
    if explicit:
        return explicit
    heading = _extract_first_heading(content)
    if heading:
        return heading
    return str(file_stem or "").strip() or "untitled"


def _normalize_trigger(value: str) -> str:
    allowed = {choice[0] for choice in ObsidianSyncRun.Trigger.choices}
    return value if value in allowed else ObsidianSyncRun.Trigger.MANUAL


def _normalize_missing_behavior(value: str) -> str:
    return value if value in {"draft", "none"} else "draft"


def sync_obsidian_documents(
    source: str | Path,
    *,
    trigger: str = ObsidianSyncRun.Trigger.MANUAL,
    publish_tag: str = "publish",
    missing_behavior: str = "draft",
    auto_update_published: bool = False,
    repo_url: str = "",
    repo_branch: str = "",
    repo_commit: str = "",
    operator=None,
) -> DocumentPoolSyncResult:
    started_at = timezone.now()
    now = timezone.now()
    status = ObsidianSyncRun.Status.SUCCESS
    message = ""
    scan_paths: set[str] = set()
    errors: list[str] = []
    stats = {
        "scanned_count": 0,
        "created_count": 0,
        "updated_count": 0,
        "missing_count": 0,
        "published_updated_count": 0,
        "drafted_count": 0,
    }

    normalized_trigger = _normalize_trigger(str(trigger or ""))
    normalized_missing_behavior = _normalize_missing_behavior(str(missing_behavior or ""))
    normalized_publish_tag = str(publish_tag or "").strip() or "publish"

    try:
        source_path = Path(source).expanduser().resolve()
        if not source_path.exists() or not source_path.is_dir():
            raise ValueError(f"Invalid source path: {source_path}")

        files = scan_markdown_files(
            source_path,
            include_roots=None,
            excluded_dir_names=DOCUMENT_POOL_EXCLUDED_DIR_NAMES,
        )

        current_timezone = timezone.get_current_timezone()

        for file_path in files:
            stats["scanned_count"] += 1
            relative_path = str(file_path.relative_to(source_path)).replace("\\", "/")
            scan_paths.add(relative_path)

            raw_text = _read_markdown_text(file_path)
            file_hash = hashlib.sha1(raw_text.encode("utf-8")).hexdigest()

            try:
                note = frontmatter.loads(raw_text)
            except Exception as exc:  # noqa: BLE001
                errors.append(f"{relative_path}: {exc}")
                continue

            metadata = dict(note.metadata)
            content = str(note.content or "")
            tags = normalize_tags(metadata.get("tags", []))
            title = _resolve_title(metadata, content, file_path.stem)
            slug_candidate = resolve_slug(metadata, file_path, title, fallback_key=relative_path)
            category_candidate = resolve_category(metadata, relative_path)
            excerpt = build_excerpt(metadata, content)
            has_publish_tag = contains_publish_tag(tags, normalized_publish_tag)
            source_mtime = timezone.make_aware(
                datetime.fromtimestamp(file_path.stat().st_mtime),
                current_timezone,
            )

            document = ObsidianDocument.objects.filter(vault_path=relative_path).select_related("linked_post").first()
            created = document is None
            if created:
                document = ObsidianDocument(vault_path=relative_path, first_seen_at=now)

            document.title = title
            document.slug_candidate = slug_candidate
            document.category_candidate = category_candidate
            document.tags = tags
            document.has_publish_tag = has_publish_tag
            document.content = content
            document.excerpt = excerpt
            document.file_hash = file_hash
            document.source_mtime = source_mtime
            document.source_exists = True
            document.last_seen_at = now
            document.last_indexed_at = now

            if document.linked_post_id is None:
                existing_post = Post.objects.filter(obsidian_path=relative_path).order_by("-updated_at", "-id").first()
                if existing_post:
                    document.linked_post = existing_post

            document.save()
            if created:
                stats["created_count"] += 1
            else:
                stats["updated_count"] += 1

            if auto_update_published and document.linked_post_id and not document.linked_post.draft:
                payload = {
                    "title": document.title,
                    "slug": document.slug_candidate,
                    "excerpt": document.excerpt,
                    "content": document.content,
                    "category": document.category_candidate,
                    "tags": document.tags,
                    "cover": str(document.linked_post.cover or ""),
                    "obsidian_path": document.vault_path,
                }
                outcome = sync_post_payload(
                    payload,
                    mode=SyncLog.Mode.OVERWRITE,
                    source=SyncLog.Source.COMMAND,
                    operator=operator,
                    dry_run=False,
                )
                if outcome.post and document.linked_post_id != outcome.post.id:
                    document.linked_post = outcome.post
                    document.save(update_fields=["linked_post", "updated_at"])
                if outcome.action in {SyncLog.Action.CREATED, SyncLog.Action.UPDATED}:
                    stats["published_updated_count"] += 1

        missing_queryset = ObsidianDocument.objects.filter(source_exists=True).exclude(vault_path__in=scan_paths).select_related(
            "linked_post"
        )
        for document in missing_queryset:
            document.source_exists = False
            document.last_indexed_at = now
            document.save(update_fields=["source_exists", "last_indexed_at", "updated_at"])
            stats["missing_count"] += 1

            if normalized_missing_behavior == "draft" and document.linked_post_id and not document.linked_post.draft:
                document.linked_post.draft = True
                document.linked_post.save(update_fields=["draft"])
                stats["drafted_count"] += 1

        if errors:
            message = f"completed_with_parse_errors={len(errors)}: {'; '.join(errors[:3])}"
        else:
            message = "ok"
    except Exception as exc:  # noqa: BLE001
        status = ObsidianSyncRun.Status.FAILED
        message = str(exc)

    finished_at = timezone.now()
    duration_ms = int((finished_at - started_at) / timedelta(milliseconds=1))

    run = ObsidianSyncRun.objects.create(
        trigger=normalized_trigger,
        status=status,
        repo_url=str(repo_url or "").strip(),
        repo_branch=str(repo_branch or "").strip(),
        repo_commit=str(repo_commit or "").strip(),
        scanned_count=stats["scanned_count"],
        created_count=stats["created_count"],
        updated_count=stats["updated_count"],
        missing_count=stats["missing_count"],
        published_updated_count=stats["published_updated_count"],
        drafted_count=stats["drafted_count"],
        started_at=started_at,
        finished_at=finished_at,
        duration_ms=max(0, duration_ms),
        message=message,
        operator=operator,
    )

    if status == ObsidianSyncRun.Status.FAILED:
        raise ValueError(message)

    return DocumentPoolSyncResult(run=run, status=status, message=message)
