from __future__ import annotations

from django.contrib.sitemaps import Sitemap
from django.urls import reverse

from .models import Post


class StaticViewSitemap(Sitemap):
    protocol = "https"
    priority = 0.8
    changefreq = "daily"

    def items(self):
        return ["home-page", "tech-page", "learning-page", "life-page"]

    def location(self, item):
        mapping = {
            "home-page": "/",
            "tech-page": "/tech",
            "learning-page": "/learning",
            "life-page": "/life",
        }
        return mapping[item]


class PostSitemap(Sitemap):
    protocol = "https"
    priority = 0.7
    changefreq = "weekly"

    def items(self):
        return Post.objects.filter(draft=False).order_by("-updated_at")

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return reverse("posts-detail", kwargs={"slug": obj.slug}).replace("/api", "")
