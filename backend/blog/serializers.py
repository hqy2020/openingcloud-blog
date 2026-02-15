from __future__ import annotations

from pathlib import Path
from urllib.parse import urlparse

from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import HighlightItem, HighlightStage, PhotoWallImage, Post, SocialFriend, TimelineNode, TravelPlace


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


class PostAdminSerializer(serializers.ModelSerializer):
    views_count = serializers.SerializerMethodField(read_only=True)

    def get_views_count(self, obj):
        return getattr(getattr(obj, "view_record", None), "views", 0)

    def validate_tags(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("tags 必须是数组")
        cleaned: list[str] = []
        for raw in value:
            text = str(raw or "").strip()
            if text:
                cleaned.append(text)
        return cleaned

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "slug",
            "excerpt",
            "content",
            "category",
            "tags",
            "cover",
            "draft",
            "obsidian_path",
            "sync_source",
            "last_synced_at",
            "views_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "sync_source",
            "last_synced_at",
            "views_count",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "slug": {"required": False, "allow_blank": True},
            "excerpt": {"required": False, "allow_blank": True},
            "cover": {"required": False, "allow_blank": True},
            "obsidian_path": {"required": False, "allow_blank": True},
        }


class TimelineNodeAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimelineNode
        fields = [
            "id",
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
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        extra_kwargs = {
            "description": {"required": False, "allow_blank": True},
            "end_date": {"required": False, "allow_null": True},
            "phase": {"required": False, "allow_blank": True},
            "cover": {"required": False, "allow_blank": True},
        }


class TravelPlaceAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = TravelPlace
        fields = [
            "id",
            "province",
            "city",
            "notes",
            "visited_at",
            "latitude",
            "longitude",
            "cover",
            "sort_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        extra_kwargs = {
            "notes": {"required": False, "allow_blank": True},
            "visited_at": {"required": False, "allow_null": True},
            "latitude": {"required": False, "allow_null": True},
            "longitude": {"required": False, "allow_null": True},
            "cover": {"required": False, "allow_blank": True},
        }


class SocialFriendAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialFriend
        fields = [
            "id",
            "name",
            "public_label",
            "relation",
            "stage_key",
            "honorific",
            "avatar",
            "profile_url",
            "contact",
            "birthday",
            "is_public",
            "sort_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        extra_kwargs = {
            "relation": {"required": False, "allow_blank": True},
            "avatar": {"required": False, "allow_blank": True},
            "profile_url": {"required": False, "allow_blank": True},
            "contact": {"required": False, "allow_blank": True},
            "birthday": {"required": False, "allow_null": True},
        }


class PhotoWallImageAdminSerializer(serializers.ModelSerializer):
    allowed_hosts = {"github.com", "raw.githubusercontent.com"}
    allowed_repo_segment = "hqy2020/obsidian-images"

    class Meta:
        model = PhotoWallImage
        fields = [
            "id",
            "title",
            "description",
            "image_url",
            "source_url",
            "captured_at",
            "width",
            "height",
            "is_public",
            "sort_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        extra_kwargs = {
            "title": {"required": False, "allow_blank": True},
            "description": {"required": False, "allow_blank": True},
            "source_url": {"required": False, "allow_blank": True},
            "captured_at": {"required": False, "allow_null": True},
            "width": {"required": False, "allow_null": True},
            "height": {"required": False, "allow_null": True},
        }

    def validate_image_url(self, value: str):
        url = str(value or "").strip()
        if url.startswith("/"):
            raise serializers.ValidationError("照片墙只允许远程链接，不能使用本地路径")
        parsed = urlparse(url)
        if parsed.netloc.lower() not in self.allowed_hosts or self.allowed_repo_segment not in parsed.path:
            raise serializers.ValidationError("照片墙图片请使用 hqy2020/obsidian-images 仓库远程链接")
        return url

    def validate_source_url(self, value: str):
        url = str(value or "").strip()
        if not url:
            return ""
        parsed = urlparse(url)
        if parsed.netloc.lower() not in self.allowed_hosts or self.allowed_repo_segment not in parsed.path:
            raise serializers.ValidationError("source_url 需指向 hqy2020/obsidian-images 仓库")
        return url


class HighlightItemAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = HighlightItem
        fields = [
            "id",
            "stage",
            "title",
            "description",
            "achieved_at",
            "sort_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        extra_kwargs = {
            "description": {"required": False, "allow_blank": True},
            "achieved_at": {"required": False, "allow_null": True},
        }


class HighlightStageAdminSerializer(serializers.ModelSerializer):
    items = HighlightItemAdminSerializer(many=True, read_only=True)

    class Meta:
        model = HighlightStage
        fields = [
            "id",
            "title",
            "description",
            "start_date",
            "end_date",
            "sort_order",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        extra_kwargs = {
            "description": {"required": False, "allow_blank": True},
            "start_date": {"required": False, "allow_null": True},
            "end_date": {"required": False, "allow_null": True},
        }


class SortOrderItemSerializer(serializers.Serializer):
    id = serializers.IntegerField(min_value=1)
    sort_order = serializers.IntegerField(min_value=0)


class ReorderRequestSerializer(serializers.Serializer):
    ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=False,
        allow_empty=False,
    )
    items = SortOrderItemSerializer(many=True, required=False, allow_empty=False)

    def validate(self, attrs):
        ids = attrs.get("ids")
        items = attrs.get("items")
        if not ids and not items:
            raise serializers.ValidationError("ids 或 items 至少提供一个")
        if ids and items:
            raise serializers.ValidationError("ids 与 items 不能同时提供")

        source = ids if ids else [item["id"] for item in items]
        if len(source) != len(set(source)):
            raise serializers.ValidationError("包含重复 id")
        return attrs


class HighlightItemReorderSerializer(SortOrderItemSerializer):
    stage_id = serializers.IntegerField(min_value=1, required=False)


class HighlightReorderRequestSerializer(serializers.Serializer):
    stages = ReorderRequestSerializer(required=False)
    items = HighlightItemReorderSerializer(many=True, required=False, allow_empty=False)

    def validate(self, attrs):
        stages = attrs.get("stages")
        items = attrs.get("items")
        if not stages and not items:
            raise serializers.ValidationError("stages 或 items 至少提供一个")

        if items:
            item_ids = [item["id"] for item in items]
            if len(item_ids) != len(set(item_ids)):
                raise serializers.ValidationError("items 包含重复 id")

        return attrs


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


class PhotoWallPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhotoWallImage
        fields = [
            "title",
            "description",
            "image_url",
            "source_url",
            "captured_at",
            "width",
            "height",
            "sort_order",
        ]


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
    photo_wall = PhotoWallPublicSerializer(many=True)
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
