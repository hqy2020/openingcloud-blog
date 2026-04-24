from __future__ import annotations

from django.db import migrations, models


# Seed douban subject IDs for the current 6 books.
SEED_MAP = {
    "哥德尔 艾舍尔 巴赫": "1291204",
    "哥德尔、艾舍尔、巴赫": "1291204",
    "黑客与画家": "35889905",
    "Effective Java": "30412517",
    "代码整洁之道": "4199741",
    "计算广告": "26596778",
    "智能简史": "37252220",
}


def seed_douban_ids(apps, schema_editor):
    Book = apps.get_model("blog", "Book")
    for b in Book.objects.all():
        sid = SEED_MAP.get(b.title.strip())
        if sid and not b.douban_subject_id:
            b.douban_subject_id = sid
            b.save(update_fields=["douban_subject_id"])


class Migration(migrations.Migration):
    dependencies = [
        ("blog", "0038_seed_book_covers"),
    ]

    operations = [
        migrations.AddField(
            model_name="book",
            name="douban_subject_id",
            field=models.CharField(
                blank=True,
                help_text="豆瓣 subject ID，如 35889905；点击封面跳转用。留空则用 title 搜索",
                max_length=32,
            ),
        ),
        migrations.RunPython(seed_douban_ids, migrations.RunPython.noop),
    ]
