import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { PhotoWallItem } from "../../api/home";
import { ScrollReveal } from "../motion/ScrollReveal";
import { PhotoPreviewModal } from "./photo-wall/PhotoPreviewModal";
import { PhotoWall3DCarousel } from "./photo-wall/PhotoWall3DCarousel";
import { PhotoWallGridFallback } from "./photo-wall/PhotoWallGridFallback";
import { canUseWebGL, preparePhotoItems, type PhotoWallRenderItem } from "./photo-wall/photoWallUtils";

type PhotoWallSectionProps = {
  photos: PhotoWallItem[];
};

type PhotoPreviewState = {
  open: boolean;
  item: PhotoWallRenderItem | null;
};

export function PhotoWallSection({ photos }: PhotoWallSectionProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [coarsePointer, setCoarsePointer] = useState(false);
  const [previewState, setPreviewState] = useState<PhotoPreviewState>({
    open: false,
    item: null,
  });

  const hasWebGL = useMemo(() => canUseWebGL(), []);
  const { baseItems, renderItems } = useMemo(() => preparePhotoItems(photos), [photos]);
  const canRender3D = hasWebGL && !prefersReducedMotion && !coarsePointer && renderItems.length > 0;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const media = window.matchMedia("(hover: none), (pointer: coarse)");
    const sync = () => {
      setCoarsePointer(media.matches);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const previewItem =
    previewState.item && baseItems.some((item) => item.__baseId === previewState.item?.__baseId) ? previewState.item : null;
  const previewOpen = previewState.open && Boolean(previewItem);

  const openPreview = (item: PhotoWallRenderItem) => {
    setPreviewState({ open: true, item });
  };

  const closePreview = () => {
    setPreviewState((prev) => ({ ...prev, open: false, item: null }));
  };

  return (
    <ScrollReveal className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">照片墙</h2>
        <span className="text-sm text-slate-500">照片数量：{baseItems.length} 张</span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.08)] backdrop-blur sm:p-5">
        <div className="pointer-events-none absolute -left-6 top-8 h-28 w-28 rounded-full bg-sky-100/70 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-8 right-6 h-32 w-32 rounded-full bg-emerald-100/60 blur-2xl" />

        {canRender3D ? (
          <PhotoWall3DCarousel photos={renderItems} onPreview={openPreview} />
        ) : (
          <PhotoWallGridFallback photos={baseItems} onPreview={openPreview} />
        )}
      </div>

      <PhotoPreviewModal item={previewItem} onClose={closePreview} open={previewOpen} />
    </ScrollReveal>
  );
}
