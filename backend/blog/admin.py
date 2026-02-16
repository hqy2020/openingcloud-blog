from __future__ import annotations

import subprocess
from pathlib import Path

from django.conf import settings
from django.contrib import admin, messages
from django.db.models import Q
from django.http import Http404, HttpRequest, HttpResponseRedirect, JsonResponse
from django.template.response import TemplateResponse
from django.urls import path, reverse
from django.utils.html import format_html, format_html_join
from adminsortable2.admin import SortableAdminMixin, SortableInlineAdminMixin

from .image_bed import ImageBedUploadError, upload_photo_to_obsidian_images
from sync.document_pool import sync_obsidian_documents
from sync.service import sync_post_payload

from .models import (
    HighlightItem,
    HighlightStage,
    ObsidianDocument,
    ObsidianSyncRun,
    PhotoWallImage,
    Post,
    PostLike,
    PostView,
    SocialFriend,
    SyncLog,
    TimelineNode,
    TravelPlace,
)


class ObsidianPublishedStatusFilter(admin.SimpleListFilter):
    title = "上线状态"
    parameter_name = "published_status"

    def lookups(self, request, model_admin):
        return (
            ("published", "已上线"),
            ("unpublished", "未上线"),
        )

    def queryset(self, request, queryset):
        value = self.value()
        if value == "published":
            return queryset.filter(linked_post__isnull=False, linked_post__draft=False)
        if value == "unpublished":
            return queryset.filter(Q(linked_post__isnull=True) | Q(linked_post__draft=True))
        return queryset


class ObsidianVaultRootFilter(admin.SimpleListFilter):
    title = "一级目录"
    parameter_name = "vault_root"

    def lookups(self, request, model_admin):
        values = model_admin.get_queryset(request).values_list("vault_path", flat=True)
        roots: set[str] = set()
        for value in values:
            text = str(value or "").strip().replace("\\", "/")
            if not text:
                continue
            roots.add(text.split("/", 1)[0])
        return [(root, root) for root in sorted(roots)]

    def queryset(self, request, queryset):
        value = self.value()
        if value:
            return queryset.filter(Q(vault_path__startswith=f"{value}/") | Q(vault_path=value))
        return queryset


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "is_published", "views_count", "sync_source", "updated_at"]
    list_filter = ["category", "draft", "sync_source"]
    search_fields = ["title", "slug"]
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ["created_at", "updated_at", "last_synced_at", "views_count"]

    @admin.display(boolean=True, description="已发布", ordering="draft")
    def is_published(self, obj: Post) -> bool:
        return not obj.draft
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


@admin.register(PostLike)
class PostLikeAdmin(admin.ModelAdmin):
    list_display = ["post", "likes", "updated_at"]
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
    list_display = ["public_label", "honorific", "gender", "birthday", "stage_key", "relation", "contact", "is_public", "sort_order", "updated_at"]
    list_filter = ["stage_key", "gender", "is_public"]
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
            path(
                "upload-image/",
                self.admin_site.admin_view(self.upload_image_view),
                name="blog_photowallimage_upload_image",
            ),
        ]
        return custom_urls + super().get_urls()

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
            },
            status=200,
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


@admin.register(ObsidianDocument)
class ObsidianDocumentAdmin(admin.ModelAdmin):
    change_list_template = "admin/blog/obsidiandocument/change_list.html"
    list_display = [
        "title",
        "vault_path",
        "category_candidate",
        "has_publish_tag",
        "source_exists",
        "linked_post",
        "is_published",
        "last_indexed_at",
        "operations",
    ]
    list_filter = [ObsidianPublishedStatusFilter, "has_publish_tag", "source_exists", ObsidianVaultRootFilter, "category_candidate"]
    search_fields = ["title", "vault_path", "tags", "content"]
    readonly_fields = [
        "vault_path",
        "title",
        "slug_candidate",
        "category_candidate",
        "tags",
        "has_publish_tag",
        "content",
        "excerpt",
        "file_hash",
        "source_mtime",
        "source_exists",
        "linked_post",
        "first_seen_at",
        "last_seen_at",
        "last_indexed_at",
        "created_at",
        "updated_at",
    ]
    fieldsets = (
        (
            "基础",
            {
                "fields": (
                    "title",
                    "vault_path",
                    "slug_candidate",
                    "category_candidate",
                    "tags",
                    "has_publish_tag",
                    "source_exists",
                    "linked_post",
                )
            },
        ),
        ("正文", {"fields": ("excerpt", "content")}),
        ("文件状态", {"fields": ("file_hash", "source_mtime")}),
        ("同步时间", {"fields": ("first_seen_at", "last_seen_at", "last_indexed_at", "created_at", "updated_at")}),
    )

    def get_urls(self):
        custom_urls = [
            path(
                "<path:object_id>/publish/",
                self.admin_site.admin_view(self.publish_view),
                name=f"{self.opts.app_label}_{self.opts.model_name}_publish",
            ),
            path(
                "<path:object_id>/unpublish/",
                self.admin_site.admin_view(self.unpublish_view),
                name=f"{self.opts.app_label}_{self.opts.model_name}_unpublish",
            ),
            path(
                "sync-now/",
                self.admin_site.admin_view(self.sync_now_view),
                name=f"{self.opts.app_label}_{self.opts.model_name}_sync_now",
            ),
        ]
        return custom_urls + super().get_urls()

    @admin.display(boolean=True, description="已上线")
    def is_published(self, obj: ObsidianDocument) -> bool:
        return bool(obj.linked_post_id and not obj.linked_post.draft)

    @admin.display(description="操作")
    def operations(self, obj: ObsidianDocument):
        links = []
        if obj.linked_post_id and not obj.linked_post.draft:
            unpublish_url = reverse(f"admin:{self.opts.app_label}_{self.opts.model_name}_unpublish", args=[obj.pk])
            links.append(format_html('<a href="{}">下线</a>', unpublish_url))
        else:
            publish_url = reverse(f"admin:{self.opts.app_label}_{self.opts.model_name}_publish", args=[obj.pk])
            links.append(format_html('<a href="{}">上线</a>', publish_url))

        if obj.linked_post_id:
            post_url = reverse("admin:blog_post_change", args=[obj.linked_post_id])
            links.append(format_html('<a href="{}" target="_blank" rel="noopener">文章</a>', post_url))

        if not links:
            return "-"
        return format_html_join(" ", "{}", ((link,) for link in links))

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def publish_view(self, request: HttpRequest, object_id: str):
        document = self.get_object(request, object_id)
        if document is None:
            raise Http404("文档不存在")

        if request.method != "POST":
            context = {
                **self.admin_site.each_context(request),
                "opts": self.model._meta,
                "title": "确认上线文档",
                "document": document,
                "action": "publish",
            }
            return TemplateResponse(request, "admin/blog/obsidiandocument/confirm_action.html", context)

        payload = {
            "title": document.title,
            "slug": document.slug_candidate,
            "excerpt": document.excerpt,
            "content": document.content,
            "category": document.category_candidate,
            "tags": document.tags,
            "cover": str(document.linked_post.cover if document.linked_post else ""),
            "obsidian_path": document.vault_path,
        }

        try:
            outcome = sync_post_payload(
                payload,
                mode=SyncLog.Mode.OVERWRITE,
                source=SyncLog.Source.COMMAND,
                operator=request.user,
                dry_run=False,
            )
        except ValueError as exc:
            self.message_user(request, f"上线失败: {exc}", level=messages.ERROR)
            return HttpResponseRedirect(reverse(f"admin:{self.opts.app_label}_{self.opts.model_name}_changelist"))

        if outcome.post and document.linked_post_id != outcome.post.id:
            document.linked_post = outcome.post
            document.save(update_fields=["linked_post", "updated_at"])

        self.message_user(request, f"文档已上线: {document.title}", level=messages.SUCCESS)
        return HttpResponseRedirect(reverse(f"admin:{self.opts.app_label}_{self.opts.model_name}_changelist"))

    def unpublish_view(self, request: HttpRequest, object_id: str):
        document = self.get_object(request, object_id)
        if document is None:
            raise Http404("文档不存在")

        if request.method != "POST":
            context = {
                **self.admin_site.each_context(request),
                "opts": self.model._meta,
                "title": "确认下线文档",
                "document": document,
                "action": "unpublish",
            }
            return TemplateResponse(request, "admin/blog/obsidiandocument/confirm_action.html", context)

        if not document.linked_post_id:
            self.message_user(request, "文档未关联线上文章", level=messages.WARNING)
            return HttpResponseRedirect(reverse(f"admin:{self.opts.app_label}_{self.opts.model_name}_changelist"))

        post = document.linked_post
        post.draft = True
        post.save(update_fields=["draft"])

        self.message_user(request, f"文档已下线: {document.title}", level=messages.SUCCESS)
        return HttpResponseRedirect(reverse(f"admin:{self.opts.app_label}_{self.opts.model_name}_changelist"))

    def sync_now_view(self, request: HttpRequest):
        if request.method != "POST":
            context = {
                **self.admin_site.each_context(request),
                "opts": self.model._meta,
                "title": "确认立即同步文档池",
                "vault_path": settings.OBSIDIAN_VAULT_PATH,
            }
            return TemplateResponse(request, "admin/blog/obsidiandocument/confirm_sync.html", context)

        repo_commit = self._resolve_repo_commit(settings.OBSIDIAN_VAULT_PATH)
        try:
            result = sync_obsidian_documents(
                source=settings.OBSIDIAN_VAULT_PATH,
                trigger=ObsidianSyncRun.Trigger.MANUAL,
                publish_tag=settings.OBSIDIAN_DOC_SYNC_PUBLISH_TAG,
                missing_behavior="draft",
                auto_update_published=True,
                repo_url=settings.OBSIDIAN_VAULT_REPO_URL,
                repo_branch=settings.OBSIDIAN_VAULT_REPO_BRANCH,
                repo_commit=repo_commit,
                operator=request.user,
            )
            run = result.run
            self.message_user(
                request,
                (
                    "文档池同步完成: "
                    f"run_id={run.id}, scanned={run.scanned_count}, created={run.created_count}, "
                    f"updated={run.updated_count}, missing={run.missing_count}, drafted={run.drafted_count}"
                ),
                level=messages.SUCCESS,
            )
        except ValueError as exc:
            self.message_user(request, f"文档池同步失败: {exc}", level=messages.ERROR)

        return HttpResponseRedirect(reverse(f"admin:{self.opts.app_label}_{self.opts.model_name}_changelist"))

    @staticmethod
    def _resolve_repo_commit(vault_path: str) -> str:
        path = Path(str(vault_path or "")).expanduser()
        if not path.exists():
            return ""
        try:
            result = subprocess.run(
                ["git", "-C", str(path), "rev-parse", "HEAD"],
                check=True,
                capture_output=True,
                text=True,
            )
        except Exception:  # noqa: BLE001
            return ""
        return str(result.stdout or "").strip()


@admin.register(ObsidianSyncRun)
class ObsidianSyncRunAdmin(admin.ModelAdmin):
    list_display = [
        "started_at",
        "trigger",
        "status",
        "scanned_count",
        "created_count",
        "updated_count",
        "missing_count",
        "published_updated_count",
        "drafted_count",
        "duration_ms",
        "operator",
    ]
    list_filter = ["trigger", "status"]
    search_fields = ["repo_url", "repo_branch", "repo_commit", "message", "operator__username"]
    readonly_fields = [
        "trigger",
        "status",
        "repo_url",
        "repo_branch",
        "repo_commit",
        "scanned_count",
        "created_count",
        "updated_count",
        "missing_count",
        "published_updated_count",
        "drafted_count",
        "started_at",
        "finished_at",
        "duration_ms",
        "message",
        "operator",
        "created_at",
        "updated_at",
    ]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


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
