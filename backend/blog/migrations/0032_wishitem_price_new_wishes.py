from __future__ import annotations

from decimal import Decimal

from django.db import migrations, models


def seed_new_wishes(apps, schema_editor):
    WishItem = apps.get_model("blog", "WishItem")
    new_wishes = [
        {
            "emoji": "🖨️",
            "title": "拓竹第二代3D打印机",
            "description": "Bambu Lab A2 Mini — 第二代打印速度更快，精度更高，随时把灵感变成实物。",
            "price": Decimal("4166.00"),
            "priority": "high",
            "sort_order": 5,
        },
        {
            "emoji": "🕶️",
            "title": "理想AI眼镜",
            "description": "LIMI AI 眼镜 — 随时语音交互，实时翻译，拍照记录生活碎片。",
            "price": Decimal("1699.00"),
            "priority": "medium",
            "sort_order": 15,
        },
        {
            "emoji": "📷",
            "title": "Insta360 GO Ultra",
            "description": "超轻拇指相机，磁吸随拍，记录骑行、徒步的第一视角。",
            "price": Decimal("2585.00"),
            "priority": "medium",
            "sort_order": 25,
        },
        {
            "emoji": "🚁",
            "title": "影翎A1全景无人机",
            "description": "360° 全景航拍，球形镜头无死角，记录旅行和城市风景。",
            "price": Decimal("6799.00"),
            "priority": "high",
            "sort_order": 35,
        },
        {
            "emoji": "😴",
            "title": "桉贝贝睡眠净化器",
            "description": "白噪音 + 空气净化二合一，改善深度睡眠质量。",
            "price": Decimal("3999.00"),
            "priority": "medium",
            "sort_order": 45,
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
        ("blog", "0031_wishitem_wuyishan"),
    ]

    operations = [
        migrations.AddField(
            model_name="wishitem",
            name="price",
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                max_digits=10,
                null=True,
                verbose_name="价格(¥)",
            ),
        ),
        migrations.RunPython(seed_new_wishes, migrations.RunPython.noop),
    ]
