from __future__ import annotations

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.text import slugify


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Post(TimeStampedModel):
    class Category(models.TextChoices):
        TECH = "tech", "技术"
        LEARNING = "learning", "效率"
        LIFE = "life", "生活"

    class SyncSource(models.TextChoices):
        MANUAL = "manual", "手动"
        OBSIDIAN = "obsidian", "Obsidian"

    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=255)
    excerpt = models.TextField(blank=True)
    content = models.TextField()
    category = models.CharField(max_length=20, choices=Category.choices)
    tags = models.JSONField(default=list, blank=True)
    cover = models.URLField(max_length=500, blank=True)
    draft = models.BooleanField(default=True)
    is_pinned = models.BooleanField(default=False, db_index=True, verbose_name="置顶")
    pin_order = models.PositiveSmallIntegerField(default=0, db_index=True, verbose_name="置顶排序")
    obsidian_path = models.CharField(max_length=500, blank=True)
    last_synced_at = models.DateTimeField(null=True, blank=True)
    sync_source = models.CharField(
        max_length=20,
        choices=SyncSource.choices,
        default=SyncSource.MANUAL,
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "文章"
        verbose_name_plural = "文章"

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    @property
    def views_count(self) -> int:
        if hasattr(self, "view_record"):
            return self.view_record.views
        return 0

    @property
    def likes_count(self) -> int:
        if hasattr(self, "like_record"):
            return self.like_record.likes
        return 0


class PostView(models.Model):
    post = models.OneToOneField(Post, on_delete=models.CASCADE, related_name="view_record")
    views = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-views"]
        verbose_name = "文章阅读"
        verbose_name_plural = "文章阅读"

    def __str__(self) -> str:
        return f"{self.post.slug}: {self.views}"


class PostLike(models.Model):
    post = models.OneToOneField(Post, on_delete=models.CASCADE, related_name="like_record")
    likes = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-likes"]
        verbose_name = "文章点赞"
        verbose_name_plural = "文章点赞"

    def __str__(self) -> str:
        return f"{self.post.slug}: {self.likes}"


class PostLikeVote(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="like_votes")
    ip_hash = models.CharField(max_length=64, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("post", "ip_hash")
        verbose_name = "点赞投票"
        verbose_name_plural = "点赞投票"

    def __str__(self) -> str:
        return f"{self.post.slug}: {self.ip_hash[:8]}"


class HomeLike(models.Model):
    likes = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "首页点赞"
        verbose_name_plural = "首页点赞"

    def __str__(self) -> str:
        return f"home: {self.likes}"


class HomeLikeVote(models.Model):
    ip_hash = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "首页点赞投票"
        verbose_name_plural = "首页点赞投票"

    def __str__(self) -> str:
        return f"home: {self.ip_hash[:8]}"


class HomeStatsSnapshot(TimeStampedModel):
    snapshot_date = models.DateField(unique=True, db_index=True)
    views_total = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-snapshot_date"]
        verbose_name = "首页统计快照"
        verbose_name_plural = "首页统计快照"

    def __str__(self) -> str:
        return f"{self.snapshot_date}: {self.views_total}"


class TimeSeriesConfig(TimeStampedModel):
    key = models.SlugField(max_length=50, unique=True, default="default")
    x_axis = models.JSONField(default=list, blank=True)
    series = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["key"]
        verbose_name = "时间分配图配置"
        verbose_name_plural = "时间分配图配置"

    def __str__(self) -> str:
        return self.key

    def clean(self):
        axis = self.x_axis
        rows = self.series

        if not isinstance(axis, list):
            raise ValidationError({"x_axis": "x_axis 必须是数组"})
        if not axis:
            return
        if not isinstance(rows, list):
            raise ValidationError({"series": "series 必须是数组"})

        axis_length = len(axis)
        for idx, item in enumerate(rows):
            if not isinstance(item, dict):
                raise ValidationError({"series": f"series[{idx}] 必须是对象"})

            name = str(item.get("name") or "").strip()
            if not name:
                raise ValidationError({"series": f"series[{idx}].name 不能为空"})

            data = item.get("data")
            if not isinstance(data, list):
                raise ValidationError({"series": f"series[{idx}].data 必须是数组"})
            if len(data) != axis_length:
                raise ValidationError({"series": f"series[{idx}].data 长度必须等于 x_axis 长度"})

            for point_idx, value in enumerate(data):
                try:
                    numeric = float(value)
                except (TypeError, ValueError) as exc:
                    raise ValidationError({"series": f"series[{idx}].data[{point_idx}] 必须是数字"}) from exc
                if numeric < 0:
                    raise ValidationError({"series": f"series[{idx}].data[{point_idx}] 不能小于 0"})


class TimelineNode(TimeStampedModel):
    class NodeType(models.TextChoices):
        CAREER = "career", "职业"
        HEALTH = "health", "健康"
        LEARNING = "learning", "学习"
        FAMILY = "family", "家庭"
        REFLECTION = "reflection", "思考"

    class Impact(models.TextChoices):
        HIGH = "high", "高"
        MEDIUM = "medium", "中"
        LOW = "low", "低"

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    type = models.CharField(max_length=20, choices=NodeType.choices)
    impact = models.CharField(max_length=10, choices=Impact.choices, default=Impact.MEDIUM)
    phase = models.CharField(max_length=100, blank=True)
    tags = models.JSONField(default=list, blank=True)
    cover = models.URLField(max_length=500, blank=True)
    links = models.JSONField(default=list, blank=True)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        ordering = ["sort_order", "start_date"]
        verbose_name = "人生足迹"
        verbose_name_plural = "人生足迹"

    def __str__(self) -> str:
        return self.title


class TravelPlace(TimeStampedModel):
    province = models.CharField(max_length=50)
    city = models.CharField(max_length=50)
    notes = models.TextField(blank=True)
    visited_at = models.DateField(null=True, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    cover = models.URLField(max_length=500, blank=True)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)
    is_current_residence = models.BooleanField(default=False, verbose_name="当前居住地")

    class Meta:
        ordering = ["sort_order", "province", "city"]
        unique_together = ("province", "city")
        verbose_name = "旅行足迹"
        verbose_name_plural = "旅行足迹"

    def __str__(self) -> str:
        return f"{self.province}-{self.city}"

    def save(self, *args, **kwargs):
        if self.is_current_residence:
            TravelPlace.objects.filter(is_current_residence=True).exclude(pk=self.pk).update(is_current_residence=False)
        super().save(*args, **kwargs)


class SocialFriend(TimeStampedModel):
    class StageKey(models.TextChoices):
        PRIMARY = "primary", "小学"
        MIDDLE = "middle", "初中"
        HIGH = "high", "高中"
        TONGJI = "tongji", "同济"
        ZJU = "zju", "浙大"
        CAREER = "career", "工作"
        FAMILY = "family", "家庭"

    class Honorific(models.TextChoices):
        MR = "mr", "先生"
        MS = "ms", "女士"
        CLASSMATE = "classmate", "同学"
        JUNIOR_M = "junior_m", "学弟"
        JUNIOR_F = "junior_f", "学妹"
        SENIOR_M = "senior_m", "师兄"
        TEACHER = "teacher", "老师"

    class Gender(models.TextChoices):
        MALE = "male", "男"
        FEMALE = "female", "女"
        UNKNOWN = "unknown", "未知"

    name = models.CharField(max_length=100)
    public_label = models.CharField(max_length=100)
    relation = models.CharField(max_length=100, blank=True)
    stage_key = models.CharField(max_length=20, choices=StageKey.choices, default=StageKey.CAREER)
    honorific = models.CharField(max_length=10, choices=Honorific.choices, default=Honorific.MR)
    gender = models.CharField(max_length=10, choices=Gender.choices, default=Gender.UNKNOWN)
    avatar = models.URLField(max_length=500, blank=True)
    profile_url = models.URLField(max_length=500, blank=True)
    contact = models.CharField(max_length=255, blank=True, verbose_name="联系方式")
    birthday = models.DateField(null=True, blank=True, verbose_name="生日")
    is_public = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        ordering = ["sort_order", "name"]
        verbose_name = "社交图谱"
        verbose_name_plural = "社交图谱"

    def __str__(self) -> str:
        return self.public_label

    def masked_name(self) -> str:
        base_name = str(self.name or "").strip()
        if not base_name:
            return self.public_label

        first_char = base_name[0]
        if self.honorific not in {self.Honorific.MR, self.Honorific.MS}:
            return f"{first_char}{self.get_honorific_display()}"

        context_text = f"{self.relation or ''} {self.public_label or ''}"
        female_markers = ("女士", "女友", "妻", "太太", "妈妈", "母亲", "姐姐", "妹妹", "闺蜜", "情侣")
        male_markers = ("先生", "男友", "丈夫", "爸爸", "父亲", "哥哥", "弟弟", "师兄")

        if any(marker in context_text for marker in female_markers):
            suffix = self.Honorific.MS.label
        elif any(marker in context_text for marker in male_markers):
            suffix = self.Honorific.MR.label
        else:
            suffix = self.Honorific.MS.label if self.honorific == self.Honorific.MS else self.Honorific.MR.label
        return f"{first_char}{suffix}"


class PhotoWallImage(TimeStampedModel):
    title = models.CharField(max_length=120, blank=True)
    description = models.TextField(blank=True)
    image_url = models.URLField(max_length=800)
    source_url = models.URLField(max_length=800, blank=True)
    captured_at = models.DateField(null=True, blank=True)
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    is_public = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "照片墙"
        verbose_name_plural = "照片墙"

    def __str__(self) -> str:
        if self.title:
            return self.title
        return self.image_url


class HighlightStage(TimeStampedModel):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        ordering = ["sort_order", "start_date", "id"]
        verbose_name = "高光阶段"
        verbose_name_plural = "高光阶段"

    def __str__(self) -> str:
        return self.title


class HighlightItem(TimeStampedModel):
    stage = models.ForeignKey(HighlightStage, on_delete=models.CASCADE, related_name="items")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    achieved_at = models.DateField(null=True, blank=True)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        ordering = ["sort_order", "achieved_at", "id"]
        verbose_name = "高光条目"
        verbose_name_plural = "高光条目"

    def __str__(self) -> str:
        return self.title


class ObsidianDocument(TimeStampedModel):
    vault_path = models.CharField(max_length=500, unique=True, db_index=True)
    title = models.CharField(max_length=255)
    slug_candidate = models.SlugField(max_length=255, blank=True)
    category_candidate = models.CharField(max_length=20, choices=Post.Category.choices, default=Post.Category.LEARNING)
    tags = models.JSONField(default=list, blank=True)
    has_publish_tag = models.BooleanField(default=False, db_index=True)
    content = models.TextField(blank=True)
    excerpt = models.TextField(blank=True)
    file_hash = models.CharField(max_length=40, blank=True)
    source_mtime = models.DateTimeField(null=True, blank=True)
    source_exists = models.BooleanField(default=True, db_index=True)
    first_seen_at = models.DateTimeField(null=True, blank=True)
    last_seen_at = models.DateTimeField(null=True, blank=True)
    last_indexed_at = models.DateTimeField(null=True, blank=True)
    linked_post = models.ForeignKey(
        Post,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="obsidian_documents",
    )

    class Meta:
        ordering = ["-last_indexed_at", "vault_path"]
        verbose_name = "Obsidian 文档池"
        verbose_name_plural = "Obsidian 文档池"

    def __str__(self) -> str:
        return f"{self.vault_path} ({self.title})"


class ObsidianSyncRun(TimeStampedModel):
    class Trigger(models.TextChoices):
        SCHEDULED = "scheduled", "定时"
        MANUAL = "manual", "手动"

    class Status(models.TextChoices):
        SUCCESS = "success", "成功"
        FAILED = "failed", "失败"

    trigger = models.CharField(max_length=20, choices=Trigger.choices, default=Trigger.MANUAL)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SUCCESS)
    repo_url = models.CharField(max_length=500, blank=True)
    repo_branch = models.CharField(max_length=100, blank=True)
    repo_commit = models.CharField(max_length=64, blank=True)
    scanned_count = models.PositiveIntegerField(default=0)
    created_count = models.PositiveIntegerField(default=0)
    updated_count = models.PositiveIntegerField(default=0)
    missing_count = models.PositiveIntegerField(default=0)
    published_updated_count = models.PositiveIntegerField(default=0)
    drafted_count = models.PositiveIntegerField(default=0)
    started_at = models.DateTimeField()
    finished_at = models.DateTimeField()
    duration_ms = models.PositiveIntegerField(default=0)
    message = models.TextField(blank=True)
    operator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="obsidian_sync_runs",
    )

    class Meta:
        ordering = ["-started_at", "-id"]
        verbose_name = "Obsidian 同步运行"
        verbose_name_plural = "Obsidian 同步运行"

    def __str__(self) -> str:
        return (
            f"{self.started_at:%Y-%m-%d %H:%M:%S} "
            f"[{self.get_trigger_display()}] {self.get_status_display()}"
        )


class SyncLog(TimeStampedModel):
    class Source(models.TextChoices):
        API = "api", "API"
        COMMAND = "command", "Command"

    class Mode(models.TextChoices):
        OVERWRITE = "overwrite", "覆盖"
        SKIP = "skip", "跳过"
        MERGE = "merge", "合并"

    class Action(models.TextChoices):
        CREATED = "created", "创建"
        UPDATED = "updated", "更新"
        SKIPPED = "skipped", "跳过"
        FAILED = "failed", "失败"

    class Status(models.TextChoices):
        SUCCESS = "success", "成功"
        FAILED = "failed", "失败"
        DRY_RUN = "dry_run", "预演"

    source = models.CharField(max_length=20, choices=Source.choices, default=Source.API)
    slug = models.SlugField(max_length=255, blank=True)
    mode = models.CharField(max_length=20, choices=Mode.choices, default=Mode.OVERWRITE)
    action = models.CharField(max_length=20, choices=Action.choices, default=Action.CREATED)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SUCCESS)
    message = models.TextField(blank=True)
    payload = models.JSONField(default=dict, blank=True)
    result = models.JSONField(default=dict, blank=True)
    started_at = models.DateTimeField()
    finished_at = models.DateTimeField()
    duration_ms = models.PositiveIntegerField(default=0)
    operator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sync_logs",
    )

    class Meta:
        ordering = ["-started_at", "-id"]
        verbose_name = "同步日志"
        verbose_name_plural = "同步日志"

    def __str__(self) -> str:
        return f"{self.slug or '-'} [{self.source}/{self.mode}] {self.status}"


class SiteVisit(models.Model):
    path = models.CharField(max_length=500, db_index=True)
    referrer = models.URLField(max_length=1000, blank=True)
    referrer_domain = models.CharField(max_length=255, blank=True, db_index=True)
    ip_hash = models.CharField(max_length=64, db_index=True)
    user_agent = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "站点访问"
        verbose_name_plural = "站点访问"
        indexes = [
            models.Index(fields=["path", "created_at"]),
            models.Index(fields=["referrer_domain", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.path} ({self.created_at:%Y-%m-%d %H:%M})"


class BarrageComment(TimeStampedModel):
    class ReviewStatus(models.TextChoices):
        PENDING = "pending", "待审核"
        APPROVED = "approved", "已通过"
        REJECTED = "rejected", "已拒绝"

    nickname = models.CharField(max_length=40, default="匿名云友")
    content = models.CharField(max_length=200)
    page_path = models.CharField(max_length=500, blank=True)
    status = models.CharField(max_length=20, choices=ReviewStatus.choices, default=ReviewStatus.PENDING, db_index=True)
    ip_hash = models.CharField(max_length=64, db_index=True)
    user_agent = models.CharField(max_length=500, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True, db_index=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_barrage_comments",
    )
    review_note = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-reviewed_at", "-created_at", "-id"]
        verbose_name = "弹幕评论"
        verbose_name_plural = "弹幕评论"
        indexes = [
            models.Index(fields=["status", "reviewed_at"]),
            models.Index(fields=["status", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.nickname}: {self.content[:24]}"


class RadarConfig(TimeStampedModel):
    key = models.SlugField(max_length=50, unique=True)
    title = models.CharField(max_length=100, verbose_name="标题")
    subtitle = models.CharField(max_length=200, blank=True, verbose_name="副标题")
    metrics = models.JSONField(
        default=list,
        verbose_name="维度数据",
        help_text='JSON数组, 每项含 {"label": "维度名", "value": 86}',
    )
    sort_order = models.PositiveIntegerField(default=0, db_index=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "key"]
        verbose_name = "雷达图配置"
        verbose_name_plural = "雷达图配置"

    def __str__(self) -> str:
        return f"{self.title} ({self.key})"

    def clean(self):
        metrics = self.metrics
        if not isinstance(metrics, list):
            raise ValidationError({"metrics": "metrics 必须是数组"})
        for idx, item in enumerate(metrics):
            if not isinstance(item, dict):
                raise ValidationError({"metrics": f"metrics[{idx}] 必须是对象"})
            label = item.get("label")
            if not isinstance(label, str) or not label.strip():
                raise ValidationError({"metrics": f"metrics[{idx}].label 必须是非空字符串"})
            value = item.get("value")
            try:
                numeric = float(value)
            except (TypeError, ValueError) as exc:
                raise ValidationError({"metrics": f"metrics[{idx}].value 必须是数字"}) from exc
            if numeric < 0 or numeric > 100:
                raise ValidationError({"metrics": f"metrics[{idx}].value 必须在 0-100 之间"})


class SectionQuote(TimeStampedModel):
    class SlotPosition(models.TextChoices):
        AFTER_MARQUEE = "after_marquee", "高光成就 → 代码项目之间"
        AFTER_GAME = "after_game", "互动游戏 → 生活之间"
        AFTER_DREAM = "after_dream", "心愿清单 → 统计之间"

    class QuoteCategory(models.TextChoices):
        TECH = "技术", "技术"
        LIFE = "生活", "生活"
        ORGANIZE = "整理", "整理"

    slot = models.CharField(max_length=30, choices=SlotPosition.choices, db_index=True)
    category = models.CharField(max_length=10, choices=QuoteCategory.choices)
    lead = models.CharField(max_length=200)
    emphasis = models.CharField(max_length=100)
    tail = models.CharField(max_length=100, blank=True, default="。")
    is_active = models.BooleanField(default=True, db_index=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["slot", "sort_order"]
        verbose_name = "散落的文字"
        verbose_name_plural = "散落的文字"
        constraints = [
            models.UniqueConstraint(
                fields=["slot"],
                condition=models.Q(is_active=True),
                name="unique_active_quote_per_slot",
            ),
        ]

    def __str__(self) -> str:
        return f"[{self.get_slot_display()}] {self.lead[:20]}"


class GithubProject(TimeStampedModel):
    name = models.CharField(max_length=255)
    full_name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    html_url = models.URLField(max_length=500)
    language = models.CharField(max_length=100, blank=True)
    topics = models.JSONField(default=list, blank=True)
    homepage_url = models.URLField(max_length=500, blank=True)
    stars_count = models.PositiveIntegerField(default=0)
    forks_count = models.PositiveIntegerField(default=0)
    open_issues_count = models.PositiveIntegerField(default=0)
    description_zh = models.TextField(blank=True, verbose_name="中文简介")
    detail_en = models.TextField(blank=True, verbose_name="英文详情")
    detail_zh = models.TextField(blank=True, verbose_name="中文详情")
    tech_stack = models.JSONField(default=list, blank=True, verbose_name="技术栈")
    is_public = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)
    cover = models.URLField(max_length=500, blank=True)
    synced_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["sort_order", "name"]
        verbose_name = "开源项目"
        verbose_name_plural = "开源项目"

    def __str__(self) -> str:
        return self.full_name


class WishItem(TimeStampedModel):
    class Priority(models.TextChoices):
        HIGH = "high", "高优先级"
        MEDIUM = "medium", "中优先级"
        LOW = "low", "低优先级"

    emoji = models.CharField(max_length=10)
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(
        max_digits=10, decimal_places=2,
        null=True, blank=True,
        verbose_name="价格(¥)"
    )
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "-priority"]
        verbose_name = "心愿清单"
        verbose_name_plural = "心愿清单"

    def __str__(self) -> str:
        return f"{self.emoji} {self.title}"


class Book(TimeStampedModel):
    class Status(models.TextChoices):
        READING = "reading", "正在读"
        FINISHED = "finished", "已读"

    title = models.CharField(max_length=200)
    author = models.CharField(max_length=200, blank=True)
    cover = models.URLField(max_length=500, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.FINISHED)
    progress = models.PositiveSmallIntegerField(default=0, help_text="正在读时的进度 0-100")
    rating = models.PositiveSmallIntegerField(null=True, blank=True, help_text="1-5 云朵评分")
    tags = models.JSONField(default=list, blank=True)
    review = models.TextField(blank=True, help_text="一句话感想（可选）")
    douban_subject_id = models.CharField(
        max_length=32, blank=True,
        help_text="豆瓣 subject ID，如 35889905；点击封面跳转用。留空则用 title 搜索",
    )
    sort_order = models.PositiveIntegerField(default=0, db_index=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "-updated_at"]
        verbose_name = "书架"
        verbose_name_plural = "书架"

    def __str__(self) -> str:
        return f"《{self.title}》 - {self.author}" if self.author else f"《{self.title}》"


class KnowledgeNode(TimeStampedModel):
    class Category(models.TextChoices):
        ENTITY = "entity", "实体"
        SOURCE = "source", "来源"
        EXPLORATION = "exploration", "探索"
        HUB = "hub", "枢纽"
        INDEX = "index", "索引"
        OTHER = "other", "其他"

    slug = models.SlugField(max_length=220, unique=True, db_index=True)
    title = models.CharField(max_length=255)
    path = models.CharField(max_length=500, unique=True)
    category = models.CharField(max_length=16, choices=Category.choices, default=Category.OTHER)
    frontmatter = models.JSONField(default=dict, blank=True)
    file_sha = models.CharField(max_length=64, db_index=True)
    git_created_at = models.DateTimeField(null=True, blank=True, db_index=True)
    git_last_modified_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    last_synced_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["git_created_at", "id"]
        verbose_name = "知识图谱节点"
        verbose_name_plural = "知识图谱节点"

    def __str__(self) -> str:
        return f"[{self.category}] {self.title}"


class KnowledgeEdge(TimeStampedModel):
    source = models.ForeignKey(KnowledgeNode, on_delete=models.CASCADE, related_name="outgoing_edges")
    target = models.ForeignKey(KnowledgeNode, on_delete=models.CASCADE, related_name="incoming_edges")
    wikilink_text = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = ("source", "target")
        verbose_name = "知识图谱边"
        verbose_name_plural = "知识图谱边"

    def __str__(self) -> str:
        return f"{self.source.slug} -> {self.target.slug}"


class WikiQuote(TimeStampedModel):
    """启云原创金句池，从 vault 金句集.md 同步而来，首页随机轮播。"""

    class Tier(models.TextChoices):
        CREED = "creed", "五信条"
        INSIGHT = "insight", "原创洞见"

    text = models.CharField(max_length=240)
    tier = models.CharField(max_length=16, choices=Tier.choices, default=Tier.INSIGHT, db_index=True)
    source = models.CharField(max_length=120, blank=True, default="", help_text="来源标注，如 WHOAMI 或 entity 文件名")
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ["tier", "sort_order", "id"]
        verbose_name = "Wiki 金句"
        verbose_name_plural = "Wiki 金句"
        constraints = [
            models.UniqueConstraint(fields=["text"], name="unique_wiki_quote_text"),
        ]

    def __str__(self) -> str:
        return f"[{self.tier}] {self.text[:40]}"
