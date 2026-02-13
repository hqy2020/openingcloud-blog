from __future__ import annotations

from django.conf import settings
from django.http import JsonResponse


class ApiOriginValidationMiddleware:
    """Rejects cross-site state-changing requests outside allowlist."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method in {"POST", "PUT", "PATCH", "DELETE"} and request.path.startswith("/api/"):
            origin = request.headers.get("Origin")
            referer = request.headers.get("Referer")
            allowed = settings.ALLOWED_WRITE_ORIGINS

            if origin and origin not in allowed:
                return JsonResponse({"ok": False, "code": "forbidden_origin", "message": "Origin not allowed"}, status=403)

            if not origin and referer:
                valid = any(referer.startswith(item) for item in allowed)
                if not valid:
                    return JsonResponse({"ok": False, "code": "forbidden_referer", "message": "Referer not allowed"}, status=403)

        return self.get_response(request)
