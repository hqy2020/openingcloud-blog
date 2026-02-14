from __future__ import annotations

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


def resolve_category(metadata: dict) -> str:
    explicit = str(metadata.get("category", "")).strip().lower()
    valid = {choice[0] for choice in Post.Category.choices}
    if explicit in valid:
        return explicit

    for key in ("clc", "zhongtufa", "clc_code", "中图法"):
        if key in metadata:
            return map_clc_to_category(str(metadata.get(key, "")))

    tags = [str(item).lower() for item in metadata.get("tags", []) if item]
    if any(tag in {"life", "daily", "travel", "family"} for tag in tags):
        return Post.Category.LIFE
    if any(tag in {"learning", "study", "productivity", "efficiency"} for tag in tags):
        return Post.Category.LEARNING

    return Post.Category.TECH


def resolve_slug(metadata: dict, path: Path, title: str) -> str:
    source = str(metadata.get("slug", "")).strip() or title or path.stem
    return slugify(source)
