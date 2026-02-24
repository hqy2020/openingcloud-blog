from django.db import migrations


def update_radar_configs(apps, schema_editor):
    RadarConfig = apps.get_model("blog", "RadarConfig")

    RadarConfig.objects.filter(key="work-writing").update(
        title="Learn",
        subtitle="",
        metrics=[
            {"label": "编码", "value": 80},
            {"label": "协作", "value": 85},
            {"label": "写作", "value": 90},
            {"label": "沟通", "value": 90},
            {"label": "速学", "value": 40},
            {"label": "规划", "value": 60},
        ],
    )

    RadarConfig.objects.filter(key="interest-life").update(
        title="Habbit",
        subtitle="",
        metrics=[
            {"label": "运动", "value": 90},
            {"label": "旅行", "value": 60},
            {"label": "社交", "value": 70},
            {"label": "音乐", "value": 40},
            {"label": "厨艺", "value": 75},
            {"label": "摄影", "value": 65},
        ],
    )


class Migration(migrations.Migration):

    dependencies = [
        ("blog", "0029_seed_github_projects"),
    ]

    operations = [
        migrations.RunPython(update_radar_configs, migrations.RunPython.noop),
    ]
