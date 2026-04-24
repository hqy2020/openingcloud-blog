"""从 vault 的 2-Resource/80_生活记录/DailyNote/金句集.md 同步到 WikiQuote 表。

沿用 sync_knowledge_github 的 GitHubClient 拉文件；按 `## 标题` 分段，每段里 `- ` 开头的行
视为一条金句。`## 五信条` → tier=creed，其他 → tier=insight。
"""

from __future__ import annotations

import os
import re

from django.core.management.base import BaseCommand
from django.db import transaction

from blog.management.commands.sync_knowledge_github import GitHubClient
from blog.models import WikiQuote


QUOTES_PATH = os.environ.get(
    "WIKI_QUOTES_PATH",
    "2-Resource/80_生活记录/DailyNote/金句集.md",
)

TIER_BY_SECTION = {
    "五信条": WikiQuote.Tier.CREED,
}

SECTION_RE = re.compile(r"^##\s+(.+?)\s*$")
BULLET_RE = re.compile(r"^-\s+(.+?)\s*$")


def parse_quotes(content: str) -> list[tuple[str, str]]:
    """返回 [(text, tier)]，按文档顺序。跳过 frontmatter。"""
    lines = content.splitlines()
    in_frontmatter = False
    if lines and lines[0].strip() == "---":
        in_frontmatter = True
        lines = lines[1:]
        for idx, ln in enumerate(lines):
            if ln.strip() == "---":
                lines = lines[idx + 1 :]
                in_frontmatter = False
                break
    current_tier = WikiQuote.Tier.INSIGHT
    out: list[tuple[str, str]] = []
    for raw in lines:
        sm = SECTION_RE.match(raw)
        if sm:
            title = sm.group(1).strip()
            head = title.split("（", 1)[0].split("(", 1)[0].strip()
            matched = next(
                (t for key, t in TIER_BY_SECTION.items() if key in head),
                WikiQuote.Tier.INSIGHT,
            )
            current_tier = matched
            continue
        bm = BULLET_RE.match(raw)
        if not bm:
            continue
        text = bm.group(1).strip()
        if not text:
            continue
        out.append((text, current_tier))
    return out


class Command(BaseCommand):
    help = "Sync WikiQuote rows from vault 金句集.md on GitHub."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, dry_run: bool = False, **kwargs):
        token = os.environ.get("GITHUB_TOKEN") or os.environ.get("KNOWLEDGE_GITHUB_TOKEN")
        client = GitHubClient(token)
        self.stdout.write(f"fetching {QUOTES_PATH} ...")
        content = client.get_content(QUOTES_PATH)
        parsed = parse_quotes(content)
        self.stdout.write(f"  parsed {len(parsed)} quotes")

        if dry_run:
            for text, tier in parsed[:20]:
                self.stdout.write(f"    [{tier}] {text}")
            return

        seen_texts: set[str] = set()
        with transaction.atomic():
            for idx, (text, tier) in enumerate(parsed):
                seen_texts.add(text)
                WikiQuote.objects.update_or_create(
                    text=text[:240],
                    defaults={"tier": tier, "sort_order": idx, "is_active": True, "source": "金句集"},
                )
            # Deactivate any rows no longer present
            stale = WikiQuote.objects.exclude(text__in=seen_texts).filter(is_active=True)
            n_stale = stale.update(is_active=False)

        self.stdout.write(self.style.SUCCESS(
            f"sync complete: upserted={len(parsed)} deactivated={n_stale}"
        ))
