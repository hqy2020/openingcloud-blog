from __future__ import annotations

from django.db import migrations


SHANGHAI_PROVINCE = "上海"
JINGAN_CITY = "静安"
JINGAN_LAT = 31.2289
JINGAN_LNG = 121.4486


def set_shanghai_jingan_residence(apps, schema_editor):
    TravelPlace = apps.get_model("blog", "TravelPlace")

    # 先把所有 is_current_residence=True 的清掉（model.save 的强制单选逻辑在 raw queryset 上不生效）
    TravelPlace.objects.filter(is_current_residence=True).update(is_current_residence=False)

    place, created = TravelPlace.objects.get_or_create(
        province=SHANGHAI_PROVINCE,
        city=JINGAN_CITY,
        defaults={
            "notes": "现居",
            "latitude": JINGAN_LAT,
            "longitude": JINGAN_LNG,
            "sort_order": 0,
            "is_current_residence": True,
        },
    )

    if not created:
        # 补齐坐标 + 标记现居（不覆盖已有 notes/cover）
        if not place.latitude:
            place.latitude = JINGAN_LAT
        if not place.longitude:
            place.longitude = JINGAN_LNG
        place.is_current_residence = True
        place.save(update_fields=["latitude", "longitude", "is_current_residence"])


def reverse_residence(apps, schema_editor):
    # 不还原（避免覆盖用户后台后续编辑）
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("blog", "0044_remove_ant_onboard_timeline"),
    ]

    operations = [
        migrations.RunPython(set_shanghai_jingan_residence, reverse_residence),
    ]
