from __future__ import annotations

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("blog", "0035_add_zju_grad_ant_offer"),
    ]

    operations = [
        migrations.CreateModel(
            name="KnowledgeNode",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("slug", models.SlugField(db_index=True, max_length=220, unique=True)),
                ("title", models.CharField(max_length=255)),
                ("path", models.CharField(max_length=500, unique=True)),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("entity", "实体"),
                            ("source", "来源"),
                            ("exploration", "探索"),
                            ("hub", "枢纽"),
                            ("index", "索引"),
                            ("other", "其他"),
                        ],
                        default="other",
                        max_length=16,
                    ),
                ),
                ("frontmatter", models.JSONField(blank=True, default=dict)),
                ("file_sha", models.CharField(db_index=True, max_length=64)),
                ("git_created_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("git_last_modified_at", models.DateTimeField(blank=True, null=True)),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("last_synced_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "知识图谱节点",
                "verbose_name_plural": "知识图谱节点",
                "ordering": ["git_created_at", "id"],
            },
        ),
        migrations.CreateModel(
            name="KnowledgeEdge",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("wikilink_text", models.CharField(blank=True, max_length=255)),
                (
                    "source",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="outgoing_edges",
                        to="blog.knowledgenode",
                    ),
                ),
                (
                    "target",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="incoming_edges",
                        to="blog.knowledgenode",
                    ),
                ),
            ],
            options={
                "verbose_name": "知识图谱边",
                "verbose_name_plural": "知识图谱边",
                "unique_together": {("source", "target")},
            },
        ),
    ]
