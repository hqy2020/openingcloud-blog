from __future__ import annotations

import hashlib
import json
import mimetypes
import os
import re
from dataclasses import dataclass
from datetime import date
from decimal import Decimal, InvalidOperation
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import unquote
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.dateparse import parse_date

from blog.image_bed import ImageBedUploadError, upload_photo_to_obsidian_images
from blog.models import Book, PhotoWallImage, SocialMediaStat, WikiQuote, WishItem


DEFAULT_SYNC_ROOT = "2-Resource/90_网站同步"
DEFAULT_PHOTO_FILE = "01_照片墙/照片墙.md"
DEFAULT_SOCIAL_FILE = "02_自媒体/平台数据.md"
DEFAULT_WISH_FILE = "03_愿望清单/愿望清单.md"
DEFAULT_BOOK_FILE = "04_书架/书架.md"
DEFAULT_INSIGHT_FILE = "05_人生感悟/人生感悟.md"

PLATFORM_ALIASES = {
    "bilibili": "bilibili",
    "Bilibili": "bilibili",
    "b站": "bilibili",
    "B站": "bilibili",
    "知乎": "zhihu",
    "zhihu": "zhihu",
    "小红书": "xiaohongshu",
    "xiaohongshu": "xiaohongshu",
    "微信公众号": "wechat_oa",
    "公众号": "wechat_oa",
    "wechat_oa": "wechat_oa",
    "个人博客": "blog",
    "博客": "blog",
    "blog": "blog",
    "抖音": "douyin",
    "douyin": "douyin",
    "快手": "kuaishou",
    "kuaishou": "kuaishou",
    "视频号": "shipinhao",
    "shipinhao": "shipinhao",
    "牛客网": "nowcoder",
    "nowcoder": "nowcoder",
    "微博": "weibo",
    "weibo": "weibo",
    "豆瓣": "douban",
    "douban": "douban",
}

PLATFORM_SORT_ORDER = {
    "bilibili": 10,
    "zhihu": 20,
    "xiaohongshu": 30,
    "wechat_oa": 40,
    "blog": 50,
    "douyin": 60,
    "kuaishou": 70,
    "shipinhao": 80,
    "nowcoder": 90,
    "weibo": 100,
    "douban": 110,
}

GITHUB_RAW_PREFIX = "https://raw.githubusercontent.com/hqy2020/obsidian-images/"
GITHUB_BLOB_PREFIX = "https://github.com/hqy2020/obsidian-images/blob/"
WIKI_EMBED_RE = re.compile(r"!\[\[([^\]]+)\]\]")
MARKDOWN_IMAGE_RE = re.compile(r"!\[[^\]]*]\(([^)]+)\)")


@dataclass
class SyncStats:
    created: int = 0
    updated: int = 0
    deactivated: int = 0
    skipped: int = 0


def _read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def _iter_markdown_tables(content: str) -> list[list[list[str]]]:
    tables: list[list[list[str]]] = []
    current: list[list[str]] = []
    for line in content.splitlines():
        stripped = line.strip()
        if stripped.startswith("|") and stripped.endswith("|"):
            current.append([cell.strip() for cell in stripped.strip("|").split("|")])
            continue
        if current:
            tables.append(current)
            current = []
    if current:
        tables.append(current)
    return tables


def _clean_tables(path: Path) -> list[tuple[list[str], list[list[str]]]]:
    tables: list[tuple[list[str], list[list[str]]]] = []
    for raw_table in _iter_markdown_tables(_read_text(path)):
        rows: list[list[str]] = []
        for row in raw_table:
            if row and all(re.fullmatch(r":?-{2,}:?", cell.replace(" ", "")) for cell in row):
                continue
            rows.append(row)
        if len(rows) <= 1:
            continue
        header, *items = rows
        tables.append((header, items))
    return tables


def _header_map(header: list[str]) -> dict[str, int]:
    return {str(name).strip().lower(): index for index, name in enumerate(header)}


def _cell(header_map: dict[str, int], row: list[str], *names: str) -> str:
    for name in names:
        index = header_map.get(str(name).strip().lower())
        if index is not None and index < len(row):
            return row[index].strip()
    return ""


def _as_int(value: str, default: int = 0) -> int:
    text = str(value or "").strip().replace(",", "")
    if not text:
        return default
    try:
        return int(float(text))
    except ValueError:
        return default


def _as_price(value: str) -> Decimal | None:
    text = str(value or "").strip().replace(",", "")
    if not text:
        return None
    match = re.search(r"(\d+(?:\.\d+)?)", text)
    if not match:
        return None
    try:
        return Decimal(match.group(1))
    except InvalidOperation:
        return None


def _as_bool(value: str, default: bool = True) -> bool:
    text = str(value or "").strip().lower()
    if not text:
        return default
    if text in {"1", "true", "yes", "y", "是", "公开", "启用"}:
        return True
    if text in {"0", "false", "no", "n", "否", "隐藏", "停用"}:
        return False
    return default


def _as_tags(value: str) -> list[str]:
    text = str(value or "").strip()
    if not text:
        return []
    parts = re.split(r"[,，/、|]", text)
    seen: set[str] = set()
    result: list[str] = []
    for part in parts:
        cleaned = part.strip().lstrip("#")
        if not cleaned or cleaned in seen:
            continue
        seen.add(cleaned)
        result.append(cleaned)
    return result


def _as_date(value: str) -> date | None:
    text = str(value or "").strip()
    if not text:
        return None
    parsed = parse_date(text)
    if parsed:
        return parsed
    normalized = text.replace("/", "-").replace(".", "-")
    return parse_date(normalized)


def _normalize_priority(value: str) -> str:
    text = str(value or "").strip().lower()
    if text in {"high", "高", "高优先级", "high priority"}:
        return WishItem.Priority.HIGH
    if text in {"low", "低", "低优先级", "low priority"}:
        return WishItem.Priority.LOW
    return WishItem.Priority.MEDIUM


def _normalize_status(value: str) -> str:
    text = str(value or "").strip().lower()
    if text in {"reading", "在读", "正在读"}:
        return Book.Status.READING
    return Book.Status.FINISHED


def _normalize_quote_tier(value: str) -> str:
    text = str(value or "").strip().lower()
    if text in {"creed", "五信条", "信条"}:
        return WikiQuote.Tier.CREED
    return WikiQuote.Tier.INSIGHT


def _normalize_platform(value: str) -> str:
    text = str(value or "").strip()
    if not text:
        return ""
    return PLATFORM_ALIASES.get(text, PLATFORM_ALIASES.get(text.lower(), text.lower()))


def _normalize_github_image_url(url: str) -> tuple[str, str]:
    text = str(url or "").strip()
    if not text:
        return "", ""
    if text.startswith(GITHUB_BLOB_PREFIX):
        suffix = text.removeprefix(GITHUB_BLOB_PREFIX)
        return f"{GITHUB_RAW_PREFIX}{suffix}", text
    if text.startswith(GITHUB_RAW_PREFIX):
        suffix = text.removeprefix(GITHUB_RAW_PREFIX)
        return text, f"{GITHUB_BLOB_PREFIX}{suffix}"
    return text, ""


def _build_repo_prefixes(repo_url: str, branch: str) -> tuple[str, str] | None:
    text = str(repo_url or "").strip()
    branch_name = str(branch or "").strip() or "main"
    match = re.fullmatch(r"https://github\.com/(?P<owner>[^/]+)/(?P<repo>[^/]+?)(?:\.git)?/?", text)
    if not match:
        return None
    owner = match.group("owner")
    repo = match.group("repo")
    return (
        f"https://raw.githubusercontent.com/{owner}/{repo}/{branch_name}/",
        f"https://github.com/{owner}/{repo}/blob/{branch_name}/",
    )


def _extract_vault_repo_relative_path(url: str) -> str:
    prefixes = _build_repo_prefixes(
        getattr(settings, "OBSIDIAN_VAULT_REPO_URL", ""),
        getattr(settings, "OBSIDIAN_VAULT_REPO_BRANCH", "main"),
    )
    if not prefixes:
        return ""

    text = str(url or "").strip()
    normalized_url, _ = _normalize_github_image_url(text)
    raw_prefix, blob_prefix = prefixes
    if normalized_url.startswith(raw_prefix):
        return unquote(normalized_url.removeprefix(raw_prefix))
    if text.startswith(blob_prefix):
        return unquote(text.removeprefix(blob_prefix))
    return ""


def _extract_image_reference(value: str) -> str:
    text = str(value or "").strip()
    if not text:
        return ""
    wiki_match = WIKI_EMBED_RE.search(text)
    if wiki_match:
        return wiki_match.group(1).strip()
    markdown_match = MARKDOWN_IMAGE_RE.search(text)
    if markdown_match:
        return markdown_match.group(1).strip()
    return text


def _resolve_local_media_path(vault: Path, note_path: Path, image_ref: str) -> Path:
    raw = image_ref.strip()
    if "|" in raw:
        raw = raw.split("|", 1)[0].strip()
    if raw.startswith("/"):
        candidate = (vault / raw.lstrip("/")).resolve()
    else:
        candidate = (note_path.parent / raw).resolve()
        if not candidate.exists():
            candidate = (vault / raw).resolve()
    if not candidate.exists() or not candidate.is_file():
        raise CommandError(f"照片资源不存在: {image_ref}")
    return candidate


def _build_photo_sync_key(note_rel: str, title: str, image_ref: str) -> str:
    return hashlib.sha1(f"{note_rel}|{title}|{image_ref}".encode("utf-8")).hexdigest()


def _upload_photo_asset(local_path: Path) -> tuple[str, str]:
    content = local_path.read_bytes()
    content_type = mimetypes.guess_type(local_path.name)[0] or "application/octet-stream"
    upload = SimpleUploadedFile(local_path.name, content, content_type=content_type)
    try:
        result = upload_photo_to_obsidian_images(upload, operator="obsidian-sync")
    except ImageBedUploadError as exc:
        raise CommandError(str(exc)) from exc
    return result.image_url, result.source_url


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
        raise CommandError(f"remote request failed: {exc.code} {detail}") from exc
    except URLError as exc:
        raise CommandError(f"remote request failed: {exc.reason}") from exc

    if not isinstance(data, dict) or not data.get("ok"):
        raise CommandError(f"remote response invalid: {data}")
    return data.get("data", {})


def _post_remote_multipart(
    url: str,
    token: str,
    fields: dict[str, str],
    *,
    file_field_name: str,
    file_name: str,
    file_content: bytes,
    content_type: str,
    timeout_seconds: int,
) -> dict:
    boundary = f"----openingcloud-sync-{hashlib.sha1(os.urandom(16)).hexdigest()}"
    body = bytearray()

    for key, value in fields.items():
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="{key}"\r\n\r\n'.encode("utf-8"))
        body.extend(str(value).encode("utf-8"))
        body.extend(b"\r\n")

    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(
        (
            f'Content-Disposition: form-data; name="{file_field_name}"; '
            f'filename="{file_name}"\r\n'
        ).encode("utf-8")
    )
    body.extend(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
    body.extend(file_content)
    body.extend(b"\r\n")
    body.extend(f"--{boundary}--\r\n".encode("utf-8"))

    request = Request(
        url=url,
        data=bytes(body),
        method="POST",
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "X-Obsidian-Sync-Token": token,
        },
    )
    try:
        with urlopen(request, timeout=timeout_seconds) as response:  # noqa: S310
            data = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise CommandError(f"remote request failed: {exc.code} {detail}") from exc
    except URLError as exc:
        raise CommandError(f"remote request failed: {exc.reason}") from exc

    if not isinstance(data, dict) or not data.get("ok"):
        raise CommandError(f"remote response invalid: {data}")
    return data.get("data", {})


def _resolve_photo_urls(
    *,
    vault: Path,
    note_path: Path,
    image_cell: str,
    existing: PhotoWallImage | None,
    dry_run: bool,
) -> tuple[str, str]:
    image_ref = _extract_image_reference(image_cell)
    if not image_ref:
        raise CommandError(f"照片墙缺少图片地址: {note_path}")

    vault_repo_relative_path = _extract_vault_repo_relative_path(image_ref)
    if vault_repo_relative_path:
        if existing and existing.image_url and not _extract_vault_repo_relative_path(existing.image_url):
            return existing.image_url, existing.source_url
        if dry_run:
            return "", ""
        local_path = _resolve_local_media_path(vault, note_path, vault_repo_relative_path)
        return _upload_photo_asset(local_path)

    normalized_remote_url, derived_source_url = _normalize_github_image_url(image_ref)
    if normalized_remote_url.startswith("http://") or normalized_remote_url.startswith("https://"):
        return normalized_remote_url, derived_source_url

    if existing and existing.image_url:
        return existing.image_url, existing.source_url

    if dry_run:
        return "", ""

    local_path = _resolve_local_media_path(vault, note_path, image_ref)
    return _upload_photo_asset(local_path)


def _sync_wishes(vault: Path, note_rel: str, *, dry_run: bool, stdout) -> SyncStats:
    stats = SyncStats()
    note_path = vault / note_rel
    if not note_path.exists():
        stdout.write(f"skip wishes: {note_rel} not found")
        return stats

    tables = _clean_tables(note_path)
    if not tables:
        stdout.write(f"skip wishes: no markdown table found in {note_rel}")
        return stats

    header, rows = tables[0]
    mapping = _header_map(header)
    active_keys: set[tuple[str, str]] = set()

    with transaction.atomic():
        for index, row in enumerate(rows, start=1):
            title = _cell(mapping, row, "标题", "物品", "名称", "title", "item")
            if not title:
                stats.skipped += 1
                continue
            active_keys.add((note_rel, title))
            defaults = {
                "emoji": (_cell(mapping, row, "emoji", "表情") or "✨")[:10],
                "description": _cell(mapping, row, "描述", "备注", "description", "note")[:500],
                "price": _as_price(_cell(mapping, row, "价格", "price")),
                "priority": _normalize_priority(_cell(mapping, row, "优先级", "priority")),
                "purchase_url": _cell(mapping, row, "购买链接", "链接", "purchase_url", "url")[:800],
                "obsidian_path": note_rel,
                "sort_order": _as_int(_cell(mapping, row, "排序", "sort_order"), index * 10),
                "is_active": _as_bool(_cell(mapping, row, "是否启用", "启用", "is_active"), True),
            }
            existing = WishItem.objects.filter(obsidian_path=note_rel, title=title).first() or WishItem.objects.filter(title=title).first()
            if dry_run:
                stats.updated += int(existing is not None)
                stats.created += int(existing is None)
                continue
            if existing is None:
                WishItem.objects.create(title=title[:100], **defaults)
                stats.created += 1
            else:
                for field, value in defaults.items():
                    setattr(existing, field, value)
                existing.title = title[:100]
                existing.save()
                stats.updated += 1

        if not dry_run:
            for existing in WishItem.objects.filter(obsidian_path=note_rel, is_active=True):
                if (note_rel, existing.title) not in active_keys:
                    existing.is_active = False
                    existing.save(update_fields=["is_active", "updated_at"])
                    stats.deactivated += 1

    return stats


def _sync_books(vault: Path, note_rel: str, *, dry_run: bool, stdout) -> SyncStats:
    stats = SyncStats()
    note_path = vault / note_rel
    if not note_path.exists():
        stdout.write(f"skip books: {note_rel} not found")
        return stats

    tables = _clean_tables(note_path)
    if not tables:
        stdout.write(f"skip books: no markdown table found in {note_rel}")
        return stats

    header, rows = tables[0]
    mapping = _header_map(header)
    active_keys: set[tuple[str, str]] = set()

    with transaction.atomic():
        for index, row in enumerate(rows, start=1):
            title = _cell(mapping, row, "标题", "书名", "title")
            if not title:
                stats.skipped += 1
                continue
            active_keys.add((note_rel, title))
            defaults = {
                "author": _cell(mapping, row, "作者", "author")[:200],
                "status": _normalize_status(_cell(mapping, row, "状态", "status")),
                "progress": _as_int(_cell(mapping, row, "进度", "progress"), 0),
                "rating": _as_int(_cell(mapping, row, "评分", "rating"), 0) or None,
                "tags": _as_tags(_cell(mapping, row, "标签", "tags")),
                "review": _cell(mapping, row, "感想", "短评", "review")[:280],
                "cover": _cell(mapping, row, "封面", "cover")[:500],
                "info_url": _cell(mapping, row, "信息链接", "豆瓣链接", "info_url", "url")[:800],
                "obsidian_path": note_rel,
                "sort_order": _as_int(_cell(mapping, row, "排序", "sort_order"), index * 10),
                "is_active": _as_bool(_cell(mapping, row, "是否启用", "启用", "is_active"), True),
            }
            existing = Book.objects.filter(obsidian_path=note_rel, title=title).first() or Book.objects.filter(title=title).first()
            if dry_run:
                stats.updated += int(existing is not None)
                stats.created += int(existing is None)
                continue
            if existing is None:
                Book.objects.create(title=title[:200], **defaults)
                stats.created += 1
            else:
                for field, value in defaults.items():
                    setattr(existing, field, value)
                existing.title = title[:200]
                existing.save()
                stats.updated += 1

        if not dry_run:
            for existing in Book.objects.filter(obsidian_path=note_rel, is_active=True):
                if (note_rel, existing.title) not in active_keys:
                    existing.is_active = False
                    existing.save(update_fields=["is_active", "updated_at"])
                    stats.deactivated += 1

    return stats


def _sync_social(vault: Path, note_rel: str, *, dry_run: bool, stdout) -> SyncStats:
    stats = SyncStats()
    note_path = vault / note_rel
    if not note_path.exists():
        stdout.write(f"skip social: {note_rel} not found")
        return stats

    tables = _clean_tables(note_path)
    if not tables:
        stdout.write(f"skip social: no markdown table found in {note_rel}")
        return stats

    with transaction.atomic():
        for header, rows in tables:
            mapping = _header_map(header)
            for row in rows:
                raw_platform = _cell(mapping, row, "平台", "platform")
                raw_date = _cell(mapping, row, "日期", "date")
                platform = _normalize_platform(raw_platform)
                snapshot_date = _as_date(raw_date)
                if not platform or snapshot_date is None:
                    stats.skipped += 1
                    continue
                defaults = {
                    "account_name": _cell(mapping, row, "账号", "账号名", "account_name")[:100],
                    "followers": _as_int(_cell(mapping, row, "粉丝", "粉丝数", "followers")),
                    "total_views": _as_int(_cell(mapping, row, "播放", "阅读", "播放/阅读", "累计播放/阅读", "views")),
                    "total_likes": _as_int(_cell(mapping, row, "点赞", "获赞", "累计获赞", "likes")),
                    "comments": _as_int(_cell(mapping, row, "评论", "comments")),
                    "shares": _as_int(_cell(mapping, row, "分享", "shares")),
                    "posts_count": _as_int(_cell(mapping, row, "内容数", "发文数", "articles", "posts_count")),
                    "is_active": _as_bool(_cell(mapping, row, "是否启用", "启用", "is_active"), True),
                    "sort_order": _as_int(
                        _cell(mapping, row, "排序", "sort_order"),
                        PLATFORM_SORT_ORDER.get(platform, 999),
                    ),
                }
                existing = SocialMediaStat.objects.filter(platform=platform, date=snapshot_date).first()
                if dry_run:
                    stats.updated += int(existing is not None)
                    stats.created += int(existing is None)
                    continue
                if existing is None:
                    SocialMediaStat.objects.create(platform=platform, date=snapshot_date, **defaults)
                    stats.created += 1
                else:
                    for field, value in defaults.items():
                        setattr(existing, field, value)
                    existing.save()
                    stats.updated += 1

    return stats


def _sync_photos(vault: Path, note_rel: str, *, dry_run: bool, stdout) -> SyncStats:
    stats = SyncStats()
    note_path = vault / note_rel
    if not note_path.exists():
        stdout.write(f"skip photos: {note_rel} not found")
        return stats

    tables = _clean_tables(note_path)
    if not tables:
        stdout.write(f"skip photos: no markdown table found in {note_rel}")
        return stats

    header, rows = tables[0]
    mapping = _header_map(header)
    active_sync_keys: set[str] = set()

    with transaction.atomic():
        for index, row in enumerate(rows, start=1):
            title = _cell(mapping, row, "标题", "title")
            image_cell = _cell(mapping, row, "图片", "图片链接", "image", "image_url")
            if not image_cell:
                stats.skipped += 1
                continue

            sync_key = _cell(mapping, row, "同步键", "sync_key") or _build_photo_sync_key(note_rel, title, image_cell)
            active_sync_keys.add(sync_key)
            existing = PhotoWallImage.objects.filter(sync_key=sync_key).first()

            if dry_run:
                stats.updated += int(existing is not None)
                stats.created += int(existing is None)
                continue

            image_url, auto_source_url = _resolve_photo_urls(
                vault=vault,
                note_path=note_path,
                image_cell=image_cell,
                existing=existing,
                dry_run=dry_run,
            )
            manual_source_url = _cell(mapping, row, "来源链接", "source_url", "原图链接")
            normalized_source_url = _normalize_github_image_url(manual_source_url)[1] if manual_source_url else ""
            source_url = normalized_source_url or auto_source_url or manual_source_url

            candidate = existing
            if candidate is None and image_url:
                candidate = PhotoWallImage.objects.filter(image_url=image_url).first()
            if candidate is None and source_url:
                candidate = PhotoWallImage.objects.filter(source_url=source_url).first()

            defaults = {
                "title": title[:120],
                "description": _cell(mapping, row, "描述", "说明", "description"),
                "image_url": image_url,
                "source_url": source_url[:800],
                "captured_at": _as_date(_cell(mapping, row, "拍摄日期", "日期", "captured_at")),
                "is_public": _as_bool(_cell(mapping, row, "是否公开", "公开", "is_public"), True),
                "sort_order": _as_int(_cell(mapping, row, "排序", "sort_order"), index * 10),
                "obsidian_path": note_rel,
                "sync_key": sync_key,
            }

            if candidate is None:
                PhotoWallImage.objects.create(**defaults)
                stats.created += 1
            else:
                for field, value in defaults.items():
                    setattr(candidate, field, value)
                candidate.save()
                stats.updated += 1

        stale_rows = PhotoWallImage.objects.filter(obsidian_path=note_rel).exclude(sync_key__isnull=True).exclude(sync_key__in=active_sync_keys)
        for stale in stale_rows:
            if stale.is_public:
                stale.is_public = False
                stale.save(update_fields=["is_public", "updated_at"])
                stats.deactivated += 1

    return stats


def _sync_photos_remote(
    vault: Path,
    note_rel: str,
    *,
    dry_run: bool,
    stdout,
    remote_base_url: str,
    remote_token: str,
    request_timeout: int,
) -> SyncStats:
    stats = SyncStats()
    note_path = vault / note_rel
    if not note_path.exists():
        stdout.write(f"skip photos: {note_rel} not found")
        return stats

    tables = _clean_tables(note_path)
    if not tables:
        stdout.write(f"skip photos: no markdown table found in {note_rel}")
        return stats

    header, rows = tables[0]
    mapping = _header_map(header)
    active_sync_keys: list[str] = []
    sync_endpoint = _build_remote_url(remote_base_url, "admin/obsidian-sync/photos/")
    reconcile_endpoint = _build_remote_url(remote_base_url, "admin/obsidian-sync/photos/reconcile/")

    for index, row in enumerate(rows, start=1):
        title = _cell(mapping, row, "标题", "title")
        image_cell = _cell(mapping, row, "图片", "图片链接", "image", "image_url")
        if not image_cell:
            stats.skipped += 1
            continue

        sync_key = _cell(mapping, row, "同步键", "sync_key") or _build_photo_sync_key(note_rel, title, image_cell)
        active_sync_keys.append(sync_key)
        captured_at = _as_date(_cell(mapping, row, "拍摄日期", "日期", "captured_at"))
        payload = {
            "title": title,
            "description": _cell(mapping, row, "描述", "说明", "description"),
            "is_public": "true" if _as_bool(_cell(mapping, row, "是否公开", "公开", "is_public"), True) else "false",
            "sort_order": str(_as_int(_cell(mapping, row, "排序", "sort_order"), index * 10)),
            "obsidian_path": note_rel,
            "sync_key": sync_key,
            "dry_run": "true" if dry_run else "false",
        }
        if captured_at is not None:
            payload["captured_at"] = captured_at.isoformat()

        image_ref = _extract_image_reference(image_cell)
        manual_source_url = _cell(mapping, row, "来源链接", "source_url", "原图链接")
        normalized_source_url = _normalize_github_image_url(manual_source_url)[1] if manual_source_url else ""
        vault_repo_relative_path = _extract_vault_repo_relative_path(image_ref)

        if vault_repo_relative_path:
            local_path = _resolve_local_media_path(vault, note_path, vault_repo_relative_path)
            file_content = local_path.read_bytes()
            content_type = mimetypes.guess_type(local_path.name)[0] or "application/octet-stream"
            response = _post_remote_multipart(
                sync_endpoint,
                remote_token,
                payload,
                file_field_name="image_file",
                file_name=local_path.name,
                file_content=file_content,
                content_type=content_type,
                timeout_seconds=request_timeout,
            )
        else:
            normalized_remote_url, derived_source_url = _normalize_github_image_url(image_ref)
            if normalized_remote_url.startswith("http://") or normalized_remote_url.startswith("https://"):
                payload["image_url"] = normalized_remote_url
                payload["source_url"] = normalized_source_url or derived_source_url or manual_source_url
                response = _post_remote_json(sync_endpoint, remote_token, payload, request_timeout)
            else:
                local_path = _resolve_local_media_path(vault, note_path, image_ref)
                file_content = local_path.read_bytes()
                content_type = mimetypes.guess_type(local_path.name)[0] or "application/octet-stream"
                response = _post_remote_multipart(
                    sync_endpoint,
                    remote_token,
                    payload,
                    file_field_name="image_file",
                    file_name=local_path.name,
                    file_content=file_content,
                    content_type=content_type,
                    timeout_seconds=request_timeout,
                )

        action = str(response.get("action") or "")
        if action == "created":
            stats.created += 1
        elif action == "updated":
            stats.updated += 1
        else:
            stats.skipped += 1

    reconcile = _post_remote_json(
        reconcile_endpoint,
        remote_token,
        {
            "obsidian_path": note_rel,
            "active_sync_keys": active_sync_keys,
            "dry_run": dry_run,
        },
        request_timeout,
    )
    stats.deactivated += int(reconcile.get("deactivated") or 0)
    return stats


def _sync_quotes(vault: Path, note_rel: str, *, dry_run: bool, stdout) -> SyncStats:
    stats = SyncStats()
    note_path = vault / note_rel
    if not note_path.exists():
        stdout.write(f"skip quotes: {note_rel} not found")
        return stats

    tables = _clean_tables(note_path)
    if not tables:
        stdout.write(f"skip quotes: no markdown table found in {note_rel}")
        return stats

    header, rows = tables[0]
    mapping = _header_map(header)
    active_texts: set[str] = set()

    with transaction.atomic():
        for index, row in enumerate(rows, start=1):
            text = _cell(mapping, row, "感悟", "文案", "金句", "内容", "text", "quote")
            if not text:
                stats.skipped += 1
                continue

            active_texts.add(text)
            defaults = {
                "emphasis": _cell(mapping, row, "高亮", "强调", "emphasis")[:64],
                "tier": _normalize_quote_tier(_cell(mapping, row, "类型", "tier", "分类")),
                "source": (_cell(mapping, row, "来源", "source") or "90_网站同步/人生感悟")[:120],
                "obsidian_path": note_rel,
                "sort_order": _as_int(_cell(mapping, row, "排序", "sort_order"), index * 10),
                "is_active": _as_bool(_cell(mapping, row, "是否启用", "启用", "is_active"), True),
            }
            existing = WikiQuote.objects.filter(text=text).first()
            if dry_run:
                stats.updated += int(existing is not None)
                stats.created += int(existing is None)
                continue
            if existing is None:
                WikiQuote.objects.create(text=text[:240], **defaults)
                stats.created += 1
            else:
                for field, value in defaults.items():
                    setattr(existing, field, value)
                existing.text = text[:240]
                existing.save()
                stats.updated += 1

        if not dry_run:
            for existing in WikiQuote.objects.filter(obsidian_path=note_rel, is_active=True):
                if existing.text not in active_texts:
                    existing.is_active = False
                    existing.save(update_fields=["is_active", "updated_at"])
                    stats.deactivated += 1

    return stats


class Command(BaseCommand):
    help = "Sync structured website source files from a dedicated Obsidian folder"

    def add_arguments(self, parser):
        parser.add_argument("--vault", default=os.environ.get("OBSIDIAN_VAULT_PATH", "/app/data/knowledge"))
        parser.add_argument("--root", default=os.environ.get("OBSIDIAN_SITE_SYNC_ROOT", DEFAULT_SYNC_ROOT))
        parser.add_argument("--target", choices=["local", "remote"], default="local")
        parser.add_argument("--remote-base-url", default=os.environ.get("OBSIDIAN_SYNC_BASE_URL", "https://blog.openingclouds.xyz/api"))
        parser.add_argument("--remote-token-env", default="OBSIDIAN_SYNC_TOKEN")
        parser.add_argument("--request-timeout", type=int, default=30)
        parser.add_argument("--photo-file", default=DEFAULT_PHOTO_FILE)
        parser.add_argument("--social-file", default=DEFAULT_SOCIAL_FILE)
        parser.add_argument("--wish-file", default=DEFAULT_WISH_FILE)
        parser.add_argument("--book-file", default=DEFAULT_BOOK_FILE)
        parser.add_argument("--insight-file", default=DEFAULT_INSIGHT_FILE)
        parser.add_argument("--skip-photos", action="store_true")
        parser.add_argument("--skip-social", action="store_true")
        parser.add_argument("--skip-wishes", action="store_true")
        parser.add_argument("--skip-books", action="store_true")
        parser.add_argument("--skip-quotes", action="store_true")
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        vault = Path(options["vault"]).expanduser().resolve()
        if not vault.exists() or not vault.is_dir():
            raise CommandError(f"Invalid vault path: {vault}")

        target = str(options["target"]).strip()
        root = str(options["root"] or "").strip().strip("/")
        if not root:
            raise CommandError("Structured sync root cannot be empty")

        remote_base_url = str(options["remote_base_url"] or "").strip()
        remote_token = ""
        request_timeout = int(options["request_timeout"])
        if target == "remote":
            unsupported_requested = [
                label
                for label, skip_flag in (
                    ("wishes", options["skip_wishes"]),
                    ("books", options["skip_books"]),
                    ("social", options["skip_social"]),
                    ("quotes", options["skip_quotes"]),
                )
                if not skip_flag
            ]
            if unsupported_requested:
                raise CommandError(
                    "remote target currently only supports photos; add "
                    + " ".join(f"--skip-{name}" for name in unsupported_requested)
                )
            remote_token_env = str(options["remote_token_env"] or "").strip() or "OBSIDIAN_SYNC_TOKEN"
            remote_token = str(os.getenv(remote_token_env, "")).strip()
            if not remote_token:
                raise CommandError(f"Missing remote sync token in env: {remote_token_env}")
            if not remote_base_url:
                raise CommandError("--remote-base-url is required for remote target")

        photo_rel = f"{root}/{str(options['photo_file']).strip().lstrip('/')}"
        social_rel = f"{root}/{str(options['social_file']).strip().lstrip('/')}"
        wish_rel = f"{root}/{str(options['wish_file']).strip().lstrip('/')}"
        book_rel = f"{root}/{str(options['book_file']).strip().lstrip('/')}"
        insight_rel = f"{root}/{str(options['insight_file']).strip().lstrip('/')}"

        self.stdout.write(f"structured sync start: root={root}, target={target}, dry_run={options['dry_run']}")

        if not options["skip_wishes"]:
            stats = _sync_wishes(vault, wish_rel, dry_run=bool(options["dry_run"]), stdout=self.stdout)
            self.stdout.write(
                f"wishes: created={stats.created} updated={stats.updated} deactivated={stats.deactivated} skipped={stats.skipped}"
            )

        if not options["skip_books"]:
            stats = _sync_books(vault, book_rel, dry_run=bool(options["dry_run"]), stdout=self.stdout)
            self.stdout.write(
                f"books: created={stats.created} updated={stats.updated} deactivated={stats.deactivated} skipped={stats.skipped}"
            )

        if not options["skip_social"]:
            stats = _sync_social(vault, social_rel, dry_run=bool(options["dry_run"]), stdout=self.stdout)
            self.stdout.write(
                f"social: created={stats.created} updated={stats.updated} deactivated={stats.deactivated} skipped={stats.skipped}"
            )

        if not options["skip_photos"]:
            if target == "remote":
                stats = _sync_photos_remote(
                    vault,
                    photo_rel,
                    dry_run=bool(options["dry_run"]),
                    stdout=self.stdout,
                    remote_base_url=remote_base_url,
                    remote_token=remote_token,
                    request_timeout=request_timeout,
                )
            else:
                stats = _sync_photos(vault, photo_rel, dry_run=bool(options["dry_run"]), stdout=self.stdout)
            self.stdout.write(
                f"photos: created={stats.created} updated={stats.updated} deactivated={stats.deactivated} skipped={stats.skipped}"
            )

        if not options["skip_quotes"]:
            stats = _sync_quotes(vault, insight_rel, dry_run=bool(options["dry_run"]), stdout=self.stdout)
            self.stdout.write(
                f"quotes: created={stats.created} updated={stats.updated} deactivated={stats.deactivated} skipped={stats.skipped}"
            )
