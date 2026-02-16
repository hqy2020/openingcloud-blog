import { useMemo } from "react";
import { useTheme } from "../../app/theme";
import type { CategoryVisualKey } from "../../theme/categoryVisuals";

type GenerativeCoverProps = {
  category: CategoryVisualKey;
  seed: string;
  className?: string;
};

/* ── deterministic hash ────────────────────────────────── */

function hashSeed(seed: string): number[] {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h + seed.charCodeAt(i)) | 0;
  }
  // derive 6 independent values in 0‑100 range
  const values: number[] = [];
  for (let i = 0; i < 6; i++) {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b + i);
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b + i);
    h = (h ^ (h >>> 16)) >>> 0;
    values.push(h % 101);
  }
  return values;
}

/* ── category palettes ─────────────────────────────────── */

type Palette = {
  stops: [string, string, string];
  base: [string, string];
  baseDark: [string, string];
};

const palettes: Record<CategoryVisualKey, Palette> = {
  tech: {
    stops: [
      "rgba(107,145,123,0.72)",
      "rgba(79,166,139,0.58)",
      "rgba(79,106,229,0.42)",
    ],
    base: ["rgba(181,212,191,0.6)", "rgba(236,245,239,0.8)"],
    baseDark: ["rgba(30,60,48,0.7)", "rgba(15,23,42,0.85)"],
  },
  learning: {
    stops: [
      "rgba(184,148,94,0.72)",
      "rgba(214,189,139,0.58)",
      "rgba(196,130,62,0.42)",
    ],
    base: ["rgba(234,218,186,0.6)", "rgba(250,245,235,0.8)"],
    baseDark: ["rgba(62,48,28,0.7)", "rgba(15,23,42,0.85)"],
  },
  life: {
    stops: [
      "rgba(150,132,168,0.72)",
      "rgba(194,182,207,0.58)",
      "rgba(139,108,168,0.42)",
    ],
    base: ["rgba(218,210,228,0.6)", "rgba(246,242,250,0.8)"],
    baseDark: ["rgba(52,38,66,0.7)", "rgba(15,23,42,0.85)"],
  },
};

/* ── component ─────────────────────────────────────────── */

export function GenerativeCover({ category, seed, className = "" }: GenerativeCoverProps) {
  const { isDark } = useTheme();

  const style = useMemo(() => {
    const [x1, y1, x2, y2, x3, y3] = hashSeed(seed);
    const p = palettes[category];
    const [baseFrom, baseTo] = isDark ? p.baseDark : p.base;

    const background = [
      `radial-gradient(ellipse 60% 55% at ${x1}% ${y1}%, ${p.stops[0]}, transparent)`,
      `radial-gradient(ellipse 50% 60% at ${x2}% ${y2}%, ${p.stops[1]}, transparent)`,
      `radial-gradient(ellipse 55% 50% at ${x3}% ${y3}%, ${p.stops[2]}, transparent)`,
      `linear-gradient(135deg, ${baseFrom}, ${baseTo})`,
    ].join(", ");

    return { background } as const;
  }, [category, seed, isDark]);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={style}
    >
      {/* decorative geometric accent */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.07) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}
