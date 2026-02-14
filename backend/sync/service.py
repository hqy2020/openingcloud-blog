from __future__ import annotations

import hashlib
from dataclasses import dataclass
from datetime import timedelta
from typing import Any

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django.utils.text import slugify

from blog.models import Post, SyncLog


@dataclass
class SyncExecutionResult:
    action: str
    status: str
    message: str
    post: Post | None
    sync_log: SyncLog


@dataclass
class SyncReconcileResult:
    action: str
    status: str
    behavior: str
    drafted: int
    deleted: int
    matched: int
    sync_log: SyncLog


def _normalize_tags(value: Any) -> list[str]:
    if isinstance(value, list):
        values = [str(item).strip() for item in value if str(item).strip()]
    elif value:
        values = [str(value).strip()]
    else:
        values = []

    cleaned: list[str] = []
    for item in values:
        normalized = item.lower().lstrip("#")
        if normalized == "publish":
            continue
        cleaned.append(item)
    return cleaned


def _slug_with_path_digest(base_slug: str, obsidian_path: str, attempt: int = 0) -> str:
    digest = hashlib.sha1(obsidian_path.encode("utf-8")).hexdigest()[:12]
    suffix = digest if attempt == 0 else f"{digest}-{attempt}"
    max_prefix_len = 255 - len(suffix) - 1
    prefix = (base_slug or "obs")
    if max_prefix_len <= 0:
        return (f"obs-{suffix}")[:255]
    return f"{prefix[:max_prefix_len]}-{suffix}"


def _resolve_target_slug(
    requested_slug: str,
    obsidian_path: str,
    *,
    existing_by_path: Post | None,
) -> str:
    if not obsidian_path:
        return requested_slug

    owner = Post.objects.filter(slug=requested_slug).first()
    if owner is None:
        return requested_slug

    if existing_by_path and owner.id == existing_by_path.id:
        return requested_slug

    if owner.sync_source == Post.SyncSource.OBSIDIAN and owner.obsidian_path == obsidian_path:
        return requested_slug

    # Keep historical behavior for non-obsidian/manual owners.
    # We only force slug disambiguation for collisions between different obsidian paths.
    if owner.sync_source != Post.SyncSource.OBSIDIAN or not owner.obsidian_path:
        return requested_slug

    excluded_id = existing_by_path.id if existing_by_path else None
    for attempt in range(0, 100):
        candidate = _slug_with_path_digest(requested_slug, obsidian_path, attempt=attempt)
        qs = Post.objects.filter(slug=candidate)
        if excluded_id:
            qs = qs.exclude(id=excluded_id)
        if not qs.exists():
            return candidate

    raise ValueError("无法为文章生成唯一 slug，请检查标题或手动设置 slug")


def _normalize_paths(values: list[str] | tuple[str, ...] | None) -> list[str]:
    if not values:
        return []
    normalized: list[str] = []
    for value in values:
        item = str(value).strip().replace("\\", "/")
        if item:
            normalized.append(item)
    return normalized


def _coerce_payload(payload: dict[str, Any]) -> dict[str, Any]:
    title = str(payload.get("title") or "").strip()
    slug = str(payload.get("slug") or "").strip()
    content = str(payload.get("content") or "")

    if not slug:
        slug = slugify(title)
    if not slug:
        raise ValueError("slug 或 title 至少提供一个")

    category = str(payload.get("category") or Post.Category.TECH)
    valid_categories = {item[0] for item in Post.Category.choices}
    if category not in valid_categories:
        category = Post.Category.TECH

    excerpt = str(payload.get("excerpt") or payload.get("description") or "").strip()
    obsidian_path = str(payload.get("obsidian_path") or payload.get("obsidianPath") or "").strip()
    cover = str(payload.get("cover") or "").strip()

    return {
        "title": title or slug,
        "slug": slug,
        "content": content,
        "category": category,
        "tags": _normalize_tags(payload.get("tags", [])),
        "cover": cover,
        "excerpt": excerpt,
        "obsidian_path": obsidian_path,
    }


def _serialize_post(post: Post) -> dict[str, Any]:
    return {
        "id": post.id,
        "slug": post.slug,
        "title": post.title,
        "category": post.category,
        "updated_at": post.updated_at.isoformat(),
        "sync_source": post.sync_source,
        "obsidian_path": post.obsidian_path,
        "last_synced_at": post.last_synced_at.isoformat() if post.last_synced_at else None,
    }


def sync_post_payload(
    payload: dict[str, Any],
    *,
    mode: str = SyncLog.Mode.OVERWRITE,
    source: str = SyncLog.Source.API,
    operator=None,
    dry_run: bool = False,
) -> SyncExecutionResult:
    started_at = timezone.now()
    normalized_mode = mode if mode in {choice[0] for choice in SyncLog.Mode.choices} else SyncLog.Mode.OVERWRITE

    status = SyncLog.Status.SUCCESS
    action = SyncLog.Action.CREATED
    message = ""
    post: Post | None = None
    result_payload: dict[str, Any] = {}
    normalized_slug = str(payload.get("slug") or "").strip()

    try:
        data = _coerce_payload(payload)
        existing_by_path: Post | None = None
        if data["obsidian_path"]:
            existing_by_path = Post.objects.filter(
                sync_source=Post.SyncSource.OBSIDIAN,
                obsidian_path=data["obsidian_path"],
            ).first()

        data["slug"] = _resolve_target_slug(data["slug"], data["obsidian_path"], existing_by_path=existing_by_path)
        normalized_slug = data["slug"]
        existing = existing_by_path or Post.objects.filter(slug=data["slug"]).first()

        if existing and normalized_mode == SyncLog.Mode.SKIP:
            action = SyncLog.Action.SKIPPED
            message = "mode=skip 且文章已存在，已跳过"
            post = existing
        elif dry_run:
            action = SyncLog.Action.UPDATED if existing else SyncLog.Action.CREATED
            status = SyncLog.Status.DRY_RUN
            message = "dry-run 仅预览，不写入数据库"
            post = existing
        else:
            now = timezone.now()
            defaults = {
                "title": data["title"],
                "excerpt": data["excerpt"],
                "content": data["content"],
                "category": data["category"],
                "tags": data["tags"],
                "cover": data["cover"],
                "draft": False,
                "obsidian_path": data["obsidian_path"],
                "last_synced_at": now,
                "sync_source": Post.SyncSource.OBSIDIAN,
            }

            with transaction.atomic():
                if existing and normalized_mode == SyncLog.Mode.MERGE:
                    changed_fields: set[str] = set()
                    if not existing.title and data["title"]:
                        existing.title = data["title"]
                        changed_fields.add("title")
                    if not existing.excerpt and data["excerpt"]:
                        existing.excerpt = data["excerpt"]
                        changed_fields.add("excerpt")
                    if not existing.content and data["content"]:
                        existing.content = data["content"]
                        changed_fields.add("content")
                    if not existing.tags and data["tags"]:
                        existing.tags = data["tags"]
                        changed_fields.add("tags")
                    if not existing.cover and data["cover"]:
                        existing.cover = data["cover"]
                        changed_fields.add("cover")

                    existing.category = data["category"]
                    existing.draft = False
                    existing.obsidian_path = data["obsidian_path"]
                    existing.last_synced_at = now
                    existing.sync_source = Post.SyncSource.OBSIDIAN
                    changed_fields.update(["category", "draft", "obsidian_path", "last_synced_at", "sync_source"])

                    existing.save(update_fields=sorted(changed_fields))
                    post = existing
                    action = SyncLog.Action.UPDATED
                else:
                    if existing:
                        for key, value in defaults.items():
                            setattr(existing, key, value)
                        existing.slug = data["slug"]
                        existing.save()
                        post = existing
                        action = SyncLog.Action.UPDATED
                    else:
                        post = Post.objects.create(slug=data["slug"], **defaults)
                        action = SyncLog.Action.CREATED

        if post is not None:
            result_payload = _serialize_post(post)
    except Exception as exc:  # noqa: BLE001
        status = SyncLog.Status.FAILED
        action = SyncLog.Action.FAILED
        message = str(exc)

    finished_at = timezone.now()
    duration = finished_at - started_at
    duration_ms = int(duration / timedelta(milliseconds=1))

    sync_log = SyncLog.objects.create(
        source=source,
        slug=normalized_slug or (post.slug if post else ""),
        mode=normalized_mode,
        action=action,
        status=status,
        message=message,
        payload=payload,
        result=result_payload,
        started_at=started_at,
        finished_at=finished_at,
        duration_ms=max(0, duration_ms),
        operator=operator,
    )

    if status == SyncLog.Status.FAILED:
        raise ValueError(message)

    return SyncExecutionResult(action=action, status=status, message=message, post=post, sync_log=sync_log)


def reconcile_obsidian_publications(
    *,
    published_paths: list[str],
    scope_prefixes: list[str] | None = None,
    behavior: str = "draft",
    source: str = SyncLog.Source.API,
    operator=None,
    dry_run: bool = False,
) -> SyncReconcileResult:
    started_at = timezone.now()
    normalized_behavior = behavior if behavior in {"draft", "delete", "none"} else "draft"
    normalized_paths = _normalize_paths(published_paths)
    normalized_scope = _normalize_paths(scope_prefixes)

    status = SyncLog.Status.DRY_RUN if dry_run else SyncLog.Status.SUCCESS
    action = SyncLog.Action.SKIPPED

    queryset = Post.objects.filter(sync_source=Post.SyncSource.OBSIDIAN).exclude(obsidian_path="")
    if normalized_scope:
        scope_query = Q()
        for prefix in normalized_scope:
            scope_query |= Q(obsidian_path__startswith=prefix)
        queryset = queryset.filter(scope_query)

    targets = queryset.exclude(obsidian_path__in=normalized_paths)
    matched = targets.count()
    drafted = 0
    deleted = 0

    if matched and normalized_behavior == "draft":
        action = SyncLog.Action.UPDATED
        if dry_run:
            drafted = matched
        else:
            drafted = targets.update(draft=True, last_synced_at=timezone.now())
    elif matched and normalized_behavior == "delete":
        action = SyncLog.Action.UPDATED
        if dry_run:
            deleted = matched
        else:
            deleted, _ = targets.delete()

    message = (
        f"reconcile behavior={normalized_behavior}, matched={matched}, "
        f"drafted={drafted}, deleted={deleted}, dry_run={dry_run}"
    )

    finished_at = timezone.now()
    duration = finished_at - started_at
    duration_ms = int(duration / timedelta(milliseconds=1))
    result_payload = {
        "behavior": normalized_behavior,
        "matched": matched,
        "drafted": drafted,
        "deleted": deleted,
    }
    payload = {
        "published_paths": normalized_paths,
        "scope_prefixes": normalized_scope,
        "behavior": normalized_behavior,
        "dry_run": dry_run,
    }

    sync_log = SyncLog.objects.create(
        source=source,
        slug="__reconcile__",
        mode=SyncLog.Mode.OVERWRITE,
        action=action,
        status=status,
        message=message,
        payload=payload,
        result=result_payload,
        started_at=started_at,
        finished_at=finished_at,
        duration_ms=max(0, duration_ms),
        operator=operator,
    )

    return SyncReconcileResult(
        action=action,
        status=status,
        behavior=normalized_behavior,
        drafted=drafted,
        deleted=deleted,
        matched=matched,
        sync_log=sync_log,
    )
