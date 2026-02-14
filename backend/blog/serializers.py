from __future__ import annotations

from pathlib import Path

from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import HighlightItem, HighlightStage, Post, TimelineNode


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(username=attrs["username"], password=attrs["password"])
        if not user:
            raise serializers.ValidationError("用户名或密码错误")
        attrs["user"] = user
        return attrs


class PostListSerializer(serializers.ModelSerializer):
    views_count = serializers.SerializerMethodField()

    def get_views_count(self, obj):
        return getattr(getattr(obj, "view_record", None), "views", 0)

    class Meta:
        model = Post
        fields = [
            "title",
            "slug",
            "excerpt",
            "category",
            "tags",
            "cover",
            "draft",
            "views_count",
            "created_at",
            "updated_at",
        ]


class PostDetailSerializer(serializers.ModelSerializer):
    views_count = serializers.SerializerMethodField()

    def get_views_count(self, obj):
        return getattr(getattr(obj, "view_record", None), "views", 0)

    class Meta:
        model = Post
        fields = [
            "title",
            "slug",
            "excerpt",
            "content",
            "category",
            "tags",
            "cover",
            "draft",
            "views_count",
            "created_at",
            "updated_at",
        ]


class TimelineNodePublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimelineNode
        fields = [
            "title",
            "description",
            "start_date",
            "end_date",
            "type",
            "impact",
            "phase",
            "tags",
            "cover",
            "links",
            "sort_order",
        ]


class HighlightItemPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = HighlightItem
        fields = [
            "title",
            "description",
            "achieved_at",
            "sort_order",
        ]


class HighlightStagePublicSerializer(serializers.ModelSerializer):
    items = HighlightItemPublicSerializer(many=True, read_only=True)

    class Meta:
        model = HighlightStage
        fields = [
            "title",
            "description",
            "start_date",
            "end_date",
            "sort_order",
            "items",
        ]


class TravelCitySerializer(serializers.Serializer):
    city = serializers.CharField()
    notes = serializers.CharField()
    visited_at = serializers.DateField(allow_null=True)
    latitude = serializers.FloatField(allow_null=True)
    longitude = serializers.FloatField(allow_null=True)
    cover = serializers.CharField()
    sort_order = serializers.IntegerField()


class TravelProvinceSerializer(serializers.Serializer):
    province = serializers.CharField()
    count = serializers.IntegerField()
    cities = TravelCitySerializer(many=True)


class SocialGraphNodeSerializer(serializers.Serializer):
    id = serializers.CharField()
    type = serializers.ChoiceField(choices=["stage", "friend"])
    label = serializers.CharField()
    stage_key = serializers.CharField()
    order = serializers.IntegerField()


class SocialGraphLinkSerializer(serializers.Serializer):
    source = serializers.CharField()
    target = serializers.CharField()


class SocialGraphPublicSerializer(serializers.Serializer):
    nodes = SocialGraphNodeSerializer(many=True)
    links = SocialGraphLinkSerializer(many=True)


class HomeHeroSerializer(serializers.Serializer):
    title = serializers.CharField()
    subtitle = serializers.CharField()
    slogans = serializers.ListField(child=serializers.CharField())
    fallback_image = serializers.CharField()
    fallback_video = serializers.CharField(allow_blank=True)


class HomeStatsSerializer(serializers.Serializer):
    posts_total = serializers.IntegerField()
    published_posts_total = serializers.IntegerField()
    timeline_total = serializers.IntegerField()
    travel_total = serializers.IntegerField()
    social_total = serializers.IntegerField()
    highlight_stages_total = serializers.IntegerField()
    highlight_items_total = serializers.IntegerField()
    tags_total = serializers.IntegerField()
    views_total = serializers.IntegerField()
    total_words = serializers.IntegerField()
    site_days = serializers.IntegerField()


class HomeContactSerializer(serializers.Serializer):
    email = serializers.CharField()
    github = serializers.CharField()


class HomeAggregateSerializer(serializers.Serializer):
    hero = HomeHeroSerializer()
    timeline = TimelineNodePublicSerializer(many=True)
    highlights = HighlightStagePublicSerializer(many=True)
    travel = TravelProvinceSerializer(many=True)
    social_graph = SocialGraphPublicSerializer()
    stats = HomeStatsSerializer()
    contact = HomeContactSerializer()


class AdminImageUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

    allowed_content_types = {"image/jpeg", "image/png", "image/webp"}
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    max_size = 5 * 1024 * 1024

    def validate_file(self, value):
        content_type = str(getattr(value, "content_type", "")).lower()
        suffix = Path(value.name).suffix.lower()

        if value.size > self.max_size:
            raise serializers.ValidationError("图片大小不能超过 5MB")

        if content_type not in self.allowed_content_types and suffix not in self.allowed_extensions:
            raise serializers.ValidationError("仅支持 jpg/png/webp 格式")

        return value


class AdminObsidianSyncRequestSerializer(serializers.Serializer):
    title = serializers.CharField(required=False, allow_blank=True)
    slug = serializers.SlugField(required=False, allow_blank=True)
    content = serializers.CharField(required=False, allow_blank=True)
    category = serializers.ChoiceField(choices=Post.Category.choices, default=Post.Category.TECH)
    tags = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    cover = serializers.CharField(required=False, allow_blank=True)
    excerpt = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    obsidian_path = serializers.CharField(required=False, allow_blank=True)
    mode = serializers.ChoiceField(choices=["overwrite", "skip", "merge"], default="overwrite")
    dry_run = serializers.BooleanField(required=False, default=False)

    def validate(self, attrs):
        title = str(attrs.get("title") or "").strip()
        slug = str(attrs.get("slug") or "").strip()

        if not title and not slug:
            raise serializers.ValidationError("title 或 slug 至少提供一个")

        if not attrs.get("excerpt") and attrs.get("description"):
            attrs["excerpt"] = attrs["description"]

        return attrs


class AdminSyncedPostSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    slug = serializers.CharField()
    title = serializers.CharField()
    category = serializers.CharField()
    updated_at = serializers.DateTimeField()
    sync_source = serializers.CharField()
    obsidian_path = serializers.CharField(allow_blank=True)
    last_synced_at = serializers.DateTimeField(allow_null=True)


class AdminObsidianSyncResponseSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["created", "updated", "skipped"])
    post = AdminSyncedPostSerializer(allow_null=True)
    sync_log_id = serializers.IntegerField()


class AdminObsidianReconcileRequestSerializer(serializers.Serializer):
    published_paths = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    scope_prefixes = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    behavior = serializers.ChoiceField(choices=["draft", "delete", "none"], default="draft")
    dry_run = serializers.BooleanField(required=False, default=False)


class AdminObsidianReconcileResponseSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["updated", "skipped"])
    behavior = serializers.ChoiceField(choices=["draft", "delete", "none"])
    matched = serializers.IntegerField()
    drafted = serializers.IntegerField()
    deleted = serializers.IntegerField()
    sync_log_id = serializers.IntegerField()
