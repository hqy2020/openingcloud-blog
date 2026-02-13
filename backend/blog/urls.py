from __future__ import annotations

from django.urls import path

from .views import (
    AdminPingView,
    HealthCheckView,
    IncrementPostView,
    LoginView,
    LogoutView,
    MeView,
    PostDetailView,
    PostListView,
)

urlpatterns = [
    path("health", HealthCheckView.as_view(), name="health"),
    path("posts/", PostListView.as_view(), name="posts-list"),
    path("posts/<slug:slug>/", PostDetailView.as_view(), name="posts-detail"),
    path("posts/<slug:slug>/view/", IncrementPostView.as_view(), name="posts-view"),
    path("auth/login", LoginView.as_view(), name="auth-login"),
    path("auth/logout", LogoutView.as_view(), name="auth-logout"),
    path("auth/me", MeView.as_view(), name="auth-me"),
    path("admin/ping", AdminPingView.as_view(), name="admin-ping"),
]
