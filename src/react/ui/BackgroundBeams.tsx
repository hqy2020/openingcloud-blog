import { useEffect, useRef } from 'react';
import { cn } from './cn';

interface BackgroundBeamsProps {
  className?: string;
}

export function BackgroundBeams({ className }: BackgroundBeamsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);

    const beams = Array.from({ length: 6 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      dx: (Math.random() - 0.5) * 0.5,
      dy: (Math.random() - 0.5) * 0.3,
      width: Math.random() * 2 + 0.5,
      hue: 210 + Math.random() * 30,
    }));

    function draw() {
      ctx!.clearRect(0, 0, w, h);

      for (const beam of beams) {
        beam.x += beam.dx;
        beam.y += beam.dy;

        if (beam.x < -50) beam.x = w + 50;
        if (beam.x > w + 50) beam.x = -50;
        if (beam.y < -50) beam.y = h + 50;
        if (beam.y > h + 50) beam.y = -50;

        const gradient = ctx!.createLinearGradient(
          beam.x - 200, beam.y - 200,
          beam.x + 200, beam.y + 200
        );
        gradient.addColorStop(0, `hsla(${beam.hue}, 80%, 65%, 0)`);
        gradient.addColorStop(0.5, `hsla(${beam.hue}, 80%, 65%, 0.03)`);
        gradient.addColorStop(1, `hsla(${beam.hue}, 80%, 65%, 0)`);

        ctx!.save();
        ctx!.translate(beam.x, beam.y);
        ctx!.rotate(Math.atan2(beam.dy, beam.dx));
        ctx!.fillStyle = gradient;
        ctx!.fillRect(-300, -beam.width, 600, beam.width * 2);
        ctx!.restore();
      }

      animationRef.current = requestAnimationFrame(draw);
    }

    draw();

    const onResize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute inset-0 w-full h-full pointer-events-none', className)}
    />
  );
}
