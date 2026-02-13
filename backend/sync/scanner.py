from __future__ import annotations

from pathlib import Path


def scan_markdown_files(root: str):
    root_path = Path(root)
    if not root_path.exists():
        return []
    return sorted(root_path.rglob("*.md"))
