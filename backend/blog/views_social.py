from __future__ import annotations

from django.db.models import Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from blog.models import SocialMediaStat
from blog.serializers_social import (
    SocialMediaStatBulkCreateSerializer,
    SocialMediaStatListSerializer,
    SocialMediaStatSerializer,
)

from .views import api_ok  # type: ignore[import-untyped]


class SocialMediaStatsView(APIView):
    """自媒体数据看板 - 公开API"""

    permission_classes = [AllowAny]

    def get(self, request):
        # 获取最新的数据
        latest_date = (
            SocialMediaStat.objects.filter(is_active=True)
            .order_by("-date")
            .values_list("date", flat=True)
            .first()
        )
        if not latest_date:
            return api_ok({
                "total_followers": 0,
                "total_views": 0,
                "total_likes": 0,
                "platform_count": 0,
                "platforms": [],
                "updated_at": None,
            })

        stats = SocialMediaStat.objects.filter(
            is_active=True, date=latest_date
        ).order_by("sort_order", "platform")

        serializer = SocialMediaStatSerializer(stats, many=True)

        aggregates = stats.aggregate(
            total_followers=Sum("followers"),
            total_views=Sum("total_views"),
            total_likes=Sum("total_likes"),
        )

        return api_ok({
            "total_followers": aggregates["total_followers"] or 0,
            "total_views": aggregates["total_views"] or 0,
            "total_likes": aggregates["total_likes"] or 0,
            "platform_count": stats.count(),
            "platforms": serializer.data,
            "updated_at": latest_date,
        })


class AdminSocialMediaStatsView(APIView):
    """管理后台 - 全量数据"""

    permission_classes = [IsAdminUser]

    def get(self, request):
        stats = SocialMediaStat.objects.all().order_by("-date", "sort_order", "platform")
        serializer = SocialMediaStatSerializer(stats, many=True)
        return api_ok(serializer.data)

    def post(self, request):
        """批量同步数据（供cron同步脚本调用）"""
        serializer = SocialMediaStatBulkCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        instances = serializer.save()
        return api_ok({
            "synced": len(instances),
            "message": f"成功同步 {len(instances)} 条记录",
        })


class SocialMediaStatsHistoryView(APIView):
    """历史趋势数据 - 单平台时间序列"""

    permission_classes = [AllowAny]

    def get(self, request, platform: str):
        stats = (
            SocialMediaStat.objects.filter(platform=platform, is_active=True)
            .order_by("date")
            .values("date", "followers", "total_views", "total_likes", "posts_count")
        )
        return api_ok(list(stats))
