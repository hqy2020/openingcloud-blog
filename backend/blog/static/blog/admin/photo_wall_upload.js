(function () {
  "use strict";

  function getCookie(name) {
    const parts = document.cookie ? document.cookie.split(";") : [];
    for (let i = 0; i < parts.length; i += 1) {
      const item = parts[i].trim();
      if (item.startsWith(name + "=")) {
        return decodeURIComponent(item.slice(name.length + 1));
      }
    }
    return "";
  }

  function resolveUploadUrl(pathname) {
    if (/\/add\/$/.test(pathname)) {
      return pathname.replace(/\/add\/$/, "/upload-image/");
    }
    if (/\/\d+\/change\/$/.test(pathname)) {
      return pathname.replace(/\/\d+\/change\/$/, "/upload-image/");
    }
    return "";
  }

  function isPhotoWallChangeForm() {
    const body = document.body;
    return (
      body.classList.contains("app-blog") &&
      body.classList.contains("model-photowallimage") &&
      body.classList.contains("change-form")
    );
  }

  function withDimensions(file, widthInput, heightInput) {
    if (!widthInput || !heightInput || !file || !file.type.startsWith("image/")) {
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = function () {
      if (!widthInput.value) {
        widthInput.value = String(image.naturalWidth || "");
      }
      if (!heightInput.value) {
        heightInput.value = String(image.naturalHeight || "");
      }
      URL.revokeObjectURL(objectUrl);
    };
    image.onerror = function () {
      URL.revokeObjectURL(objectUrl);
    };
    image.src = objectUrl;
  }

  function init() {
    if (!isPhotoWallChangeForm()) {
      return;
    }

    const imageInput = document.getElementById("id_image_url");
    if (!imageInput) {
      return;
    }

    const imageRow = imageInput.closest(".form-row") || imageInput.closest("div");
    if (!imageRow || !imageRow.parentNode) {
      return;
    }

    const sourceInput = document.getElementById("id_source_url");
    const widthInput = document.getElementById("id_width");
    const heightInput = document.getElementById("id_height");
    const uploadUrl = resolveUploadUrl(window.location.pathname);
    if (!uploadUrl) {
      return;
    }

    const panel = document.createElement("div");
    panel.className = "photo-wall-upload-panel";
    panel.innerHTML =
      '<div class="photo-wall-upload-dropzone" role="button" tabindex="0">' +
      '<div class="photo-wall-upload-title">拖拽图片到这里上传到图床</div>' +
      '<div class="photo-wall-upload-subtitle">或点击选择文件（jpg / png / webp，最大 8MB）</div>' +
      "</div>" +
      '<div class="photo-wall-upload-status" aria-live="polite"></div>' +
      '<div class="photo-wall-upload-preview"><img alt="预览图" /></div>';

    imageRow.parentNode.insertBefore(panel, imageRow);

    const dropzone = panel.querySelector(".photo-wall-upload-dropzone");
    const statusNode = panel.querySelector(".photo-wall-upload-status");
    const previewNode = panel.querySelector(".photo-wall-upload-preview");
    const previewImg = previewNode ? previewNode.querySelector("img") : null;

    const picker = document.createElement("input");
    picker.type = "file";
    picker.accept = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";
    picker.style.display = "none";
    panel.appendChild(picker);

    function setStatus(text, isError) {
      if (!statusNode) return;
      statusNode.textContent = text || "";
      statusNode.classList.toggle("error", Boolean(isError));
    }

    function setPreview(src) {
      if (!previewImg || !previewNode) return;
      if (!src) {
        previewNode.classList.remove("ready");
        previewImg.removeAttribute("src");
        return;
      }
      previewImg.src = src;
      previewNode.classList.add("ready");
    }

    async function uploadFile(file) {
      if (!file) return;
      const allowedByType = /^image\/(jpeg|png|webp)$/.test(file.type || "");
      const allowedByName = /\.(jpe?g|png|webp)$/i.test(file.name || "");
      if (!allowedByType && !allowedByName) {
        setStatus("仅支持 jpg/png/webp 格式", true);
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        setStatus("图片大小不能超过 8MB", true);
        return;
      }

      setStatus("上传中...", false);
      dropzone.classList.add("uploading");

      const formData = new FormData();
      formData.append("file", file, file.name || "photo");

      try {
        const response = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
          credentials: "same-origin",
          headers: {
            "X-CSRFToken": getCookie("csrftoken"),
            "X-Requested-With": "XMLHttpRequest",
          },
        });

        let payload = null;
        try {
          payload = await response.json();
        } catch (_error) {
          payload = null;
        }

        if (!response.ok || !payload || payload.ok !== true) {
          throw new Error((payload && payload.message) || "上传失败，请稍后重试");
        }

        const data = payload.data || {};
        imageInput.value = data.image_url || "";
        if (sourceInput && data.source_url) {
          sourceInput.value = data.source_url;
        }
        setPreview(data.image_url || "");
        withDimensions(file, widthInput, heightInput);
        setStatus("上传成功，已自动填写图片链接", false);
      } catch (error) {
        const message = error instanceof Error ? error.message : "上传失败";
        setStatus(message, true);
      } finally {
        dropzone.classList.remove("uploading");
      }
    }

    dropzone.addEventListener("click", function () {
      picker.click();
    });
    dropzone.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        picker.click();
      }
    });

    ["dragenter", "dragover"].forEach(function (eventName) {
      dropzone.addEventListener(eventName, function (event) {
        event.preventDefault();
        event.stopPropagation();
        dropzone.classList.add("dragover");
      });
    });

    ["dragleave", "drop"].forEach(function (eventName) {
      dropzone.addEventListener(eventName, function (event) {
        event.preventDefault();
        event.stopPropagation();
        dropzone.classList.remove("dragover");
      });
    });

    dropzone.addEventListener("drop", function (event) {
      const files = event.dataTransfer && event.dataTransfer.files;
      if (files && files.length > 0) {
        uploadFile(files[0]);
      }
    });

    picker.addEventListener("change", function () {
      if (picker.files && picker.files.length > 0) {
        uploadFile(picker.files[0]);
      }
      picker.value = "";
    });

    if (imageInput.value) {
      setPreview(imageInput.value);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
