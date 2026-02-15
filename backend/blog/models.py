from __future__ import annotations

from django.conf import settings
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

    class Meta:
        ordering = ["sort_order", "province", "city"]
        unique_together = ("province", "city")
        verbose_name = "旅行足迹"
        verbose_name_plural = "旅行足迹"

    def __str__(self) -> str:
        return f"{self.province}-{self.city}"


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

    name = models.CharField(max_length=100)
    public_label = models.CharField(max_length=100)
    relation = models.CharField(max_length=100, blank=True)
    stage_key = models.CharField(max_length=20, choices=StageKey.choices, default=StageKey.CAREER)
    honorific = models.CharField(max_length=10, choices=Honorific.choices, default=Honorific.MR)
    avatar = models.URLField(max_length=500, blank=True)
    profile_url = models.URLField(max_length=500, blank=True)
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
