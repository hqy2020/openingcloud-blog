from __future__ import annotations

from django.db.models import Sum

from .models import HighlightItem, HighlightStage, Post, PostView, SocialFriend, TimelineNode, TravelPlace


def admin_dashboard_stats(_request):
    total_views = PostView.objects.aggregate(total=Sum("views")).get("total") or 0
    return {
        "dashboard_stats": {
            "posts_total": Post.objects.count(),
            "posts_published": Post.objects.filter(draft=False).count(),
            "timeline_total": TimelineNode.objects.count(),
            "travel_total": TravelPlace.objects.count(),
            "social_total": SocialFriend.objects.count(),
            "highlight_stages_total": HighlightStage.objects.count(),
            "highlight_items_total": HighlightItem.objects.count(),
            "total_views": total_views,
        }
    }
