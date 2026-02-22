import { cn } from "../../lib/utils";
import type { ReactNode } from "react";
import { useReducedMotion } from "motion/react";

type MarqueeProps = {
  children: ReactNode;
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  duration?: number;
};

export function Marquee({
  children,
  className,
  reverse = false,
  pauseOnHover = false,
  duration = 28,
}: MarqueeProps) {
  const reduceMotion = Boolean(useReducedMotion());
  const animationValue = reduceMotion
    ? "none"
    : `marquee-scroll ${duration}s linear infinite${reverse ? " reverse" : ""}`;

  return (
    <div
      className={cn(
        "group flex overflow-hidden [--gap:1rem]",
        className,
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-around gap-[var(--gap)]",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
        )}
        style={{
          animation: animationValue,
        }}
      >
        {children}
      </div>
      {!reduceMotion ? (
        <div
          aria-hidden="true"
          className={cn(
            "flex shrink-0 items-center justify-around gap-[var(--gap)]",
            pauseOnHover && "group-hover:[animation-play-state:paused]",
          )}
          style={{
            animation: animationValue,
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
