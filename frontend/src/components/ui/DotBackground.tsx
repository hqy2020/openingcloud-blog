import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";
import { CanvasFractalGrid } from "./CanvasFractalGrid";

type DotColors = { dot: string; glow: string; opacity: number };

/** Read theme CSS vars ("R G B" triplets) and convert to rgba strings. */
function readThemeDotColor(): DotColors {
  if (typeof document === "undefined") {
    return { dot: "rgba(217, 119, 87, 1)", glow: "rgba(217, 119, 87, 1)", opacity: 0.18 };
  }
  const styles = getComputedStyle(document.documentElement);
  const accent = styles.getPropertyValue("--theme-dot-color").trim() || "217 119 87";
  const glow = styles.getPropertyValue("--theme-dot-glow").trim() || accent;
  const opacityRaw = styles.getPropertyValue("--theme-dot-opacity").trim();
  const opacity = opacityRaw ? parseFloat(opacityRaw) : 0.18;
  const [r, g, b] = accent.split(/\s+/);
  const [gr, gg, gb] = glow.split(/\s+/);
  return {
    dot: `rgba(${r}, ${g}, ${b}, 1)`,
    glow: `rgba(${gr}, ${gg}, ${gb}, 1)`,
    opacity: Number.isFinite(opacity) ? opacity : 0.18,
  };
}

export function DotBackground({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const [colors, setColors] = useState<DotColors>(() => readThemeDotColor());

  useEffect(() => {
    const update = () => setColors(readThemeDotColor());
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn("relative isolate w-full bg-transparent", className)}>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <CanvasFractalGrid
          key={`${colors.dot}-${colors.glow}`}
          dotSize={3.6}
          dotSpacing={19}
          dotOpacity={colors.opacity}
          waveIntensity={26}
          waveRadius={220}
          dotColor={colors.dot}
          glowColor={colors.glow}
          enableNoise={true}
          noiseOpacity={0.04}
          enableMouseGlow={true}
          initialPerformance="medium"
          enableGradient={false}
        />
      </div>
      {children ? <div className="relative z-10">{children}</div> : null}
    </div>
  );
}
