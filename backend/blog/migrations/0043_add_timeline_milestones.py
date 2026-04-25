from __future__ import annotations

from datetime import date

from django.db import migrations


def seed_milestones(apps, schema_editor):
    TimelineNode = apps.get_model("blog", "TimelineNode")
    entries = [
        {
            "title": "同济大学 · 工科学士毕业",
            "description": "2023 年 7 月本科毕业，工学学士。",
            "start_date": date(2023, 7, 1),
            "type": "learning",
            "impact": "high",
            "phase": "本科毕业",
            "tags": ["同济", "毕业", "学士"],
            "sort_order": 4,
        },
        {
            "title": "学术论文 · CCF B 类录用",
            "description": "2024 年 12 月，第一篇 CCF B 类论文录用。",
            "start_date": date(2024, 12, 1),
            "type": "learning",
            "impact": "high",
            "phase": "学术输出",
            "tags": ["论文", "CCF-B", "学术"],
            "sort_order": 9,
        },
        {
            "title": "自媒体 · 起点",
            "description": "2026 年 3 月开始持续做自媒体（博客 / 公众号）。",
            "start_date": date(2026, 3, 1),
            "type": "reflection",
            "impact": "high",
            "phase": "个人品牌",
            "tags": ["自媒体", "博客", "公众号"],
            "sort_order": 13,
        },
    ]
    for entry in entries:
        TimelineNode.objects.get_or_create(
            title=entry["title"],
            defaults=entry,
        )


class Migration(migrations.Migration):
    dependencies = [
        ("blog", "0042_wikiquote_emphasis"),
    ]

    operations = [
        migrations.RunPython(seed_milestones, migrations.RunPython.noop),
    ]
