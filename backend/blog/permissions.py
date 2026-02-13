from __future__ import annotations

from rest_framework.permissions import BasePermission


class IsStaffUser(BasePermission):
    message = "管理员权限 required"

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)
