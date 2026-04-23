from __future__ import annotations

from django.db import migrations, models


INITIAL_BOOKS = [
    {
        "title": "哥德尔 艾舍尔 巴赫",
        "author": "侯世达",
        "cover": "https://img2.doubanio.com/view/subject/l/public/s1762956.jpg",
        "status": "reading",
        "progress": 30,
        "rating": None,
        "tags": ["认知科学", "递归", "思想"],
        "review": "形式系统的嵌套才是这本书真正的主角。",
        "sort_order": 10,
    },
    {
        "title": "黑客与画家",
        "author": "Paul Graham",
        "cover": "https://img1.doubanio.com/view/subject/l/public/s2503853.jpg",
        "status": "finished",
        "progress": 0,
        "rating": 5,
        "tags": ["编程哲学", "创业"],
        "review": "",
        "sort_order": 20,
    },
    {
        "title": "Effective Java",
        "author": "Joshua Bloch",
        "cover": "https://img9.doubanio.com/view/subject/l/public/s29462796.jpg",
        "status": "finished",
        "progress": 0,
        "rating": 5,
        "tags": ["Java", "最佳实践"],
        "review": "",
        "sort_order": 30,
    },
    {
        "title": "代码整洁之道",
        "author": "Robert C. Martin",
        "cover": "https://img2.doubanio.com/view/subject/l/public/s3228028.jpg",
        "status": "finished",
        "progress": 0,
        "rating": 4,
        "tags": ["工程", "最佳实践"],
        "review": "",
        "sort_order": 40,
    },
    {
        "title": "计算广告",
        "author": "刘鹏 / 王超",
        "cover": "https://img3.doubanio.com/view/subject/l/public/s34388321.jpg",
        "status": "finished",
        "progress": 0,
        "rating": 4,
        "tags": ["广告系统", "机器学习"],
        "review": "",
        "sort_order": 50,
    },
    {
        "title": "智能简史",
        "author": "马克斯·贝内特",
        "cover": "https://img9.doubanio.com/view/subject/l/public/s34836502.jpg",
        "status": "finished",
        "progress": 0,
        "rating": 4,
        "tags": ["神经科学", "认知演化"],
        "review": "",
        "sort_order": 60,
    },
]


def seed_books(apps, schema_editor):
    Book = apps.get_model("blog", "Book")
    for book in INITIAL_BOOKS:
        Book.objects.get_or_create(
            title=book["title"],
            defaults={
                "author": book["author"],
                "cover": book["cover"],
                "status": book["status"],
                "progress": book["progress"],
                "rating": book["rating"],
                "tags": book["tags"],
                "review": book["review"],
                "sort_order": book["sort_order"],
                "is_active": True,
            },
        )


class Migration(migrations.Migration):
    dependencies = [
        ("blog", "0036_knowledge_graph"),
    ]

    operations = [
        migrations.CreateModel(
            name="Book",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=200)),
                ("author", models.CharField(blank=True, max_length=200)),
                ("cover", models.URLField(blank=True, max_length=500)),
                (
                    "status",
                    models.CharField(
                        choices=[("reading", "正在读"), ("finished", "已读")],
                        default="finished",
                        max_length=16,
                    ),
                ),
                ("progress", models.PositiveSmallIntegerField(default=0, help_text="正在读时的进度 0-100")),
                ("rating", models.PositiveSmallIntegerField(blank=True, help_text="1-5 云朵评分", null=True)),
                ("tags", models.JSONField(blank=True, default=list)),
                ("review", models.TextField(blank=True, help_text="一句话感想（可选）")),
                ("sort_order", models.PositiveIntegerField(db_index=True, default=0)),
                ("is_active", models.BooleanField(default=True)),
            ],
            options={
                "verbose_name": "书架",
                "verbose_name_plural": "书架",
                "ordering": ["sort_order", "-updated_at"],
            },
        ),
        migrations.RunPython(seed_books, migrations.RunPython.noop),
    ]
