from __future__ import annotations

import re
from typing import Any

import frontmatter


def normalize_tags(raw_tags: Any) -> list[str]:
    if isinstance(raw_tags, list):
        values = [str(item).strip() for item in raw_tags]
        return [item for item in values if item]
    if raw_tags:
        return [str(raw_tags).strip()]
    return []


def contains_publish_tag(tags: list[str], publish_tag: str = "publish") -> bool:
    needle = str(publish_tag).strip().lower().lstrip("#")
    if not needle:
        needle = "publish"
    for tag in tags:
        normalized = str(tag).strip().lower().lstrip("#")
        if normalized == needle:
            return True
    return False


def remove_publish_tag(tags: list[str], publish_tag: str = "publish") -> list[str]:
    needle = str(publish_tag).strip().lower().lstrip("#")
    if not needle:
        needle = "publish"
    return [tag for tag in tags if str(tag).strip().lower().lstrip("#") != needle]


def build_excerpt(metadata: dict[str, Any], content: str, *, max_length: int = 150) -> str:
    excerpt = str(metadata.get("description") or metadata.get("excerpt") or "").strip()
    if excerpt:
        return excerpt

    text = content or ""
    text = re.sub(r"```[\s\S]*?```", " ", text)
    text = re.sub(r"`[^`]+`", " ", text)
    text = re.sub(r"!\[[^\]]*\]\([^)]+\)", " ", text)
    text = re.sub(r"\[[^\]]+\]\([^)]+\)", " ", text)
    text = re.sub(r"^#{1,6}\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"[*_~>#-]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:max_length]


def parse_markdown(path):
    with open(path, "r", encoding="utf-8") as f:
        post = frontmatter.load(f)
    return {
        "title": post.get("title", ""),
        "slug": post.get("slug", ""),
        "excerpt": build_excerpt(post.metadata, post.content),
        "category": post.get("category", "tech"),
        "tags": normalize_tags(post.get("tags", [])),
        "draft": bool(post.get("draft", False)),
        "cover": post.get("cover", ""),
        "content": post.content,
    }
