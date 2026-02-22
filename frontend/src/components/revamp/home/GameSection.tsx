import { useState } from "react";

const GAME_PREVIEW_URL = "https://lo6kp.csb.app/";
const GAME_SOURCE_URL = "https://codesandbox.io/p/sandbox/lo6kp?file=%2Fsrc%2FApp.tsx";

export function GameSection() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Game Playground</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-800">3D 赛车游戏</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            已接入 CodeSandbox `lo6kp` 的赛车项目，可在页面内直接体验。
          </p>
        </div>
        <a
          href={GAME_SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-full border border-slate-300/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
        >
          查看源码
        </a>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-slate-950/95 shadow-[0_20px_40px_rgba(2,6,23,0.3)]">
        {status === "error" ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 px-5 text-center text-slate-100 sm:min-h-[480px]">
            <p className="text-sm text-slate-200">游戏加载失败，请在新窗口打开体验。</p>
            <a
              href={GAME_PREVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full border border-white/40 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              新窗口打开游戏
            </a>
          </div>
        ) : (
          <div className="relative">
            <iframe
              title="Racing game from CodeSandbox"
              src={GAME_PREVIEW_URL}
              className={`h-[60vh] min-h-[360px] w-full border-0 transition-opacity duration-300 sm:min-h-[520px] ${
                status === "ready" ? "opacity-100" : "opacity-0"
              }`}
              loading="lazy"
              allow="autoplay; fullscreen; gamepad"
              onLoad={() => setStatus("ready")}
              onError={() => setStatus("error")}
            />
            {status === "loading" ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90">
                <p className="text-sm text-slate-200">游戏加载中，首次可能需要 10-30 秒...</p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        操作提示：`W / A / S / D` 控制方向，`Space` 刹车，`Shift` 加速，`R` 重置。
      </p>
    </section>
  );
}
