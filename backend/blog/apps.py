from django.apps import AppConfig


class BlogConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "blog"
    verbose_name = "博客"

    def ready(self):
        from django.db.backends.signals import connection_created

        from .db import configure_sqlite

        connection_created.connect(configure_sqlite, dispatch_uid="blog.configure_sqlite")
