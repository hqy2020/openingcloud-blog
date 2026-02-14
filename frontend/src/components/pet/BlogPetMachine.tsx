import { useEffect, useMemo, useState } from "react";
import { GrassManager } from "./GrassManager";

type PetState = "idle" | "walking_to_grass" | "eating";

type PetPosition = {
  x: number;
  y: number;
};

const STEP_PX = 3;

export function BlogPetMachine() {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const lowMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    return !(media.matches || (typeof lowMemory === "number" && lowMemory <= 2));
  });
  const [petState, setPetState] = useState<PetState>("idle");
  const [position, setPosition] = useState<PetPosition>({ x: 0, y: 0 });
  const [target, setTarget] = useState<PetPosition | null>(null);
  const grass = useMemo(() => new GrassManager(10, 200), []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const onChange = () => {
      const lowMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
      const shouldDisable = media.matches || (typeof lowMemory === "number" && lowMemory <= 2);
      setEnabled(!shouldDisable);
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onClick = (event: MouseEvent) => {
      const planted = grass.plant(event.clientX, event.clientY);
      if (!planted) {
        return;
      }

      setTarget({ x: planted.x, y: planted.y });
      setPetState("walking_to_grass");
    };

    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [enabled, grass]);

  useEffect(() => {
    if (!enabled || petState !== "walking_to_grass" || !target) {
      return;
    }

    const timer = window.setInterval(() => {
      setPosition((current) => {
        const dx = target.x - current.x;
        const dy = target.y - current.y;
        const distance = Math.hypot(dx, dy);

        if (distance <= STEP_PX) {
          grass.consumeNearest(target.x, target.y);
          setPetState("eating");
          window.setTimeout(() => {
            setPetState("idle");
            setTarget(null);
          }, 1200);
          return { x: target.x, y: target.y };
        }

        return {
          x: current.x + (dx / distance) * STEP_PX,
          y: current.y + (dy / distance) * STEP_PX,
        };
      });
    }, 16);

    return () => window.clearInterval(timer);
  }, [enabled, grass, petState, target]);

  if (!enabled) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed left-0 top-0 z-40" style={{ transform: `translate(${position.x}px, ${position.y}px)` }}>
      <div className="rounded-full bg-white/90 px-3 py-1 text-xs text-slate-700 shadow-lg">🐑 {petState}</div>
    </div>
  );
}
