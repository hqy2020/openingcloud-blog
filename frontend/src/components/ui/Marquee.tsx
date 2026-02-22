import { cn } from "../../lib/utils";
import type { ReactNode } from "react";
import { useReducedMotion } from "motion/react";

type MarqueeProps = {
  children: ReactNode;
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  duration?: number;
  vertical?: boolean;
};

export function Marquee({
  children,
  className,
  reverse = false,
  pauseOnHover = false,
  duration = 28,
  vertical = false,
}: MarqueeProps) {
  const reduceMotion = Boolean(useReducedMotion());
  const keyframe = vertical ? "marquee-scroll-y" : "marquee-scroll";
  const animationValue = reduceMotion
    ? "none"
    : `${keyframe} ${duration}s linear infinite${reverse ? " reverse" : ""}`;

  return (
    <div
      className={cn(
        "group flex overflow-hidden [--gap:1rem]",
        vertical ? "flex-col" : "flex-row",
        className,
      )}
    >
      <div
        className={cn(
          "flex shrink-0 gap-[var(--gap)]",
          vertical ? "flex-col" : "items-center justify-around",
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
            "flex shrink-0 gap-[var(--gap)]",
            vertical ? "flex-col" : "items-center justify-around",
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
