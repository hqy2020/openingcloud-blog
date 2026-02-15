from __future__ import annotations

from pathlib import Path

from django.contrib import admin
from django.http import HttpRequest, JsonResponse
from adminsortable2.admin import SortableAdminMixin, SortableInlineAdminMixin

from .image_bed import ImageBedUploadError, upload_photo_to_obsidian_images
from .models import (
    HighlightItem,
    HighlightStage,
    PhotoWallImage,
    Post,
    PostView,
    SocialFriend,
    SyncLog,
    TimelineNode,
    TravelPlace,
)


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "draft", "views_count", "sync_source", "updated_at"]
    list_filter = ["category", "draft", "sync_source"]
    search_fields = ["title", "slug"]
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ["created_at", "updated_at", "last_synced_at", "views_count"]
    fieldsets = (
        ("基础", {"fields": ("title", "slug", "excerpt", "category", "tags", "cover")}),
        ("正文", {"fields": ("content",)}),
        ("状态", {"fields": ("draft", "sync_source", "obsidian_path", "last_synced_at", "views_count")}),
        ("时间", {"fields": ("created_at", "updated_at")}),
    )


@admin.register(PostView)
class PostViewAdmin(admin.ModelAdmin):
    list_display = ["post", "views", "updated_at"]
    search_fields = ["post__title", "post__slug"]


@admin.register(TimelineNode)
class TimelineNodeAdmin(SortableAdminMixin, admin.ModelAdmin):
    list_display = ["title", "type", "impact", "start_date", "sort_order", "updated_at"]
    list_filter = ["type", "impact"]
    search_fields = ["title", "description", "phase"]


@admin.register(TravelPlace)
class TravelPlaceAdmin(SortableAdminMixin, admin.ModelAdmin):
    list_display = ["province", "city", "visited_at", "sort_order", "updated_at"]
    list_filter = ["province"]
    search_fields = ["province", "city", "notes"]


@admin.register(SocialFriend)
class SocialFriendAdmin(SortableAdminMixin, admin.ModelAdmin):
    list_display = [
        "public_label",
        "honorific",
        "birthday",
        "stage_key",
        "relation",
        "contact",
        "is_public",
        "sort_order",
        "updated_at",
    ]
    list_filter = ["stage_key", "is_public"]
    search_fields = ["name", "public_label", "relation", "contact"]


@admin.register(PhotoWallImage)
class PhotoWallImageAdmin(SortableAdminMixin, admin.ModelAdmin):
    list_display = ["title", "captured_at", "is_public", "sort_order", "updated_at"]
    list_filter = ["is_public"]
    search_fields = ["title", "description", "image_url", "source_url"]

    allowed_content_types = {"image/jpeg", "image/png", "image/webp"}
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    max_upload_size = 8 * 1024 * 1024

    class Media:
        js = ("blog/admin/photo_wall_upload.js",)
        css = {"all": ("blog/admin/photo_wall_upload.css",)}

    def get_urls(self):
        custom_urls = [
            self._upload_url(),
        ]
        return custom_urls + super().get_urls()

    def _upload_url(self):
        from django.urls import path

        return path(
            "upload-image/",
            self.admin_site.admin_view(self.upload_image_view),
            name="blog_photowallimage_upload_image",
        )

    def upload_image_view(self, request: HttpRequest):
        if request.method != "POST":
            return JsonResponse({"ok": False, "message": "仅支持 POST"}, status=405)

        upload = request.FILES.get("file")
        if upload is None:
            return JsonResponse({"ok": False, "message": "缺少 file 字段"}, status=400)

        suffix = Path(str(upload.name or "")).suffix.lower()
        content_type = str(getattr(upload, "content_type", "")).lower()
        if upload.size > self.max_upload_size:
            return JsonResponse({"ok": False, "message": "图片大小不能超过 8MB"}, status=400)
        if content_type not in self.allowed_content_types and suffix not in self.allowed_extensions:
            return JsonResponse({"ok": False, "message": "仅支持 jpg/png/webp 格式"}, status=400)

        try:
            result = upload_photo_to_obsidian_images(upload, operator=getattr(request.user, "username", ""))
        except ImageBedUploadError as exc:
            return JsonResponse({"ok": False, "message": str(exc)}, status=400)

        return JsonResponse(
            {
                "ok": True,
                "data": {
                    "image_url": result.image_url,
                    "source_url": result.source_url,
                    "path": result.path,
                    "sha": result.sha,
                    "size": upload.size,
                    "content_type": content_type,
                },
            }
        )


class HighlightItemInline(SortableInlineAdminMixin, admin.TabularInline):
    model = HighlightItem
    extra = 1
    fields = ["title", "description", "achieved_at", "sort_order"]


@admin.register(HighlightStage)
class HighlightStageAdmin(SortableAdminMixin, admin.ModelAdmin):
    list_display = ["title", "start_date", "end_date", "sort_order", "updated_at"]
    inlines = [HighlightItemInline]


@admin.register(HighlightItem)
class HighlightItemAdmin(SortableAdminMixin, admin.ModelAdmin):
    list_display = ["title", "stage", "achieved_at", "sort_order", "updated_at"]
    list_filter = ["stage"]
    search_fields = ["title", "description"]


@admin.register(SyncLog)
class SyncLogAdmin(admin.ModelAdmin):
    list_display = ["started_at", "source", "slug", "mode", "action", "status", "duration_ms", "operator"]
    list_filter = ["source", "mode", "action", "status"]
    search_fields = ["slug", "message", "operator__username"]
    readonly_fields = [
        "source",
        "slug",
        "mode",
        "action",
        "status",
        "message",
        "payload",
        "result",
        "started_at",
        "finished_at",
        "duration_ms",
        "operator",
        "created_at",
        "updated_at",
    ]
    fieldsets = (
        ("基本信息", {"fields": ("source", "slug", "mode", "action", "status", "operator")}),
        ("执行信息", {"fields": ("message", "duration_ms", "started_at", "finished_at")}),
        ("数据快照", {"fields": ("payload", "result")}),
        ("时间", {"fields": ("created_at", "updated_at")}),
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


admin.site.site_header = "openingClouds 管理后台"
admin.site.site_title = "openingClouds Admin"
admin.site.index_title = "内容管理面板"
admin.site.index_template = "admin/custom_index.html"
