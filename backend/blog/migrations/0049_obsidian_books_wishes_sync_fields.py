from __future__ import annotations

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("blog", "0048_seed_thousand_brains"),
    ]

    operations = [
        migrations.AddField(
            model_name="book",
            name="ai_context",
            field=models.JSONField(blank=True, default=dict, verbose_name="AI 补全上下文"),
        ),
        migrations.AddField(
            model_name="book",
            name="info_url",
            field=models.URLField(blank=True, max_length=800, verbose_name="书籍信息链接"),
        ),
        migrations.AddField(
            model_name="book",
            name="obsidian_path",
            field=models.CharField(blank=True, db_index=True, max_length=500, verbose_name="Obsidian 路径"),
        ),
        migrations.AddField(
            model_name="book",
            name="source_url",
            field=models.URLField(blank=True, max_length=800, verbose_name="Obsidian 来源链接"),
        ),
        migrations.AddField(
            model_name="wishitem",
            name="ai_context",
            field=models.JSONField(blank=True, default=dict, verbose_name="AI 补全上下文"),
        ),
        migrations.AddField(
            model_name="wishitem",
            name="obsidian_path",
            field=models.CharField(blank=True, db_index=True, max_length=500, verbose_name="Obsidian 路径"),
        ),
        migrations.AddField(
            model_name="wishitem",
            name="purchase_url",
            field=models.URLField(blank=True, max_length=800, verbose_name="购买/参考链接"),
        ),
        migrations.AddField(
            model_name="wishitem",
            name="source_url",
            field=models.URLField(blank=True, max_length=800, verbose_name="Obsidian 来源链接"),
        ),
    ]
