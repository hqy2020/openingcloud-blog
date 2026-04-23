from __future__ import annotations

from datetime import date

from django.db import migrations


def seed_zju_grad_and_ant(apps, schema_editor):
    TimelineNode = apps.get_model("blog", "TimelineNode")
    HighlightStage = apps.get_model("blog", "HighlightStage")
    HighlightItem = apps.get_model("blog", "HighlightItem")

    timeline_entries = [
        {
            "title": "浙江大学 · 研究生毕业",
            "description": "2023 级软件工程硕士，2026 年 3 月毕业。",
            "start_date": date(2026, 3, 1),
            "type": "learning",
            "impact": "high",
            "phase": "研究生毕业",
            "tags": ["浙大", "毕业", "硕士"],
            "sort_order": 14,
        },
        {
            "title": "蚂蚁集团 · 拿到 offer",
            "description": "2026 春招结果。",
            "start_date": date(2026, 4, 19),
            "type": "career",
            "impact": "high",
            "phase": "春招收尾",
            "tags": ["蚂蚁集团", "offer"],
            "sort_order": 15,
        },
        {
            "title": "蚂蚁集团 · 入职",
            "description": "2026 年加入蚂蚁集团。",
            "start_date": date(2026, 7, 1),
            "type": "career",
            "impact": "high",
            "phase": "入职筹备",
            "tags": ["蚂蚁集团", "入职"],
            "sort_order": 16,
        },
    ]
    for entry in timeline_entries:
        TimelineNode.objects.get_or_create(
            title=entry["title"],
            defaults={
                "description": entry["description"],
                "start_date": entry["start_date"],
                "type": entry["type"],
                "impact": entry["impact"],
                "phase": entry["phase"],
                "tags": entry["tags"],
                "sort_order": entry["sort_order"],
            },
        )

    zju_stage = HighlightStage.objects.filter(title="浙江大学 · 硕士").first()
    if zju_stage:
        zju_items = [
            ("研究生毕业（2026-03）", 100),
            ("拿到蚂蚁集团 offer", 101),
        ]
        for title, sort_order in zju_items:
            HighlightItem.objects.get_or_create(
                stage=zju_stage,
                title=title,
                defaults={"sort_order": sort_order, "achieved_at": date(2026, 4, 19)},
            )

    ant_stage, _ = HighlightStage.objects.get_or_create(
        title="蚂蚁集团 · 入职",
        defaults={
            "description": "2026 年加入蚂蚁集团。",
            "start_date": date(2026, 7, 1),
            "sort_order": 7,
        },
    )
    ant_items = [
        ("2026 春招拿到 offer", date(2026, 4, 19), 1),
        ("新身份：后端开发工程师", date(2026, 7, 1), 2),
        ("从 offer 到入职的筹备期", date(2026, 7, 1), 3),
    ]
    for title, achieved_at, sort_order in ant_items:
        HighlightItem.objects.get_or_create(
            stage=ant_stage,
            title=title,
            defaults={"sort_order": sort_order, "achieved_at": achieved_at},
        )


class Migration(migrations.Migration):
    dependencies = [
        ("blog", "0034_add_device_wishes"),
    ]

    operations = [
        migrations.RunPython(seed_zju_grad_and_ant, migrations.RunPython.noop),
    ]
