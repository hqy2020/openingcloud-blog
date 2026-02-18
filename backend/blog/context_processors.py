from __future__ import annotations

from django.db.models import Sum
from django.utils import timezone

from .models import HighlightItem, HighlightStage, PhotoWallImage, Post, PostView, SiteVisit, SocialFriend, TimelineNode, TravelPlace


def admin_dashboard_stats(_request):
    total_views = PostView.objects.aggregate(total=Sum("views")).get("total") or 0

    site_visits_total = SiteVisit.objects.count()
    unique_visitors = SiteVisit.objects.values("ip_hash").distinct().count()
    today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_visits = SiteVisit.objects.filter(created_at__gte=today_start).count()

    return {
        "dashboard_stats": {
            "posts_total": Post.objects.count(),
            "posts_published": Post.objects.filter(draft=False).count(),
            "timeline_total": TimelineNode.objects.count(),
            "travel_total": TravelPlace.objects.count(),
            "social_total": SocialFriend.objects.count(),
            "photo_total": PhotoWallImage.objects.count(),
            "highlight_stages_total": HighlightStage.objects.count(),
            "highlight_items_total": HighlightItem.objects.count(),
            "total_views": total_views,
            "site_visits_total": site_visits_total,
            "unique_visitors": unique_visitors,
            "today_visits": today_visits,
        }
    }
