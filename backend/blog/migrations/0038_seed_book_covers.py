from __future__ import annotations

from pathlib import Path
from urllib.error import URLError, HTTPError
from urllib.request import Request, urlopen

from django.conf import settings
from django.db import migrations


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120 Safari/537.36"
    ),
    "Referer": "https://www.douban.com/",
}

# (title, slug, douban_url)
COVER_MAP = [
    ("哥德尔 艾舍尔 巴赫",   "geb",               "https://img2.doubanio.com/view/subject/l/public/s1762956.jpg"),
    ("黑客与画家",           "hackers-painters",  "https://img1.doubanio.com/view/subject/l/public/s2503853.jpg"),
    ("Effective Java",       "effective-java",    "https://img9.doubanio.com/view/subject/l/public/s29462796.jpg"),
    ("代码整洁之道",         "clean-code",        "https://img2.doubanio.com/view/subject/l/public/s3228028.jpg"),
    ("计算广告",             "computational-ads", "https://img3.doubanio.com/view/subject/l/public/s34388321.jpg"),
    ("智能简史",             "brief-intelligence","https://img9.doubanio.com/view/subject/l/public/s34836502.jpg"),
]


def download_covers(apps, schema_editor):
    Book = apps.get_model("blog", "Book")
    dest_dir = Path(settings.MEDIA_ROOT) / "books"
    dest_dir.mkdir(parents=True, exist_ok=True)

    for title, slug, url in COVER_MAP:
        out = dest_dir / f"{slug}.jpg"
        relative_url = f"/media/uploads/books/{slug}.jpg"

        if out.exists() and out.stat().st_size > 1024:
            Book.objects.filter(title=title).update(cover=relative_url)
            continue

        try:
            req = Request(url, headers=HEADERS)
            with urlopen(req, timeout=20) as resp:
                content = resp.read()
            if len(content) < 1024:
                raise ValueError(f"response too small ({len(content)} bytes)")
            out.write_bytes(content)
            Book.objects.filter(title=title).update(cover=relative_url)
            print(f"[cover] downloaded {title} -> {out}")
        except (HTTPError, URLError, ValueError, OSError) as exc:
            print(f"[cover] {title} FAILED ({exc!r}); keeping original URL")


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [("blog", "0037_book")]

    operations = [migrations.RunPython(download_covers, noop)]
