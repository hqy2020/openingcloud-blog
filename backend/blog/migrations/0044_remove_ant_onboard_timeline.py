from __future__ import annotations

from django.db import migrations


def remove_ant_onboard(apps, schema_editor):
    TimelineNode = apps.get_model("blog", "TimelineNode")
    TimelineNode.objects.filter(title="蚂蚁集团 · 入职").delete()


def restore_ant_onboard(apps, schema_editor):
    # noop reverse — 不还原（避免覆盖用户后台后续编辑）
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("blog", "0043_add_timeline_milestones"),
    ]

    operations = [
        migrations.RunPython(remove_ant_onboard, restore_ant_onboard),
    ]
