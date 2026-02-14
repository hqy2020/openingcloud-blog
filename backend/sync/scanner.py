from __future__ import annotations

from pathlib import Path


DEFAULT_EXCLUDED_DIR_NAMES = (
    ".obsidian",
    ".git",
    ".trash",
    ".ai-team",
    ".claude",
    "模版",
    "Templates",
)


def _is_excluded(path: Path, excluded_dir_names: set[str]) -> bool:
    return any(part.lower() in excluded_dir_names for part in path.parts)


def scan_markdown_files(
    root: str | Path,
    *,
    include_roots: list[str] | None = None,
    excluded_dir_names: list[str] | tuple[str, ...] | None = None,
) -> list[Path]:
    root_path = Path(root).expanduser().resolve()
    if not root_path.exists():
        return []

    excluded_set = {item.strip().lower() for item in (excluded_dir_names or DEFAULT_EXCLUDED_DIR_NAMES) if item.strip()}
    files: set[Path] = set()

    scan_targets: list[Path] = []
    if include_roots:
        for relative in include_roots:
            value = str(relative).strip()
            if not value:
                continue
            candidate = root_path / value
            if candidate.exists():
                scan_targets.append(candidate)
    else:
        scan_targets.append(root_path)

    for target in scan_targets:
        if target.is_file() and target.suffix.lower() == ".md":
            if not _is_excluded(target.relative_to(root_path), excluded_set):
                files.add(target)
            continue
        if not target.is_dir():
            continue
        for path in target.rglob("*.md"):
            if _is_excluded(path.relative_to(root_path), excluded_set):
                continue
            files.add(path)

    return sorted(files)
