import { useEffect, useState } from "react";

type GameLoadStatus = "loading" | "ready" | "error" | "timeout";

type GameItem = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  sourceUrl: string;
  embedUrl: string;
  previewUrl: string;
  controlsHint: string;
};

const GAMES: GameItem[] = [
  {
    id: "lo6kp",
    title: "3D 赛车游戏",
    subtitle: "Racing game",
    description: "已接入 CodeSandbox `lo6kp` 的赛车项目，可在页面内直接体验。",
    sourceUrl: "https://codesandbox.io/p/sandbox/lo6kp?file=%2Fsrc%2FApp.tsx",
    embedUrl: "https://codesandbox.io/embed/lo6kp?view=preview&hidenavigation=1&module=%2Fsrc%2FApp.tsx&runonclick=1",
    previewUrl: "https://lo6kp.csb.app/",
    controlsHint: "操作提示：`W / A / S / D` 控制方向，`Space` 刹车，`Shift` 加速，`R` 重置。",
  },
  {
    id: "i2160",
    title: "太空射击游戏",
    subtitle: "space game",
    description: "新增 CodeSandbox `i2160`，一个节奏较快的 3D 太空射击小游戏。",
    sourceUrl: "https://codesandbox.io/p/sandbox/i2160?file=%2Fsrc%2FApp.js",
    embedUrl: "https://codesandbox.io/embed/i2160?view=preview&hidenavigation=1&module=%2Fsrc%2FApp.js&runonclick=1",
    previewUrl: "https://i2160.csb.app/",
    controlsHint: "操作提示：使用 `W / A / S / D` 移动，鼠标配合完成瞄准和射击。",
  },
  {
    id: "gwthnh",
    title: "雷暴云层互动",
    subtitle: "Thunder clouds",
    description: "新增 CodeSandbox `gwthnh`，可在 3D 云层中体验雷暴与光照氛围。",
    sourceUrl: "https://codesandbox.io/p/sandbox/gwthnh?file=%2Fsrc%2FApp.js",
    embedUrl: "https://codesandbox.io/embed/gwthnh?view=preview&hidenavigation=1&module=%2Fsrc%2FApp.js&runonclick=1",
    previewUrl: "https://gwthnh.csb.app/",
    controlsHint: "操作提示：拖拽旋转视角，滚轮缩放，观察云层与闪电效果。",
  },
];

export function GameSection() {
  const [activeGameId, setActiveGameId] = useState<string>(GAMES[0].id);
  const [statusMap, setStatusMap] = useState<Record<string, GameLoadStatus>>(() =>
    Object.fromEntries(GAMES.map((game) => [game.id, "loading"])) as Record<string, GameLoadStatus>
  );

  const activeGame = GAMES.find((game) => game.id === activeGameId) ?? GAMES[0];
  const status = statusMap[activeGame.id];

  const setGameStatus = (gameId: string, nextStatus: GameLoadStatus) => {
    setStatusMap((prev) => {
      if (prev[gameId] === nextStatus) {
        return prev;
      }
      return { ...prev, [gameId]: nextStatus };
    });
  };

  useEffect(() => {
    if (status !== "loading") {
      return;
    }
    const timer = window.setTimeout(() => setGameStatus(activeGame.id, "timeout"), 12000);
    return () => window.clearTimeout(timer);
  }, [activeGame.id, status]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Game Playground</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-800">{activeGame.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{activeGame.description}</p>
        </div>
        <a
          href={activeGame.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-full border border-slate-300/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
        >
          查看源码
        </a>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {GAMES.map((game) => (
          <button
            key={game.id}
            type="button"
            onClick={() => {
              setActiveGameId(game.id);
              if (statusMap[game.id] !== "ready") {
                setGameStatus(game.id, "loading");
              }
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              game.id === activeGame.id
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300/80 bg-white/90 text-slate-700 hover:border-slate-400 hover:bg-white"
            }`}
            aria-pressed={game.id === activeGame.id}
          >
            {game.title}
          </button>
        ))}
        <span className="text-xs text-slate-500">当前共 {GAMES.length} 个小游戏</span>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-slate-950/95 shadow-[0_20px_40px_rgba(2,6,23,0.3)]">
        {status === "error" ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 px-5 text-center text-slate-100 sm:min-h-[480px]">
            <p className="text-sm text-slate-200">游戏加载失败，请在新窗口打开体验。</p>
            <a
              href={activeGame.embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full border border-white/40 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              新窗口打开预览
            </a>
          </div>
        ) : (
          <div className="relative">
            <iframe
              key={activeGame.id}
              title={`${activeGame.subtitle} from CodeSandbox`}
              src={activeGame.embedUrl}
              className="h-[60vh] min-h-[360px] w-full border-0 sm:min-h-[520px]"
              loading="lazy"
              allow="accelerometer; autoplay; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; xr-spatial-tracking; gamepad; fullscreen"
              sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
              onLoad={() => setGameStatus(activeGame.id, "ready")}
              onError={() => setGameStatus(activeGame.id, "error")}
            />
            {status === "loading" || status === "timeout" ? (
              <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/30 bg-slate-950/70 px-3 py-1.5 text-xs text-slate-100">
                {status === "loading" ? "游戏加载中，首次可能需要 10-30 秒..." : "若场景未显示，请点下方按钮新窗口打开"}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={activeGame.previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-full border border-slate-300/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
        >
          新窗口直接玩
        </a>
        <p className="text-xs text-slate-500">{activeGame.controlsHint}</p>
      </div>
    </section>
  );
}
