import type { PhotoWallItem } from "../../../api/home";

export const OBSIDIAN_IMAGES_REPO_URL = "https://github.com/hqy2020/obsidian-images";
export const MINIMUM_RING_CARD_COUNT = 8;

export type PhotoWallRenderItem = PhotoWallItem & {
  __baseId: string;
  __baseIndex: number;
  __instanceId: string;
  __normalizedImageUrl: string;
  __normalizedSourceUrl: string;
};

export function normalizeRemoteUrl(url: string, fallback = "") {
  const text = String(url || "").trim();
  if (!text) {
    return fallback;
  }
  const prefix = "https://github.com/hqy2020/obsidian-images/blob/";
  if (text.startsWith(prefix)) {
    return `https://raw.githubusercontent.com/hqy2020/obsidian-images/${text.slice(prefix.length)}`;
  }
  return text;
}

function compareCapturedAtDesc(left: string | null, right: string | null) {
  if (left && right) {
    return right.localeCompare(left);
  }
  if (left && !right) {
    return -1;
  }
  if (!left && right) {
    return 1;
  }
  return 0;
}

export function preparePhotoItems(photos: PhotoWallItem[]) {
  const normalized = photos
    .map((item) => {
      const normalizedImageUrl = normalizeRemoteUrl(item.image_url);
      const normalizedSourceUrl = normalizeRemoteUrl(item.source_url || OBSIDIAN_IMAGES_REPO_URL, OBSIDIAN_IMAGES_REPO_URL);
      return {
        ...item,
        __normalizedImageUrl: normalizedImageUrl,
        __normalizedSourceUrl: normalizedSourceUrl,
      };
    })
    .filter((item) => item.__normalizedImageUrl)
    .sort((a, b) => {
      const byOrder = a.sort_order - b.sort_order;
      if (byOrder !== 0) {
        return byOrder;
      }
      const byCapturedAt = compareCapturedAtDesc(a.captured_at, b.captured_at);
      if (byCapturedAt !== 0) {
        return byCapturedAt;
      }
      return a.__normalizedImageUrl.localeCompare(b.__normalizedImageUrl);
    });

  const sameFingerprintCounter = new Map<string, number>();
  const baseItems: PhotoWallRenderItem[] = normalized.map((item, index) => {
    const fingerprint = `${item.__normalizedImageUrl}|${item.title}|${item.captured_at || ""}|${item.sort_order}`;
    const sequence = (sameFingerprintCounter.get(fingerprint) ?? 0) + 1;
    sameFingerprintCounter.set(fingerprint, sequence);
    const baseId = sequence === 1 ? fingerprint : `${fingerprint}#${sequence}`;

    return {
      ...item,
      image_url: item.__normalizedImageUrl,
      source_url: item.__normalizedSourceUrl,
      __baseId: baseId,
      __baseIndex: index,
      __instanceId: `${baseId}::0`,
    };
  });

  const renderItems: PhotoWallRenderItem[] = baseItems.map((item) => ({ ...item }));
  if (renderItems.length > 0 && renderItems.length < MINIMUM_RING_CARD_COUNT) {
    const duplicateCounter = new Map<string, number>();
    let cursor = 0;
    while (renderItems.length < MINIMUM_RING_CARD_COUNT) {
      const source = baseItems[cursor % baseItems.length];
      const duplicateIndex = (duplicateCounter.get(source.__baseId) ?? 0) + 1;
      duplicateCounter.set(source.__baseId, duplicateIndex);
      renderItems.push({
        ...source,
        __instanceId: `${source.__baseId}::dup${duplicateIndex}`,
      });
      cursor += 1;
    }
  }

  return { baseItems, renderItems };
}

export function canUseWebGL() {
  if (typeof document === "undefined") {
    return false;
  }
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}
