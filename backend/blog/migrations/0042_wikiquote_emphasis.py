from __future__ import annotations

from django.db import migrations, models


SEED_EMPHASIS = {
    "日拱一卒，静水深流 — 不信爆款，信复利": "复利",
    "真诚是唯一的捷径 — 可以不写，绝不骗人": "真诚",
    "有所为有所不为 — 流量和钱不是没用，但不跨那道线": "有所为有所不为",
    "尊重身体信号 — 困了就睡，累了就歇": "尊重身体信号",
    "内在驱动力大于外部认可": "内在驱动力",
    "学习的本质是构建模型而非记忆": "构建模型",
    "脑糊信号是身体要求重启，躺 30 分钟胜过硬撑": "重启",
    "推进感来自闭环，先跑通再优化": "闭环",
    "情绪不表达会累积成定时炸弹": "定时炸弹",
    "个人品牌冷启动，先强后广": "先强后广",
    "内容传播的流量密码是新鲜事加主动抛出": "新鲜事加主动抛出",
    "信息入口收敛原则，源头越少注意力越聚焦": "源头越少",
    "学习环境氛围决定专注度上限": "氛围",
    "人情温度大于形式": "温度",
    "仪式感来自日常记录的意外复利": "意外复利",
}


def seed(apps, schema_editor):
    WikiQuote = apps.get_model("blog", "WikiQuote")
    for text, emphasis in SEED_EMPHASIS.items():
        WikiQuote.objects.filter(text=text).update(emphasis=emphasis)


def unseed(apps, schema_editor):
    WikiQuote = apps.get_model("blog", "WikiQuote")
    WikiQuote.objects.filter(text__in=SEED_EMPHASIS.keys()).update(emphasis="")


class Migration(migrations.Migration):

    dependencies = [
        ("blog", "0041_seed_wiki_quotes"),
    ]

    operations = [
        migrations.AddField(
            model_name="wikiquote",
            name="emphasis",
            field=models.CharField(blank=True, default="", help_text="金句中要被黄色滑动高亮的关键子串；留空则整句高亮", max_length=64),
        ),
        migrations.RunPython(seed, reverse_code=unseed),
    ]
