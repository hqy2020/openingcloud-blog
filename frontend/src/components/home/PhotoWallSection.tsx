import { useMemo, useState } from "react";
import type { PhotoWallItem } from "../../api/home";
import { ScrollReveal } from "../motion/ScrollReveal";

type PhotoWallSectionProps = {
  photos: PhotoWallItem[];
};

const OBSIDIAN_IMAGES_REPO_URL = "https://github.com/hqy2020/obsidian-images";
const IMMICH_REFERENCE_URL = "https://github.com/immich-app/immich";

function normalizeRemoteUrl(url: string) {
  const text = String(url || "").trim();
  const prefix = "https://github.com/hqy2020/obsidian-images/blob/";
  if (text.startsWith(prefix)) {
    return `https://raw.githubusercontent.com/hqy2020/obsidian-images/${text.slice(prefix.length)}`;
  }
  return text;
}

function formatCapturedAt(value: string | null) {
  if (!value) {
    return "未记录时间";
  }
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }
  return `${year}.${month}.${day}`;
}

export function PhotoWallSection({ photos }: PhotoWallSectionProps) {
  const [brokenSet, setBrokenSet] = useState<Set<string>>(new Set());

  const orderedPhotos = useMemo(() => {
    return [...photos]
      .map((item, index) => ({
        ...item,
        __id: `${item.image_url}-${index}`,
        image_url: normalizeRemoteUrl(item.image_url),
        source_url: normalizeRemoteUrl(item.source_url || OBSIDIAN_IMAGES_REPO_URL),
      }))
      .sort((a, b) => {
        const byOrder = a.sort_order - b.sort_order;
        if (byOrder !== 0) {
          return byOrder;
        }
        if (a.captured_at && b.captured_at) {
          return b.captured_at.localeCompare(a.captured_at);
        }
        return 0;
      });
  }, [photos]);

  const markBroken = (id: string) => {
    setBrokenSet((prev) => {
      if (prev.has(id)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  return (
    <ScrollReveal className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">照片墙</h2>
        <span className="text-sm text-slate-500">Immich 风格瀑布流 · 共 {orderedPhotos.length} 张</span>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="mb-4 flex flex-wrap gap-2">
          <a
            className="inline-flex items-center rounded-full border border-slate-300 bg-white/85 px-3 py-1 text-xs text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            href={OBSIDIAN_IMAGES_REPO_URL}
            rel="noreferrer"
            target="_blank"
          >
            主图床仓库（Obsidian Images）
          </a>
          <a
            className="inline-flex items-center rounded-full border border-slate-300 bg-white/85 px-3 py-1 text-xs text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            href={IMMICH_REFERENCE_URL}
            rel="noreferrer"
            target="_blank"
          >
            前端参考（Immich）
          </a>
        </div>

        {orderedPhotos.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-6 text-sm text-slate-600">
            暂无照片数据，请在后台新增远程图片链接。
          </div>
        ) : (
          <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
            {orderedPhotos.map((photo, index) => {
              const broken = brokenSet.has(photo.__id);
              return (
                <article
                  key={photo.__id}
                  className="group mb-3 break-inside-avoid overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/70"
                >
                  {broken ? (
                    <div className="aspect-[4/3] w-full bg-[radial-gradient(circle_at_20%_20%,rgba(79,106,229,0.28),transparent_52%),linear-gradient(160deg,#e2e8f0,#f8fafc)]" />
                  ) : (
                    <img
                      alt={photo.title || `照片 ${index + 1}`}
                      className="h-auto w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      decoding="async"
                      loading="lazy"
                      onError={() => markBroken(photo.__id)}
                      referrerPolicy="no-referrer"
                      src={photo.image_url}
                    />
                  )}
                  <div className="space-y-1.5 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-sm font-medium text-slate-900">{photo.title || `照片 ${index + 1}`}</h3>
                      <time className="shrink-0 text-[11px] text-slate-500">{formatCapturedAt(photo.captured_at)}</time>
                    </div>
                    {photo.description ? <p className="text-xs text-slate-600">{photo.description}</p> : null}
                    <a
                      className="inline-flex text-xs text-sky-700 transition hover:text-sky-800"
                      href={photo.source_url || OBSIDIAN_IMAGES_REPO_URL}
                      rel="noreferrer"
                      target="_blank"
                    >
                      查看源图
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </ScrollReveal>
  );
}
