import { useEffect, useRef } from "react";

type HeroAtmosphereCanvasProps = {
  mobile?: boolean;
  reducedMotion?: boolean;
  themeMode?: "light" | "dark";
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  twinkle: number;
};

type CloudBand = {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  phase: number;
  alpha: number;
};

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function HeroAtmosphereCanvas({ mobile = false, reducedMotion = false, themeMode = "light" }: HeroAtmosphereCanvasProps) {
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
    let width = 1;
    let height = 1;
    let ratio = 1;
    let lastTimestamp = 0;
    const isDarkTheme = themeMode === "dark";

    const clouds: CloudBand[] = new Array(mobile ? (isDarkTheme ? 3 : 4) : isDarkTheme ? 5 : 6).fill(null).map((_, index) => ({
      x: randomRange(-320, 1280),
      y: randomRange(120, isDarkTheme ? 720 : 660),
      width: randomRange(280, 520),
      height: randomRange(90, 190),
      speed: randomRange(isDarkTheme ? 6 : 8, isDarkTheme ? 14 : 18),
      phase: randomRange(0, Math.PI * 2) + index * 0.35,
      alpha: randomRange(isDarkTheme ? 0.06 : 0.08, isDarkTheme ? 0.12 : 0.16),
    }));

    const particleCount = mobile ? (isDarkTheme ? 24 : 30) : isDarkTheme ? 42 : 56;
    const particles: Particle[] = new Array(particleCount).fill(null).map(() => ({
      x: randomRange(0, 1),
      y: randomRange(0, 1),
      vx: randomRange(-0.018, 0.018),
      vy: randomRange(isDarkTheme ? -0.046 : -0.056, isDarkTheme ? -0.016 : -0.018),
      radius: randomRange(isDarkTheme ? 0.9 : 1, isDarkTheme ? 2.4 : 2.8),
      alpha: randomRange(isDarkTheme ? 0.22 : 0.3, isDarkTheme ? 0.72 : 0.9),
      twinkle: randomRange(0, Math.PI * 2),
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      ratio = Math.max(1, Math.min(1.25, window.devicePixelRatio || 1));
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const resetParticle = (particle: Particle, enteringFromBottom: boolean) => {
      particle.x = randomRange(0, width);
      particle.y = enteringFromBottom ? height + randomRange(6, 32) : randomRange(0, height);
      particle.vx = randomRange(-0.018, 0.018);
      particle.vy = randomRange(isDarkTheme ? -0.046 : -0.056, isDarkTheme ? -0.016 : -0.018);
      particle.radius = randomRange(isDarkTheme ? 0.9 : 1, isDarkTheme ? 2.4 : 2.8);
      particle.alpha = randomRange(isDarkTheme ? 0.22 : 0.3, isDarkTheme ? 0.72 : 0.9);
      particle.twinkle = randomRange(0, Math.PI * 2);
    };

    const render = (timestamp: number, animate: boolean) => {
      const elapsedSeconds = timestamp * 0.001;
      const delta = animate && lastTimestamp ? Math.min(0.05, (timestamp - lastTimestamp) / 1000) : 0;
      lastTimestamp = timestamp;

      context.clearRect(0, 0, width, height);

      const haze = context.createLinearGradient(0, 0, 0, height);
      if (isDarkTheme) {
        haze.addColorStop(0, "rgba(10, 20, 44, 0.14)");
        haze.addColorStop(0.45, "rgba(8, 16, 38, 0.34)");
        haze.addColorStop(1, "rgba(2, 6, 23, 0.62)");
      } else {
        haze.addColorStop(0, "rgba(74, 109, 185, 0.1)");
        haze.addColorStop(0.45, "rgba(40, 69, 136, 0.2)");
        haze.addColorStop(1, "rgba(14, 28, 68, 0.42)");
      }
      context.fillStyle = haze;
      context.fillRect(0, 0, width, height);

      const sunBloom = context.createRadialGradient(width * 0.52, height * 0.04, 0, width * 0.52, height * 0.04, height * 0.82);
      if (isDarkTheme) {
        sunBloom.addColorStop(0, "rgba(147, 197, 253, 0.16)");
        sunBloom.addColorStop(0.2, "rgba(96, 165, 250, 0.1)");
        sunBloom.addColorStop(0.42, "rgba(99, 102, 241, 0.08)");
        sunBloom.addColorStop(1, "rgba(30, 41, 59, 0)");
      } else {
        sunBloom.addColorStop(0, "rgba(255, 228, 170, 0.42)");
        sunBloom.addColorStop(0.2, "rgba(245, 221, 172, 0.2)");
        sunBloom.addColorStop(0.42, "rgba(198, 220, 255, 0.16)");
        sunBloom.addColorStop(1, "rgba(64, 102, 183, 0)");
      }
      context.globalCompositeOperation = "screen";
      context.fillStyle = sunBloom;
      context.fillRect(0, 0, width, height);

      context.globalCompositeOperation = "screen";

      for (const cloud of clouds) {
        if (animate) {
          cloud.x += cloud.speed * delta;
          if (cloud.x - cloud.width > width + 140) {
            cloud.x = -cloud.width - 120;
            cloud.y = randomRange(height * 0.26, height * 0.86);
          }
        }
        const sway = Math.sin(elapsedSeconds * 0.34 + cloud.phase) * 18;
        const cx = cloud.x;
        const cy = cloud.y + sway;
        const radius = cloud.width * 0.74;
        const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, radius);
        if (isDarkTheme) {
          gradient.addColorStop(0, `rgba(176, 210, 255, ${cloud.alpha * 0.72})`);
          gradient.addColorStop(0.55, `rgba(82, 118, 176, ${cloud.alpha * 0.44})`);
          gradient.addColorStop(1, "rgba(15, 23, 42, 0)");
        } else {
          gradient.addColorStop(0, `rgba(216, 232, 255, ${cloud.alpha * 1.15})`);
          gradient.addColorStop(0.55, `rgba(152, 181, 242, ${cloud.alpha * 0.58})`);
          gradient.addColorStop(1, "rgba(46, 74, 136, 0)");
        }
        context.fillStyle = gradient;
        context.beginPath();
        context.ellipse(cx, cy, cloud.width, cloud.height, 0, 0, Math.PI * 2);
        context.fill();
      }

      context.shadowBlur = mobile ? (isDarkTheme ? 5 : 7) : isDarkTheme ? 7 : 10;
      context.shadowColor = isDarkTheme ? "rgba(147, 197, 253, 0.36)" : "rgba(218, 233, 255, 0.55)";
      for (const [index, particle] of particles.entries()) {
        if (animate) {
          particle.x += particle.vx * 64;
          particle.y += particle.vy * 64;
          if (particle.y < -12 || particle.x < -18 || particle.x > width + 18) {
            resetParticle(particle, true);
          }
        }

        const twinkle = 0.62 + 0.38 * Math.sin(elapsedSeconds * 2.2 + particle.twinkle);
        const nearField = index % 7 === 0 ? 1.35 : 1;
        context.fillStyle = isDarkTheme
          ? `rgba(191, 219, 254, ${Math.min(0.88, particle.alpha * twinkle * 0.84)})`
          : `rgba(230, 241, 255, ${Math.min(1, particle.alpha * twinkle)})`;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius * nearField, 0, Math.PI * 2);
        context.fill();
      }
      context.shadowBlur = 0;

      context.globalCompositeOperation = "source-over";
    };

    resize();
    for (const particle of particles) {
      resetParticle(particle, false);
    }

    if (reducedMotion) {
      render(performance.now(), false);
    } else {
      const animate = (timestamp: number) => {
        render(timestamp, true);
        rafId = window.requestAnimationFrame(animate);
      };
      rafId = window.requestAnimationFrame(animate);
    }

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [mobile, reducedMotion, themeMode]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />;
}
