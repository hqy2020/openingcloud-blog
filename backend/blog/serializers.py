from __future__ import annotations

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
