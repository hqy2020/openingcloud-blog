from __future__ import annotations

from datetime import date, timedelta
from pathlib import Path
from uuid import uuid4

from django.conf import settings
from django.core.cache import cache
from django.core.files.storage import default_storage
from django.db import connection, transaction
from django.db.models import BooleanField, F, IntegerField, Q, Sum, Value
from django.db.models.expressions import RawSQL
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    HighlightItem,
    HighlightStage,
    PhotoWallImage,
    Post,
    PostLike,
    PostLikeVote,
    PostView,
    SiteVisit,
    SocialFriend,
    SyncLog,
    TimelineNode,
    TravelPlace,
)
from .permissions import IsStaffOrSyncToken, IsStaffUser
from .serializers import (
    AdminImageUploadSerializer,
    AdminObsidianReconcileRequestSerializer,
    AdminObsidianReconcileResponseSerializer,
    AdminObsidianSyncRequestSerializer,
    AdminObsidianSyncResponseSerializer,
    HighlightItemAdminSerializer,
    HighlightReorderRequestSerializer,
    HighlightStageAdminSerializer,
    HighlightStagePublicSerializer,
    HomeAggregateSerializer,
    LoginSerializer,
    PhotoWallImageAdminSerializer,
    PhotoWallPublicSerializer,
    PinnedPostSerializer,
    PostAdminSerializer,
    PostDetailSerializer,
    PostListSerializer,
    ReorderRequestSerializer,
    SocialFriendAdminSerializer,
    SocialGraphPublicSerializer,
    TimelineNodeAdminSerializer,
    TimelineNodePublicSerializer,
    TravelPlaceAdminSerializer,
    TravelProvinceSerializer,
)
from sync.service import reconcile_obsidian_publications, sync_post_payload

OBSIDIAN_IMAGES_REPO_URL = "https://github.com/hqy2020/obsidian-images"


def api_ok(data, status_code=status.HTTP_200_OK):
    return Response({"ok": True, "data": data}, status=status_code)


def api_ok_private(data, status_code=status.HTTP_200_OK):
    response = api_ok(data, status_code=status_code)
    response["Cache-Control"] = "private, no-store"
    response["Vary"] = "Cookie, Authorization"
    return response


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


def _parse_bool_query(raw_value: str | None):
    if raw_value is None:
        return None
    normalized = str(raw_value).strip().lower()
    if normalized in {"1", "true", "yes", "y", "on"}:
        return True
    if normalized in {"0", "false", "no", "n", "off"}:
        return False
    return None


def _is_staff_viewer(request) -> bool:
    user = getattr(request, "user", None)
    if bool(getattr(user, "is_authenticated", False) and getattr(user, "is_staff", False)):
        return True

    # Support Django admin session auth on API views (without requiring DRF SessionAuthentication).
    raw_user = getattr(getattr(request, "_request", None), "user", None)
    return bool(getattr(raw_user, "is_authenticated", False) and getattr(raw_user, "is_staff", False))


def _normalize_reorder_items(payload: dict) -> list[dict]:
    ids = payload.get("ids") or []
    if ids:
        return [{"id": item_id, "sort_order": index} for index, item_id in enumerate(ids)]
    return list(payload.get("items") or [])


def _apply_reorder(model, items: list[dict], *, allow_extra_fields: bool = False):
    ids = [item["id"] for item in items]
    existing_ids = set(model.objects.filter(id__in=ids).values_list("id", flat=True))
    missing_ids = [item_id for item_id in ids if item_id not in existing_ids]
    if missing_ids:
        raise ValueError(f"记录不存在: {missing_ids}")

    for item in items:
        update_kwargs = {"sort_order": item["sort_order"]}
        if allow_extra_fields and "stage_id" in item:
            update_kwargs["stage_id"] = item["stage_id"]
        model.objects.filter(id=item["id"]).update(**update_kwargs)


def _normalize_remote_image_url(url: str) -> str:
    text = str(url or "").strip()
    if not text:
        return text

    github_blob_prefix = f"{OBSIDIAN_IMAGES_REPO_URL}/blob/"
    if text.startswith(github_blob_prefix):
        suffix = text.removeprefix(github_blob_prefix)
        return f"https://raw.githubusercontent.com/hqy2020/obsidian-images/{suffix}"
    return text


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
        queryset = Post.objects.filter(draft=False).select_related("view_record", "like_record")
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
        return Post.objects.filter(draft=False).select_related("view_record", "like_record")

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


class TogglePostLike(APIView):
    permission_classes = [AllowAny]

    @staticmethod
    def _get_ip_hash(request) -> str:
        import hashlib

        raw = (
            request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip()
            or request.META.get("REMOTE_ADDR")
            or "unknown"
        )
        return hashlib.sha256(raw.encode()).hexdigest()[:32]

    def get(self, request, slug):
        try:
            post = Post.objects.get(slug=slug, draft=False)
        except Post.DoesNotExist:
            return api_error("not_found", "文章不存在", status.HTTP_404_NOT_FOUND)

        ip_hash = self._get_ip_hash(request)
        liked = PostLikeVote.objects.filter(post=post, ip_hash=ip_hash).exists()
        likes = PostLikeVote.objects.filter(post=post).count()
        return api_ok({"slug": slug, "likes": likes, "liked": liked})

    def post(self, request, slug):
        try:
            post = Post.objects.get(slug=slug, draft=False)
        except Post.DoesNotExist:
            return api_error("not_found", "文章不存在", status.HTTP_404_NOT_FOUND)

        ip_hash = self._get_ip_hash(request)
        vote = PostLikeVote.objects.filter(post=post, ip_hash=ip_hash).first()

        if vote:
            vote.delete()
            liked = False
        else:
            PostLikeVote.objects.create(post=post, ip_hash=ip_hash)
            liked = True

        likes = PostLikeVote.objects.filter(post=post).count()
        PostLike.objects.update_or_create(post=post, defaults={"likes": likes})
        return api_ok({"slug": slug, "likes": likes, "liked": liked})


class RecordSiteVisitView(APIView):
    permission_classes = [AllowAny]

    @staticmethod
    def _get_ip_hash(request) -> str:
        import hashlib

        raw = (
            request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip()
            or request.META.get("REMOTE_ADDR")
            or "unknown"
        )
        return hashlib.sha256(raw.encode()).hexdigest()[:32]

    def post(self, request):
        from urllib.parse import urlparse

        path = str(request.data.get("path", "") or "").strip()[:500]
        referrer = str(request.data.get("referrer", "") or "").strip()[:1000]

        if not path:
            return api_error("invalid", "path is required", status.HTTP_400_BAD_REQUEST)

        ip_hash = self._get_ip_hash(request)
        cache_key = f"site-visit-throttle:{ip_hash}:{path}"
        if cache.get(cache_key):
            return api_ok({"recorded": False, "throttled": True})

        referrer_domain = ""
        if referrer:
            try:
                referrer_domain = urlparse(referrer).netloc[:255]
            except Exception:
                pass

        user_agent = str(request.META.get("HTTP_USER_AGENT", ""))[:500]

        SiteVisit.objects.create(
            path=path,
            referrer=referrer,
            referrer_domain=referrer_domain,
            ip_hash=ip_hash,
            user_agent=user_agent,
        )
        cache.set(cache_key, True, timeout=int(timedelta(minutes=5).total_seconds()))
        return api_ok({"recorded": True, "throttled": False})


class AdminAnalyticsView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def get(self, request):
        from django.db.models import Count
        from django.db.models.functions import TruncDate

        days = int(request.query_params.get("days", 30))
        days = min(max(days, 1), 365)
        since = timezone.now() - timedelta(days=days)

        visits = SiteVisit.objects.filter(created_at__gte=since)

        total_visits = visits.count()
        unique_visitors = visits.values("ip_hash").distinct().count()

        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_visits = SiteVisit.objects.filter(created_at__gte=today_start).count()

        week_start = timezone.now() - timedelta(days=7)
        week_visits = SiteVisit.objects.filter(created_at__gte=week_start).count()

        month_start = timezone.now() - timedelta(days=30)
        month_visits = SiteVisit.objects.filter(created_at__gte=month_start).count()

        top_referrers = list(
            visits.exclude(referrer_domain="")
            .values("referrer_domain")
            .annotate(count=Count("id"))
            .order_by("-count")[:10]
        )

        top_pages = list(
            visits.values("path")
            .annotate(count=Count("id"))
            .order_by("-count")[:10]
        )

        daily_trend = list(
            visits.annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(count=Count("id"))
            .order_by("date")
        )
        for item in daily_trend:
            item["date"] = item["date"].isoformat()

        return api_ok_private({
            "total_visits": total_visits,
            "unique_visitors": unique_visitors,
            "today_visits": today_visits,
            "week_visits": week_visits,
            "month_visits": month_visits,
            "top_referrers": top_referrers,
            "top_pages": top_pages,
            "daily_trend": daily_trend,
        })


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


class AdminListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return api_ok(response.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        response = api_ok(serializer.data, status_code=status.HTTP_201_CREATED)
        for key, value in headers.items():
            response[key] = value
        return response


class AdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        return api_ok(response.data)

    def put(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return api_ok(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        deleted_id = instance.id
        self.perform_destroy(instance)
        return api_ok({"deleted": True, "id": deleted_id})


class AdminPostListCreateView(AdminListCreateView):
    serializer_class = PostAdminSerializer
    queryset = Post.objects.select_related("view_record").all()

    def get_queryset(self):
        queryset = Post.objects.all().select_related("view_record")
        category = self.request.query_params.get("category")
        draft = _parse_bool_query(self.request.query_params.get("draft"))
        keyword = str(self.request.query_params.get("q", "")).strip()
        tag = self.request.query_params.get("tag")
        sort = str(self.request.query_params.get("sort", "latest")).strip()

        if category:
            queryset = queryset.filter(category=category)
        if draft is not None:
            queryset = queryset.filter(draft=draft)
        if keyword:
            queryset = queryset.filter(Q(title__icontains=keyword) | Q(slug__icontains=keyword) | Q(excerpt__icontains=keyword))
        if tag:
            queryset = filter_posts_by_tag(queryset, tag)

        if sort == "views":
            return queryset.annotate(
                sort_views=Coalesce("view_record__views", Value(0), output_field=IntegerField())
            ).order_by("-sort_views", "-updated_at", "-id")
        if sort == "oldest":
            return queryset.order_by("updated_at", "id")
        if sort == "title_asc":
            return queryset.order_by("title", "-updated_at", "-id")
        if sort == "title_desc":
            return queryset.order_by("-title", "-updated_at", "-id")

        return queryset.order_by("-updated_at", "-id")


class AdminPostDetailView(AdminDetailView):
    serializer_class = PostAdminSerializer
    queryset = Post.objects.select_related("view_record").all()
    lookup_field = "id"
    lookup_url_kwarg = "post_id"


class AdminTimelineListCreateView(AdminListCreateView):
    serializer_class = TimelineNodeAdminSerializer
    queryset = TimelineNode.objects.all()

    def get_queryset(self):
        queryset = TimelineNode.objects.all()
        node_type = self.request.query_params.get("type")
        impact = self.request.query_params.get("impact")
        keyword = str(self.request.query_params.get("q", "")).strip()
        sort = str(self.request.query_params.get("sort", "order")).strip()

        if node_type:
            queryset = queryset.filter(type=node_type)
        if impact:
            queryset = queryset.filter(impact=impact)
        if keyword:
            queryset = queryset.filter(Q(title__icontains=keyword) | Q(description__icontains=keyword) | Q(phase__icontains=keyword))

        if sort == "latest":
            return queryset.order_by("-start_date", "-id")
        if sort == "oldest":
            return queryset.order_by("start_date", "id")
        return queryset.order_by("sort_order", "start_date", "id")


class AdminTimelineDetailView(AdminDetailView):
    serializer_class = TimelineNodeAdminSerializer
    queryset = TimelineNode.objects.all()
    lookup_field = "id"
    lookup_url_kwarg = "timeline_id"


class AdminTravelListCreateView(AdminListCreateView):
    serializer_class = TravelPlaceAdminSerializer
    queryset = TravelPlace.objects.all()

    def get_queryset(self):
        queryset = TravelPlace.objects.all()
        province = self.request.query_params.get("province")
        keyword = str(self.request.query_params.get("q", "")).strip()
        sort = str(self.request.query_params.get("sort", "order")).strip()

        if province:
            queryset = queryset.filter(province=province)
        if keyword:
            queryset = queryset.filter(Q(province__icontains=keyword) | Q(city__icontains=keyword) | Q(notes__icontains=keyword))

        if sort == "province":
            return queryset.order_by("province", "city", "id")
        if sort == "latest":
            return queryset.order_by("-updated_at", "-id")
        return queryset.order_by("sort_order", "province", "city", "id")


class AdminTravelDetailView(AdminDetailView):
    serializer_class = TravelPlaceAdminSerializer
    queryset = TravelPlace.objects.all()
    lookup_field = "id"
    lookup_url_kwarg = "travel_id"


class AdminSocialListCreateView(AdminListCreateView):
    serializer_class = SocialFriendAdminSerializer
    queryset = SocialFriend.objects.all()

    def get_queryset(self):
        queryset = SocialFriend.objects.all()
        stage_key = self.request.query_params.get("stage_key")
        if not stage_key:
            stage_key = self.request.query_params.get("stage")
        public_only = _parse_bool_query(self.request.query_params.get("is_public"))
        keyword = str(self.request.query_params.get("q", "")).strip()
        sort = str(self.request.query_params.get("sort", "order")).strip()

        if stage_key:
            queryset = queryset.filter(stage_key=stage_key)
        if public_only is not None:
            queryset = queryset.filter(is_public=public_only)
        if keyword:
            queryset = queryset.filter(
                Q(name__icontains=keyword)
                | Q(public_label__icontains=keyword)
                | Q(relation__icontains=keyword)
                | Q(contact__icontains=keyword)
            )

        if sort == "latest":
            return queryset.order_by("-updated_at", "-id")
        if sort == "name":
            return queryset.order_by("name", "id")
        return queryset.order_by("sort_order", "id")


class AdminSocialDetailView(AdminDetailView):
    serializer_class = SocialFriendAdminSerializer
    queryset = SocialFriend.objects.all()
    lookup_field = "id"
    lookup_url_kwarg = "social_id"


class AdminPhotoListCreateView(AdminListCreateView):
    serializer_class = PhotoWallImageAdminSerializer
    queryset = PhotoWallImage.objects.all()

    def get_queryset(self):
        queryset = PhotoWallImage.objects.all()
        public_only = _parse_bool_query(self.request.query_params.get("is_public"))
        keyword = str(self.request.query_params.get("q", "")).strip()
        sort = str(self.request.query_params.get("sort", "order")).strip()

        if public_only is not None:
            queryset = queryset.filter(is_public=public_only)
        if keyword:
            queryset = queryset.filter(
                Q(title__icontains=keyword) | Q(description__icontains=keyword) | Q(image_url__icontains=keyword)
            )

        if sort == "latest":
            return queryset.order_by("-updated_at", "-id")
        if sort == "captured_at":
            return queryset.order_by("-captured_at", "-id")
        return queryset.order_by("sort_order", "id")

    def perform_create(self, serializer):
        source_url = serializer.validated_data.get("source_url", "") or OBSIDIAN_IMAGES_REPO_URL
        serializer.save(
            image_url=_normalize_remote_image_url(serializer.validated_data.get("image_url", "")),
            source_url=_normalize_remote_image_url(source_url),
        )


class AdminPhotoDetailView(AdminDetailView):
    serializer_class = PhotoWallImageAdminSerializer
    queryset = PhotoWallImage.objects.all()
    lookup_field = "id"
    lookup_url_kwarg = "photo_id"

    def perform_update(self, serializer):
        payload = {}
        if "image_url" in serializer.validated_data:
            payload["image_url"] = _normalize_remote_image_url(serializer.validated_data.get("image_url", ""))
        if "source_url" in serializer.validated_data:
            payload["source_url"] = _normalize_remote_image_url(serializer.validated_data.get("source_url", ""))
        serializer.save(**payload)


class AdminReorderView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]
    model = None

    def patch(self, request):
        serializer = ReorderRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        items = _normalize_reorder_items(serializer.validated_data)

        try:
            with transaction.atomic():
                _apply_reorder(self.model, items)
        except ValueError as exc:
            return api_error("not_found", str(exc), status.HTTP_404_NOT_FOUND)

        return api_ok({"updated": len(items)})


class AdminTimelineReorderView(AdminReorderView):
    model = TimelineNode


class AdminTravelReorderView(AdminReorderView):
    model = TravelPlace


class AdminSocialReorderView(AdminReorderView):
    model = SocialFriend


class AdminPhotoReorderView(AdminReorderView):
    model = PhotoWallImage


class AdminHighlightsView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def get(self, request):
        queryset = HighlightStage.objects.prefetch_related("items").order_by("sort_order", "start_date", "id")
        keyword = str(request.query_params.get("q", "")).strip()
        if keyword:
            queryset = queryset.filter(Q(title__icontains=keyword) | Q(description__icontains=keyword))
        payload = HighlightStageAdminSerializer(queryset, many=True).data
        return api_ok(payload)


class AdminHighlightStageCreateView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def post(self, request):
        serializer = HighlightStageAdminSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return api_ok(HighlightStageAdminSerializer(instance).data, status_code=status.HTTP_201_CREATED)


class AdminHighlightStageDetailView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def _get_object(self, stage_id):
        return HighlightStage.objects.filter(id=stage_id).first()

    def put(self, request, stage_id):
        return self._update(request, stage_id, partial=True)

    def patch(self, request, stage_id):
        return self._update(request, stage_id, partial=True)

    def delete(self, request, stage_id):
        instance = self._get_object(stage_id)
        if not instance:
            return api_error("not_found", "阶段不存在", status.HTTP_404_NOT_FOUND)
        deleted_id = instance.id
        instance.delete()
        return api_ok({"deleted": True, "id": deleted_id})

    def _update(self, request, stage_id, *, partial):
        instance = self._get_object(stage_id)
        if not instance:
            return api_error("not_found", "阶段不存在", status.HTTP_404_NOT_FOUND)
        serializer = HighlightStageAdminSerializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return api_ok(serializer.data)


class AdminHighlightItemCreateView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def post(self, request):
        serializer = HighlightItemAdminSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return api_ok(HighlightItemAdminSerializer(instance).data, status_code=status.HTTP_201_CREATED)


class AdminHighlightItemDetailView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def _get_object(self, item_id):
        return HighlightItem.objects.filter(id=item_id).first()

    def put(self, request, item_id):
        return self._update(request, item_id, partial=True)

    def patch(self, request, item_id):
        return self._update(request, item_id, partial=True)

    def delete(self, request, item_id):
        instance = self._get_object(item_id)
        if not instance:
            return api_error("not_found", "成就不存在", status.HTTP_404_NOT_FOUND)
        deleted_id = instance.id
        instance.delete()
        return api_ok({"deleted": True, "id": deleted_id})

    def _update(self, request, item_id, *, partial):
        instance = self._get_object(item_id)
        if not instance:
            return api_error("not_found", "成就不存在", status.HTTP_404_NOT_FOUND)
        serializer = HighlightItemAdminSerializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return api_ok(serializer.data)


class AdminHighlightReorderView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def patch(self, request):
        serializer = HighlightReorderRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        stages_payload = serializer.validated_data.get("stages")
        stage_items = _normalize_reorder_items(stages_payload) if stages_payload else []
        highlight_items = list(serializer.validated_data.get("items") or [])

        stage_ids = {item["stage_id"] for item in highlight_items if "stage_id" in item}
        if stage_ids:
            existing_stage_ids = set(HighlightStage.objects.filter(id__in=stage_ids).values_list("id", flat=True))
            missing_stage_ids = sorted(stage_ids - existing_stage_ids)
            if missing_stage_ids:
                return api_error("not_found", f"阶段不存在: {missing_stage_ids}", status.HTTP_404_NOT_FOUND)

        try:
            with transaction.atomic():
                if stage_items:
                    _apply_reorder(HighlightStage, stage_items)
                if highlight_items:
                    _apply_reorder(HighlightItem, highlight_items, allow_extra_fields=True)
        except ValueError as exc:
            return api_error("not_found", str(exc), status.HTTP_404_NOT_FOUND)

        return api_ok({"updated_stages": len(stage_items), "updated_items": len(highlight_items)})


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


def _social_graph_payload(*, show_real_name: bool = False) -> dict:
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
                "honorific": None,
                "gender": None,
            }
        )

    friends = SocialFriend.objects.filter(is_public=True).order_by("sort_order", "id")
    for friend in friends:
        node_id = f"friend-{friend.id}"
        stage_id = f"stage-{friend.stage_key}"
        friend_label = friend.name if show_real_name else friend.masked_name()
        nodes.append(
            {
                "id": node_id,
                "type": "friend",
                "label": friend_label,
                "stage_key": friend.stage_key,
                "order": 1000 + friend.sort_order,
                "honorific": friend.honorific,
                "gender": friend.gender,
            }
        )
        links.append({"source": stage_id, "target": node_id})

    return {"nodes": nodes, "links": links}


def _photo_wall_payload() -> list[dict]:
    queryset = PhotoWallImage.objects.filter(is_public=True).order_by("sort_order", "id")
    payload = PhotoWallPublicSerializer(queryset, many=True).data
    normalized: list[dict] = []
    for item in payload:
        normalized.append(
            {
                **item,
                "image_url": _normalize_remote_image_url(item.get("image_url", "")),
                "source_url": _normalize_remote_image_url(item.get("source_url", "") or OBSIDIAN_IMAGES_REPO_URL),
            }
        )
    return normalized


def _collect_post_tags(queryset) -> set[str]:
    tags: set[str] = set()
    for row in queryset.values_list("tags", flat=True):
        if isinstance(row, list):
            tags.update(str(item).strip() for item in row if str(item).strip())
    return tags


def _count_post_words(queryset) -> int:
    return sum(
        len(str(content or "").replace(" ", "").replace("\n", "").replace("\t", ""))
        for content in queryset.values_list("content", flat=True)
    )


def _home_stats_payload() -> dict:
    posts = Post.objects.all()
    published_posts = posts.filter(draft=False)
    tags: set[str] = set()
    for row in published_posts.values_list("tags", flat=True):
        if isinstance(row, list):
            tags.update(str(item) for item in row if item)

    views_total = PostView.objects.aggregate(total=Sum("views"))["total"] or 0
    views_total = int(views_total)
    views_delta_week = 0

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

    one_week_ago = timezone.now() - timedelta(days=7)
    posts_week_ago = published_posts.filter(created_at__lte=one_week_ago)
    published_posts_delta_week = published_posts.count() - posts_week_ago.count()

    tags_week_ago: set[str] = set()
    for row in posts_week_ago.values_list("tags", flat=True):
        if isinstance(row, list):
            tags_week_ago.update(str(item) for item in row if item)
    tags_delta_week = len(tags) - len(tags_week_ago)

    words_week_ago = _count_post_words(posts_week_ago)
    total_words_delta_week = int(total_words) - words_week_ago

    one_year_ago = timezone.localdate() - timedelta(days=365)
    travel_total = TravelPlace.objects.count()
    travel_year_ago = TravelPlace.objects.filter(visited_at__lte=one_year_ago).count()
    travel_delta_year = travel_total - travel_year_ago

    likes_total = PostLike.objects.aggregate(total=Sum("likes"))["total"] or 0
    likes_delta_week = PostLikeVote.objects.filter(created_at__gte=one_week_ago).count()

    site_visits_total = SiteVisit.objects.count()
    unique_visitors_total = SiteVisit.objects.values("ip_hash").distinct().count()

    return {
        "posts_total": posts.count(),
        "published_posts_total": published_posts.count(),
        "timeline_total": TimelineNode.objects.count(),
        "travel_total": travel_total,
        "social_total": SocialFriend.objects.filter(is_public=True).count(),
        "highlight_stages_total": stages.count(),
        "highlight_items_total": sum(len(stage.items.all()) for stage in stages),
        "tags_total": len(tags),
        "views_total": int(views_total),
        "total_words": int(total_words),
        "site_days": int(site_days),
        "site_launch_date": launch_date.isoformat(),
        "published_posts_delta_week": published_posts_delta_week,
        "views_delta_week": views_delta_week,
        "total_words_delta_week": total_words_delta_week,
        "tags_delta_week": tags_delta_week,
        "travel_delta_year": travel_delta_year,
        "likes_total": int(likes_total),
        "likes_delta_week": likes_delta_week,
        "site_visits_total": site_visits_total,
        "unique_visitors_total": unique_visitors_total,
    }


def _home_payload(*, show_real_name: bool = False) -> dict:
    timeline = TimelineNode.objects.all().order_by("sort_order", "start_date")
    highlights = HighlightStage.objects.prefetch_related("items").order_by("sort_order", "start_date", "id")
    travel = _travel_payload()
    social_graph = _social_graph_payload(show_real_name=show_real_name)
    photo_wall = _photo_wall_payload()
    pinned_qs = (
        Post.objects.filter(draft=False, is_pinned=True)
        .select_related("view_record", "like_record")
        .order_by("pin_order", "-created_at")[:12]
    )

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
        "photo_wall": photo_wall,
        "pinned_posts": PinnedPostSerializer(pinned_qs, many=True).data,
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
        payload = SocialGraphPublicSerializer(_social_graph_payload(show_real_name=_is_staff_viewer(request))).data
        return api_ok_private(payload)


class PhotoWallView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return api_ok(_photo_wall_payload())


class HomeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        payload = HomeAggregateSerializer(_home_payload(show_real_name=_is_staff_viewer(request))).data
        return api_ok_private(payload)
