from __future__ import annotations

from datetime import timedelta

from django.conf import settings
from django.core.cache import cache
from django.db.models import F
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Post, PostView
from .permissions import IsStaffUser
from .serializers import LoginSerializer, PostDetailSerializer, PostListSerializer


def api_ok(data, status_code=status.HTTP_200_OK):
    return Response({"ok": True, "data": data}, status=status_code)


def api_error(code, message, status_code):
    return Response({"ok": False, "code": code, "message": message}, status=status_code)


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
        queryset = Post.objects.filter(draft=False).order_by("-created_at")
        category = self.request.query_params.get("category")
        tag = self.request.query_params.get("tag")

        if category:
            queryset = queryset.filter(category=category)

        if tag:
            queryset = queryset.filter(tags__icontains=f'"{tag}"')

        return queryset

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return api_ok(response.data)


class PostDetailView(generics.RetrieveAPIView):
    serializer_class = PostDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        return Post.objects.filter(draft=False)

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
