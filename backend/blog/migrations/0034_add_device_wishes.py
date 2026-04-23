from __future__ import annotations

from decimal import Decimal

from django.db import migrations


def seed_device_wishes(apps, schema_editor):
    WishItem = apps.get_model("blog", "WishItem")
    new_wishes = [
        {
            "emoji": "🖥️",
            "title": "Mac mini",
            "description": "Apple Silicon 的小方盒，安静强大的本地开发与 AI 跑模型主机。",
            "price": None,
            "priority": "high",
            "sort_order": 55,
        },
        {
            "emoji": "🕶️",
            "title": "通义千问 S1 智能眼镜",
            "description": "阿里 Qwen S1 AI 眼镜，实时语音问答、翻译、第一人称记录。",
            "price": Decimal("3499.00"),
            "priority": "medium",
            "sort_order": 65,
        },
        {
            "emoji": "🥽",
            "title": "Xreal One Pro AR 眼镜",
            "description": "随身大屏与空间计算的入口，沉浸式看剧、代码、沉思。",
            "price": Decimal("4227.00"),
            "priority": "medium",
            "sort_order": 75,
        },
    ]
    for wish in new_wishes:
        WishItem.objects.get_or_create(
            title=wish["title"],
            defaults={
                "emoji": wish["emoji"],
                "description": wish["description"],
                "price": wish["price"],
                "priority": wish["priority"],
                "sort_order": wish["sort_order"],
                "is_active": True,
            },
        )


class Migration(migrations.Migration):
    dependencies = [
        ("blog", "0033_add_cagent_project"),
    ]

    operations = [
        migrations.RunPython(seed_device_wishes, migrations.RunPython.noop),
    ]
