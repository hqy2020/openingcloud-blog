from __future__ import annotations

import base64
import json
from dataclasses import dataclass
from pathlib import Path
from urllib import error, request
from uuid import uuid4

from django.conf import settings
from django.utils import timezone


class ImageBedUploadError(ValueError):
    pass


@dataclass(frozen=True)
class UploadedImageResult:
    image_url: str
    source_url: str
    path: str
    sha: str


def _ensure_repo_config() -> tuple[str, str, str, str, str]:
    token = str(getattr(settings, "OBSIDIAN_IMAGES_GITHUB_TOKEN", "")).strip()
    owner = str(getattr(settings, "OBSIDIAN_IMAGES_REPO_OWNER", "hqy2020")).strip()
    repo = str(getattr(settings, "OBSIDIAN_IMAGES_REPO_NAME", "obsidian-images")).strip()
    branch = str(getattr(settings, "OBSIDIAN_IMAGES_REPO_BRANCH", "main")).strip()
    prefix = str(getattr(settings, "OBSIDIAN_IMAGES_REPO_PREFIX", "gallery")).strip().strip("/")

    if not token:
        raise ImageBedUploadError("未配置 OBSIDIAN_IMAGES_GITHUB_TOKEN，无法上传到图床")
    if not owner or not repo or not branch:
        raise ImageBedUploadError("图床仓库配置不完整，请检查 OBSIDIAN_IMAGES_REPO_* 环境变量")

    return token, owner, repo, branch, prefix


def _resolve_suffix(filename: str, content_type: str) -> str:
    suffix = Path(str(filename or "")).suffix.lower()
    if suffix:
        return suffix

    content_type = str(content_type or "").lower()
    mapping = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }
    return mapping.get(content_type, ".bin")


def _upload_via_github_api(*, token: str, owner: str, repo: str, branch: str, path: str, content: bytes, message: str) -> dict:
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
    payload = {
        "message": message,
        "content": base64.b64encode(content).decode("ascii"),
        "branch": branch,
    }

    committer_name = str(getattr(settings, "OBSIDIAN_IMAGES_COMMITTER_NAME", "")).strip()
    committer_email = str(getattr(settings, "OBSIDIAN_IMAGES_COMMITTER_EMAIL", "")).strip()
    if committer_name and committer_email:
        payload["committer"] = {"name": committer_name, "email": committer_email}

    data = json.dumps(payload).encode("utf-8")
    req = request.Request(
        url=url,
        data=data,
        method="PUT",
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "User-Agent": "openingclouds-photo-wall-uploader",
        },
    )

    try:
        with request.urlopen(req, timeout=30) as resp:
            body = resp.read()
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise ImageBedUploadError(f"图床上传失败（HTTP {exc.code}）: {detail or exc.reason}") from exc
    except Exception as exc:  # noqa: BLE001
        raise ImageBedUploadError(f"图床上传失败: {exc}") from exc

    try:
        return json.loads(body.decode("utf-8"))
    except Exception as exc:  # noqa: BLE001
        raise ImageBedUploadError("图床上传响应解析失败") from exc


def upload_photo_to_obsidian_images(upload, *, operator: str = "") -> UploadedImageResult:
    token, owner, repo, branch, prefix = _ensure_repo_config()

    content = upload.read()
    if not content:
        raise ImageBedUploadError("上传文件为空")

    suffix = _resolve_suffix(getattr(upload, "name", ""), getattr(upload, "content_type", ""))
    now = timezone.now()
    target_path = f"{prefix}/{now:%Y/%m}/{uuid4().hex}{suffix}" if prefix else f"{now:%Y/%m}/{uuid4().hex}{suffix}"
    message = f"chore(photo-wall): upload {target_path}"
    if operator:
        message = f"{message} by {operator}"

    payload = _upload_via_github_api(
        token=token,
        owner=owner,
        repo=repo,
        branch=branch,
        path=target_path,
        content=content,
        message=message,
    )

    content_info = payload.get("content") if isinstance(payload, dict) else None
    actual_path = str((content_info or {}).get("path") or target_path).strip()
    sha = str((content_info or {}).get("sha") or "").strip()
    image_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{actual_path}"
    source_url = f"https://github.com/{owner}/{repo}/blob/{branch}/{actual_path}"
    return UploadedImageResult(
        image_url=image_url,
        source_url=source_url,
        path=actual_path,
        sha=sha,
    )
