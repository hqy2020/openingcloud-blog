from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

import frontmatter
import yaml
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from blog.models import Book, WishItem


DEFAULT_BOOK_ROOT = "1-Information"
DEFAULT_BOOK_FALLBACK_ROOT = "2-Resource/20_书籍文献"
DEFAULT_WISH_PATH = "2-Resource/80_生活记录/消费/愿望清单.md"
DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"

BOOK_TITLE_PATTERNS = [re.compile(r"《([^》]{1,120})》")]
BOOK_PLAN_KEYWORDS = ("读书计划", "阅读计划", "书单", "书架", "在读", "想读", "已读", "待读")
BOOK_PLAN_SECTION_KEYWORDS = ("读书计划", "阅读计划", "书单", "书架")
READWISE_SKIP_TITLES = {"How to Use Readwise", "Readwise"}


def _load_note(path: Path) -> frontmatter.Post | None:
    try:
        return frontmatter.load(path)
    except (OSError, UnicodeDecodeError, yaml.YAMLError):
        return None


@dataclass
class BookCandidate:
    title: str
    author: str = ""
    status: str = Book.Status.FINISHED
    progress: int = 0
    rating: int | None = None
    tags: list[str] | None = None
    review: str = ""
    cover: str = ""
    info_url: str = ""
    obsidian_path: str = ""
    sort_order: int = 0
    ai_context: dict[str, Any] | None = None


@dataclass
class WishCandidate:
    title: str
    emoji: str = "✨"
    description: str = ""
    price: Decimal | None = None
    priority: str = WishItem.Priority.MEDIUM
    purchase_url: str = ""
    obsidian_path: str = ""
    sort_order: int = 0
    ai_context: dict[str, Any] | None = None


def _first_text(value: Any) -> str:
    if isinstance(value, list):
        return str(value[0]).strip() if value else ""
    return str(value or "").strip()


def _as_tags(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip().lstrip("#") for item in value if str(item).strip()]
    if value:
        return [str(value).strip().lstrip("#")]
    return []


def _unique_tags(*groups: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for group in groups:
        for tag in group:
            cleaned = str(tag).strip().lstrip("#")
            if not cleaned or cleaned in seen:
                continue
            seen.add(cleaned)
            result.append(cleaned)
    return result


def _as_int(value: Any, default: int = 0, *, lower: int = 0, upper: int = 100) -> int:
    try:
        number = int(float(str(value).strip().rstrip("%")))
    except (TypeError, ValueError):
        return default
    return max(lower, min(upper, number))


def _as_rating(value: Any) -> int | None:
    if value in ("", None):
        return None
    rating = _as_int(value, default=0, lower=0, upper=5)
    return rating or None


def _as_price(value: Any) -> Decimal | None:
    text = str(value or "").strip()
    if not text:
        return None
    match = re.search(r"(\d+(?:\.\d+)?)", text.replace(",", ""))
    if not match:
        return None
    try:
        return Decimal(match.group(1))
    except InvalidOperation:
        return None


def _priority_from_text(text: str) -> str:
    value = text.lower()
    if any(token in value for token in ("high", "高", "最想", "most")):
        return WishItem.Priority.HIGH
    if any(token in value for token in ("low", "低", "nice")):
        return WishItem.Priority.LOW
    return WishItem.Priority.MEDIUM


def _status_from_meta(meta: dict[str, Any], path: Path) -> str:
    raw = str(meta.get("status") or meta.get("reading_status") or meta.get("状态") or "").lower()
    if raw in {"reading", "在读", "正在读"}:
        return Book.Status.READING
    if raw in {"finished", "done", "read", "已读"}:
        return Book.Status.FINISHED
    if any(token in path.name for token in ("想读", "计划", "书单")):
        return Book.Status.READING
    return Book.Status.FINISHED


def _extract_first_markdown_link(text: str) -> str:
    match = re.search(r"\((https?://[^)]+)\)", text)
    if match:
        return match.group(1).strip()
    match = re.search(r"https?://\S+", text)
    return match.group(0).strip() if match else ""


def _obsidian_source_url(repo_url: str, branch: str, relative_path: str) -> str:
    if not repo_url:
        return ""
    base = repo_url.removesuffix(".git").replace("github.com:", "github.com/")
    if base.startswith("git@"):
        base = "https://" + base.split("@", 1)[1]
    if not base.startswith("http"):
        return ""
    return f"{base}/blob/{branch}/{relative_path}"


def _parse_markdown_tables(content: str) -> list[list[str]]:
    rows: list[list[str]] = []
    for line in content.splitlines():
        stripped = line.strip()
        if not stripped.startswith("|") or not stripped.endswith("|"):
            continue
        cells = [cell.strip() for cell in stripped.strip("|").split("|")]
        if cells and all(re.fullmatch(r":?-{2,}:?", cell.replace(" ", "")) for cell in cells):
            continue
        rows.append(cells)
    if len(rows) <= 1:
        return []
    header = rows[0]
    return [header, *rows[1:]]


def _cell_from_header(header: list[str], row: list[str], *names: str) -> str:
    normalized = {name.strip().lower(): index for index, name in enumerate(header)}
    for name in names:
        index = normalized.get(name.strip().lower())
        if index is not None and index < len(row):
            return row[index].strip()
    return ""


def _clean_book_title(title: str) -> str:
    cleaned = re.sub(r"^[\s\-*>\d.、]+", "", title)
    cleaned = re.sub(r"^\[[ xX-]\]\s*", "", cleaned)
    cleaned = cleaned.strip(" 「」《》[]()（）:")
    return cleaned.strip()


def _extract_book_titles(text: str) -> list[str]:
    titles: list[str] = []
    seen: set[str] = set()
    for pattern in BOOK_TITLE_PATTERNS:
        for match in pattern.finditer(text):
            title = _clean_book_title(match.group(1))
            if title and title not in seen:
                seen.add(title)
                titles.append(title)
    return titles


def _book_plan_text_blocks(path: Path, content: str) -> list[str]:
    if any(keyword in path.stem for keyword in BOOK_PLAN_SECTION_KEYWORDS):
        return [content]

    blocks: list[str] = []
    current: list[str] = []
    current_level = 0
    in_target = False
    for line in content.splitlines():
        heading = re.match(r"^(#{1,6})\s+(.+?)\s*$", line)
        if heading:
            level = len(heading.group(1))
            title = heading.group(2)
            if in_target and level <= current_level:
                blocks.append("\n".join(current))
                current = []
                in_target = False
            if any(keyword in title for keyword in BOOK_PLAN_SECTION_KEYWORDS):
                in_target = True
                current_level = level
                current = [line]
                continue
        bold_heading = re.match(r"^\*\*(.+?)\*\*\s*$", line.strip())
        if bold_heading:
            title = bold_heading.group(1)
            if in_target:
                blocks.append("\n".join(current))
                current = []
                in_target = False
            if any(keyword in title for keyword in BOOK_PLAN_SECTION_KEYWORDS):
                in_target = True
                current_level = 7
                current = [line]
                continue
        if in_target:
            current.append(line)
    if in_target and current:
        blocks.append("\n".join(current))
    return blocks


def _candidate_from_plan_table(path: Path, vault: Path, header: list[str], row: list[str], index: int) -> BookCandidate | None:
    raw_title = _cell_from_header(header, row, "书名", "书籍", "标题", "名称", "title", "book")
    if not raw_title:
        raw_title = row[0].strip() if row else ""
    title = _clean_book_title(raw_title)
    if not title or title in READWISE_SKIP_TITLES:
        return None
    rel = path.relative_to(vault).as_posix()
    raw_status = _cell_from_header(header, row, "状态", "阅读状态", "status")
    status = Book.Status.READING if any(token in raw_status for token in ("在读", "想读", "计划", "reading")) else Book.Status.FINISHED
    review = _cell_from_header(header, row, "备注", "读后感", "短评", "review", "note", "description")
    tags = _as_tags(_cell_from_header(header, row, "标签", "tags", "分类"))
    info_url = _extract_first_markdown_link(" ".join(row))
    return BookCandidate(
        title=title[:200],
        author=_cell_from_header(header, row, "作者", "author")[:200],
        status=status,
        progress=_as_int(_cell_from_header(header, row, "进度", "progress"), default=0),
        rating=_as_rating(_cell_from_header(header, row, "评分", "rating")),
        tags=tags[:6],
        review=review[:280],
        info_url=info_url,
        obsidian_path=rel,
        sort_order=index * 10,
        ai_context={"source": "obsidian", "path": rel, "parser": "plan_table"},
    )


def _scan_book_plans(vault: Path, book_root: str, limit: int) -> list[BookCandidate]:
    root = vault / book_root
    if not root.exists():
        return []
    candidates: list[BookCandidate] = []
    seen: set[str] = set()

    for path in sorted(root.rglob("*.md")):
        rel = path.relative_to(vault).as_posix()
        note = _load_note(path)
        if note is None:
            continue
        content = note.content or ""
        meta = dict(note.metadata)
        haystack = f"{path.name}\n{content[:3000]}"
        has_book_signal = any(keyword in haystack for keyword in BOOK_PLAN_KEYWORDS)
        rows = _parse_markdown_tables(content)
        if rows:
            header, *items = rows
            header_text = "|".join(header)
            table_has_book_signal = any(keyword in header_text for keyword in ("书名", "书籍", "阅读状态"))
            if table_has_book_signal:
                for row in items:
                    item = _candidate_from_plan_table(path, vault, header, row, len(candidates) + 1)
                    if not item or item.title in seen:
                        continue
                    seen.add(item.title)
                    candidates.append(item)
                    if len(candidates) >= limit:
                        return candidates
        if not has_book_signal:
            continue
        for block in _book_plan_text_blocks(path, content):
            for title in _extract_book_titles(block):
                if title in seen or title in READWISE_SKIP_TITLES:
                    continue
                seen.add(title)
                candidates.append(
                    BookCandidate(
                        title=title[:200],
                        status=_status_from_meta(meta, path),
                        tags=_unique_tags(_as_tags(meta.get("tags")), ["读书计划"])[:6],
                        review=_first_text(meta.get("summary") or meta.get("review"))[:280],
                        info_url=_extract_first_markdown_link(block),
                        obsidian_path=rel,
                        sort_order=len(candidates) * 10 + 10,
                        ai_context={"source": "obsidian", "path": rel, "parser": "plan_text"},
                    )
                )
                if len(candidates) >= limit:
                    return candidates
    return candidates


def _deepseek_complete(kind: str, payload: dict[str, Any], *, timeout: int) -> dict[str, Any]:
    api_key = os.environ.get("DEEPSEEK_API_KEY", "").strip()
    if not api_key:
        return {}
    model = os.environ.get("DEEPSEEK_MODEL", "deepseek-v4-pro").strip() or "deepseek-v4-pro"
    prompt = (
        "你是个人网站内容同步助手。根据输入补全公开展示需要的上下文。"
        "只返回 JSON，不要 Markdown。字段允许为空但不要编造具体价格。"
        "book 输出: review, tags, info_url, cover, rating。"
        "wish 输出: emoji, description, priority, purchase_url。"
    )
    body = json.dumps(
        {
            "model": model,
            "messages": [
                {"role": "system", "content": prompt},
                {"role": "user", "content": json.dumps({"kind": kind, "item": payload}, ensure_ascii=False)},
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        },
        ensure_ascii=False,
    ).encode("utf-8")
    req = urllib.request.Request(
        DEEPSEEK_API_URL,
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:  # noqa: S310
            data = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return {}

    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _scan_books(vault: Path, book_root: str, repo_url: str, branch: str, limit: int) -> list[BookCandidate]:
    plan_candidates = _scan_book_plans(vault, book_root, limit)
    if plan_candidates or book_root.rstrip("/") == DEFAULT_BOOK_ROOT:
        return plan_candidates

    root = vault / book_root
    if not root.exists():
        return []
    candidates: list[BookCandidate] = []
    for path in sorted(root.rglob("*.md")):
        rel = path.relative_to(vault).as_posix()
        note = _load_note(path)
        if note is None:
            continue
        meta = dict(note.metadata)
        category = str(meta.get("category") or "").lower()
        tags = _as_tags(meta.get("tags"))
        is_readwise_book = category == "books"
        is_plain_book_note = path.parent == root and "type" not in meta
        if not is_readwise_book and not is_plain_book_note:
            continue
        title = _first_text(meta.get("title")) or path.stem
        if not title or title.startswith("=") or title in READWISE_SKIP_TITLES:
            continue
        candidates.append(
            BookCandidate(
                title=title[:200],
                author=_first_text(meta.get("author"))[:200],
                status=_status_from_meta(meta, path),
                progress=_as_int(meta.get("progress"), default=0),
                rating=_as_rating(meta.get("rating")),
                tags=tags[:6],
                review=_first_text(meta.get("review") or meta.get("summary"))[:280],
                cover=_first_text(meta.get("cover")),
                info_url=_first_text(meta.get("source_url") or meta.get("url")) or _extract_first_markdown_link(note.content or ""),
                obsidian_path=rel,
                sort_order=(len(candidates) + 1) * 10,
                ai_context={},
            )
        )
        if len(candidates) >= limit:
            break
    for item in candidates:
        item.ai_context = {"source": "obsidian", "path": item.obsidian_path}
    return candidates


def _scan_wishes(vault: Path, wish_path: str) -> list[WishCandidate]:
    path = vault / wish_path
    if not path.exists():
        return []
    note = _load_note(path)
    if note is None:
        return []
    rows = _parse_markdown_tables(note.content or "")
    if not rows:
        return []
    header, *items = rows
    header_map = {name: index for index, name in enumerate(header)}

    def cell(row: list[str], *names: str) -> str:
        for name in names:
            index = header_map.get(name)
            if index is not None and index < len(row):
                return row[index].strip()
        return ""

    candidates: list[WishCandidate] = []
    for row in items:
        title = cell(row, "物品", "名称", "title", "item")
        if not title:
            continue
        note_text = cell(row, "备注", "描述", "description", "note")
        candidates.append(
            WishCandidate(
                title=title[:100],
                description=note_text[:500],
                price=_as_price(cell(row, "价格", "price")),
                priority=_priority_from_text(note_text),
                purchase_url=_extract_first_markdown_link(note_text),
                obsidian_path=wish_path,
                sort_order=(len(candidates) + 1) * 10,
                ai_context={"source": "obsidian", "path": wish_path},
            )
        )
    return candidates


class Command(BaseCommand):
    help = "Sync Bookshelf and WishItem records from Obsidian vault, with optional DeepSeek V4 enrichment."

    def add_arguments(self, parser):
        parser.add_argument("--vault", default=os.environ.get("OBSIDIAN_VAULT_PATH", "/app/data/knowledge"))
        parser.add_argument("--book-root", default=os.environ.get("OBSIDIAN_BOOK_ROOT", DEFAULT_BOOK_ROOT))
        parser.add_argument("--book-fallback-root", default=os.environ.get("OBSIDIAN_BOOK_FALLBACK_ROOT", DEFAULT_BOOK_FALLBACK_ROOT))
        parser.add_argument("--wish-path", default=os.environ.get("OBSIDIAN_WISH_PATH", DEFAULT_WISH_PATH))
        parser.add_argument("--repo-url", default=os.environ.get("OBSIDIAN_VAULT_REPO_URL", ""))
        parser.add_argument("--repo-branch", default=os.environ.get("OBSIDIAN_VAULT_REPO_BRANCH", "main"))
        parser.add_argument("--limit-books", type=int, default=int(os.environ.get("OBSIDIAN_BOOK_LIMIT", "12")))
        parser.add_argument("--skip-ai", action="store_true")
        parser.add_argument("--dry-run", action="store_true")
        parser.add_argument("--request-timeout", type=int, default=30)

    def handle(self, *args, **options):
        vault = Path(options["vault"]).expanduser().resolve()
        if not vault.exists() or not vault.is_dir():
            raise CommandError(f"Invalid vault path: {vault}")

        repo_url = str(options["repo_url"] or "")
        repo_branch = str(options["repo_branch"] or "main")
        books = _scan_books(vault, options["book_root"], repo_url, repo_branch, options["limit_books"])
        if not books and options["book_fallback_root"]:
            books = _scan_books(vault, options["book_fallback_root"], repo_url, repo_branch, options["limit_books"])
        wishes = _scan_wishes(vault, options["wish_path"])

        if not options["skip_ai"]:
            for book in books:
                if book.review and book.tags and book.info_url:
                    continue
                ai = _deepseek_complete("book", book.__dict__, timeout=options["request_timeout"])
                if ai:
                    book.review = book.review or str(ai.get("review") or "")[:280]
                    book.tags = book.tags or _as_tags(ai.get("tags"))[:6]
                    book.info_url = book.info_url or _first_text(ai.get("info_url"))
                    book.cover = book.cover or _first_text(ai.get("cover"))
                    book.rating = book.rating or _as_rating(ai.get("rating"))
                    book.ai_context = {**(book.ai_context or {}), "deepseek": ai}
            for wish in wishes:
                if wish.description and wish.purchase_url:
                    continue
                ai = _deepseek_complete("wish", wish.__dict__, timeout=options["request_timeout"])
                if ai:
                    wish.emoji = wish.emoji if wish.emoji != "✨" else _first_text(ai.get("emoji"))[:10] or "✨"
                    wish.description = wish.description or str(ai.get("description") or "")[:500]
                    wish.priority = _priority_from_text(str(ai.get("priority") or wish.priority))
                    wish.purchase_url = wish.purchase_url or _first_text(ai.get("purchase_url"))
                    wish.ai_context = {**(wish.ai_context or {}), "deepseek": ai}

        self.stdout.write(f"found books={len(books)} wishes={len(wishes)}")
        if options["dry_run"]:
            for book in books[:8]:
                self.stdout.write(f"  book: {book.title} / {book.author}")
            for wish in wishes[:8]:
                self.stdout.write(f"  wish: {wish.title} / {wish.price}")
            return

        with transaction.atomic():
            active_book_keys: set[tuple[str, str]] = set()
            for book in books:
                active_book_keys.add((book.obsidian_path, book.title))
                source_url = _obsidian_source_url(repo_url, repo_branch, book.obsidian_path)
                defaults = {
                    "author": book.author,
                    "cover": book.cover,
                    "status": book.status,
                    "progress": book.progress,
                    "rating": book.rating,
                    "tags": book.tags or [],
                    "review": book.review,
                    "info_url": book.info_url,
                    "source_url": source_url,
                    "obsidian_path": book.obsidian_path,
                    "ai_context": book.ai_context or {},
                    "sort_order": book.sort_order,
                    "is_active": True,
                }
                existing = Book.objects.filter(obsidian_path=book.obsidian_path, title=book.title).first() or Book.objects.filter(title=book.title).first()
                if existing:
                    for key, value in defaults.items():
                        setattr(existing, key, value)
                    existing.title = book.title
                    existing.save()
                else:
                    Book.objects.create(title=book.title, **defaults)

            synced_books = Book.objects.exclude(obsidian_path="")
            for existing in synced_books:
                if (existing.obsidian_path, existing.title) not in active_book_keys and existing.is_active:
                    existing.is_active = False
                    existing.save(update_fields=["is_active", "updated_at"])

            active_wish_keys: set[tuple[str, str]] = set()
            for wish in wishes:
                active_wish_keys.add((wish.obsidian_path, wish.title))
                source_url = _obsidian_source_url(repo_url, repo_branch, wish.obsidian_path)
                defaults = {
                    "emoji": wish.emoji,
                    "description": wish.description,
                    "price": wish.price,
                    "priority": wish.priority,
                    "purchase_url": wish.purchase_url,
                    "source_url": source_url,
                    "obsidian_path": wish.obsidian_path,
                    "ai_context": wish.ai_context or {},
                    "sort_order": wish.sort_order,
                    "is_active": True,
                }
                existing = WishItem.objects.filter(obsidian_path=wish.obsidian_path, title=wish.title).first() or WishItem.objects.filter(title=wish.title).first()
                if existing:
                    for key, value in defaults.items():
                        setattr(existing, key, value)
                    existing.title = wish.title
                    existing.save()
                else:
                    WishItem.objects.create(title=wish.title, **defaults)

            synced_wishes = WishItem.objects.exclude(obsidian_path="")
            for existing in synced_wishes:
                if (existing.obsidian_path, existing.title) not in active_wish_keys and existing.is_active:
                    existing.is_active = False
                    existing.save(update_fields=["is_active", "updated_at"])

        self.stdout.write(self.style.SUCCESS(f"sync complete: books={len(books)} wishes={len(wishes)}"))
