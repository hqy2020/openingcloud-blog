import { useEffect } from "react";
import { createPortal } from "react-dom";
import { OBSIDIAN_IMAGES_REPO_URL, type PhotoWallRenderItem } from "./photoWallUtils";

type PhotoPreviewModalProps = {
  open: boolean;
  item: PhotoWallRenderItem | null;
  onClose: () => void;
};

export function PhotoPreviewModal({ open, item, onClose }: PhotoPreviewModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [open, onClose]);

  if (!open || !item) {
    return null;
  }

  const sourceUrl = item.__normalizedSourceUrl || OBSIDIAN_IMAGES_REPO_URL;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/72 px-4 py-6 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={item.title ? `预览：${item.title}` : "照片预览"}
    >
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/20 bg-slate-950 shadow-[0_24px_54px_rgba(15,23,42,0.4)]">
        <button
          aria-label="关闭照片预览"
          className="absolute right-3 top-3 z-10 rounded-full bg-slate-950/65 p-2 text-white transition hover:bg-slate-950/80"
          onClick={onClose}
          type="button"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 0 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>

        <div className="max-h-[80vh] min-h-[280px] bg-slate-950 flex items-center justify-center">
          <img
            alt={item.title || "照片预览"}
            className="max-h-[80vh] w-full object-contain"
            decoding="async"
            loading="eager"
            referrerPolicy="no-referrer"
            src={item.__normalizedImageUrl}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
