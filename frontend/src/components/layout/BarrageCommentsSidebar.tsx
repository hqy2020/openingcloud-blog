import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLocation } from "react-router-dom";
import { fetchBarrageComments, submitBarrageComment, type BarrageComment } from "../../api/barrage";

const springTransition = { type: "spring" as const, stiffness: 340, damping: 30 };

function BarrageCard({ item }: { item: BarrageComment }) {
  return (
    <article className="rounded-lg border border-slate-200/70 bg-white/85 px-3 py-2.5 backdrop-blur-sm">
      <header className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold text-slate-600">{item.nickname}</span>
        <time className="text-[10px] text-slate-400">{item.created_at.slice(0, 10)}</time>
      </header>
      <p className="mt-1.5 text-sm leading-5 text-slate-700 break-words">{item.content}</p>
    </article>
  );
}

export function BarrageCommentsSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState<BarrageComment[]>([]);
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const location = useLocation();

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const rows = await fetchBarrageComments(60);
        if (!active) return;
        setComments(rows);
      } catch (err) {
        if (!active) return;
        const message = err instanceof Error ? err.message : "弹幕加载失败";
        setError(message);
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

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

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
      await submitBarrageComment({
        nickname: nickname.trim(),
        content: trimmedContent,
        page_path: location.pathname,
      });
      setContent("");
      setNotice("已提交，后台审核通过后会在这里滚动展示。");
    } catch (err) {
      const message = err instanceof Error ? err.message : "提交失败，请稍后重试";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed left-0 top-1/3 z-40 hidden lg:flex flex-col items-center gap-1.5 rounded-r-lg border border-l-0 border-slate-200/70 bg-white/90 px-1.5 py-3 shadow-sm backdrop-blur-xl transition-colors hover:bg-slate-50"
          aria-label="展开弹幕评论"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-slate-500">
            <path d="M3 5.75A2.75 2.75 0 0 1 5.75 3h8.5A2.75 2.75 0 0 1 17 5.75v6.5A2.75 2.75 0 0 1 14.25 15H9.5l-3.96 2.64A.75.75 0 0 1 4.5 17v-2.46A2.75 2.75 0 0 1 3 12.25v-6.5Z" />
          </svg>
          <span className="text-xs font-semibold tracking-widest text-slate-600" style={{ writingMode: "vertical-rl" }}>
            弹幕评论
          </span>
        </button>
      )}

      <AnimatePresence>
        {isOpen ? (
          <motion.aside
            initial={prefersReducedMotion ? false : { x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={prefersReducedMotion ? { duration: 0 } : springTransition}
            className="fixed left-0 top-0 z-50 hidden lg:flex h-screen w-72 xl:w-80 flex-col border-r border-slate-200/70 bg-white/90 shadow-xl backdrop-blur-xl"
          >
            <header className="flex items-center justify-between border-b border-slate-200/70 px-4 pt-20 pb-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">弹幕评论</p>
                <p className="mt-0.5 text-[11px] text-slate-500">发布后进入待审核</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="关闭弹幕评论"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </header>

            <div className="border-b border-slate-200/70 px-4 py-3">
              <form className="space-y-2.5" onSubmit={onSubmit}>
                <input
                  className="w-full rounded-md border border-slate-200 bg-white/90 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-slate-400"
                  maxLength={40}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="昵称（可选）"
                  value={nickname}
                />
                <textarea
                  className="min-h-[68px] w-full resize-none rounded-md border border-slate-200 bg-white/90 px-2.5 py-1.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                  maxLength={200}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="说点什么..."
                  value={content}
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">{content.trim().length}/200</span>
                  <button
                    className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={submitting}
                    type="submit"
                  >
                    {submitting ? "提交中..." : "发布评论"}
                  </button>
                </div>
                {notice ? <p className="text-[11px] text-emerald-600">{notice}</p> : null}
                {error ? <p className="text-[11px] text-rose-500">{error}</p> : null}
              </form>
            </div>

            <div className="flex-1 overflow-hidden px-4 py-3">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-500">暂无已审核弹幕，欢迎第一个留言。</p>
              ) : prefersReducedMotion ? (
                <div className="max-h-full space-y-2.5 overflow-y-auto">
                  {comments.map((item) => (
                    <BarrageCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="barrage-sidebar-viewport h-full">
                  <div className="barrage-sidebar-track barrage-sidebar-animate">
                    <div className="barrage-sidebar-segment">
                      {comments.map((item) => (
                        <BarrageCard key={item.id} item={item} />
                      ))}
                    </div>
                    <div className="barrage-sidebar-segment" aria-hidden="true">
                      {comments.map((item) => (
                        <BarrageCard key={`dup-${item.id}`} item={item} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}
