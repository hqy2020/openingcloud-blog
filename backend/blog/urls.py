from __future__ import annotations

from django.urls import path

from .views import (
    AdminImageUploadView,
    AdminObsidianReconcileView,
    AdminObsidianSyncView,
    AdminPingView,
    HealthCheckView,
    HighlightsView,
    HomeView,
    IncrementPostView,
    LoginView,
    LogoutView,
    MeView,
    PostDetailView,
    PostListView,
    SocialGraphView,
    TimelineView,
    TravelView,
)

urlpatterns = [
    path("health", HealthCheckView.as_view(), name="health"),
    path("home/", HomeView.as_view(), name="home"),
    path("posts/", PostListView.as_view(), name="posts-list"),
    path("posts/<slug:slug>/", PostDetailView.as_view(), name="posts-detail"),
    path("posts/<slug:slug>/view/", IncrementPostView.as_view(), name="posts-view"),
    path("timeline/", TimelineView.as_view(), name="timeline"),
    path("highlights/", HighlightsView.as_view(), name="highlights"),
    path("travel/", TravelView.as_view(), name="travel"),
    path("social-graph/", SocialGraphView.as_view(), name="social-graph"),
    path("auth/login", LoginView.as_view(), name="auth-login"),
    path("auth/logout", LogoutView.as_view(), name="auth-logout"),
    path("auth/me", MeView.as_view(), name="auth-me"),
    path("admin/ping", AdminPingView.as_view(), name="admin-ping"),
    path("admin/images/", AdminImageUploadView.as_view(), name="admin-images"),
    path("admin/obsidian-sync/", AdminObsidianSyncView.as_view(), name="admin-obsidian-sync"),
    path("admin/obsidian-sync/reconcile/", AdminObsidianReconcileView.as_view(), name="admin-obsidian-reconcile"),
]
