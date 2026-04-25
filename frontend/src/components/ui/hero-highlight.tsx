import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import type { MouseEvent, ReactNode } from "react";
import { cn } from "../../lib/utils";

type HeroHighlightProps = {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
};

type HighlightProps = {
  children: ReactNode;
  className?: string;
  backgroundHeight?: string;
  backgroundPosition?: string;
  duration?: number;
};

const DOT_PATTERNS = {
  light: {
    default:
      "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='16' height='16' fill='none'%3E%3Ccircle fill='%23d4d4d4' id='pattern-circle' cx='10' cy='10' r='2.5'%3E%3C/circle%3E%3C/svg%3E\")",
    hover:
      "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='16' height='16' fill='none'%3E%3Ccircle fill='%236366f1' id='pattern-circle' cx='10' cy='10' r='2.5'%3E%3C/circle%3E%3C/svg%3E\")",
  },
  dark: {
    default:
      "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='16' height='16' fill='none'%3E%3Ccircle fill='%23404040' id='pattern-circle' cx='10' cy='10' r='2.5'%3E%3C/circle%3E%3C/svg%3E\")",
    hover:
      "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='16' height='16' fill='none'%3E%3Ccircle fill='%238183f4' id='pattern-circle' cx='10' cy='10' r='2.5'%3E%3C/circle%3E%3C/svg%3E\")",
  },
} as const;

export function HeroHighlight({ children, className, containerClassName }: HeroHighlightProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const hoverMask = useMotionTemplate`
    radial-gradient(
      200px circle at ${mouseX}px ${mouseY}px,
      black 0%,
      transparent 100%
    )
  `;

  const handleMouseMove = ({ currentTarget, clientX, clientY }: MouseEvent<HTMLDivElement>) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  return (
    <div
      className={cn(
        "group relative flex h-[40rem] w-full items-center justify-center bg-white dark:bg-black",
        containerClassName,
      )}
      onMouseMove={handleMouseMove}
    >
      <div
        className="pointer-events-none absolute inset-0 dark:hidden"
        style={{ backgroundImage: DOT_PATTERNS.light.default }}
      />
      <div
        className="pointer-events-none absolute inset-0 hidden dark:block"
        style={{ backgroundImage: DOT_PATTERNS.dark.default }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100 dark:hidden"
        style={{
          backgroundImage: DOT_PATTERNS.light.hover,
          WebkitMaskImage: hoverMask,
          maskImage: hoverMask,
        }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0 hidden opacity-0 transition duration-300 group-hover:opacity-100 dark:block"
        style={{
          backgroundImage: DOT_PATTERNS.dark.hover,
          WebkitMaskImage: hoverMask,
          maskImage: hoverMask,
        }}
      />
      <div className={cn("relative z-20", className)}>{children}</div>
    </div>
  );
}

export function Highlight({
  children,
  className,
  backgroundHeight = "100%",
  backgroundPosition = "left center",
  duration = 2,
}: HighlightProps) {
  return (
    <motion.span
      initial={{ backgroundSize: `0% ${backgroundHeight}` }}
      animate={{ backgroundSize: `100% ${backgroundHeight}` }}
      transition={{ duration, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      style={{
        backgroundPosition,
        backgroundRepeat: "no-repeat",
        display: "inline",
      }}
      className={cn(
        "relative inline-block rounded-lg bg-gradient-to-r from-indigo-300 to-purple-300 px-1 pb-1 dark:from-indigo-500 dark:to-purple-500",
        className,
      )}
    >
      {children}
    </motion.span>
  );
}
