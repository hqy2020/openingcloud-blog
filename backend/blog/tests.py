from __future__ import annotations

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from .models import Post, PostView


class ApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.post = Post.objects.create(
            title="Hello",
            slug="hello",
            excerpt="intro",
            content="# hello",
            category=Post.Category.TECH,
            tags=["django"],
            draft=False,
        )

    def test_health(self):
        resp = self.client.get(reverse("health"))
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.data["ok"])

    def test_posts_list(self):
        resp = self.client.get(reverse("posts-list"))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["ok"], True)

    def test_increment_view(self):
        resp = self.client.post(reverse("posts-view", kwargs={"slug": self.post.slug}))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(PostView.objects.get(post=self.post).views, 1)


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
