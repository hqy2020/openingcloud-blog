from __future__ import annotations

from django.db import migrations


SEED_QUOTES = [
    # tier=creed（五信条 · 从 WHOAMI.md Section 二提炼）
    ("日拱一卒，静水深流 — 不信爆款，信复利", "creed", "WHOAMI 五信条"),
    ("真诚是唯一的捷径 — 可以不写，绝不骗人", "creed", "WHOAMI 五信条"),
    ("有所为有所不为 — 流量和钱不是没用，但不跨那道线", "creed", "WHOAMI 五信条"),
    ("尊重身体信号 — 困了就睡，累了就歇", "creed", "WHOAMI 五信条"),
    # tier=insight（entity 精选断言 · 来自 3-Knowledge/entities/）
    ("内在驱动力大于外部认可", "insight", "entities"),
    ("学习的本质是构建模型而非记忆", "insight", "entities"),
    ("脑糊信号是身体要求重启，躺 30 分钟胜过硬撑", "insight", "entities"),
    ("推进感来自闭环，先跑通再优化", "insight", "entities"),
    ("情绪不表达会累积成定时炸弹", "insight", "entities"),
    ("个人品牌冷启动，先强后广", "insight", "entities"),
    ("内容传播的流量密码是新鲜事加主动抛出", "insight", "entities"),
    ("信息入口收敛原则，源头越少注意力越聚焦", "insight", "entities"),
    ("学习环境氛围决定专注度上限", "insight", "entities"),
    ("人情温度大于形式", "insight", "entities"),
    ("仪式感来自日常记录的意外复利", "insight", "entities"),
]


def seed(apps, schema_editor):
    WikiQuote = apps.get_model("blog", "WikiQuote")
    for idx, (text, tier, source) in enumerate(SEED_QUOTES):
        WikiQuote.objects.update_or_create(
            text=text,
            defaults={"tier": tier, "source": source, "sort_order": idx, "is_active": True},
        )


def unseed(apps, schema_editor):
    WikiQuote = apps.get_model("blog", "WikiQuote")
    WikiQuote.objects.filter(text__in=[t for t, _, _ in SEED_QUOTES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("blog", "0040_wikiquote"),
    ]

    operations = [
        migrations.RunPython(seed, reverse_code=unseed),
    ]
