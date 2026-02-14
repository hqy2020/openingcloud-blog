from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from adminsortable2.admin import SortableAdminMixin, SortableInlineAdminMixin
from django.conf import settings
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.test import Client

from blog.models import HighlightItem, HighlightStage, SocialFriend, TimelineNode, TravelPlace


class Command(BaseCommand):
    help = "Verify admin sortable/inline/dashboard capabilities"

    def handle(self, *args, **options):
        errors: list[str] = []

        registry = admin.site._registry
        sortable_models = [TimelineNode, TravelPlace, SocialFriend, HighlightStage, HighlightItem]

        for model in sortable_models:
            admin_cls = registry[model].__class__ if model in registry else None
            if admin_cls is None:
                errors.append(f"{model.__name__} is not registered in admin")
                continue
            if not issubclass(admin_cls, SortableAdminMixin):
                errors.append(f"{model.__name__} admin is not SortableAdminMixin")

        stage_admin = registry.get(HighlightStage)
        if stage_admin is None:
            errors.append("HighlightStage admin missing")
        else:
            has_inline = False
            for inline_cls in stage_admin.inlines:
                if inline_cls.model == HighlightItem:
                    has_inline = True
                    if not issubclass(inline_cls, SortableInlineAdminMixin):
                        errors.append("HighlightItem inline is not SortableInlineAdminMixin")
            if not has_inline:
                errors.append("HighlightStage missing HighlightItem inline")

        dashboard_template = Path(settings.BASE_DIR) / "templates" / "admin" / "custom_index.html"
        if not dashboard_template.exists():
            errors.append("custom admin dashboard template not found")

        client = Client()
        username = f"admin_probe_{uuid4().hex[:8]}"
        password = uuid4().hex

        user_model = get_user_model()
        user = user_model.objects.create_superuser(username=username, email="", password=password)
        try:
            login_ok = client.login(username=username, password=password)
            if not login_ok:
                errors.append("failed to login test superuser")
            else:
                response = client.get("/admin/")
                if response.status_code != 200:
                    errors.append(f"admin index returned {response.status_code}, expected 200")
                elif "运营概览" not in response.content.decode("utf-8"):
                    errors.append("admin dashboard title not found in admin index")
        finally:
            user.delete()

        if errors:
            for item in errors:
                self.stdout.write(self.style.ERROR(item))
            raise CommandError("Admin capability verification failed")

        self.stdout.write(self.style.SUCCESS("Admin capability verification passed"))
