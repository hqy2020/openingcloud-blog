import { useEffect, useState } from "react";

type GameLoadStatus = "loading" | "ready" | "error" | "timeout";

type GameItem = {
  id: string;
  title: string;
  description: string;
  embedUrl: string;
};

const GAMES: GameItem[] = [
  {
    id: "lo6kp",
    title: "Racing Game",
    description: "Arcade-style 3D driving with drifting, boosts, and quick restarts.",
    embedUrl:
      "https://codesandbox.io/embed/lo6kp?view=preview&hidenavigation=1&hidedevtools=1&module=%2Fsrc%2FApp.tsx&runonclick=0",
  },
  {
    id: "i2160",
    title: "Space Shooter",
    description: "Fast-paced space combat with flight movement, enemies, and particle effects.",
    embedUrl:
      "https://codesandbox.io/embed/i2160?view=preview&hidenavigation=1&hidedevtools=1&module=%2Fsrc%2FApp.js&runonclick=0",
  },
  {
    id: "gwthnh",
    title: "Thunder Clouds",
    description: "Interactive storm-cloud scene focused on lighting, atmosphere, and motion.",
    embedUrl:
      "https://codesandbox.io/embed/gwthnh?view=preview&hidenavigation=1&hidedevtools=1&module=%2Fsrc%2FApp.js&runonclick=0",
  },
];

function GameCard({ game, index }: { game: GameItem; index: number }) {
  const [status, setStatus] = useState<GameLoadStatus>("loading");

  useEffect(() => {
    if (status !== "loading") {
      return;
    }
    const timer = window.setTimeout(() => setStatus("timeout"), 12000);
    return () => window.clearTimeout(timer);
  }, [game.id, status]);

  return (
    <article className="space-y-3 rounded-3xl border border-slate-200/90 bg-white/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:p-5">
      <div>
        <h3 className="text-xl font-semibold text-slate-800">{game.title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{game.description}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-950/95 shadow-[0_20px_40px_rgba(2,6,23,0.3)]">
        {status === "error" ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 px-5 text-center text-slate-100 sm:min-h-[420px]">
            <p className="text-sm text-slate-200">Failed to load this game.</p>
          </div>
        ) : (
          <div className="relative">
            <iframe
              title={game.title}
              src={game.embedUrl}
              className="h-[55vh] min-h-[320px] w-full border-0 sm:min-h-[460px]"
              loading={index === 0 ? "eager" : "lazy"}
              allow="accelerometer; autoplay; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; xr-spatial-tracking; gamepad; fullscreen"
              sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
              onLoad={() => setStatus("ready")}
              onError={() => setStatus("error")}
            />
            {status === "loading" || status === "timeout" ? (
              <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/30 bg-slate-950/70 px-3 py-1.5 text-xs text-slate-100">
                {status === "loading" ? "Loading game..." : "Still loading..."}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </article>
  );
}

export function GameSection() {
  const [racingGame, ...sideGames] = GAMES;

  return (
    <section className="space-y-5">
      <h2 className="text-2xl font-semibold text-slate-800">Game</h2>
      <div className="space-y-6">
        <GameCard game={racingGame} index={0} />
        <div className="grid gap-6 lg:grid-cols-2">
          {sideGames.map((game, index) => (
            <GameCard key={game.id} game={game} index={index + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
