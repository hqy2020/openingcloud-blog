from __future__ import annotations

from django.db import migrations


def seed_thousand_brains(apps, schema_editor):
    Book = apps.get_model("blog", "Book")
    Book.objects.get_or_create(
        title="千脑智能",
        defaults={
            "author": "杰夫·霍金斯",
            "cover": "/media/uploads/books/thousand-brains.jpg",
            "status": "finished",
            "progress": 0,
            "rating": 4,
            "tags": ["神经科学", "智能理论"],
            "review": "",
            "sort_order": 70,
            "is_active": True,
        },
    )


class Migration(migrations.Migration):
    dependencies = [
        ("blog", "0047_alter_knowledgeedge_id_alter_knowledgenode_id_and_more"),
    ]

    operations = [
        migrations.RunPython(seed_thousand_brains, migrations.RunPython.noop),
    ]
