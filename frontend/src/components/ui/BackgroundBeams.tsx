import { useEffect, useRef } from "react";

type Beam = {
  baseY: number;
  amplitude: number;
  speed: number;
  width: number;
  hue: string;
  phase: number;
};

type BackgroundBeamsProps = {
  className?: string;
  colors?: string[];
};

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function BackgroundBeams({ className = "", colors = ["#4F6AE5", "#6B917B", "#B8945E"] }: BackgroundBeamsProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    let rafId = 0;
    const beams: Beam[] = new Array(7).fill(null).map((_, index) => ({
      baseY: 0.12 + index * 0.12,
      amplitude: randomBetween(0.03, 0.11),
      speed: randomBetween(0.4, 1),
      width: randomBetween(1.2, 2.8),
      hue: colors[index % colors.length],
      phase: randomBetween(0, Math.PI * 2),
    }));

    const resize = () => {
      const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (timeMs: number) => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const t = timeMs / 1000;

      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "lighter";

      for (const beam of beams) {
        context.beginPath();
        context.lineWidth = beam.width;
        context.strokeStyle = `${beam.hue}66`;
        context.shadowColor = `${beam.hue}88`;
        context.shadowBlur = 12;

        const step = Math.max(18, width / 18);
        for (let x = 0; x <= width + step; x += step) {
          const normalized = x / width;
          const y =
            height * beam.baseY +
            Math.sin(normalized * Math.PI * 2 + beam.phase + t * beam.speed) *
              beam.amplitude *
              height;

          if (x === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        }

        context.stroke();
      }

      rafId = window.requestAnimationFrame(draw);
    };

    resize();
    rafId = window.requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, [colors]);

  return <canvas ref={canvasRef} className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} aria-hidden="true" />;
}
