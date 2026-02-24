from __future__ import annotations

from django.db import migrations, models


def seed_wish_items(apps, schema_editor):
    WishItem = apps.get_model("blog", "WishItem")
    initial_wishes = [
        {
            "emoji": "🖨️",
            "title": "3D 打印机",
            "description": "Bambu Lab P1S — 随时把灵感变成实物，快速原型验证。",
            "priority": "high",
            "sort_order": 10,
        },
        {
            "emoji": "🚁",
            "title": "无人机",
            "description": "DJI Mini 4 Pro — 用航拍视角记录旅行和城市风景。",
            "priority": "high",
            "sort_order": 20,
        },
        {
            "emoji": "💡",
            "title": "窗前氛围灯",
            "description": "Govee Glide Hexa Pro — 打造沉浸式编程与阅读环境。",
            "priority": "medium",
            "sort_order": 30,
        },
        {
            "emoji": "📷",
            "title": "运动摄像机",
            "description": "GoPro Hero 13 — 记录骑行、徒步和极限运动的第一视角。",
            "priority": "medium",
            "sort_order": 40,
        },
        {
            "emoji": "🕶️",
            "title": "AI 眼镜",
            "description": "Meta Ray-Ban — 随时语音交互，拍照记录生活碎片。",
            "priority": "low",
            "sort_order": 50,
        },
    ]
    for wish in initial_wishes:
        WishItem.objects.get_or_create(
            title=wish["title"],
            defaults={
                "emoji": wish["emoji"],
                "description": wish["description"],
                "priority": wish["priority"],
                "sort_order": wish["sort_order"],
                "is_active": True,
            },
        )


def seed_wuyishan(apps, schema_editor):
    TravelPlace = apps.get_model("blog", "TravelPlace")
    TravelPlace.objects.get_or_create(
        province="福建",
        city="武夷山",
        defaults={
            "visited_at": "2014-07-01",
            "latitude": 27.7563,
            "longitude": 118.0355,
            "sort_order": 50,
        },
    )


class Migration(migrations.Migration):
    dependencies = [
        ("blog", "0030_update_radar_data"),
    ]

    operations = [
        migrations.CreateModel(
            name="WishItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("emoji", models.CharField(max_length=10)),
                ("title", models.CharField(max_length=100)),
                ("description", models.TextField(blank=True)),
                (
                    "priority",
                    models.CharField(
                        choices=[("high", "高优先级"), ("medium", "中优先级"), ("low", "低优先级")],
                        default="medium",
                        max_length=10,
                    ),
                ),
                ("sort_order", models.PositiveIntegerField(db_index=True, default=0)),
                ("is_active", models.BooleanField(default=True)),
            ],
            options={
                "verbose_name": "心愿清单",
                "verbose_name_plural": "心愿清单",
                "ordering": ["sort_order", "-priority"],
            },
        ),
        migrations.RunPython(seed_wish_items, migrations.RunPython.noop),
        migrations.RunPython(seed_wuyishan, migrations.RunPython.noop),
    ]
