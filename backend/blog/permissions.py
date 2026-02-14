from __future__ import annotations

import secrets

from django.conf import settings
from rest_framework.permissions import BasePermission


class IsStaffUser(BasePermission):
    message = "管理员权限 required"

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class IsStaffOrSyncToken(BasePermission):
    message = "管理员权限或同步 token required"

    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated and request.user.is_staff:
            return True

        expected = str(getattr(settings, "OBSIDIAN_SYNC_TOKEN", "")).strip()
        provided = str(request.headers.get("X-Obsidian-Sync-Token", "")).strip()
        if not expected or not provided:
            return False
        return secrets.compare_digest(provided, expected)
