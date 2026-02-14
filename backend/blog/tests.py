from __future__ import annotations

import tempfile
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from .models import HighlightItem, HighlightStage, Post, PostView, SocialFriend, TimelineNode, TravelPlace


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
        self.assertIn("stats", payload)
        self.assertIn("contact", payload)
        self.assertGreaterEqual(payload["stats"]["published_posts_total"], 1)

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
        self.assertNotIn("name", friend)
        self.assertNotIn("profile_url", friend)
        self.assertNotIn("avatar", friend)

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
    def test_sync_obsidian_upsert(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            vault = Path(temp_dir)
            markdown = vault / "hello.md"
            markdown.write_text(
                "---\n"
                "title: 来自 Obsidian\n"
                "publish: true\n"
                "tags:\n"
                "  - note\n"
                "  - sync\n"
                "clc: T123\n"
                "---\n\n"
                "这是正文。\n",
                encoding="utf-8",
            )

            call_command("sync_obsidian", str(vault), "--force")
            self.assertEqual(Post.objects.count(), 1)

            post = Post.objects.first()
            assert post is not None
            self.assertEqual(post.sync_source, Post.SyncSource.OBSIDIAN)
            self.assertEqual(post.category, Post.Category.TECH)
            self.assertEqual(post.obsidian_path, "hello.md")
            self.assertEqual(post.draft, False)
