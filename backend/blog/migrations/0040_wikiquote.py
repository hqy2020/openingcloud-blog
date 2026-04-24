from __future__ import annotations

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("blog", "0039_book_douban_subject_id"),
    ]

    operations = [
        migrations.CreateModel(
            name="WikiQuote",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("text", models.CharField(max_length=240)),
                (
                    "tier",
                    models.CharField(
                        choices=[("creed", "五信条"), ("insight", "原创洞见")],
                        db_index=True,
                        default="insight",
                        max_length=16,
                    ),
                ),
                (
                    "source",
                    models.CharField(
                        blank=True,
                        default="",
                        help_text="来源标注，如 WHOAMI 或 entity 文件名",
                        max_length=120,
                    ),
                ),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("is_active", models.BooleanField(db_index=True, default=True)),
            ],
            options={
                "verbose_name": "Wiki 金句",
                "verbose_name_plural": "Wiki 金句",
                "ordering": ["tier", "sort_order", "id"],
            },
        ),
        migrations.AddConstraint(
            model_name="wikiquote",
            constraint=models.UniqueConstraint(fields=("text",), name="unique_wiki_quote_text"),
        ),
    ]
