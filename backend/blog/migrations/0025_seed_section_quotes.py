"""Seed SectionQuote with the 3 hardcoded quotes from HomePage.tsx."""

from django.db import migrations

SEED_QUOTES = [
    {
        "slot": "after_marquee",
        "category": "技术",
        "lead": "真正可靠的工程，不是一次写对所有逻辑，而是持续把复杂度",
        "emphasis": "沉淀成可复用的能力",
        "tail": "。",
        "sort_order": 0,
    },
    {
        "slot": "after_game",
        "category": "生活",
        "lead": "生活质量的提升，不一定来自更多空闲，而是来自每天都能",
        "emphasis": "认真感受当下",
        "tail": "。",
        "sort_order": 0,
    },
    {
        "slot": "after_dream",
        "category": "整理",
        "lead": "整理的核心不是堆叠工具，而是建立一套在需要时可以",
        "emphasis": "快速定位与执行",
        "tail": "的系统。",
        "sort_order": 0,
    },
]


def seed_quotes(apps, schema_editor):
    SectionQuote = apps.get_model("blog", "SectionQuote")
    for item in SEED_QUOTES:
        if SectionQuote.objects.filter(slot=item["slot"], is_active=True).exists():
            continue
        SectionQuote.objects.create(is_active=True, **item)


def reverse_seed(apps, schema_editor):
    SectionQuote = apps.get_model("blog", "SectionQuote")
    slots = [item["slot"] for item in SEED_QUOTES]
    SectionQuote.objects.filter(slot__in=slots).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("blog", "0024_sectionquote"),
    ]

    operations = [
        migrations.RunPython(seed_quotes, reverse_seed),
    ]
