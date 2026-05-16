from __future__ import annotations

import tempfile
from pathlib import Path
from unittest.mock import patch

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase

from blog.models import Book, PhotoWallImage, SocialMediaStat, WishItem


SYNC_ROOT = "2-Resource/90_网站同步"
PHOTO_NOTE = f"{SYNC_ROOT}/01_照片墙/照片墙.md"
SOCIAL_NOTE = f"{SYNC_ROOT}/02_自媒体/平台数据.md"
WISH_NOTE = f"{SYNC_ROOT}/03_愿望清单/愿望清单.md"
BOOK_NOTE = f"{SYNC_ROOT}/04_书架/书架.md"


def _write(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.strip() + "\n", encoding="utf-8")


class StructuredSiteSyncCommandTests(TestCase):
    def test_sync_site_structured_imports_four_example_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            vault = Path(tmp)
            _write(
                vault / WISH_NOTE,
                """
                # 愿望清单

                | 标题 | 表情 | 描述 | 价格 | 优先级 | 购买链接 | 是否启用 |
                | --- | --- | --- | --- | --- | --- | --- |
                | 雷霆50 羽毛球拍 | 🏸 | 想买的拍子 | 500 | 中 |  | 是 |
                """,
            )
            _write(
                vault / BOOK_NOTE,
                """
                # 书架

                | 标题 | 作者 | 状态 | 进度 | 评分 | 标签 | 感想 | 封面 | 信息链接 | 是否启用 |
                | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
                | 哥德尔 艾舍尔 巴赫 | 侯世达 | 在读 | 30 |  | 认知科学,递归 | 形式系统的嵌套才是主角。 | /media/uploads/books/geb.jpg |  | 是 |
                """,
            )
            _write(
                vault / SOCIAL_NOTE,
                """
                # 平台数据

                | 日期 | 平台 | 账号名 | 粉丝数 | 播放/阅读 | 获赞 | 评论 | 分享 | 内容数 | 是否启用 |
                | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
                | 2026-04-09 | Bilibili | Opening Cloud | 1200 | 56000 | 3100 | 90 | 12 | 18 | 是 |
                """,
            )
            _write(
                vault / PHOTO_NOTE,
                """
                # 照片墙

                | 标题 | 图片 | 描述 | 拍摄日期 | 是否公开 |
                | --- | --- | --- | --- | --- |
                | 浙大 | https://raw.githubusercontent.com/hqy2020/obsidian-images/main/gallery/2026/02/demo.jpg | 校园照片 | 2026-02-01 | 是 |
                """,
            )

            call_command("sync_site_structured", "--vault", str(vault))

        wish = WishItem.objects.get(title="雷霆50 羽毛球拍")
        self.assertEqual(wish.obsidian_path, WISH_NOTE)
        self.assertEqual(str(wish.price), "500.00")

        book = Book.objects.get(title="哥德尔 艾舍尔 巴赫")
        self.assertEqual(book.obsidian_path, BOOK_NOTE)
        self.assertEqual(book.status, Book.Status.READING)
        self.assertEqual(book.tags, ["认知科学", "递归"])

        social = SocialMediaStat.objects.get(platform="bilibili", date="2026-04-09")
        self.assertEqual(social.account_name, "Opening Cloud")
        self.assertEqual(social.followers, 1200)

        photo = PhotoWallImage.objects.get(title="浙大")
        self.assertEqual(photo.obsidian_path, PHOTO_NOTE)
        self.assertTrue(photo.sync_key)
        self.assertEqual(photo.captured_at.isoformat(), "2026-02-01")

    def test_sync_site_structured_deactivates_removed_items(self):
        with tempfile.TemporaryDirectory() as tmp:
            vault = Path(tmp)
            _write(
                vault / WISH_NOTE,
                """
                # 愿望清单

                | 标题 | 表情 | 描述 | 是否启用 |
                | --- | --- | --- | --- |
                | 保留项 | ✨ | keep | 是 |
                | 旧愿望 | ✨ | old | 是 |
                """,
            )
            _write(
                vault / BOOK_NOTE,
                """
                # 书架

                | 标题 | 作者 | 状态 | 是否启用 |
                | --- | --- | --- | --- |
                | 保留书 | 作者A | 已读 | 是 |
                | 旧书 | 作者B | 已读 | 是 |
                """,
            )
            _write(
                vault / SOCIAL_NOTE,
                """
                # 平台数据

                | 日期 | 平台 | 粉丝数 |
                | --- | --- | --- |
                | 2026-04-09 | 知乎 | 9 |
                """,
            )
            _write(
                vault / PHOTO_NOTE,
                """
                # 照片墙

                | 标题 | 图片 | 是否公开 |
                | --- | --- | --- |
                | 保留照片 | https://raw.githubusercontent.com/hqy2020/obsidian-images/main/gallery/keep.jpg | 是 |
                | 旧照片 | https://raw.githubusercontent.com/hqy2020/obsidian-images/main/gallery/old.jpg | 是 |
                """,
            )

            call_command("sync_site_structured", "--vault", str(vault))

            _write(
                vault / WISH_NOTE,
                """
                # 愿望清单

                | 标题 | 表情 | 描述 | 是否启用 |
                | --- | --- | --- | --- |
                | 保留项 | ✨ | keep | 是 |
                """,
            )
            _write(
                vault / BOOK_NOTE,
                """
                # 书架

                | 标题 | 作者 | 状态 | 是否启用 |
                | --- | --- | --- | --- |
                | 保留书 | 作者A | 已读 | 是 |
                """,
            )
            _write(
                vault / PHOTO_NOTE,
                """
                # 照片墙

                | 标题 | 图片 | 是否公开 |
                | --- | --- | --- |
                | 保留照片 | https://raw.githubusercontent.com/hqy2020/obsidian-images/main/gallery/keep.jpg | 是 |
                """,
            )

            call_command("sync_site_structured", "--vault", str(vault))

        self.assertTrue(WishItem.objects.get(title="保留项").is_active)
        self.assertFalse(WishItem.objects.get(title="旧愿望").is_active)
        self.assertTrue(Book.objects.get(title="保留书").is_active)
        self.assertFalse(Book.objects.get(title="旧书").is_active)
        self.assertTrue(PhotoWallImage.objects.get(title="保留照片").is_public)
        self.assertFalse(PhotoWallImage.objects.get(title="旧照片").is_public)

    @patch("blog.management.commands.sync_site_structured.upload_photo_to_obsidian_images")
    def test_sync_site_structured_uploads_local_photo_assets(self, mock_upload):
        class MockUploadResult:
            image_url = "https://raw.githubusercontent.com/hqy2020/obsidian-images/main/gallery/uploaded.jpg"
            source_url = "https://github.com/hqy2020/obsidian-images/blob/main/gallery/uploaded.jpg"

        mock_upload.return_value = MockUploadResult()

        with tempfile.TemporaryDirectory() as tmp:
            vault = Path(tmp)
            local_image = vault / SYNC_ROOT / "01_照片墙" / "assets" / "sample.jpg"
            local_image.parent.mkdir(parents=True, exist_ok=True)
            local_image.write_bytes(b"fake-jpg")
            _write(
                vault / PHOTO_NOTE,
                """
                # 照片墙

                | 标题 | 图片 | 是否公开 |
                | --- | --- | --- |
                | 本地图片 | ![[assets/sample.jpg]] | 是 |
                """,
            )
            _write(vault / SOCIAL_NOTE, "# 平台数据")
            _write(vault / WISH_NOTE, "# 愿望清单")
            _write(vault / BOOK_NOTE, "# 书架")

            call_command("sync_site_structured", "--vault", str(vault))

        photo = PhotoWallImage.objects.get(title="本地图片")
        self.assertEqual(photo.image_url, MockUploadResult.image_url)
        self.assertEqual(photo.source_url, MockUploadResult.source_url)
        self.assertEqual(mock_upload.call_count, 1)


class SiteSyncPipelineCommandTests(TestCase):
    @patch("blog.management.commands.sync_site_sources.call_command")
    def test_sync_site_sources_skips_document_pool_in_dry_run(self, mock_call_command):
        with tempfile.TemporaryDirectory() as tmp:
            vault = Path(tmp)
            (vault / "3-Knowledge").mkdir(parents=True, exist_ok=True)
            call_command("sync_site_sources", str(vault), "--dry-run")

        called_names = [args[0] for args, _kwargs in mock_call_command.call_args_list]
        self.assertIn("sync_obsidian", called_names)
        self.assertIn("sync_knowledge_github", called_names)
        self.assertIn("sync_site_structured", called_names)
        self.assertNotIn("sync_obsidian_documents", called_names)
