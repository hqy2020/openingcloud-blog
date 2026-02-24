"""Seed default TimeSeriesConfig from hardcoded DEFAULT_HOME_TIME_SERIES."""

from django.db import migrations

DEFAULT_KEY = "default"

DEFAULT_X_AXIS = [str(age) for age in range(0, 27)]

DEFAULT_SERIES = [
    {
        "name": "学习",
        "color": "#B3D4FF",
        "data": [0, 0, 8, 20, 35, 50, 58, 60, 55, 45, 40, 38, 36, 34, 32, 30, 30, 30, 30, 30, 28, 24, 20, 20, 20, 20, 30],
    },
    {
        "name": "游戏",
        "color": "#80E5FF",
        "data": [0, 0, 0, 0, 0, 0, 0, 0, 5, 15, 22, 28, 30, 28, 24, 20, 18, 16, 15, 15, 15, 15, 15, 15, 15, 15, 10],
    },
    {
        "name": "写代码",
        "color": "#8FD9D0",
        "data": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 14, 18, 22, 24, 24, 24, 24, 24, 23, 22, 20, 18, 16, 14, 10],
    },
    {
        "name": "运动",
        "color": "#7BC9FF",
        "data": [0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 8, 10, 12, 12, 10, 10, 9, 8, 8, 6, 6, 5, 5, 5, 5, 5, 3],
    },
    {
        "name": "音乐",
        "color": "#A7C4FF",
        "data": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 4, 5, 6, 7, 9, 10, 10, 10, 10, 8],
    },
    {
        "name": "社交&家庭",
        "color": "#A3F0C7",
        "data": [100, 100, 92, 80, 65, 50, 42, 40, 40, 35, 25, 14, 8, 8, 12, 16, 17, 18, 18, 19, 21, 25, 30, 32, 34, 36, 39],
    },
]


def seed_time_series(apps, schema_editor):
    TimeSeriesConfig = apps.get_model("blog", "TimeSeriesConfig")
    if TimeSeriesConfig.objects.filter(key=DEFAULT_KEY).exists():
        return
    TimeSeriesConfig.objects.create(
        key=DEFAULT_KEY,
        x_axis=DEFAULT_X_AXIS,
        series=DEFAULT_SERIES,
        is_active=True,
    )


def reverse_seed(apps, schema_editor):
    TimeSeriesConfig = apps.get_model("blog", "TimeSeriesConfig")
    TimeSeriesConfig.objects.filter(key=DEFAULT_KEY).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("blog", "0022_radarconfig"),
    ]

    operations = [
        migrations.RunPython(seed_time_series, reverse_seed),
    ]
