import type { PropsWithChildren } from "react";

type LampHeroProps = PropsWithChildren<{
  className?: string;
}>;

export function LampHero({ className, children }: LampHeroProps) {
  return (
    <div className={`relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/86 px-6 py-10 shadow-[0_28px_68px_rgba(15,23,42,0.14)] backdrop-blur sm:px-10 ${className ?? ""}`}>
      <div className="pointer-events-none absolute left-1/2 top-0 h-52 w-52 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(79,106,229,0.28),rgba(79,106,229,0))] blur-2xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,transparent,rgba(79,106,229,0.7),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.86),rgba(255,255,255,0)_62%)]" />
      <div className="relative">{children}</div>
    </div>
  );
}
