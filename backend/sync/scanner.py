from __future__ import annotations

from pathlib import Path


DEFAULT_EXCLUDED_DIR_NAMES = (
    ".obsidian",
    ".git",
    ".trash",
    ".ai-team",
    ".claude",
    ".cursor",
    ".smart-env",
    ".serena",
    "模版",
    "Templates",
)

ROOT_ALIAS_GROUPS = (
    ("3-Knowledge（知识库）", "3-Knowledge"),
    ("2-Resource（参考资源）", "2-Resource"),
    ("1-Information（项目与任务）", "1-Information"),
)

ROOT_ALIAS_MAP = {
    item: group
    for group in ROOT_ALIAS_GROUPS
    for item in group
}


def _is_excluded(path: Path, excluded_dir_names: set[str]) -> bool:
    return any(part.lower() in excluded_dir_names for part in path.parts)


def _expand_root_aliases(relative: str) -> list[str]:
    value = str(relative or "").strip().replace("\\", "/")
    if not value:
        return []

    head, sep, tail = value.partition("/")
    variants = ROOT_ALIAS_MAP.get(head, (head,))
    expanded: list[str] = []
    seen: set[str] = set()
    for variant in variants:
        candidate = f"{variant}{sep}{tail}" if sep else variant
        if candidate in seen:
            continue
        seen.add(candidate)
        expanded.append(candidate)
    return expanded


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
        seen_targets: set[Path] = set()
        for relative in include_roots:
            for expanded in _expand_root_aliases(relative):
                candidate = root_path / expanded
                if not candidate.exists() or candidate in seen_targets:
                    continue
                seen_targets.add(candidate)
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
