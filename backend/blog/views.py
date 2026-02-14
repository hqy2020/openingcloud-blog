from __future__ import annotations

from datetime import date, timedelta
from pathlib import Path
from uuid import uuid4

from django.conf import settings
from django.core.cache import cache
from django.core.files.storage import default_storage
from django.db import connection
from django.db.models import BooleanField, F, IntegerField, Sum, Value
from django.db.models.expressions import RawSQL
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import HighlightStage, Post, PostView, SocialFriend, SyncLog, TimelineNode, TravelPlace
from .permissions import IsStaffOrSyncToken, IsStaffUser
from .serializers import (
    AdminImageUploadSerializer,
    AdminObsidianReconcileRequestSerializer,
    AdminObsidianReconcileResponseSerializer,
    AdminObsidianSyncRequestSerializer,
    AdminObsidianSyncResponseSerializer,
    HighlightStagePublicSerializer,
    HomeAggregateSerializer,
    LoginSerializer,
    PostDetailSerializer,
    PostListSerializer,
    SocialGraphPublicSerializer,
    TimelineNodePublicSerializer,
    TravelProvinceSerializer,
)
from sync.service import reconcile_obsidian_publications, sync_post_payload


def api_ok(data, status_code=status.HTTP_200_OK):
    return Response({"ok": True, "data": data}, status=status_code)


def api_error(code, message, status_code):
    return Response({"ok": False, "code": code, "message": message}, status=status_code)


def filter_posts_by_tag(queryset, tag: str):
    normalized_tag = str(tag or "").strip()
    if not normalized_tag:
        return queryset

    if connection.vendor == "sqlite":
        table_name = queryset.model._meta.db_table
        tag_match_sql = (
            "EXISTS ("
            f"SELECT 1 FROM json_each({table_name}.tags) "
            "WHERE lower(trim(CAST(json_each.value AS TEXT))) = lower(trim(%s))"
            ")"
        )
        return queryset.annotate(
            _tag_matched=RawSQL(tag_match_sql, (normalized_tag,), output_field=BooleanField())
        ).filter(_tag_matched=True)

    return queryset.filter(tags__icontains=f'"{normalized_tag}"')


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return api_ok(
            {
                "service": "openingclouds-backend",
                "status": "healthy",
                "time": timezone.now().isoformat(),
            }
        )


class PostListView(generics.ListAPIView):
    serializer_class = PostListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Post.objects.filter(draft=False).select_related("view_record")
        category = self.request.query_params.get("category")
        tag = self.request.query_params.get("tag")
        sort = self.request.query_params.get("sort", "latest")

        if category:
            queryset = queryset.filter(category=category)

        if tag:
            queryset = filter_posts_by_tag(queryset, tag)

        if sort == "views":
            queryset = queryset.annotate(
                sort_views=Coalesce("view_record__views", Value(0), output_field=IntegerField())
            ).order_by("-sort_views", "-updated_at", "-id")
        else:
            queryset = queryset.order_by("-updated_at", "-id")

        return queryset

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return api_ok(response.data)


class PostDetailView(generics.RetrieveAPIView):
    serializer_class = PostDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        return Post.objects.filter(draft=False).select_related("view_record")

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        return api_ok(response.data)


class IncrementPostView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, slug):
        try:
            post = Post.objects.get(slug=slug, draft=False)
        except Post.DoesNotExist:
            return api_error("not_found", "文章不存在", status.HTTP_404_NOT_FOUND)

        ident = request.META.get("HTTP_X_FORWARDED_FOR") or request.META.get("REMOTE_ADDR") or "unknown"
        cache_key = f"post-view-throttle:{slug}:{ident}"
        if cache.get(cache_key):
            record, _ = PostView.objects.get_or_create(post=post)
            return api_ok({"slug": slug, "views": record.views, "throttled": True})

        PostView.objects.get_or_create(post=post)
        PostView.objects.filter(post=post).update(views=F("views") + 1)
        cache.set(cache_key, True, timeout=int(timedelta(minutes=30).total_seconds()))

        record = PostView.objects.get(post=post)
        return api_ok({"slug": slug, "views": record.views, "throttled": False})


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        response = api_ok({"username": user.username, "is_staff": user.is_staff})

        response.set_cookie(
            settings.LOGIN_COOKIE_NAME,
            access_token,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite=settings.COOKIE_SAMESITE,
            max_age=int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()),
            domain=settings.COOKIE_DOMAIN,
            path="/",
        )

        response.set_cookie(
            settings.REFRESH_COOKIE_NAME,
            refresh_token,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite=settings.COOKIE_SAMESITE,
            max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
            domain=settings.COOKIE_DOMAIN,
            path="/",
        )
        return response


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        response = api_ok({"logged_out": True})
        response.delete_cookie(settings.LOGIN_COOKIE_NAME, path="/", domain=settings.COOKIE_DOMAIN)
        response.delete_cookie(settings.REFRESH_COOKIE_NAME, path="/", domain=settings.COOKIE_DOMAIN)
        return response


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return api_ok(
            {
                "username": request.user.username,
                "is_staff": request.user.is_staff,
                "is_superuser": request.user.is_superuser,
            }
        )


class AdminPingView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def get(self, request):
        return api_ok({"message": "admin access granted", "username": request.user.username})


class AdminImageUploadView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = AdminImageUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        upload = serializer.validated_data["file"]
        suffix = Path(upload.name).suffix.lower() or ".bin"
        saved_path = default_storage.save(
            f"uploads/{timezone.now():%Y/%m}/{uuid4().hex}{suffix}",
            upload,
        )

        return api_ok(
            {
                "url": default_storage.url(saved_path),
                "path": saved_path,
                "size": upload.size,
                "content_type": str(getattr(upload, "content_type", "")),
            }
        )


class AdminObsidianSyncView(APIView):
    permission_classes = [IsStaffOrSyncToken]

    def post(self, request):
        serializer = AdminObsidianSyncRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payload = dict(serializer.validated_data)
        mode = payload.pop("mode", SyncLog.Mode.OVERWRITE)
        dry_run = bool(payload.pop("dry_run", False))
        operator = request.user if request.user and request.user.is_authenticated else None
        try:
            outcome = sync_post_payload(
                payload,
                mode=mode,
                source=SyncLog.Source.API,
                operator=operator,
                dry_run=dry_run,
            )
        except ValueError as exc:
            return api_error("sync_failed", str(exc), status.HTTP_400_BAD_REQUEST)

        response_payload = {
            "action": outcome.action,
            "post": outcome.sync_log.result if outcome.post else None,
            "sync_log_id": outcome.sync_log.id,
        }
        response_serializer = AdminObsidianSyncResponseSerializer(data=response_payload)
        response_serializer.is_valid(raise_exception=True)
        return api_ok(response_serializer.validated_data)


class AdminObsidianReconcileView(APIView):
    permission_classes = [IsStaffOrSyncToken]

    def post(self, request):
        serializer = AdminObsidianReconcileRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        operator = request.user if request.user and request.user.is_authenticated else None

        payload = dict(serializer.validated_data)
        try:
            result = reconcile_obsidian_publications(
                published_paths=payload.get("published_paths", []),
                scope_prefixes=payload.get("scope_prefixes", []),
                behavior=payload.get("behavior", "draft"),
                source=SyncLog.Source.API,
                operator=operator,
                dry_run=bool(payload.get("dry_run", False)),
            )
        except ValueError as exc:
            return api_error("reconcile_failed", str(exc), status.HTTP_400_BAD_REQUEST)

        response_payload = {
            "action": result.action,
            "behavior": result.behavior,
            "matched": result.matched,
            "drafted": result.drafted,
            "deleted": result.deleted,
            "sync_log_id": result.sync_log.id,
        }
        response_serializer = AdminObsidianReconcileResponseSerializer(data=response_payload)
        response_serializer.is_valid(raise_exception=True)
        return api_ok(response_serializer.validated_data)


def _travel_payload() -> list[dict]:
    rows = TravelPlace.objects.all().order_by("sort_order", "province", "city")
    grouped: dict[str, dict] = {}
    for row in rows:
        if row.province not in grouped:
            grouped[row.province] = {"province": row.province, "count": 0, "cities": []}
        grouped[row.province]["cities"].append(
            {
                "city": row.city,
                "notes": row.notes,
                "visited_at": row.visited_at,
                "latitude": row.latitude,
                "longitude": row.longitude,
                "cover": row.cover,
                "sort_order": row.sort_order,
            }
        )
        grouped[row.province]["count"] += 1

    return [grouped[province] for province in sorted(grouped.keys())]


def _social_graph_payload() -> dict:
    stage_meta = {
        SocialFriend.StageKey.PRIMARY: ("小学", 10),
        SocialFriend.StageKey.MIDDLE: ("初中", 20),
        SocialFriend.StageKey.HIGH: ("高中", 30),
        SocialFriend.StageKey.TONGJI: ("同济", 40),
        SocialFriend.StageKey.ZJU: ("浙大", 50),
        SocialFriend.StageKey.CAREER: ("工作", 60),
        SocialFriend.StageKey.FAMILY: ("家庭", 70),
    }
    stage_keys = list(stage_meta.keys())

    nodes: list[dict] = []
    links: list[dict] = []

    for key in stage_keys:
        label, order = stage_meta[key]
        nodes.append(
            {
                "id": f"stage-{key}",
                "type": "stage",
                "label": label,
                "stage_key": key,
                "order": order,
            }
        )

    friends = SocialFriend.objects.filter(is_public=True).order_by("sort_order", "id")
    for friend in friends:
        node_id = f"friend-{friend.id}"
        stage_id = f"stage-{friend.stage_key}"
        nodes.append(
            {
                "id": node_id,
                "type": "friend",
                "label": friend.public_label,
                "stage_key": friend.stage_key,
                "order": 1000 + friend.sort_order,
            }
        )
        links.append({"source": stage_id, "target": node_id})

    return {"nodes": nodes, "links": links}


def _home_stats_payload() -> dict:
    posts = Post.objects.all()
    published_posts = posts.filter(draft=False)
    tags: set[str] = set()
    for row in published_posts.values_list("tags", flat=True):
        if isinstance(row, list):
            tags.update(str(item) for item in row if item)

    views_total = PostView.objects.aggregate(total=Sum("views"))["total"] or 0

    stages = HighlightStage.objects.prefetch_related("items")
    total_words = sum(len(str(content or "").replace(" ", "").replace("\n", "").replace("\t", "")) for content in published_posts.values_list("content", flat=True))

    launch_date = None
    configured_launch_date = str(getattr(settings, "SITE_LAUNCH_DATE", "2026-02-01")).strip()
    try:
        launch_date = date.fromisoformat(configured_launch_date)
    except ValueError:
        launch_date = None

    if launch_date is None:
        first_post_created_at = published_posts.order_by("created_at").values_list("created_at", flat=True).first()
        if first_post_created_at is not None:
            launch_date = timezone.localdate(first_post_created_at)

    if launch_date is None:
        launch_date = timezone.localdate()

    site_days = max(1, (timezone.localdate() - launch_date).days + 1)

    return {
        "posts_total": posts.count(),
        "published_posts_total": published_posts.count(),
        "timeline_total": TimelineNode.objects.count(),
        "travel_total": TravelPlace.objects.count(),
        "social_total": SocialFriend.objects.filter(is_public=True).count(),
        "highlight_stages_total": stages.count(),
        "highlight_items_total": sum(len(stage.items.all()) for stage in stages),
        "tags_total": len(tags),
        "views_total": int(views_total),
        "total_words": int(total_words),
        "site_days": int(site_days),
    }


def _home_payload() -> dict:
    timeline = TimelineNode.objects.all().order_by("sort_order", "start_date")
    highlights = HighlightStage.objects.prefetch_related("items").order_by("sort_order", "start_date", "id")
    travel = _travel_payload()
    social_graph = _social_graph_payload()

    email = getattr(settings, "PUBLIC_CONTACT_EMAIL", "openingclouds@outlook.com")
    github = getattr(settings, "PUBLIC_GITHUB_URL", "https://github.com/hqy2020/openingcloud-blog")

    return {
        "hero": {
            "title": "openingClouds",
            "subtitle": "Tech · Efficiency · Life",
            "slogans": [
                "用代码丈量世界的边界",
                "记录即存在，分享即生长",
                "每一次优化都是向自由迈进",
                "在云端看自己的脚印",
                "技术是手段，思考是目的",
                "把日常过成实验，把生活活成作品",
            ],
            "fallback_image": "/media/hero/hero-fallback.png",
            "fallback_video": "/media/hero/hero-fallback.mp4",
        },
        "timeline": TimelineNodePublicSerializer(timeline, many=True).data,
        "highlights": HighlightStagePublicSerializer(highlights, many=True).data,
        "travel": TravelProvinceSerializer(travel, many=True).data,
        "social_graph": SocialGraphPublicSerializer(social_graph).data,
        "stats": _home_stats_payload(),
        "contact": {
            "email": email,
            "github": github,
        },
    }


class TimelineView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        queryset = TimelineNode.objects.all().order_by("sort_order", "start_date")
        payload = TimelineNodePublicSerializer(queryset, many=True).data
        return api_ok(payload)


class HighlightsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        queryset = HighlightStage.objects.prefetch_related("items").order_by("sort_order", "start_date", "id")
        payload = HighlightStagePublicSerializer(queryset, many=True).data
        return api_ok(payload)


class TravelView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        payload = TravelProvinceSerializer(_travel_payload(), many=True).data
        return api_ok(payload)


class SocialGraphView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        payload = SocialGraphPublicSerializer(_social_graph_payload()).data
        return api_ok(payload)


class HomeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        payload = HomeAggregateSerializer(_home_payload()).data
        return api_ok(payload)
