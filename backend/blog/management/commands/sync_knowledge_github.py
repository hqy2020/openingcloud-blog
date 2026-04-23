from __future__ import annotations

import base64
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

try:
    import yaml  # type: ignore
except Exception:  # pragma: no cover
    yaml = None

from blog.models import KnowledgeEdge, KnowledgeNode


GITHUB_REPO = os.environ.get("KNOWLEDGE_GITHUB_REPO", "hqy2020/GardenOfOpeningClouds")
GITHUB_BRANCH = os.environ.get("KNOWLEDGE_GITHUB_BRANCH", "main")
ROOT_PREFIX = "3-Knowledge/"
SYSTEM_BASENAMES = {"index.md", "log.md", "SCHEMA.md", "CLAUDE.md", "README.md", "_README.md"}

WIKILINK_RE = re.compile(r"\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]")
FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)


@dataclass
class RemoteFile:
    path: str
    sha: str


class GitHubClient:
    def __init__(self, token: str | None):
        self.token = token

    def _request(self, url: str) -> tuple[int, dict[str, str], bytes]:
        req = urllib.request.Request(url)
        req.add_header("Accept", "application/vnd.github+json")
        req.add_header("X-GitHub-Api-Version", "2022-11-28")
        if self.token:
            req.add_header("Authorization", f"Bearer {self.token}")
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return resp.status, dict(resp.headers.items()), resp.read()
        except urllib.error.HTTPError as exc:
            return exc.code, dict(exc.headers.items() if exc.headers else {}), exc.read() or b""

    def _get_json(self, url: str) -> tuple[int, dict[str, str], object]:
        status, headers, body = self._request(url)
        if not body:
            return status, headers, None
        try:
            return status, headers, json.loads(body.decode("utf-8"))
        except json.JSONDecodeError:
            return status, headers, None

    def get_tree(self) -> list[RemoteFile]:
        url = f"https://api.github.com/repos/{GITHUB_REPO}/git/trees/{GITHUB_BRANCH}?recursive=1"
        status, _, body = self._get_json(url)
        if status != 200 or not isinstance(body, dict):
            raise RuntimeError(f"GitHub tree returned {status}: {body}")
        tree = body.get("tree", [])
        files: list[RemoteFile] = []
        for entry in tree:
            if entry.get("type") != "blob":
                continue
            path = entry.get("path") or ""
            if not path.startswith(ROOT_PREFIX):
                continue
            if not path.endswith(".md"):
                continue
            basename = path.rsplit("/", 1)[-1]
            if basename in SYSTEM_BASENAMES:
                continue
            files.append(RemoteFile(path=path, sha=entry["sha"]))
        return files

    def get_content(self, path: str) -> str:
        encoded = urllib.parse.quote(path, safe="/")
        url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{encoded}?ref={GITHUB_BRANCH}"
        status, _, payload = self._get_json(url)
        if status != 200 or not isinstance(payload, dict):
            raise RuntimeError(f"content fetch {path} -> {status}")
        if payload.get("encoding") != "base64":
            return payload.get("content") or ""
        raw = payload.get("content") or ""
        return base64.b64decode(raw).decode("utf-8", errors="replace")

    def get_first_commit_at(self, path: str) -> datetime | None:
        encoded = urllib.parse.quote(path, safe="/")
        url = f"https://api.github.com/repos/{GITHUB_REPO}/commits?path={encoded}&per_page=1"
        status, headers, body = self._get_json(url)
        if status != 200:
            return None
        link = headers.get("Link") or headers.get("link") or ""
        last_page = 1
        m = re.search(r'<[^>]+?[?&]page=(\d+)>;\s*rel="last"', link)
        if m:
            last_page = int(m.group(1))
        if last_page > 1:
            status2, _, body2 = self._get_json(f"{url}&page={last_page}")
            if status2 == 200 and isinstance(body2, list) and body2:
                return _parse_gh_time(
                    body2[0].get("commit", {}).get("committer", {}).get("date")
                )
        if isinstance(body, list) and body:
            return _parse_gh_time(body[0].get("commit", {}).get("committer", {}).get("date"))
        return None


def _parse_gh_time(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except ValueError:
        return None


def parse_frontmatter_and_wikilinks(content: str) -> tuple[dict, list[str], str]:
    m = FRONTMATTER_RE.match(content)
    fm: dict = {}
    body = content
    if m:
        raw = m.group(1)
        body = content[m.end():]
        if yaml is not None:
            try:
                loaded = yaml.safe_load(raw) or {}
                if isinstance(loaded, dict):
                    fm = loaded
            except Exception:
                fm = {}
    wikilinks = []
    for m2 in WIKILINK_RE.finditer(body):
        target = m2.group(1).strip()
        if target:
            wikilinks.append(target)
    return fm, wikilinks, body


def slug_from_path(path: str) -> str:
    # 3-Knowledge/entities/karpathy.md → entities__karpathy
    rel = path[len(ROOT_PREFIX):] if path.startswith(ROOT_PREFIX) else path
    stem = rel[:-3] if rel.endswith(".md") else rel
    raw = stem.replace("/", "__")
    # allow CJK by replacing non-allowed with _
    s = slugify(raw, allow_unicode=True)
    return s or raw[:200]


def slug_from_wikilink(target: str, name_to_slug: dict[str, str]) -> str | None:
    """wikilink target 可能是"karpathy"或"entities/karpathy"，在已知 slug 池里查。"""
    t = target.strip()
    if not t:
        return None
    # 直接命中
    direct = slugify(t, allow_unicode=True)
    if direct in name_to_slug.values():
        return direct
    # 按 name 索引（frontmatter name 或 path basename）
    if t in name_to_slug:
        return name_to_slug[t]
    # 带路径
    normalized = slugify(t.replace("/", "__"), allow_unicode=True)
    if normalized in name_to_slug.values():
        return normalized
    return None


def infer_category(path: str, frontmatter: dict) -> str:
    fm_type = (frontmatter.get("type") or "").lower().strip()
    if fm_type in {"entity", "source", "exploration", "hub", "index"}:
        return fm_type
    lower = path.lower()
    for key in ("entities/", "entity/"):
        if key in lower:
            return "entity"
    if "sources/" in lower:
        return "source"
    if "explorations/" in lower:
        return "exploration"
    if "_hub/" in lower or "hubs/" in lower:
        return "hub"
    return "other"


class Command(BaseCommand):
    help = "Incrementally sync 3-Knowledge/*.md from GitHub into KnowledgeNode + KnowledgeEdge tables."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true")
        parser.add_argument("--full", action="store_true", help="ignore sha cache; refetch all")

    def handle(self, *args, dry_run: bool = False, full: bool = False, **kwargs):
        token = os.environ.get("GITHUB_TOKEN") or os.environ.get("KNOWLEDGE_GITHUB_TOKEN")
        if not token:
            self.stdout.write(self.style.WARNING(
                "GITHUB_TOKEN not set; using unauthenticated (60 req/h rate limit)."
            ))
        client = GitHubClient(token)

        self.stdout.write(f"fetching tree for {GITHUB_REPO}@{GITHUB_BRANCH} ...")
        remote_files = client.get_tree()
        self.stdout.write(f"  tree returned {len(remote_files)} 3-Knowledge/*.md files")

        db_nodes = {n.path: n for n in KnowledgeNode.objects.all()}
        remote_by_path = {f.path: f for f in remote_files}

        to_create: list[RemoteFile] = []
        to_update: list[RemoteFile] = []
        to_skip: list[str] = []
        to_soft_delete: list[str] = []

        for f in remote_files:
            existing = db_nodes.get(f.path)
            if not existing:
                to_create.append(f)
            elif existing.file_sha != f.sha or full:
                to_update.append(f)
            else:
                to_skip.append(f.path)

        for path in db_nodes.keys() - remote_by_path.keys():
            if db_nodes[path].is_active:
                to_soft_delete.append(path)

        self.stdout.write(
            f"  create={len(to_create)} update={len(to_update)} "
            f"skip={len(to_skip)} soft_delete={len(to_soft_delete)}"
        )

        if dry_run:
            for f in to_create[:10]:
                self.stdout.write(f"    + {f.path}")
            for f in to_update[:10]:
                self.stdout.write(f"    ~ {f.path}")
            for p in to_soft_delete[:10]:
                self.stdout.write(f"    - {p}")
            return

        # Pass 1: create or update all nodes (without edges)
        created_nodes: dict[str, KnowledgeNode] = {}
        for f in to_create + to_update:
            content = ""
            try:
                content = client.get_content(f.path)
            except Exception as exc:
                self.stderr.write(f"  fetch {f.path} failed: {exc}")
                continue
            fm, _, _ = parse_frontmatter_and_wikilinks(content)
            title = (fm.get("name") or fm.get("title") or f.path.rsplit("/", 1)[-1][:-3])
            title = str(title).strip() or f.path
            slug = slug_from_path(f.path)
            category = infer_category(f.path, fm)
            node_defaults = {
                "title": title[:255],
                "path": f.path,
                "category": category,
                "frontmatter": {k: v for k, v in fm.items() if _json_safe(v)},
                "file_sha": f.sha,
                "is_active": True,
            }
            node, was_created = KnowledgeNode.objects.update_or_create(slug=slug, defaults=node_defaults)
            if was_created and not node.git_created_at:
                first_commit = client.get_first_commit_at(f.path)
                if first_commit:
                    node.git_created_at = first_commit
                    node.save(update_fields=["git_created_at"])
            if not node.git_created_at:
                node.git_created_at = timezone.now()
                node.save(update_fields=["git_created_at"])
            created_nodes[f.path] = node

        # Pass 2: edges — only for files that were create/update this run
        slug_to_node = {n.slug: n for n in KnowledgeNode.objects.filter(is_active=True)}
        name_to_slug: dict[str, str] = {}
        for n in slug_to_node.values():
            name_to_slug[n.title] = n.slug
            stem = n.path.rsplit("/", 1)[-1][:-3]
            name_to_slug.setdefault(stem, n.slug)

        changed_paths = [f.path for f in (to_create + to_update)]
        for path in changed_paths:
            node = created_nodes.get(path)
            if not node:
                continue
            try:
                content = client.get_content(path)
            except Exception:
                continue
            _, wikilinks, _ = parse_frontmatter_and_wikilinks(content)
            with transaction.atomic():
                KnowledgeEdge.objects.filter(source=node).delete()
                seen_targets: set[int] = set()
                for target_text in wikilinks:
                    target_slug = slug_from_wikilink(target_text, name_to_slug)
                    if not target_slug:
                        continue
                    target_node = slug_to_node.get(target_slug)
                    if not target_node or target_node.id == node.id:
                        continue
                    if target_node.id in seen_targets:
                        continue
                    seen_targets.add(target_node.id)
                    KnowledgeEdge.objects.create(
                        source=node, target=target_node, wikilink_text=target_text[:255]
                    )

        # Soft delete
        if to_soft_delete:
            KnowledgeNode.objects.filter(path__in=to_soft_delete).update(is_active=False)

        self.stdout.write(self.style.SUCCESS(
            f"sync complete: +{len(to_create)} ~{len(to_update)} "
            f"-{len(to_soft_delete)} skip={len(to_skip)}"
        ))


def _json_safe(v) -> bool:
    if v is None or isinstance(v, (bool, int, float, str)):
        return True
    if isinstance(v, list):
        return all(_json_safe(x) for x in v)
    if isinstance(v, dict):
        return all(isinstance(k, str) and _json_safe(val) for k, val in v.items())
    return False
