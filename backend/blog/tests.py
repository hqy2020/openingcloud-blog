from __future__ import annotations

import hashlib
import os
import tempfile
from datetime import timedelta
from pathlib import Path
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import CommandError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from .models import HighlightItem, HighlightStage, PhotoWallImage, Post, PostView, SocialFriend, SyncLog, TimelineNode, TravelPlace


class ApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.post = Post.objects.create(
            title="Hello",
            slug="hello",
            excerpt="intro",
            content="# hello",
            category=Post.Category.TECH,
            tags=["django", "react"],
            draft=False,
        )
        self.draft_post = Post.objects.create(
            title="Draft",
            slug="draft",
            excerpt="draft",
            content="# draft",
            category=Post.Category.LIFE,
            tags=["private"],
            draft=True,
        )

        stage = HighlightStage.objects.create(
            title="大学",
            description="学习阶段",
            sort_order=1,
        )
        HighlightItem.objects.create(
            stage=stage,
            title="论文发表",
            description="完成首篇论文",
            sort_order=1,
        )

        TimelineNode.objects.create(
            title="同济大学",
            description="本科阶段",
            start_date="2019-09-01",
            type=TimelineNode.NodeType.LEARNING,
            impact=TimelineNode.Impact.HIGH,
            sort_order=1,
        )
        TravelPlace.objects.create(
            province="浙江",
            city="杭州",
            notes="学习",
            sort_order=1,
        )
        TravelPlace.objects.create(
            province="浙江",
            city="宁波",
            notes="旅行",
            sort_order=2,
        )

        SocialFriend.objects.create(
            name="张三",
            public_label="一位同窗",
            relation="同学",
            stage_key=SocialFriend.StageKey.TONGJI,
            is_public=True,
            sort_order=1,
            profile_url="https://example.com/private",
        )
        SocialFriend.objects.create(
            name="李四",
            public_label="一位朋友",
            relation="朋友",
            stage_key=SocialFriend.StageKey.FAMILY,
            is_public=False,
            sort_order=2,
        )
        PhotoWallImage.objects.create(
            title="云海日出",
            description="公开照片",
            image_url="https://raw.githubusercontent.com/hqy2020/obsidian-images/main/gallery/sunrise.jpg",
            source_url="https://github.com/hqy2020/obsidian-images/blob/main/gallery/sunrise.jpg",
            captured_at="2025-11-08",
            is_public=True,
            sort_order=1,
        )
        PhotoWallImage.objects.create(
            title="私密照片",
            description="仅后台",
            image_url="https://raw.githubusercontent.com/hqy2020/obsidian-images/main/gallery/private.jpg",
            is_public=False,
            sort_order=2,
        )

    def test_health(self):
        resp = self.client.get(reverse("health"))
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.data["ok"])

    def test_posts_list_excludes_draft(self):
        resp = self.client.get(reverse("posts-list"))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["ok"], True)
        self.assertEqual(resp.data["data"]["count"], 1)
        self.assertEqual(resp.data["data"]["results"][0]["slug"], "hello")

    def test_posts_list_latest_uses_db_order_by_updated_at_desc(self):
        older = Post.objects.create(
            title="Older",
            slug="older-post",
            excerpt="older",
            content="older",
            category=Post.Category.TECH,
            tags=[],
            draft=False,
        )
        newer = Post.objects.create(
            title="Newer",
            slug="newer-post",
            excerpt="newer",
            content="newer",
            category=Post.Category.TECH,
            tags=[],
            draft=False,
        )
        now = timezone.now()
        Post.objects.filter(id=older.id).update(updated_at=now - timedelta(days=3))
        Post.objects.filter(id=self.post.id).update(updated_at=now - timedelta(days=2))
        Post.objects.filter(id=newer.id).update(updated_at=now - timedelta(days=1))

        resp = self.client.get(reverse("posts-list"))
        self.assertEqual(resp.status_code, 200)
        slugs = [item["slug"] for item in resp.data["data"]["results"]]
        self.assertEqual(slugs[:3], ["newer-post", "hello", "older-post"])

    def test_posts_list_views_sort_uses_db_order(self):
        mid = Post.objects.create(
            title="Mid",
            slug="views-mid",
            excerpt="mid",
            content="mid",
            category=Post.Category.TECH,
            tags=[],
            draft=False,
        )
        top = Post.objects.create(
            title="Top",
            slug="views-top",
            excerpt="top",
            content="top",
            category=Post.Category.TECH,
            tags=[],
            draft=False,
        )
        PostView.objects.create(post=self.post, views=1)
        PostView.objects.create(post=mid, views=6)
        PostView.objects.create(post=top, views=12)

        resp = self.client.get(reverse("posts-list"), {"sort": "views"})
        self.assertEqual(resp.status_code, 200)
        slugs = [item["slug"] for item in resp.data["data"]["results"]]
        self.assertEqual(slugs[:3], ["views-top", "views-mid", "hello"])

    def test_posts_list_filters_tag_case_insensitive(self):
        resp = self.client.get(reverse("posts-list"), {"tag": "DJANGO"})
        self.assertEqual(resp.status_code, 200)
        slugs = [item["slug"] for item in resp.data["data"]["results"]]
        self.assertEqual(slugs, ["hello"])

    def test_posts_list_filters_chinese_tag_with_category(self):
        tech_post = Post.objects.create(
            title="Sharding",
            slug="sharding-cn",
            excerpt="中文标签",
            content="content",
            category=Post.Category.TECH,
            tags=["分库分表", "架构"],
            draft=False,
        )
        Post.objects.create(
            title="Learning Tag",
            slug="learning-cn",
            excerpt="学习分类",
            content="content",
            category=Post.Category.LEARNING,
            tags=["分库分表"],
            draft=False,
        )

        resp = self.client.get(
            reverse("posts-list"),
            {"category": Post.Category.TECH, "tag": "分库分表"},
        )
        self.assertEqual(resp.status_code, 200)
        slugs = [item["slug"] for item in resp.data["data"]["results"]]
        self.assertEqual(slugs, [tech_post.slug])

    def test_increment_view_and_throttle(self):
        first = self.client.post(reverse("posts-view", kwargs={"slug": self.post.slug}))
        second = self.client.post(reverse("posts-view", kwargs={"slug": self.post.slug}))

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(PostView.objects.get(post=self.post).views, 1)
        self.assertTrue(second.data["data"]["throttled"])

    def test_public_home_shape(self):
        resp = self.client.get(reverse("home"))
        self.assertEqual(resp.status_code, 200)
        payload = resp.data["data"]

        self.assertIn("hero", payload)
        self.assertIn("timeline", payload)
        self.assertIn("highlights", payload)
        self.assertIn("travel", payload)
        self.assertIn("social_graph", payload)
        self.assertIn("photo_wall", payload)
        self.assertIn("stats", payload)
        self.assertIn("contact", payload)
        self.assertGreaterEqual(payload["stats"]["published_posts_total"], 1)
        self.assertIn("total_words", payload["stats"])
        self.assertIn("site_days", payload["stats"])
        self.assertGreaterEqual(payload["stats"]["total_words"], 1)
        self.assertGreaterEqual(payload["stats"]["site_days"], 1)

    def test_timeline_api(self):
        resp = self.client.get(reverse("timeline"))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["data"][0]["title"], "同济大学")

    def test_highlights_api(self):
        resp = self.client.get(reverse("highlights"))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["data"][0]["title"], "大学")
        self.assertEqual(len(resp.data["data"][0]["items"]), 1)

    def test_travel_api_grouping(self):
        resp = self.client.get(reverse("travel"))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["data"][0]["province"], "浙江")
        self.assertEqual(resp.data["data"][0]["count"], 2)

    def test_social_graph_privacy(self):
        resp = self.client.get(reverse("social-graph"))
        self.assertEqual(resp.status_code, 200)

        graph = resp.data["data"]
        friend_nodes = [node for node in graph["nodes"] if node["type"] == "friend"]
        self.assertEqual(len(friend_nodes), 1)

        friend = friend_nodes[0]
        self.assertIn("label", friend)
        self.assertEqual(friend["label"], "张先生")
        self.assertNotIn("name", friend)
        self.assertNotIn("profile_url", friend)
        self.assertNotIn("avatar", friend)

    def test_social_graph_staff_login_shows_real_name(self):
        admin_user = get_user_model().objects.create_user(
            username="staff_social_graph",
            password="pass1234",
            is_staff=True,
        )
        login_resp = self.client.post(
            reverse("auth-login"),
            {"username": admin_user.username, "password": "pass1234"},
            format="json",
        )
        self.assertEqual(login_resp.status_code, 200)

        resp = self.client.get(reverse("social-graph"))
        self.assertEqual(resp.status_code, 200)
        friend_nodes = [node for node in resp.data["data"]["nodes"] if node["type"] == "friend"]
        self.assertEqual(len(friend_nodes), 1)
        self.assertEqual(friend_nodes[0]["label"], "张三")

    def test_social_graph_staff_session_login_shows_real_name(self):
        admin_user = get_user_model().objects.create_user(
            username="staff_social_graph_session",
            password="pass1234",
            is_staff=True,
        )
        self.assertTrue(self.client.login(username=admin_user.username, password="pass1234"))

        resp = self.client.get(reverse("social-graph"))
        self.assertEqual(resp.status_code, 200)
        friend_nodes = [node for node in resp.data["data"]["nodes"] if node["type"] == "friend"]
        self.assertEqual(len(friend_nodes), 1)
        self.assertEqual(friend_nodes[0]["label"], "张三")

    def test_home_staff_login_shows_real_name_in_social_graph(self):
        admin_user = get_user_model().objects.create_user(
            username="staff_home_graph",
            password="pass1234",
            is_staff=True,
        )
        login_resp = self.client.post(
            reverse("auth-login"),
            {"username": admin_user.username, "password": "pass1234"},
            format="json",
        )
        self.assertEqual(login_resp.status_code, 200)

        resp = self.client.get(reverse("home"))
        self.assertEqual(resp.status_code, 200)
        friend_nodes = [node for node in resp.data["data"]["social_graph"]["nodes"] if node["type"] == "friend"]
        self.assertEqual(len(friend_nodes), 1)
        self.assertEqual(friend_nodes[0]["label"], "张三")

    def test_social_graph_female_relation_masks_to_ms(self):
        SocialFriend.objects.create(
            name="杨彩",
            public_label="一位大学同学 C",
            relation="情侣",
            stage_key=SocialFriend.StageKey.TONGJI,
            is_public=True,
            sort_order=3,
        )

        resp = self.client.get(reverse("social-graph"))
        self.assertEqual(resp.status_code, 200)
        friend_nodes = [node for node in resp.data["data"]["nodes"] if node["type"] == "friend"]
        labels = {node["label"] for node in friend_nodes}
        self.assertIn("杨女士", labels)

    def test_photo_wall_api_only_returns_public_remote_images(self):
        resp = self.client.get(reverse("photo-wall"))
        self.assertEqual(resp.status_code, 200)
        rows = resp.data["data"]
        self.assertEqual(len(rows), 1)
        item = rows[0]
        self.assertEqual(item["title"], "云海日出")
        self.assertTrue(str(item["image_url"]).startswith("https://"))
        self.assertIn("hqy2020/obsidian-images", item["source_url"])

    def test_social_graph_and_home_responses_are_private(self):
        social_resp = self.client.get(reverse("social-graph"))
        home_resp = self.client.get(reverse("home"))

        self.assertEqual(social_resp.status_code, 200)
        self.assertEqual(home_resp.status_code, 200)
        self.assertIn("private", str(social_resp.get("Cache-Control", "")).lower())
        self.assertIn("no-store", str(social_resp.get("Cache-Control", "")).lower())
        self.assertIn("cookie", str(social_resp.get("Vary", "")).lower())
        self.assertIn("private", str(home_resp.get("Cache-Control", "")).lower())
        self.assertIn("no-store", str(home_resp.get("Cache-Control", "")).lower())
        self.assertIn("cookie", str(home_resp.get("Vary", "")).lower())

    def test_sitemap_contains_published_posts_only(self):
        resp = self.client.get("/sitemap.xml")
        self.assertEqual(resp.status_code, 200)
        content = resp.content.decode("utf-8")
        self.assertIn("/posts/hello/", content)
        self.assertNotIn("/posts/draft/", content)


class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="admin",
            password="pass1234",
            is_staff=True,
        )

    def test_login_sets_cookie(self):
        resp = self.client.post(reverse("auth-login"), {"username": "admin", "password": "pass1234"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("oc_access_token", resp.cookies)

    def test_admin_ping_requires_auth(self):
        resp = self.client.get(reverse("admin-ping"))
        self.assertEqual(resp.status_code, 401)


class SyncObsidianCommandTests(TestCase):
    def _write_note(self, vault: Path, relative_path: str, content: str) -> Path:
        path = vault / relative_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        return path

    def test_sync_obsidian_upsert(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            vault = Path(temp_dir)
            self._write_note(
                vault,
                "3-Knowledge（知识库）/T_工业技术/hello.md",
                "---\n"
                "title: 来自 Obsidian\n"
                "tags:\n"
                "  - note\n"
                "  - publish\n"
                "  - sync\n"
                "clc: T123\n"
                "---\n\n"
                "这是正文。\n",
            )

            call_command("sync_obsidian", str(vault), "--force")
            self.assertEqual(Post.objects.count(), 1)

            post = Post.objects.first()
            assert post is not None
            self.assertEqual(post.sync_source, Post.SyncSource.OBSIDIAN)
            self.assertEqual(post.category, Post.Category.TECH)
            self.assertEqual(post.obsidian_path, "3-Knowledge（知识库）/T_工业技术/hello.md")
            self.assertEqual(post.draft, False)
            self.assertEqual(post.tags, ["note", "sync"])

    def test_sync_obsidian_skips_without_publish_tag(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            vault = Path(temp_dir)
            self._write_note(
                vault,
                "3-Knowledge（知识库）/skip.md",
                "---\n"
                "title: 不发布\n"
                "tags:\n"
                "  - note\n"
                "---\n\n"
                "这是一篇不发布的文章。\n",
            )
            call_command("sync_obsidian", str(vault), "--force")
            self.assertEqual(Post.objects.count(), 0)

    def test_sync_obsidian_slug_hash_fallback_for_non_ascii_title(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            vault = Path(temp_dir)
            relative = "3-Knowledge（知识库）/路径/纯中文标题.md"
            self._write_note(
                vault,
                relative,
                "---\n"
                "title: 纯中文标题\n"
                "tags:\n"
                "  - publish\n"
                "---\n\n"
                "正文\n",
            )
            call_command("sync_obsidian", str(vault), "--force")
            post = Post.objects.first()
            assert post is not None
            expected = f"obs-{hashlib.sha1(relative.encode('utf-8')).hexdigest()[:12]}"
            self.assertEqual(post.slug, expected)

    def test_sync_obsidian_reconcile_drafts_when_publish_removed(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            vault = Path(temp_dir)
            relative = "3-Knowledge（知识库）/to-unpublish.md"
            path = self._write_note(
                vault,
                relative,
                "---\n"
                "title: 先发布\n"
                "tags:\n"
                "  - publish\n"
                "---\n\n"
                "正文\n",
            )
            call_command("sync_obsidian", str(vault), "--force")
            post = Post.objects.get(obsidian_path=relative)
            self.assertFalse(post.draft)

            path.write_text(
                "---\n"
                "title: 先发布\n"
                "tags:\n"
                "  - note\n"
                "---\n\n"
                "正文\n",
                encoding="utf-8",
            )
            call_command("sync_obsidian", str(vault), "--force")

            post.refresh_from_db()
            self.assertTrue(post.draft)

    def test_sync_obsidian_whitelist_excludes_other_roots(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            vault = Path(temp_dir)
            self._write_note(
                vault,
                "3-Knowledge（知识库）/in-scope.md",
                "---\n"
                "title: 在范围\n"
                "tags:\n"
                "  - publish\n"
                "---\n\n"
                "正文\n",
            )
            self._write_note(
                vault,
                "1-Information（项目与任务）/out-scope.md",
                "---\n"
                "title: 不在范围\n"
                "tags:\n"
                "  - publish\n"
                "---\n\n"
                "正文\n",
            )
            call_command("sync_obsidian", str(vault), "--force")
            self.assertEqual(Post.objects.count(), 1)
            self.assertTrue(Post.objects.filter(obsidian_path="3-Knowledge（知识库）/in-scope.md").exists())

    def test_sync_obsidian_same_slug_different_paths_keep_separate_posts(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            vault = Path(temp_dir)
            self._write_note(
                vault,
                "2-Resource（参考资源）/并发/ThreadLocal什么场景内存泄露.md",
                "---\n"
                "title: ThreadLocal\n"
                "tags:\n"
                "  - publish\n"
                "---\n\n"
                "正文 A\n",
            )
            self._write_note(
                vault,
                "2-Resource（参考资源）/并发/ThreadLocal底层实现原理.md",
                "---\n"
                "title: ThreadLocal\n"
                "tags:\n"
                "  - publish\n"
                "---\n\n"
                "正文 B\n",
            )
            self._write_note(
                vault,
                "2-Resource（参考资源）/并发/ThreadLocal有哪些扩展实现.md",
                "---\n"
                "title: ThreadLocal\n"
                "tags:\n"
                "  - publish\n"
                "---\n\n"
                "正文 C\n",
            )

            call_command("sync_obsidian", str(vault), "--force")

            posts = Post.objects.filter(sync_source=Post.SyncSource.OBSIDIAN)
            self.assertEqual(posts.count(), 3)
            slugs = set(posts.values_list("slug", flat=True))
            self.assertEqual(len(slugs), 3)
            self.assertIn("threadlocal", slugs)
            self.assertEqual(
                posts.filter(slug__startswith="threadlocal-").count(),
                2,
            )

    def test_sync_obsidian_remote_mode_posts_and_reconciles(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            vault = Path(temp_dir)
            self._write_note(
                vault,
                "3-Knowledge（知识库）/remote.md",
                "---\n"
                "title: 远程同步\n"
                "tags:\n"
                "  - publish\n"
                "  - kb\n"
                "---\n\n"
                "正文\n",
            )

            with patch.dict(os.environ, {"TEST_SYNC_TOKEN": "token-123"}, clear=False):
                with patch(
                    "blog.management.commands.sync_obsidian._post_remote_json",
                    side_effect=[
                        {"action": "created"},
                        {"action": "updated", "drafted": 1, "deleted": 0},
                    ],
                ) as remote_post:
                    call_command(
                        "sync_obsidian",
                        str(vault),
                        "--target",
                        "remote",
                        "--remote-base-url",
                        "https://example.com/api",
                        "--remote-token-env",
                        "TEST_SYNC_TOKEN",
                    )

            self.assertEqual(remote_post.call_count, 2)
            sync_call = remote_post.call_args_list[0]
            sync_payload = sync_call.args[2]
            self.assertEqual(sync_payload["tags"], ["kb"])
            self.assertEqual(sync_payload["obsidian_path"], "3-Knowledge（知识库）/remote.md")

    def test_sync_obsidian_remote_mode_requires_token_env(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            vault = Path(temp_dir)
            with self.assertRaises(CommandError):
                call_command(
                    "sync_obsidian",
                    str(vault),
                    "--target",
                    "remote",
                    "--remote-base-url",
                    "https://example.com/api",
                    "--remote-token-env",
                    "MISSING_SYNC_TOKEN",
                )


class AdminApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.staff_user = get_user_model().objects.create_user(
            username="staff",
            password="pass1234",
            is_staff=True,
        )
        self.normal_user = get_user_model().objects.create_user(
            username="normal",
            password="pass1234",
            is_staff=False,
        )

    def test_image_upload_requires_auth(self):
        resp = self.client.post(reverse("admin-images"), {}, format="multipart")
        self.assertEqual(resp.status_code, 401)

    def test_image_upload_requires_staff(self):
        self.client.force_authenticate(user=self.normal_user)
        upload = SimpleUploadedFile("note.txt", b"hello", content_type="text/plain")
        resp = self.client.post(reverse("admin-images"), {"file": upload}, format="multipart")
        self.assertEqual(resp.status_code, 403)

    def test_image_upload_reject_invalid_type(self):
        self.client.force_authenticate(user=self.staff_user)
        upload = SimpleUploadedFile("note.txt", b"hello", content_type="text/plain")
        resp = self.client.post(reverse("admin-images"), {"file": upload}, format="multipart")
        self.assertEqual(resp.status_code, 400)

    @override_settings(MEDIA_ROOT=tempfile.gettempdir())
    def test_image_upload_reject_oversize(self):
        self.client.force_authenticate(user=self.staff_user)
        payload = b"a" * (5 * 1024 * 1024 + 1)
        upload = SimpleUploadedFile("big.png", payload, content_type="image/png")
        resp = self.client.post(reverse("admin-images"), {"file": upload}, format="multipart")
        self.assertEqual(resp.status_code, 400)

    def test_image_upload_success(self):
        self.client.force_authenticate(user=self.staff_user)
        with tempfile.TemporaryDirectory() as media_root:
            with override_settings(MEDIA_ROOT=media_root):
                upload = SimpleUploadedFile(
                    "cloud.png",
                    b"\x89PNG\r\n\x1a\nmock-image",
                    content_type="image/png",
                )
                resp = self.client.post(reverse("admin-images"), {"file": upload}, format="multipart")

        self.assertEqual(resp.status_code, 200)
        body = resp.data["data"]
        self.assertTrue(body["url"].startswith("/media/"))
        self.assertTrue(body["path"].startswith("uploads/"))
        self.assertEqual(body["content_type"], "image/png")

    def test_obsidian_sync_create(self):
        self.client.force_authenticate(user=self.staff_user)
        resp = self.client.post(
            reverse("admin-obsidian-sync"),
            {
                "title": "API 同步创建",
                "slug": "api-sync-create",
                "content": "# hello",
                "category": "tech",
                "tags": ["sync", "publish"],
                "mode": "overwrite",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["data"]["action"], "created")
        self.assertTrue(Post.objects.filter(slug="api-sync-create").exists())
        self.assertEqual(Post.objects.get(slug="api-sync-create").tags, ["sync"])
        self.assertEqual(SyncLog.objects.count(), 1)
        self.assertEqual(SyncLog.objects.first().status, SyncLog.Status.SUCCESS)

    def test_obsidian_sync_update(self):
        self.client.force_authenticate(user=self.staff_user)
        Post.objects.create(
            title="旧标题",
            slug="api-sync-update",
            excerpt="old",
            content="old",
            category=Post.Category.TECH,
            tags=[],
            draft=False,
        )
        resp = self.client.post(
            reverse("admin-obsidian-sync"),
            {
                "title": "新标题",
                "slug": "api-sync-update",
                "content": "new",
                "category": "learning",
                "mode": "overwrite",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["data"]["action"], "updated")
        post = Post.objects.get(slug="api-sync-update")
        self.assertEqual(post.title, "新标题")
        self.assertEqual(post.content, "new")
        self.assertEqual(post.category, "learning")

    def test_obsidian_sync_skip(self):
        self.client.force_authenticate(user=self.staff_user)
        Post.objects.create(
            title="原文",
            slug="api-sync-skip",
            excerpt="keep",
            content="keep",
            category=Post.Category.TECH,
            tags=["keep"],
            draft=False,
        )
        resp = self.client.post(
            reverse("admin-obsidian-sync"),
            {
                "title": "新文",
                "slug": "api-sync-skip",
                "content": "replace",
                "mode": "skip",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["data"]["action"], "skipped")
        post = Post.objects.get(slug="api-sync-skip")
        self.assertEqual(post.title, "原文")
        self.assertEqual(post.content, "keep")

    def test_obsidian_sync_merge(self):
        self.client.force_authenticate(user=self.staff_user)
        Post.objects.create(
            title="",
            slug="api-sync-merge",
            excerpt="",
            content="",
            category=Post.Category.TECH,
            tags=[],
            cover="",
            draft=False,
        )
        resp = self.client.post(
            reverse("admin-obsidian-sync"),
            {
                "title": "合并标题",
                "slug": "api-sync-merge",
                "excerpt": "合并摘要",
                "content": "合并正文",
                "cover": "https://example.com/c.png",
                "category": "life",
                "tags": ["merged"],
                "obsidian_path": "notes/merge.md",
                "mode": "merge",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["data"]["action"], "updated")

        post = Post.objects.get(slug="api-sync-merge")
        self.assertEqual(post.title, "合并标题")
        self.assertEqual(post.excerpt, "合并摘要")
        self.assertEqual(post.content, "合并正文")
        self.assertEqual(post.cover, "https://example.com/c.png")
        self.assertEqual(post.category, "life")
        self.assertEqual(post.tags, ["merged"])
        self.assertEqual(post.obsidian_path, "notes/merge.md")
        self.assertEqual(SyncLog.objects.count(), 1)

    @override_settings(OBSIDIAN_SYNC_TOKEN="sync-token")
    def test_obsidian_sync_requires_auth_or_token(self):
        resp = self.client.post(
            reverse("admin-obsidian-sync"),
            {
                "title": "NoAuth",
                "slug": "no-auth-sync",
                "content": "x",
            },
            format="json",
        )
        self.assertIn(resp.status_code, {401, 403})

    @override_settings(OBSIDIAN_SYNC_TOKEN="sync-token")
    def test_obsidian_sync_invalid_token_forbidden(self):
        resp = self.client.post(
            reverse("admin-obsidian-sync"),
            {
                "title": "BadToken",
                "slug": "bad-token",
                "content": "x",
            },
            format="json",
            HTTP_X_OBSIDIAN_SYNC_TOKEN="wrong-token",
        )
        self.assertIn(resp.status_code, {401, 403})

    @override_settings(OBSIDIAN_SYNC_TOKEN="sync-token")
    def test_obsidian_sync_valid_token_without_login(self):
        resp = self.client.post(
            reverse("admin-obsidian-sync"),
            {
                "title": "Token 同步",
                "slug": "token-sync",
                "content": "token",
                "category": "learning",
                "tags": ["publish", "kb"],
            },
            format="json",
            HTTP_X_OBSIDIAN_SYNC_TOKEN="sync-token",
        )
        self.assertEqual(resp.status_code, 200)
        post = Post.objects.get(slug="token-sync")
        self.assertEqual(post.tags, ["kb"])

    @override_settings(OBSIDIAN_SYNC_TOKEN="sync-token")
    def test_obsidian_sync_same_slug_different_path_creates_new_post(self):
        Post.objects.create(
            title="ThreadLocal A",
            slug="threadlocal",
            excerpt="",
            content="A",
            category=Post.Category.TECH,
            tags=[],
            draft=False,
            sync_source=Post.SyncSource.OBSIDIAN,
            obsidian_path="2-Resource（参考资源）/并发/A.md",
        )

        resp = self.client.post(
            reverse("admin-obsidian-sync"),
            {
                "title": "ThreadLocal B",
                "slug": "threadlocal",
                "content": "B",
                "category": "tech",
                "tags": ["publish", "kb"],
                "mode": "overwrite",
                "obsidian_path": "2-Resource（参考资源）/并发/B.md",
            },
            format="json",
            HTTP_X_OBSIDIAN_SYNC_TOKEN="sync-token",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(Post.objects.count(), 2)
        second = Post.objects.get(obsidian_path="2-Resource（参考资源）/并发/B.md")
        self.assertNotEqual(second.slug, "threadlocal")
        self.assertTrue(second.slug.startswith("threadlocal-"))

    @override_settings(OBSIDIAN_SYNC_TOKEN="sync-token")
    def test_obsidian_reconcile_draft_with_token(self):
        Post.objects.create(
            title="A",
            slug="reconcile-a",
            excerpt="a",
            content="a",
            category=Post.Category.TECH,
            tags=[],
            draft=False,
            sync_source=Post.SyncSource.OBSIDIAN,
            obsidian_path="3-Knowledge（知识库）/a.md",
        )
        post_b = Post.objects.create(
            title="B",
            slug="reconcile-b",
            excerpt="b",
            content="b",
            category=Post.Category.TECH,
            tags=[],
            draft=False,
            sync_source=Post.SyncSource.OBSIDIAN,
            obsidian_path="3-Knowledge（知识库）/b.md",
        )
        Post.objects.create(
            title="OutScope",
            slug="reconcile-out",
            excerpt="c",
            content="c",
            category=Post.Category.TECH,
            tags=[],
            draft=False,
            sync_source=Post.SyncSource.OBSIDIAN,
            obsidian_path="1-Information（项目与任务）/c.md",
        )

        resp = self.client.post(
            reverse("admin-obsidian-reconcile"),
            {
                "published_paths": ["3-Knowledge（知识库）/a.md"],
                "scope_prefixes": ["3-Knowledge（知识库）"],
                "behavior": "draft",
            },
            format="json",
            HTTP_X_OBSIDIAN_SYNC_TOKEN="sync-token",
        )
        self.assertEqual(resp.status_code, 200)
        post_b.refresh_from_db()
        self.assertTrue(post_b.draft)
        self.assertEqual(resp.data["data"]["drafted"], 1)


class AdminContentCrudApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.staff_user = get_user_model().objects.create_user(
            username="admin-crud",
            password="pass1234",
            is_staff=True,
        )
        self.client.force_authenticate(user=self.staff_user)

        self.post = Post.objects.create(
            title="管理文章",
            slug="admin-post",
            excerpt="old",
            content="content",
            category=Post.Category.TECH,
            tags=["ops"],
            draft=False,
        )
        PostView.objects.create(post=self.post, views=3)

        self.timeline = TimelineNode.objects.create(
            title="基础节点",
            description="old",
            start_date="2020-01-01",
            type=TimelineNode.NodeType.LEARNING,
            impact=TimelineNode.Impact.MEDIUM,
            sort_order=3,
        )
        self.travel = TravelPlace.objects.create(
            province="上海",
            city="上海",
            notes="old",
            sort_order=3,
        )
        self.social = SocialFriend.objects.create(
            name="张三",
            public_label="一位同学",
            relation="同窗",
            stage_key=SocialFriend.StageKey.TONGJI,
            contact="wechat:zhangsan",
            birthday="2000-09-01",
            is_public=True,
            sort_order=3,
        )
        self.photo = PhotoWallImage.objects.create(
            title="旧照片",
            description="old",
            image_url="https://raw.githubusercontent.com/hqy2020/obsidian-images/main/gallery/old.jpg",
            is_public=True,
            sort_order=3,
        )
        self.stage = HighlightStage.objects.create(
            title="大学",
            description="old",
            sort_order=3,
        )
        self.item = HighlightItem.objects.create(
            stage=self.stage,
            title="论文",
            description="old",
            sort_order=3,
        )

    def test_admin_posts_crud_filter_and_sort(self):
        top_post = Post.objects.create(
            title="Top Views",
            slug="top-views",
            excerpt="x",
            content="x",
            category=Post.Category.TECH,
            tags=[],
            draft=False,
        )
        PostView.objects.create(post=top_post, views=12)

        resp = self.client.get(reverse("admin-posts"), {"category": Post.Category.TECH})
        self.assertEqual(resp.status_code, 200)
        self.assertGreaterEqual(resp.data["data"]["count"], 2)

        create_resp = self.client.post(
            reverse("admin-posts"),
            {
                "title": "新增文章",
                "slug": "admin-created-post",
                "excerpt": "new",
                "content": "# new",
                "category": "life",
                "tags": ["new", "life"],
                "draft": True,
            },
            format="json",
        )
        self.assertEqual(create_resp.status_code, 201)
        post_id = create_resp.data["data"]["id"]

        update_resp = self.client.put(
            reverse("admin-post-detail", kwargs={"post_id": post_id}),
            {"excerpt": "updated", "draft": False},
            format="json",
        )
        self.assertEqual(update_resp.status_code, 200)
        self.assertEqual(update_resp.data["data"]["excerpt"], "updated")
        self.assertFalse(update_resp.data["data"]["draft"])

        sort_resp = self.client.get(reverse("admin-posts"), {"sort": "views"})
        self.assertEqual(sort_resp.status_code, 200)
        self.assertEqual(sort_resp.data["data"]["results"][0]["slug"], "top-views")

        delete_resp = self.client.delete(reverse("admin-post-detail", kwargs={"post_id": post_id}))
        self.assertEqual(delete_resp.status_code, 200)
        self.assertFalse(Post.objects.filter(id=post_id).exists())

    def test_admin_timeline_crud_filter_and_reorder(self):
        create_resp = self.client.post(
            reverse("admin-timeline"),
            {
                "title": "沉淀期",
                "description": "node",
                "start_date": "2021-01-01",
                "type": "reflection",
                "impact": "high",
                "phase": "self",
                "tags": ["成长"],
                "links": [],
                "sort_order": 7,
            },
            format="json",
        )
        self.assertEqual(create_resp.status_code, 201)
        node_id = create_resp.data["data"]["id"]

        filter_resp = self.client.get(reverse("admin-timeline"), {"type": "reflection"})
        self.assertEqual(filter_resp.status_code, 200)
        returned_ids = [row["id"] for row in filter_resp.data["data"]["results"]]
        self.assertIn(node_id, returned_ids)

        reorder_resp = self.client.patch(
            reverse("admin-timeline-reorder"),
            {"ids": [node_id, self.timeline.id]},
            format="json",
        )
        self.assertEqual(reorder_resp.status_code, 200)
        self.timeline.refresh_from_db()
        self.assertEqual(self.timeline.sort_order, 1)

        update_resp = self.client.put(
            reverse("admin-timeline-detail", kwargs={"timeline_id": node_id}),
            {"title": "沉淀期-更新"},
            format="json",
        )
        self.assertEqual(update_resp.status_code, 200)
        self.assertEqual(update_resp.data["data"]["title"], "沉淀期-更新")

        delete_resp = self.client.delete(reverse("admin-timeline-detail", kwargs={"timeline_id": node_id}))
        self.assertEqual(delete_resp.status_code, 200)
        self.assertFalse(TimelineNode.objects.filter(id=node_id).exists())

    def test_admin_travel_crud_filter_and_reorder(self):
        create_resp = self.client.post(
            reverse("admin-travel"),
            {
                "province": "浙江",
                "city": "杭州",
                "notes": "travel",
                "sort_order": 8,
            },
            format="json",
        )
        self.assertEqual(create_resp.status_code, 201)
        place_id = create_resp.data["data"]["id"]

        filter_resp = self.client.get(reverse("admin-travel"), {"province": "浙江"})
        self.assertEqual(filter_resp.status_code, 200)
        ids = [row["id"] for row in filter_resp.data["data"]["results"]]
        self.assertIn(place_id, ids)

        reorder_resp = self.client.patch(
            reverse("admin-travel-reorder"),
            {"items": [{"id": place_id, "sort_order": 0}, {"id": self.travel.id, "sort_order": 1}]},
            format="json",
        )
        self.assertEqual(reorder_resp.status_code, 200)
        self.travel.refresh_from_db()
        self.assertEqual(self.travel.sort_order, 1)

        update_resp = self.client.put(
            reverse("admin-travel-detail", kwargs={"travel_id": place_id}),
            {"notes": "updated"},
            format="json",
        )
        self.assertEqual(update_resp.status_code, 200)
        self.assertEqual(update_resp.data["data"]["notes"], "updated")

        delete_resp = self.client.delete(reverse("admin-travel-detail", kwargs={"travel_id": place_id}))
        self.assertEqual(delete_resp.status_code, 200)
        self.assertFalse(TravelPlace.objects.filter(id=place_id).exists())

    def test_admin_social_crud_filter_and_reorder(self):
        create_resp = self.client.post(
            reverse("admin-social"),
            {
                "name": "李四",
                "public_label": "一位朋友",
                "relation": "好友",
                "stage_key": "zju",
                "contact": "wechat:lisi",
                "birthday": "2001-01-01",
                "is_public": True,
                "sort_order": 8,
            },
            format="json",
        )
        self.assertEqual(create_resp.status_code, 201)
        self.assertEqual(create_resp.data["data"]["contact"], "wechat:lisi")
        self.assertEqual(create_resp.data["data"]["birthday"], "2001-01-01")
        friend_id = create_resp.data["data"]["id"]

        filter_resp = self.client.get(reverse("admin-social"), {"stage_key": "zju"})
        self.assertEqual(filter_resp.status_code, 200)
        ids = [row["id"] for row in filter_resp.data["data"]["results"]]
        self.assertIn(friend_id, ids)

        graph_resp = self.client.get(reverse("admin-social-graph"), {"stage_key": "zju"})
        self.assertEqual(graph_resp.status_code, 200)
        graph_ids = [row["id"] for row in graph_resp.data["data"]["results"]]
        self.assertIn(friend_id, graph_ids)

        reorder_resp = self.client.patch(
            reverse("admin-social-reorder"),
            {"ids": [friend_id, self.social.id]},
            format="json",
        )
        self.assertEqual(reorder_resp.status_code, 200)
        self.social.refresh_from_db()
        self.assertEqual(self.social.sort_order, 1)

        update_resp = self.client.put(
            reverse("admin-social-detail", kwargs={"social_id": friend_id}),
            {"relation": "同事", "contact": "phone:13800000000", "birthday": "2001-05-20", "is_public": False},
            format="json",
        )
        self.assertEqual(update_resp.status_code, 200)
        self.assertFalse(update_resp.data["data"]["is_public"])
        self.assertEqual(update_resp.data["data"]["contact"], "phone:13800000000")
        self.assertEqual(update_resp.data["data"]["birthday"], "2001-05-20")

        delete_resp = self.client.delete(reverse("admin-social-detail", kwargs={"social_id": friend_id}))
        self.assertEqual(delete_resp.status_code, 200)
        self.assertFalse(SocialFriend.objects.filter(id=friend_id).exists())

    def test_admin_photo_wall_crud_filter_and_reorder(self):
        create_resp = self.client.post(
            reverse("admin-photos"),
            {
                "title": "新照片",
                "description": "from github blob",
                "image_url": "https://github.com/hqy2020/obsidian-images/blob/main/gallery/new.jpg",
                "source_url": "https://github.com/hqy2020/obsidian-images/blob/main/gallery/new.jpg",
                "captured_at": "2026-02-01",
                "is_public": True,
                "sort_order": 8,
            },
            format="json",
        )
        self.assertEqual(create_resp.status_code, 201)
        photo_id = create_resp.data["data"]["id"]
        self.assertTrue(create_resp.data["data"]["image_url"].startswith("https://raw.githubusercontent.com/"))

        filter_resp = self.client.get(reverse("admin-photos"), {"q": "新照片"})
        self.assertEqual(filter_resp.status_code, 200)
        ids = [row["id"] for row in filter_resp.data["data"]["results"]]
        self.assertIn(photo_id, ids)

        reorder_resp = self.client.patch(
            reverse("admin-photos-reorder"),
            {"ids": [photo_id, self.photo.id]},
            format="json",
        )
        self.assertEqual(reorder_resp.status_code, 200)
        self.photo.refresh_from_db()
        self.assertEqual(self.photo.sort_order, 1)

        update_resp = self.client.put(
            reverse("admin-photo-detail", kwargs={"photo_id": photo_id}),
            {"description": "updated", "is_public": False},
            format="json",
        )
        self.assertEqual(update_resp.status_code, 200)
        self.assertEqual(update_resp.data["data"]["description"], "updated")
        self.assertFalse(update_resp.data["data"]["is_public"])

        delete_resp = self.client.delete(reverse("admin-photo-detail", kwargs={"photo_id": photo_id}))
        self.assertEqual(delete_resp.status_code, 200)
        self.assertFalse(PhotoWallImage.objects.filter(id=photo_id).exists())

    def test_admin_highlights_stage_item_crud_and_reorder(self):
        stage_resp = self.client.post(
            reverse("admin-highlight-stage-create"),
            {
                "title": "硕士",
                "description": "new stage",
                "sort_order": 8,
            },
            format="json",
        )
        self.assertEqual(stage_resp.status_code, 201)
        stage_id = stage_resp.data["data"]["id"]

        item_resp = self.client.post(
            reverse("admin-highlight-item-create"),
            {
                "stage": stage_id,
                "title": "获奖",
                "description": "new item",
                "sort_order": 8,
            },
            format="json",
        )
        self.assertEqual(item_resp.status_code, 201)
        item_id = item_resp.data["data"]["id"]

        list_resp = self.client.get(reverse("admin-highlights"))
        self.assertEqual(list_resp.status_code, 200)
        stage_ids = [row["id"] for row in list_resp.data["data"]]
        self.assertIn(stage_id, stage_ids)

        update_stage_resp = self.client.put(
            reverse("admin-highlight-stage-detail", kwargs={"stage_id": stage_id}),
            {"title": "硕士-更新"},
            format="json",
        )
        self.assertEqual(update_stage_resp.status_code, 200)
        self.assertEqual(update_stage_resp.data["data"]["title"], "硕士-更新")

        update_item_resp = self.client.put(
            reverse("admin-highlight-item-detail", kwargs={"item_id": item_id}),
            {"title": "获奖-更新"},
            format="json",
        )
        self.assertEqual(update_item_resp.status_code, 200)
        self.assertEqual(update_item_resp.data["data"]["title"], "获奖-更新")

        reorder_resp = self.client.patch(
            reverse("admin-highlights-reorder"),
            {
                "stages": {"ids": [stage_id, self.stage.id]},
                "items": [{"id": item_id, "sort_order": 0, "stage_id": self.stage.id}],
            },
            format="json",
        )
        self.assertEqual(reorder_resp.status_code, 200)
        moved_item = HighlightItem.objects.get(id=item_id)
        self.assertEqual(moved_item.stage_id, self.stage.id)
        self.assertEqual(moved_item.sort_order, 0)

        delete_item_resp = self.client.delete(reverse("admin-highlight-item-detail", kwargs={"item_id": item_id}))
        self.assertEqual(delete_item_resp.status_code, 200)
        self.assertFalse(HighlightItem.objects.filter(id=item_id).exists())

        delete_stage_resp = self.client.delete(reverse("admin-highlight-stage-detail", kwargs={"stage_id": stage_id}))
        self.assertEqual(delete_stage_resp.status_code, 200)
        self.assertFalse(HighlightStage.objects.filter(id=stage_id).exists())
