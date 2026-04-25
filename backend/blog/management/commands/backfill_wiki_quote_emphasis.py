"""幂等地为所有 emphasis 为空的 WikiQuote 写入关键词。

启动时由 entrypoint.sh 调用，确保即便 0042 migration 因为 text 不一致没匹配，
线上每条金句都会有 emphasis 字段，前端按词高亮才能生效。
"""

from __future__ import annotations

import re

from django.core.management.base import BaseCommand

from blog.models import WikiQuote


# 优先按精确 text 匹配
EXACT_EMPHASIS = {
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

# 关键词模糊匹配（只要 text 包含这个词，就用它做 emphasis）
KEYWORD_FALLBACK = [
    "复利", "真诚", "有所为有所不为", "尊重身体信号", "内在驱动力", "构建模型",
    "重启", "闭环", "定时炸弹", "先强后广", "新鲜事", "源头越少", "氛围",
    "温度", "意外复利",
]


def derive_emphasis(text: str) -> str:
    if text in EXACT_EMPHASIS:
        return EXACT_EMPHASIS[text]
    for kw in KEYWORD_FALLBACK:
        if kw in text:
            return kw
    # 终极 fallback：取最后一段（按 ， 。 — 切分）的 4-8 字
    parts = re.split(r"[，。—\s]+", text.strip())
    last = parts[-1] if parts else text
    return last[:8] if last else text[-6:]


class Command(BaseCommand):
    help = "Backfill empty emphasis on WikiQuote rows so frontend can highlight keywords."

    def add_arguments(self, parser):
        parser.add_argument("--force", action="store_true", help="overwrite even non-empty emphasis")

    def handle(self, *args, force: bool = False, **kwargs):
        qs = WikiQuote.objects.all() if force else WikiQuote.objects.filter(emphasis="")
        n = 0
        for q in qs:
            new_emphasis = derive_emphasis(q.text)
            if new_emphasis and new_emphasis != q.emphasis:
                q.emphasis = new_emphasis[:64]
                q.save(update_fields=["emphasis"])
                n += 1
        self.stdout.write(self.style.SUCCESS(f"backfilled emphasis on {n} quotes"))
