import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimation } from "motion/react";

interface GradientStop {
  color: string;
  position: number;
}

interface GradientType {
  stops: GradientStop[];
  centerX: number;
  centerY: number;
}

export interface CanvasFractalGridProps {
  dotSize?: number;
  dotSpacing?: number;
  dotOpacity?: number;
  gradientAnimationDuration?: number;
  mouseTrackingStiffness?: number;
  mouseTrackingDamping?: number;
  waveIntensity?: number;
  waveRadius?: number;
  gradients?: GradientType[];
  dotColor?: string;
  glowColor?: string;
  enableNoise?: boolean;
  noiseOpacity?: number;
  enableMouseGlow?: boolean;
  initialPerformance?: "low" | "medium" | "high";
  enableGradient?: boolean;
}

const NoiseSVG = React.memo(() => (
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <filter id="fractal-grid-noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
    </filter>
    <rect width="100%" height="100%" filter="url(#fractal-grid-noise)" />
  </svg>
));

NoiseSVG.displayName = "NoiseSVG";

const NoiseOverlay: React.FC<{ opacity: number }> = ({ opacity }) => (
  <div className="absolute inset-0 h-full w-full mix-blend-overlay" style={{ opacity }}>
    <NoiseSVG />
  </div>
);

function useResponsive() {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    isMobile: windowSize.width < 768,
    isTablet: windowSize.width >= 768 && windowSize.width < 1024,
  };
}

function usePerformance(initialPerformance: "low" | "medium" | "high" = "medium") {
  const initialFps = initialPerformance === "high" ? 60 : initialPerformance === "medium" ? 40 : 20;
  const [fps, setFps] = useState(initialFps);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let frameCount = 0;
    let lastTime = window.performance.now();
    let frameId = 0;

    const measureFps = (time: number) => {
      frameCount += 1;
      if (time - lastTime > 1000) {
        setFps(Math.round((frameCount * 1000) / (time - lastTime)));
        frameCount = 0;
        lastTime = time;
      }
      frameId = requestAnimationFrame(measureFps);
    };

    frameId = requestAnimationFrame(measureFps);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return useMemo(() => {
    if (fps < 30) {
      return "low";
    }
    if (fps < 50) {
      return "medium";
    }
    return "high";
  }, [fps]);
}

const Gradient: React.FC<{ gradients: GradientType[]; animationDuration: number }> = React.memo(
  ({ gradients, animationDuration }) => {
    const controls = useAnimation();

    useEffect(() => {
      controls.start({
        background: gradients.map(
          (gradient) =>
            `radial-gradient(circle at ${gradient.centerX}% ${gradient.centerY}%, ${gradient.stops
              .map((stop) => `${stop.color} ${stop.position}%`)
              .join(", ")})`,
        ),
        transition: {
          duration: animationDuration,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "linear",
        },
      });
    }, [animationDuration, controls, gradients]);

    return <motion.div className="absolute inset-0 h-full w-full" animate={controls} />;
  },
);

Gradient.displayName = "Gradient";

const DotCanvas: React.FC<{
  dotSize: number;
  dotSpacing: number;
  dotOpacity: number;
  waveIntensity: number;
  waveRadius: number;
  dotColor: string;
  glowColor: string;
  performance: "low" | "medium" | "high";
  mousePos: { x: number; y: number };
}> = React.memo(
  ({ dotSize, dotSpacing, dotOpacity, waveIntensity, waveRadius, dotColor, glowColor, performance, mousePos }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);

    const drawDots = useCallback(
      (ctx: CanvasRenderingContext2D, time: number) => {
        const { width, height } = ctx.canvas;
        ctx.clearRect(0, 0, width, height);

        const performanceSettings = {
          low: { skip: 3 },
          medium: { skip: 2 },
          high: { skip: 1 },
        } as const;

        const skip = performanceSettings[performance].skip;
        const cols = Math.ceil(width / dotSpacing);
        const rows = Math.ceil(height / dotSpacing);
        const centerX = mousePos.x * width;
        const centerY = mousePos.y * height;

        for (let i = 0; i < cols; i += skip) {
          for (let j = 0; j < rows; j += skip) {
            const x = i * dotSpacing;
            const y = j * dotSpacing;

            const distanceX = x - centerX;
            const distanceY = y - centerY;
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

            let dotX = x;
            let dotY = y;

            if (distance < waveRadius) {
              const waveStrength = Math.pow(1 - distance / waveRadius, 2);
              const angle = Math.atan2(distanceY, distanceX);
              const waveOffset = Math.sin(distance * 0.05 - time * 0.005) * waveIntensity * waveStrength;
              dotX += Math.cos(angle) * waveOffset;
              dotY += Math.sin(angle) * waveOffset;

              const glowRadius = dotSize * (1 + waveStrength);
              const gradient = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, glowRadius);
              gradient.addColorStop(0, glowColor.replace("1)", `${dotOpacity * (1 + waveStrength)})`));
              gradient.addColorStop(1, glowColor.replace("1)", "0)"));
              ctx.fillStyle = gradient;
            } else {
              ctx.fillStyle = dotColor.replace("1)", `${dotOpacity})`);
            }

            ctx.beginPath();
            ctx.arc(dotX, dotY, dotSize / 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      },
      [dotColor, dotOpacity, dotSize, dotSpacing, glowColor, mousePos, performance, waveIntensity, waveRadius],
    );

    useEffect(() => {
      if (typeof window === "undefined") {
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };

      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);

      let lastTime = 0;
      const animate = (time: number) => {
        if (time - lastTime > 16) {
          drawDots(ctx, time);
          lastTime = time;
        }
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        window.removeEventListener("resize", resizeCanvas);
        if (animationRef.current !== null) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [drawDots]);

    return (
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full bg-gray-100"
        style={{ mixBlendMode: "multiply" }}
      />
    );
  },
);

DotCanvas.displayName = "DotCanvas";

const MouseGlow: React.FC<{ glowColor: string; mousePos: { x: number; y: number } }> = React.memo(
  ({ glowColor, mousePos }) => (
    <>
      <div
        className="pointer-events-none absolute h-40 w-40 rounded-full"
        style={{
          background: `radial-gradient(circle, ${glowColor.replace("1)", "0.2)")} 0%, ${glowColor.replace("1)", "0)")} 70%)`,
          left: `${mousePos.x * 100}%`,
          top: `${mousePos.y * 100}%`,
          transform: "translate(-50%, -50%)",
          filter: "blur(10px)",
        }}
      />
      <div
        className="pointer-events-none absolute h-20 w-20 rounded-full"
        style={{
          background: `radial-gradient(circle, ${glowColor.replace("1)", "0.4)")} 0%, ${glowColor.replace("1)", "0)")} 70%)`,
          left: `${mousePos.x * 100}%`,
          top: `${mousePos.y * 100}%`,
          transform: "translate(-50%, -50%)",
        }}
      />
    </>
  ),
);

MouseGlow.displayName = "MouseGlow";

const defaultGradients: GradientType[] = [
  {
    stops: [
      { color: "#FFD6A5", position: 0 },
      { color: "#FFADAD", position: 25 },
      { color: "#FFC6FF", position: 50 },
      { color: "transparent", position: 75 },
    ],
    centerX: 50,
    centerY: 50,
  },
  {
    stops: [
      { color: "#A0C4FF", position: 0 },
      { color: "#BDB2FF", position: 25 },
      { color: "#CAFFBF", position: 50 },
      { color: "transparent", position: 75 },
    ],
    centerX: 60,
    centerY: 40,
  },
  {
    stops: [
      { color: "#9BF6FF", position: 0 },
      { color: "#FDFFB6", position: 25 },
      { color: "#FFAFCC", position: 50 },
      { color: "transparent", position: 75 },
    ],
    centerX: 40,
    centerY: 60,
  },
];

export function CanvasFractalGrid({
  dotSize = 4,
  dotSpacing = 20,
  dotOpacity = 0.3,
  gradientAnimationDuration = 20,
  waveIntensity = 30,
  waveRadius = 200,
  gradients = defaultGradients,
  dotColor = "rgba(100, 100, 255, 1)",
  glowColor = "rgba(100, 100, 255, 1)",
  enableNoise = true,
  noiseOpacity = 0.03,
  enableMouseGlow = true,
  initialPerformance = "medium",
  enableGradient = false,
}: CanvasFractalGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isMobile, isTablet } = useResponsive();
  const performance = usePerformance(initialPerformance);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((event: MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) {
      return;
    }

    const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
    setMousePos({ x, y });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  const responsiveDotSize = useMemo(() => {
    if (isMobile) {
      return dotSize * 0.75;
    }
    if (isTablet) {
      return dotSize * 0.9;
    }
    return dotSize;
  }, [dotSize, isMobile, isTablet]);

  const responsiveDotSpacing = useMemo(() => {
    if (isMobile) {
      return dotSpacing * 1.5;
    }
    if (isTablet) {
      return dotSpacing * 1.25;
    }
    return dotSpacing;
  }, [dotSpacing, isMobile, isTablet]);

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        key="canvas-fractal-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute inset-0 h-full w-full overflow-hidden"
      >
        {enableGradient ? <Gradient gradients={gradients} animationDuration={gradientAnimationDuration} /> : null}
        {enableGradient ? (
          <motion.div
            className="absolute inset-0 h-full w-full"
            style={{
              background: "radial-gradient(circle, transparent, #FFFFFF)",
              backgroundSize: "100% 100%",
              backgroundPosition: "center",
              mixBlendMode: "overlay",
            }}
            animate={{
              backgroundPosition: `${mousePos.x * 100}% ${mousePos.y * 100}%`,
            }}
          />
        ) : null}
        <DotCanvas
          dotSize={responsiveDotSize}
          dotSpacing={responsiveDotSpacing}
          dotOpacity={dotOpacity}
          waveIntensity={waveIntensity}
          waveRadius={waveRadius}
          dotColor={dotColor}
          glowColor={glowColor}
          performance={performance}
          mousePos={mousePos}
        />
        {enableNoise ? <NoiseOverlay opacity={noiseOpacity} /> : null}
        {enableMouseGlow ? <MouseGlow glowColor={glowColor} mousePos={mousePos} /> : null}
      </motion.div>
    </AnimatePresence>
  );
}

export default React.memo(CanvasFractalGrid);
