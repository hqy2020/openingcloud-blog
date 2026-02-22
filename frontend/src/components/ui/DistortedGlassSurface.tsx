import { useId, type CSSProperties } from "react";
import { cn } from "../../lib/utils";

export type DistortedGlassSurfaceProps = {
  className?: string;
  intensity?: "soft" | "regular";
};

export function DistortedGlassSurface({ className, intensity = "regular" }: DistortedGlassSurfaceProps) {
  const rawId = useId();
  const sanitizedId = rawId.replace(/[^a-zA-Z0-9_-]/g, "") || "0";
  const filterId = `distorted-glass-${sanitizedId}`;
  const displacementScale = intensity === "soft" ? 18 : 30;

  return (
    <div
      className={cn("distorted-glass-surface absolute inset-0 z-0 pointer-events-none overflow-hidden", className)}
      style={{ "--distorted-glass-filter": `url(#${filterId})` } as CSSProperties}
      aria-hidden="true"
    >
      <div className={cn("distorted-glass-surface__effect absolute inset-0", intensity === "soft" ? "distorted-glass-surface--soft" : "distorted-glass-surface--regular")} />
      <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
        <defs>
          <filter id={filterId}>
            <feTurbulence type="fractalNoise" baseFrequency="0.12 0.12" numOctaves="1" result="warp" />
            <feDisplacementMap in="SourceGraphic" in2="warp" xChannelSelector="R" yChannelSelector="G" scale={displacementScale} />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
