import { motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "../../lib/utils";

type SparklesPalette = {
  first: string;
  second: string;
};

type Sparkle = {
  id: string;
  x: string;
  y: string;
  color: string;
  delay: number;
  scale: number;
  lifespan: number;
};

type SparklesTextProps = {
  className?: string;
  children: ReactNode;
  sparklesCount?: number;
  colors?: SparklesPalette;
};

function createSparkle(colors: SparklesPalette): Sparkle {
  const x = `${Math.random() * 100}%`;
  const y = `${Math.random() * 100}%`;
  const color = Math.random() > 0.5 ? colors.first : colors.second;
  const delay = Math.random() * 2;
  const scale = Math.random() + 0.3;
  const lifespan = Math.random() * 10 + 5;
  const id = `${x}-${y}-${Math.random().toString(36).slice(2, 8)}`;
  return { id, x, y, color, delay, scale, lifespan };
}

function SparkleGlyph({ sparkle }: { sparkle: Sparkle }) {
  return (
    <motion.svg
      className="pointer-events-none absolute z-0"
      initial={{ opacity: 0, left: sparkle.x, top: sparkle.y }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, sparkle.scale, 0],
        rotate: [75, 120, 150],
      }}
      transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, delay: sparkle.delay }}
      width="21"
      height="21"
      viewBox="0 0 21 21"
    >
      <path
        d="M9.82531 0.843845C10.0553 0.215178 10.9446 0.215178 11.1746 0.843845L11.8618 2.72026C12.4006 4.19229 12.3916 6.39157 13.5 7.5C14.6084 8.60843 16.8077 8.59935 18.2797 9.13822L20.1561 9.82534C20.7858 10.0553 20.7858 10.9447 20.1561 11.1747L18.2797 11.8618C16.8077 12.4007 14.6084 12.3916 13.5 13.5C12.3916 14.6084 12.4006 16.8077 11.8618 18.2798L11.1746 20.1562C10.9446 20.7858 10.0553 20.7858 9.82531 20.1562L9.13819 18.2798C8.59932 16.8077 8.60843 14.6084 7.5 13.5C6.39157 12.3916 4.19225 12.4007 2.72023 11.8618L0.843814 11.1747C0.215148 10.9447 0.215148 10.0553 0.843814 9.82534L2.72023 9.13822C4.19225 8.59935 6.39157 8.60843 7.5 7.5C8.60843 6.39157 8.59932 4.19229 9.13819 2.72026L9.82531 0.843845Z"
        fill={sparkle.color}
      />
    </motion.svg>
  );
}

export function SparklesText({
  className,
  children,
  sparklesCount = 10,
  colors = { first: "#38bdf8", second: "#f59e0b" },
}: SparklesTextProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    const palette = {
      first: colors.first,
      second: colors.second,
    };

    const initializeSparkles = () => {
      setSparkles(Array.from({ length: sparklesCount }, () => createSparkle(palette)));
    };

    const tick = () => {
      setSparkles((current) =>
        current.map((sparkle) =>
          sparkle.lifespan <= 0 ? createSparkle(palette) : { ...sparkle, lifespan: sparkle.lifespan - 0.1 }
        )
      );
    };

    initializeSparkles();
    const timer = window.setInterval(tick, 100);
    return () => window.clearInterval(timer);
  }, [colors.first, colors.second, sparklesCount]);

  return (
    <span className={cn("relative inline-block", className)}>
      {sparkles.map((sparkle) => (
        <SparkleGlyph key={sparkle.id} sparkle={sparkle} />
      ))}
      <span className="relative z-10">{children}</span>
    </span>
  );
}
