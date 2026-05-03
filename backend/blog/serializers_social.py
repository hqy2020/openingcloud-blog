from rest_framework import serializers

from blog.models import SocialMediaStat


class SocialMediaStatSerializer(serializers.ModelSerializer):
    """自媒体数据序列化器"""
    platform_icon = serializers.CharField(read_only=True)
    engagement_rate = serializers.FloatField(read_only=True)
    
    class Meta:
        model = SocialMediaStat
        fields = [
            "id", "platform", "account_name", "date",
            "followers", "total_views", "total_likes",
            "posts_count", "comments", "shares", "favorites",
            "best_post_title", "best_post_views", "best_post_likes", "best_post_url",
            "yesterday_followers", "yesterday_views", "yesterday_shares",
            "is_active", "sort_order", "collected_at",
            "platform_icon", "engagement_rate",
        ]


class SocialMediaStatListSerializer(serializers.Serializer):
    """聚合统计数据 - 用于看板总览"""
    total_followers = serializers.IntegerField()
    total_views = serializers.IntegerField()
    total_likes = serializers.IntegerField()
    platform_count = serializers.IntegerField()
    platforms = SocialMediaStatSerializer(many=True)
    updated_at = serializers.DateTimeField()


class SocialMediaStatBulkCreateSerializer(serializers.Serializer):
    """批量创建更新 - 供同步脚本使用"""
    data = SocialMediaStatSerializer(many=True)
    
    def create(self, validated_data):
        instances = []
        for item in validated_data["data"]:
            platform = item["platform"]
            date = item["date"]
            # Upsert: 同平台同日期只保留一条
            obj, created = SocialMediaStat.objects.update_or_create(
                platform=platform,
                date=date,
                defaults=item,
            )
            instances.append(obj)
        return instances
