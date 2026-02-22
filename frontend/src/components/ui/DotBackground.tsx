import { cn } from "../../lib/utils";
import { CanvasFractalGrid } from "./CanvasFractalGrid";

export function DotBackground({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative isolate w-full bg-transparent", className)}>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <CanvasFractalGrid
          dotSize={3.6}
          dotSpacing={19}
          dotOpacity={0.18}
          waveIntensity={26}
          waveRadius={220}
          dotColor="rgba(79, 106, 229, 1)"
          glowColor="rgba(79, 106, 229, 1)"
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
