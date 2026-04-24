import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { PhotoWallItem } from "../../api/home";
import { ScrollReveal } from "../motion/ScrollReveal";
import { SectionTitleCard } from "../revamp/shared/SectionTitleCard";
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
    <ScrollReveal className="space-y-4">
      <SectionTitleCard
        category="Photo"
        title="照片墙"
        accentColor="#c96442"
        tagline="用镜头留住每一个值得被记住的瞬间。"
      />

      <div className="relative overflow-hidden rounded-2xl border border-theme-line/80 bg-theme-surface p-4 shadow-[var(--theme-shadow-whisper)] sm:p-5">
        <div className="pointer-events-none absolute -left-6 top-8 h-28 w-28 rounded-full bg-theme-surface-raised blur-2xl" />
        <div className="pointer-events-none absolute -bottom-8 right-6 h-32 w-32 rounded-full bg-theme-surface-raised blur-2xl" />

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
