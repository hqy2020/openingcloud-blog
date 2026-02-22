import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";

type AnimationDirection = "top-to-bottom" | "bottom-to-top" | "both" | "random";
type AnimationEasing = "linear" | "easeIn" | "easeOut" | "easeInOut" | "spring";

type VariantValue = { top: string } | { top: string[] };
type VariantResolver = VariantValue | (() => VariantValue);

type StripeBgGuidesProps = {
  columnCount?: number;
  className?: string;
  solidLines?: number[];
  animated?: boolean;
  animationDuration?: number;
  animationDelay?: number;
  glowColor?: string;
  glowSize?: string;
  glowOpacity?: number;
  randomize?: boolean;
  randomInterval?: number;
  direction?: AnimationDirection;
  easing?: AnimationEasing;
  responsive?: boolean;
  minColumnWidth?: string;
  maxActiveColumns?: number;
  darkMode?: boolean;
  contained?: boolean;
};

const easingFunctions = {
  linear: [0, 0, 1, 1] as const,
  easeIn: [0.42, 0, 1, 1] as const,
  easeOut: [0, 0, 0.58, 1] as const,
  easeInOut: [0.42, 0, 0.58, 1] as const,
  spring: [0.175, 0.885, 0.32, 1.275] as const,
};

const resolveVariantValue = (value: VariantResolver): VariantValue => (typeof value === "function" ? value() : value);

export function StripeBgGuides({
  columnCount = 4,
  className = "",
  solidLines = [],
  animated = true,
  animationDuration = 62,
  animationDelay = 0.8,
  glowColor = "rgba(79, 106, 229, 0.55)",
  glowSize = "10vh",
  glowOpacity = 0.4,
  randomize = true,
  randomInterval = 9000,
  direction = "both",
  easing = "spring",
  responsive = false,
  minColumnWidth = "4rem",
  maxActiveColumns = 3,
  darkMode = false,
  contained = false,
}: StripeBgGuidesProps) {
  const [windowWidth, setWindowWidth] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 0));
  const minWidthNumber = useMemo(() => {
    const numericValue = Number.parseFloat(minColumnWidth);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return 1;
    }

    if (minColumnWidth.endsWith("rem")) {
      if (typeof window === "undefined") {
        return numericValue * 16;
      }
      const rootFontSize = Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;
      return numericValue * rootFontSize;
    }

    return numericValue;
  }, [minColumnWidth]);

  const columns = useMemo(() => {
    const count = responsive ? Math.max(Math.floor(windowWidth / minWidthNumber), 1) : columnCount;
    return Array.from({ length: count });
  }, [columnCount, minWidthNumber, responsive, windowWidth]);

  const [activeColumns, setActiveColumns] = useState<boolean[]>([]);

  const getRandomColumns = useCallback(() => {
    const nextActiveColumns = columns.map(() => Math.random() < 0.5);
    const activeCount = nextActiveColumns.filter(Boolean).length;
    if (activeCount <= maxActiveColumns) {
      return nextActiveColumns;
    }

    const indicesToDeactivate = nextActiveColumns
      .map((isActive, index) => (isActive ? index : -1))
      .filter((index) => index !== -1)
      .sort(() => Math.random() - 0.5)
      .slice(0, activeCount - maxActiveColumns);

    indicesToDeactivate.forEach((index) => {
      nextActiveColumns[index] = false;
    });

    return nextActiveColumns;
  }, [columns, maxActiveColumns]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!animated || !randomize) {
      return undefined;
    }

    const initializeId = window.setTimeout(() => {
      setActiveColumns(getRandomColumns());
    }, 0);
    const intervalId = window.setInterval(() => {
      setActiveColumns(getRandomColumns());
    }, randomInterval);

    return () => {
      window.clearTimeout(initializeId);
      window.clearInterval(intervalId);
    };
  }, [animated, columns, getRandomColumns, randomInterval, randomize]);

  const resolvedActiveColumns = useMemo(() => {
    if (!animated || !randomize || activeColumns.length !== columns.length) {
      return columns.map(() => true);
    }
    return activeColumns;
  }, [activeColumns, animated, columns, randomize]);

  const animationVariants = useMemo(() => {
    const variants: Record<AnimationDirection, { initial: VariantResolver; animate: VariantResolver }> = {
      "top-to-bottom": {
        initial: { top: "-100%" },
        animate: { top: "100%" },
      },
      "bottom-to-top": {
        initial: { top: "100%" },
        animate: { top: "-100%" },
      },
      both: {
        initial: { top: "100%" },
        animate: { top: ["-100%", "100%"] },
      },
      random: {
        initial: () => ({ top: Math.random() < 0.5 ? "-100%" : "100%" }),
        animate: () => ({ top: Math.random() < 0.5 ? "-100%" : "100%" }),
      },
    };
    return variants[direction];
  }, [direction]);

  const lineColors = useMemo(
    () => ({
      solid: darkMode ? "hsl(233 14% 13%)" : "hsl(233 14.1% 96.1%)",
      dashed: darkMode ? "hsl(233 14% 20%)" : "hsl(233 14% 93%)",
    }),
    [darkMode],
  );

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none ${contained ? "absolute inset-0" : "fixed inset-0"} ${className}`}
      style={{ zIndex: contained ? 0 : -1 }}
    >
      <div className="h-full w-full px-4 sm:px-6 lg:px-16">
        <div
          className="mx-auto h-full w-full"
          style={{
            display: "grid",
            gridTemplateColumns: responsive
              ? `repeat(auto-fit, minmax(${minColumnWidth}, 1fr))`
              : `repeat(${columnCount}, minmax(0, 1fr))`,
            gap: "2rem",
          }}
        >
          {columns.map((_, index) => {
            const isSolid = solidLines.includes(index + 1);
            return (
              <div key={index} className="relative h-full">
                <div
                  className={`absolute inset-y-0 ${
                    index === 0 ? "left-0" : index === columns.length - 1 ? "right-0" : "left-1/2"
                  } w-px overflow-hidden`}
                  style={
                    isSolid
                      ? { background: lineColors.solid }
                      : {
                          backgroundImage: `linear-gradient(to bottom, ${lineColors.dashed} 50%, transparent 50%)`,
                          backgroundSize: "1px 8px",
                        }
                  }
                >
                  <AnimatePresence mode="wait">
                    {animated && resolvedActiveColumns[index] ? (
                      <motion.div
                        key={`guide-glow-${index}`}
                        animate={resolveVariantValue(animationVariants.animate)}
                        className="absolute w-full"
                        exit={resolveVariantValue(animationVariants.initial)}
                        initial={resolveVariantValue(animationVariants.initial)}
                        style={{
                          height: glowSize,
                          background: `linear-gradient(to bottom, transparent, ${glowColor}, ${
                            darkMode ? "black" : "white"
                          })`,
                          opacity: glowOpacity,
                        }}
                        transition={{
                          duration: animationDuration,
                          repeat: Infinity,
                          ease: easingFunctions[easing],
                          delay: index * animationDelay,
                        }}
                      />
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
