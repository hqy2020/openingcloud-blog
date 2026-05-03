#!/usr/bin/env python3
"""
自媒体数据同步脚本
从 Hermes SQLite DB 读取数据 → 写入 Django API
用法: python3 sync_social_stats.py [--date YYYY-MM-DD]
"""

import os
import sys
import json
import sqlite3
import urllib.request
import urllib.parse
from datetime import datetime, timedelta

# ── 配置 ──
HERMES_DB = os.path.expanduser("~/.hermes/scripts/social-dashboard/data/social_stats.db")
DJANGO_API = "https://blog.openingclouds.xyz/api/admin/social-stats/"
# 从环境变量读 token，没有则尝试本地
API_TOKEN = os.getenv("DJANGO_API_TOKEN") or ""

# ── 平台映射 ──
PLATFORM_MAP = {
    "bilibili": {"icon": "📺", "name": "B站"},
    "zhihu": {"icon": "💡", "name": "知乎"},
    "xiaohongshu": {"icon": "📕", "name": "小红书"},
    "wechat_oa": {"icon": "📱", "name": "公众号"},
    "blog": {"icon": "🌐", "name": "博客"},
    "douyin": {"icon": "🎵", "name": "抖音"},
    "kuaishou": {"icon": "📱", "name": "快手"},
    "shipinhao": {"icon": "📹", "name": "视频号"},
    "nowcoder": {"icon": "💻", "name": "牛客"},
    "weibo": {"icon": "📢", "name": "微博"},
    "douban": {"icon": "📚", "name": "豆瓣"},
}

ORDER = {p: i for i, p in enumerate(PLATFORM_MAP.keys())}


def query_hermes(date_str: str) -> list[dict]:
    """从 Hermes SQLite 读取当日快照"""
    if not os.path.exists(HERMES_DB):
        print(f"❌ Hermes DB 不存在: {HERMES_DB}")
        return []

    conn = sqlite3.connect(HERMES_DB)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        """SELECT platform, account_name, followers, total_likes,
                  total_views, posts_count, comments, shares, favorites,
                  best_post_title, best_post_views, best_post_likes,
                  best_post_url, yesterday_followers, yesterday_views,
                  yesterday_shares
           FROM daily_stats
           WHERE date = ?
           ORDER BY platform""",
        (date_str,),
    )

    rows = cursor.fetchall()
    conn.close()

    results = []
    for row in rows:
        d = dict(row)
        d["date"] = date_str
        d["sort_order"] = ORDER.get(d["platform"], 99)
        results.append(d)

    return results


def push_to_django(data: list[dict]) -> bool:
    """推送数据到 Django API"""
    if not data:
        print("ℹ️ 无数据，跳过推送")
        return False

    payload = json.dumps({"data": data}).encode("utf-8")

    req = urllib.request.Request(
        DJANGO_API,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_TOKEN}" if API_TOKEN else "",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read())
            print(f"✅ 推送成功: {result.get('message', '')}")
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"❌ HTTP {e.code}: {body[:500]}")
        return False
    except Exception as e:
        print(f"❌ 请求失败: {e}")
        return False


def get_token_from_settings():
    """从 Django settings 尝试获取 API token"""
    settings_path = os.path.expanduser("~/openingcloud-blog/backend/.env.production")
    if os.path.exists(settings_path):
        with open(settings_path) as f:
            for line in f:
                line = line.strip()
                if line.startswith("DJANGO_SUPERUSER_PASSWORD="):
                    return line.split("=", 1)[1]
    return ""


def main():
    # 解析日期
    date_str = None
    for arg in sys.argv[1:]:
        if arg.startswith("--date="):
            date_str = arg.split("=", 1)[1]
    if not date_str:
        date_str = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

    print(f"📡 同步自媒体数据 [{date_str}]")

    # 读取 Hermes DB
    data = query_hermes(date_str)
    print(f"📊 读取到 {len(data)} 条记录")

    for d in data:
        icon = PLATFORM_MAP.get(d["platform"], {}).get("icon", "🌍")
        name = d.get("account_name") or PLATFORM_MAP.get(d["platform"], {}).get("name", d["platform"])
        print(f"   {icon} {name}: {d['followers']}粉 | {d['total_views']}阅读 | {d['total_likes']}赞")

    # 推送
    push_to_django(data)
    print(f"✅ 同步完成")


if __name__ == "__main__":
    main()
