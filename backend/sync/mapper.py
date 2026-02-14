from __future__ import annotations

import hashlib
from pathlib import Path

from django.utils.text import slugify

from blog.models import Post


def map_clc_to_category(clc_code: str | None) -> str:
    if not clc_code:
        return Post.Category.TECH

    code = str(clc_code).strip().upper()
    if not code:
        return Post.Category.TECH

    first = code[0]

    if first in {"N", "O", "P", "Q", "R", "S", "T", "U", "V", "X"}:
        return Post.Category.TECH
    if first in {"A", "B", "C", "D", "E", "F", "G", "H", "K", "Z"}:
        return Post.Category.LEARNING
    if first in {"I", "J"}:
        return Post.Category.LIFE

    return Post.Category.TECH


def _normalize_path(path: str) -> str:
    return path.replace("\\", "/").strip().lower()


def map_path_to_category(relative_path: str | None) -> str | None:
    if not relative_path:
        return None

    normalized = _normalize_path(relative_path)

    if "/daily/" in normalized or normalized.startswith("daily/"):
        return Post.Category.LIFE
    if "/travel/" in normalized or normalized.startswith("travel/"):
        return Post.Category.LIFE

    if "3-knowledge" in normalized and "t_工业技术" in normalized:
        return Post.Category.TECH
    if "3-knowledge" in normalized and "/tp_" in normalized:
        return Post.Category.TECH
    if "3-knowledge" in normalized and "/tp3_" in normalized:
        return Post.Category.TECH

    if "5-economics" in normalized:
        return Post.Category.LEARNING
    if "3-knowledge" in normalized:
        return Post.Category.LEARNING
    if "2-resource" in normalized:
        return Post.Category.LEARNING

    return None


def resolve_category(metadata: dict, relative_path: str | None = None) -> str:
    explicit = str(metadata.get("category", "")).strip().lower()
    valid = {choice[0] for choice in Post.Category.choices}
    if explicit in valid:
        return explicit

    mapped = map_path_to_category(relative_path)
    if mapped:
        return mapped

    for key in ("clc", "zhongtufa", "clc_code", "中图法"):
        if key in metadata:
            return map_clc_to_category(str(metadata.get(key, "")))

    tags = [str(item).lower() for item in metadata.get("tags", []) if item]
    if any(tag in {"life", "daily", "travel", "family"} for tag in tags):
        return Post.Category.LIFE
    if any(tag in {"learning", "study", "productivity", "efficiency"} for tag in tags):
        return Post.Category.LEARNING

    return Post.Category.LEARNING


def resolve_slug(metadata: dict, path: Path, title: str, *, fallback_key: str | None = None) -> str:
    source = str(metadata.get("slug", "")).strip() or title or path.stem
    slug = slugify(source)
    if slug:
        return slug
    stable_key = fallback_key or path.as_posix()
    digest = hashlib.sha1(stable_key.encode("utf-8")).hexdigest()[:12]
    return f"obs-{digest}"
