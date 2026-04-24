import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLocation } from "react-router-dom";
import { fetchBarrageComments, submitBarrageComment, type BarrageComment } from "../../api/barrage";

type FloatingControlPosition = {
  y: number;
};

type DragState = {
  pointerId: number;
  startY: number;
  originY: number;
};

const FLOATING_CONTROL_MIN_TOP = 88;
const FLOATING_CONTROL_HEIGHT = 40;
const COLLAPSED_WIDTH = 44;
const EXPANDED_WIDTH = 360;
const FLOATING_CONTROL_STORAGE_KEY = "openingcloud_barrage_control_pos_v1";
const defaultFloatingControlPosition: FloatingControlPosition = { y: 96 };

function formatErrorMessage(err: unknown, fallback: string): string {
  const rawMessage = err instanceof Error ? err.message : fallback;
  if (/404/.test(rawMessage)) {
    return "弹幕服务暂不可用（404），请检查 /api/barrage-comments/ 接口。";
  }
  return rawMessage;
}

function BarrageCard({ item }: { item: BarrageComment }) {
  return (
    <article className="rounded-xl border border-theme-line bg-theme-surface-raised px-3 py-2.5">
      <p className="break-words text-sm leading-5 text-theme-ink">{item.content}</p>
      <time className="mt-2 block text-[10px] text-theme-soft">{item.created_at.slice(0, 16).replace("T", " ")}</time>
    </article>
  );
}

export function BarrageCommentsSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [controlPosition, setControlPosition] = useState<FloatingControlPosition>(defaultFloatingControlPosition);
  const [comments, setComments] = useState<BarrageComment[]>([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();
  const dragStateRef = useRef<DragState | null>(null);
  const movedRef = useRef(false);
  const prefersReducedMotion = useReducedMotion() ?? false;

  const clampControlPosition = useCallback((y: number): FloatingControlPosition => {
    if (typeof window === "undefined") {
      return defaultFloatingControlPosition;
    }

    const maxY = Math.max(FLOATING_CONTROL_MIN_TOP, window.innerHeight - FLOATING_CONTROL_HEIGHT - 12);
    return {
      y: Math.min(Math.max(FLOATING_CONTROL_MIN_TOP, y), maxY),
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(FLOATING_CONTROL_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as Partial<FloatingControlPosition>;
      if (typeof parsed.y === "number") {
        setControlPosition(clampControlPosition(parsed.y));
      }
    } catch {
      // ignore invalid cached position
    }
  }, [clampControlPosition]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(FLOATING_CONTROL_STORAGE_KEY, JSON.stringify(controlPosition));
    } catch {
      // ignore write errors
    }
  }, [controlPosition]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setControlPosition((current) => clampControlPosition(current.y));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clampControlPosition]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const rows = await fetchBarrageComments(60);
        if (!active) return;
        setComments(rows);
      } catch (err) {
        if (!active) return;
        setError(formatErrorMessage(err, "弹幕加载失败"));
      }
    };

    void load();
    const timerId = window.setInterval(() => {
      void load();
    }, 60_000);

    return () => {
      active = false;
      window.clearInterval(timerId);
    };
  }, []);

  const upsertComment = useCallback((nextComment: BarrageComment) => {
    setComments((current) => [nextComment, ...current.filter((item) => item.id !== nextComment.id)].slice(0, 80));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setError("请输入评论内容");
      return;
    }

    setSubmitting(true);
    try {
      const submitResult = await submitBarrageComment({
        content: trimmedContent,
        page_path: location.pathname,
      });
      const now = new Date().toISOString();
      upsertComment(
        submitResult.comment ?? {
          id: submitResult.id,
          nickname: "匿名云友",
          content: trimmedContent,
          created_at: now,
          reviewed_at: now,
        },
      );
      setContent("");
      setNotice("已发布，正在滚动展示。");
    } catch (err) {
      setError(formatErrorMessage(err, "提交失败，请稍后重试"));
    } finally {
      setSubmitting(false);
    }
  }

  function onControlPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (isOpen) {
      return;
    }
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      originY: controlPosition.y,
    };
    movedRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onControlPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaY = event.clientY - dragState.startY;
    if (Math.abs(deltaY) > 4) {
      movedRef.current = true;
    }

    setControlPosition(clampControlPosition(dragState.originY + deltaY));
  }

  function onControlPointerUpOrCancel(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    dragStateRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function onTogglePanel() {
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }
    setIsOpen((open) => !open);
  }

  const panelMaxHeight = `calc(100vh - ${Math.max(controlPosition.y + 12, FLOATING_CONTROL_MIN_TOP + 12)}px)`;

  return (
    <motion.aside
      className={`fixed left-0 z-30 max-w-[calc(100vw-0.75rem)] overflow-hidden rounded-r-[var(--theme-radius)] border border-theme-line bg-theme-surface-raised/90 backdrop-blur-sm ${
        isOpen
          ? "shadow-[var(--theme-shadow-lifted)]"
          : "shadow-[var(--theme-shadow-whisper)]"
      }`}
      style={{ top: `${controlPosition.y}px`, maxHeight: panelMaxHeight }}
      animate={{ width: isOpen ? EXPANDED_WIDTH : COLLAPSED_WIDTH, opacity: isOpen ? 1 : 0.78 }}
      whileHover={{ opacity: 1 }}
      initial={false}
      transition={{ duration: prefersReducedMotion ? 0 : 0.28, ease: [0.42, 0, 0.58, 1] }}
    >
      <div
        className="flex items-center justify-center p-1.5"
        onPointerDown={onControlPointerDown}
        onPointerMove={onControlPointerMove}
        onPointerUp={onControlPointerUpOrCancel}
        onPointerCancel={onControlPointerUpOrCancel}
        onClick={onTogglePanel}
        style={{ cursor: isOpen ? "pointer" : "grab" }}
      >
        <button
          type="button"
          aria-label={isOpen ? "收起弹幕" : "打开弹幕"}
          title={isOpen ? "收起弹幕" : "弹幕 · 拖动换位置"}
          className="group inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-full bg-transparent text-theme-muted transition-colors hover:text-theme-accent"
        >
          <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2H11l-4 3v-3H6.5a2 2 0 0 1-2-2v-7.5Z" />
          </svg>
          {isOpen ? (
            <span className="whitespace-nowrap text-xs font-medium leading-none">弹幕</span>
          ) : null}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            className="flex max-h-[calc(100vh-8rem)] flex-col border-t border-theme-line"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -8 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: "easeOut" }}
          >
            <div className="border-b border-theme-line px-4 py-3">
              <p className="text-sm font-semibold text-theme-ink">弹幕评论</p>
              <p className="mt-0.5 text-xs text-theme-muted">发布后立即滚动展示</p>
            </div>

            <div className="border-b border-theme-line px-4 py-3">
              <form className="space-y-2.5" onSubmit={onSubmit}>
                <textarea
                  className="min-h-[96px] w-full resize-none rounded-xl border border-theme-line bg-theme-surface-raised px-3 py-2 text-sm text-theme-ink outline-none transition placeholder:text-theme-soft focus:border-theme-soft"
                  maxLength={200}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="说点什么..."
                  value={content}
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-theme-soft">{content.trim().length}/200</span>
                  <button
                    className="rounded-xl bg-theme-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-theme-accent/85 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={submitting}
                    type="submit"
                  >
                    {submitting ? "提交中..." : "发布评论"}
                  </button>
                </div>
                {notice ? <p className="text-xs text-emerald-600">{notice}</p> : null}
                {error ? <p className="text-xs text-rose-500">{error}</p> : null}
              </form>
            </div>

            <div className="barrage-sidebar-viewport flex-1 px-4 py-3">
              {comments.length === 0 ? (
                <p className="text-xs text-theme-muted">暂无弹幕，欢迎第一个留言。</p>
              ) : (
                <div className="barrage-sidebar-track barrage-sidebar-animate">
                  <div className="barrage-sidebar-segment">
                    {comments.map((item) => (
                      <BarrageCard key={item.id} item={item} />
                    ))}
                  </div>
                  <div aria-hidden="true" className="barrage-sidebar-segment">
                    {comments.map((item) => (
                      <BarrageCard key={`ghost-${item.id}`} item={item} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.aside>
  );
}
