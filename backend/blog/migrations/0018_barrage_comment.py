from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("blog", "0017_add_github_project"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="BarrageComment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("nickname", models.CharField(default="匿名云友", max_length=40)),
                ("content", models.CharField(max_length=200)),
                ("page_path", models.CharField(blank=True, max_length=500)),
                (
                    "status",
                    models.CharField(
                        choices=[("pending", "待审核"), ("approved", "已通过"), ("rejected", "已拒绝")],
                        db_index=True,
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("ip_hash", models.CharField(db_index=True, max_length=64)),
                ("user_agent", models.CharField(blank=True, max_length=500)),
                ("reviewed_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("review_note", models.CharField(blank=True, max_length=255)),
                (
                    "reviewed_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="reviewed_barrage_comments",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "弹幕评论",
                "verbose_name_plural": "弹幕评论",
                "ordering": ["-reviewed_at", "-created_at", "-id"],
            },
        ),
        migrations.AddIndex(
            model_name="barragecomment",
            index=models.Index(fields=["status", "reviewed_at"], name="blog_barrag_status_408c40_idx"),
        ),
        migrations.AddIndex(
            model_name="barragecomment",
            index=models.Index(fields=["status", "created_at"], name="blog_barrag_status_048ff1_idx"),
        ),
    ]
