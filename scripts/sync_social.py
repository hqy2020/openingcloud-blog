#!/usr/bin/env python3
"""
Push social stats from Hermes DB to Django API.
Bypasses system proxy by connecting to ECS IP directly.
Usage: python3 sync_social.py [--date YYYY-MM-DD] [--username USER] [--password PASS]
"""
import json, os, sqlite3, sys, ssl

import urllib.request

HERMES_DB = os.path.expanduser("~/.hermes/scripts/social-dashboard/data/social_stats.db")
ECS_IP = "47.99.42.71"
LOGIN_URL = f"https://{ECS_IP}/api/auth/login"
API_URL = f"https://{ECS_IP}/api/admin/social-stats/"
LOGIN_HOST = "blog.openingclouds.xyz"

ORDER = {p: i for i, p in enumerate([
    "bilibili", "zhihu", "xiaohongshu", "wechat_oa", "blog",
    "douyin", "kuaishou", "shipinhao", "nowcoder", "weibo", "douban"
])}

def main():
    date_str = None
    username, password = None, None
    for arg in sys.argv[1:]:
        if arg.startswith("--date="): date_str = arg.split("=", 1)[1]
        elif arg.startswith("--username="): username = arg.split("=", 1)[1]
        elif arg.startswith("--password="): password = arg.split("=", 1)[1]
    if not date_str:
        from datetime import datetime, timedelta
        date_str = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

    # Bypass system proxy + SSL verify by using raw IP + custom Host header
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    proxy_handler = urllib.request.ProxyHandler({})
    https_handler = urllib.request.HTTPSHandler(context=ctx)
    opener = urllib.request.build_opener(proxy_handler, https_handler)
    urllib.request.install_opener(opener)

    # Read from Hermes DB
    if not os.path.exists(HERMES_DB):
        print(f"❌ DB not found: {HERMES_DB}")
        return
    conn = sqlite3.connect(HERMES_DB)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("""
        SELECT platform, account_name, followers, total_likes, total_views,
               posts_count, comments, shares, best_post_title, best_post_views,
               best_post_likes, best_post_url
        FROM daily_stats WHERE date = ?
        ORDER BY platform
    """, (date_str,)).fetchall()
    conn.close()

    if not rows:
        print(f"ℹ️ No data for {date_str}")
        return

    data = []
    for row in rows:
        d = dict(row)
        d["date"] = date_str
        d["sort_order"] = ORDER.get(d["platform"], 99)
        d["yesterday_followers"] = 0
        d["yesterday_views"] = 0
        d["yesterday_shares"] = 0
        d["favorites"] = 0
        data.append(d)

    print(f"📊 Loaded {len(data)} platforms for {date_str}:")
    for d in data:
        print(f"   {d['platform']:>12}: {d['followers']:>5}粉 {d['total_views']:>8}阅 {d['total_likes']:>5}赞")

    # Login
    if username and password:
        login_payload = json.dumps({"username": username, "password": password}).encode()
        login_req = urllib.request.Request(LOGIN_URL, data=login_payload,
            headers={"Content-Type": "application/json", "Host": LOGIN_HOST}, method="POST")
        try:
            resp = urllib.request.urlopen(login_req, timeout=15)
            print(f"✅ Login success: {resp.status}")
            cookies = resp.headers.get_all("Set-Cookie")
            if not cookies:
                print("❌ No cookies returned")
                return
            cookie_header = "; ".join(c.split(";")[0] for c in cookies)
            print(f"🍪 Got cookie: {cookie_header[:60]}...")

            # POST data
            post_payload = json.dumps({"data": data}).encode()
            post_req = urllib.request.Request(API_URL, data=post_payload,
                headers={
                    "Content-Type": "application/json",
                    "Host": LOGIN_HOST,
                    "Cookie": cookie_header,
                }, method="POST")
            post_resp = urllib.request.urlopen(post_req, timeout=30)
            result = json.loads(post_resp.read())
            print(f"✅ Sync success: {result.get('message', '')}")
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            print(f"❌ HTTP {e.code}: {body[:300]}")
        except Exception as e:
            print(f"❌ Error: {e}")
    else:
        print("ℹ️ No credentials provided. Use --username and --password.")

if __name__ == "__main__":
    main()
