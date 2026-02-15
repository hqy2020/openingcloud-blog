import { useMemo, useState, type CSSProperties } from "react";
import type { PhotoWallItem } from "../../api/home";
import { ScrollReveal } from "../motion/ScrollReveal";

type PhotoWallSectionProps = {
  photos: PhotoWallItem[];
};

const OBSIDIAN_IMAGES_REPO_URL = "https://github.com/hqy2020/obsidian-images";

const LEAF_LAYOUT_PRESETS = [
  { x: -16, y: 8, rotate: -6, scale: 0.98, marginTop: 8 },
  { x: 10, y: -8, rotate: 5, scale: 1.01, marginTop: 18 },
  { x: -9, y: 10, rotate: -4, scale: 1, marginTop: 2 },
  { x: 14, y: -6, rotate: 6, scale: 0.97, marginTop: 16 },
  { x: -12, y: -10, rotate: -7, scale: 1.02, marginTop: 10 },
  { x: 8, y: 7, rotate: 4, scale: 0.99, marginTop: 4 },
] as const;

function normalizeRemoteUrl(url: string) {
  const text = String(url || "").trim();
  const prefix = "https://github.com/hqy2020/obsidian-images/blob/";
  if (text.startsWith(prefix)) {
    return `https://raw.githubusercontent.com/hqy2020/obsidian-images/${text.slice(prefix.length)}`;
  }
  return text;
}

export function PhotoWallSection({ photos }: PhotoWallSectionProps) {
  const [brokenSet, setBrokenSet] = useState<Set<string>>(new Set());

  const orderedPhotos = useMemo(() => {
    return [...photos]
      .map((item) => ({
        ...item,
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
      })
      .map((item, index) => ({
        ...item,
        __id: `${item.image_url}-${index}`,
        __leaf: LEAF_LAYOUT_PRESETS[index % LEAF_LAYOUT_PRESETS.length],
      }));
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
        <span className="text-sm text-slate-500">照片数量：{orderedPhotos.length} 张</span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.08)] backdrop-blur sm:p-5">
        <div className="pointer-events-none absolute -left-6 top-8 h-28 w-28 rounded-full bg-sky-100/70 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-8 right-6 h-32 w-32 rounded-full bg-emerald-100/60 blur-2xl" />
        {orderedPhotos.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-6 text-sm text-slate-600">
            暂无照片数据，请在后台新增远程图片链接。
          </div>
        ) : (
          <div className="relative columns-2 gap-4 sm:columns-3 lg:columns-4">
            {orderedPhotos.map((photo, index) => {
              const broken = brokenSet.has(photo.__id);
              const leafStyle: CSSProperties = {
                marginTop: `${photo.__leaf.marginTop}px`,
                ["--leaf-x" as string]: `${photo.__leaf.x}px`,
                ["--leaf-y" as string]: `${photo.__leaf.y}px`,
                ["--leaf-r" as string]: `${photo.__leaf.rotate}deg`,
                ["--leaf-s" as string]: String(photo.__leaf.scale),
              };
              return (
                <a
                  key={photo.__id}
                  className="group mb-5 block break-inside-avoid overflow-hidden rounded-2xl border border-white/80 bg-white/85 shadow-[0_16px_32px_rgba(15,23,42,0.16)] transition-[transform,box-shadow] duration-300 [transform:translate(var(--leaf-x),var(--leaf-y))_rotate(var(--leaf-r))_scale(var(--leaf-s))] hover:z-20 hover:[transform:translate(0px,0px)_rotate(0deg)_scale(1.03)] hover:shadow-[0_24px_40px_rgba(15,23,42,0.24)]"
                  href={photo.source_url || OBSIDIAN_IMAGES_REPO_URL}
                  rel="noreferrer"
                  style={leafStyle}
                  target="_blank"
                >
                  {broken ? (
                    <div className="aspect-[4/5] w-full bg-[radial-gradient(circle_at_20%_20%,rgba(79,106,229,0.28),transparent_52%),linear-gradient(160deg,#e2e8f0,#f8fafc)]" />
                  ) : (
                    <img
                      alt={photo.title || `照片 ${index + 1}`}
                      className="h-auto w-full object-cover transition duration-300"
                      decoding="async"
                      loading="lazy"
                      onError={() => markBroken(photo.__id)}
                      referrerPolicy="no-referrer"
                      src={photo.image_url}
                    />
                  )}
                </a>
              );
            })}
          </div>
        )}
      </div>
    </ScrollReveal>
  );
}
