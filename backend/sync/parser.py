from __future__ import annotations

import frontmatter


def parse_markdown(path):
    with open(path, "r", encoding="utf-8") as f:
        post = frontmatter.load(f)
    return {
        "title": post.get("title", ""),
        "slug": post.get("slug", ""),
        "excerpt": post.get("description", ""),
        "category": post.get("category", "tech"),
        "tags": post.get("tags", []),
        "draft": bool(post.get("draft", False)),
        "cover": post.get("cover", ""),
        "content": post.content,
    }
