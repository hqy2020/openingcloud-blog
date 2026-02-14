from __future__ import annotations

from urllib.parse import urlparse

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Check security baseline settings"

    def add_arguments(self, parser):
        parser.add_argument("--allow-http-temporary", action="store_true", default=False)

    def handle(self, *args, **options):
        allow_http_temporary = options["allow_http_temporary"]
        errors: list[str] = []
        warnings: list[str] = []

        if settings.SESSION_COOKIE_HTTPONLY is not True:
            errors.append("SESSION_COOKIE_HTTPONLY must be True")

        if settings.COOKIE_SAMESITE != "Strict":
            if allow_http_temporary:
                warnings.append(f"COOKIE_SAMESITE is {settings.COOKIE_SAMESITE}, expected Strict (temporary HTTP mode)")
            else:
                errors.append(f"COOKIE_SAMESITE is {settings.COOKIE_SAMESITE}, expected Strict")

        if settings.COOKIE_SECURE is not True:
            if allow_http_temporary:
                warnings.append("COOKIE_SECURE is False (temporary HTTP mode)")
            else:
                errors.append("COOKIE_SECURE must be True")

        if getattr(settings, "SECURE_SSL_REDIRECT", False) is not True:
            if allow_http_temporary:
                warnings.append("SECURE_SSL_REDIRECT is False (temporary HTTP mode)")
            else:
                errors.append("SECURE_SSL_REDIRECT must be True")

        if settings.X_FRAME_OPTIONS != "DENY":
            errors.append("X_FRAME_OPTIONS must be DENY")

        if not getattr(settings, "SECURE_CONTENT_TYPE_NOSNIFF", False):
            errors.append("SECURE_CONTENT_TYPE_NOSNIFF must be enabled")

        if settings.DEBUG:
            warnings.append("DEBUG=True (production should set DEBUG=0)")

        for origin in settings.CORS_ALLOWED_ORIGINS:
            parsed = urlparse(origin)
            if parsed.scheme != "https":
                if allow_http_temporary:
                    warnings.append(f"CORS origin not https: {origin} (temporary HTTP mode)")
                else:
                    errors.append(f"CORS origin must use https: {origin}")

        for origin in settings.CSRF_TRUSTED_ORIGINS:
            parsed = urlparse(origin)
            if parsed.scheme != "https":
                if allow_http_temporary:
                    warnings.append(f"CSRF trusted origin not https: {origin} (temporary HTTP mode)")
                else:
                    errors.append(f"CSRF trusted origin must use https: {origin}")

        for item in warnings:
            self.stdout.write(self.style.WARNING(item))

        if errors:
            for item in errors:
                self.stdout.write(self.style.ERROR(item))
            raise CommandError("Security baseline check failed")

        self.stdout.write(self.style.SUCCESS("Security baseline check passed"))
