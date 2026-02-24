import { useState, type CSSProperties } from "react";
import type { PhotoWallRenderItem } from "./photoWallUtils";

type PhotoWallGridFallbackProps = {
  photos: PhotoWallRenderItem[];
  onPreview: (item: PhotoWallRenderItem) => void;
};

const LEAF_LAYOUT_PRESETS = [
  { x: -16, y: 8, rotate: -6, scale: 0.98, rowSpan: 2 },
  { x: 10, y: -8, rotate: 5, scale: 1.01, rowSpan: 1 },
  { x: -9, y: 10, rotate: -4, scale: 1, rowSpan: 1 },
  { x: 14, y: -6, rotate: 6, scale: 0.97, rowSpan: 2 },
  { x: -12, y: -10, rotate: -7, scale: 1.02, rowSpan: 1 },
  { x: 8, y: 7, rotate: 4, scale: 0.99, rowSpan: 2 },
] as const;

export function PhotoWallGridFallback({ photos, onPreview }: PhotoWallGridFallbackProps) {
  const [brokenSet, setBrokenSet] = useState<Set<string>>(new Set());

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

  if (photos.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-6 text-sm text-slate-600">
        暂无照片数据，请在后台新增远程图片链接。
      </div>
    );
  }

  return (
    <div className="max-h-[380px] overflow-y-auto pr-1 sm:max-h-[420px]">
      <div className="relative grid auto-rows-[100px] grid-cols-2 gap-3 pb-3 sm:auto-rows-[110px] sm:grid-cols-3 lg:auto-rows-[120px] lg:grid-cols-4">
        {photos.map((photo, index) => {
          const broken = brokenSet.has(photo.__instanceId);
          const leaf = LEAF_LAYOUT_PRESETS[index % LEAF_LAYOUT_PRESETS.length];
          const leafStyle: CSSProperties = {
            ["--leaf-x" as string]: `${leaf.x}px`,
            ["--leaf-y" as string]: `${leaf.y}px`,
            ["--leaf-r" as string]: `${leaf.rotate}deg`,
            ["--leaf-s" as string]: String(leaf.scale),
            gridRowEnd: `span ${leaf.rowSpan}`,
          };
          return (
            <button
              key={photo.__instanceId}
              className="group block overflow-hidden rounded-2xl border border-white/80 bg-white/85 shadow-[0_12px_24px_rgba(15,23,42,0.14)] transition-[transform,box-shadow] duration-300 [transform:translate(var(--leaf-x),var(--leaf-y))_rotate(var(--leaf-r))_scale(var(--leaf-s))] hover:z-20 hover:[transform:translate(0px,0px)_rotate(0deg)_scale(1.02)] hover:shadow-[0_20px_30px_rgba(15,23,42,0.2)]"
              onClick={() => onPreview(photo)}
              style={leafStyle}
              type="button"
            >
              {broken ? (
                <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(79,106,229,0.28),transparent_52%),linear-gradient(160deg,#e2e8f0,#f8fafc)]" />
              ) : (
                <img
                  alt={photo.title || `照片 ${index + 1}`}
                  className="h-full w-full object-cover transition duration-300"
                  decoding="async"
                  loading="lazy"
                  onError={() => markBroken(photo.__instanceId)}
                  referrerPolicy="no-referrer"
                  src={photo.__normalizedImageUrl}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
