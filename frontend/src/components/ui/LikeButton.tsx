import { useCallback, useRef } from "react";
import { cn } from "../../lib/utils";
import { getConfettiOriginFromElement } from "../../lib/confetti";
import { Confetti, type ConfettiRef } from "./Confetti";

type LikeButtonProps = {
  liked: boolean;
  likes: number;
  onToggle: () => void;
  size?: "sm" | "md";
};

export function LikeButton({ liked, likes, onToggle, size = "md" }: LikeButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const confettiRef = useRef<ConfettiRef>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!liked && btnRef.current) {
        const origin = getConfettiOriginFromElement(btnRef.current);
        void confettiRef.current?.fire({
          origin,
          particleCount: 60,
          spread: 55,
          startVelocity: 25,
          ticks: 50,
          scalar: 0.8,
        });
      }

      onToggle();
    },
    [liked, onToggle],
  );

  const isSm = size === "sm";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleClick}
        className={cn(
          "group/like inline-flex items-center gap-1.5 rounded-full border transition-all",
          isSm ? "px-2 py-1 text-xs" : "px-3.5 py-2 text-sm",
          liked
            ? "border-rose-200 bg-rose-50 text-rose-500"
            : "border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:text-rose-400",
        )}
      >
        <svg
          viewBox="0 0 24 24"
          className={cn(
            "transition-transform group-hover/like:scale-110",
            isSm ? "h-3.5 w-3.5" : "h-5 w-5",
          )}
          fill={liked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={liked ? 0 : 2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          />
        </svg>
        <span className="tabular-nums">{likes}</span>
      </button>

      <Confetti
        ref={confettiRef}
        manualStart
        className="pointer-events-none fixed inset-0 z-[60]"
        style={{ width: "100%", height: "100%" }}
      />
    </>
  );
}
