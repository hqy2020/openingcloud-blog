import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { GrassManager, type GrassPatch } from "./GrassManager";

type PetState = "idle" | "walking_to_grass" | "eating";

type PetPosition = {
  x: number;
  y: number;
};

const STEP_PX = 3;
const EAT_DURATION_MS = 1200;
const INTERACTIVE_SELECTOR = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  "summary",
  "[role='button']",
  "[role='link']",
  "[contenteditable='true']",
].join(",");

function findNearestPatch(position: PetPosition, patches: GrassPatch[], excludedId: string | null) {
  return patches.reduce<GrassPatch | null>((nearest, patch) => {
    if (excludedId && patch.id === excludedId) {
      return nearest;
    }
    if (!nearest) {
      return patch;
    }
    const nearestDistance = Math.hypot(nearest.x - position.x, nearest.y - position.y);
    const currentDistance = Math.hypot(patch.x - position.x, patch.y - position.y);
    return currentDistance < nearestDistance ? patch : nearest;
  }, null);
}

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
  const [targetPatchId, setTargetPatchId] = useState<string | null>(null);
  const [eatingPatchId, setEatingPatchId] = useState<string | null>(null);
  const [grassPatches, setGrassPatches] = useState<GrassPatch[]>([]);
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
    if (typeof window === "undefined") {
      return;
    }
    const placePet = () => {
      const safeX = Math.max(24, window.innerWidth - 180);
      const safeY = Math.max(120, window.innerHeight - 120);
      setPosition({ x: safeX, y: safeY });
    };
    placePet();
    window.addEventListener("resize", placePet);
    return () => window.removeEventListener("resize", placePet);
  }, []);

  useEffect(() => {
    if (!enabled) {
      const rafId = window.requestAnimationFrame(() => {
        setGrassPatches([]);
        setTargetPatchId(null);
        setEatingPatchId(null);
        setPetState("idle");
      });
      return () => window.cancelAnimationFrame(rafId);
    }

    const onClick = (event: MouseEvent) => {
      const targetNode = event.target as Element | null;
      if (targetNode?.closest(INTERACTIVE_SELECTOR)) {
        return;
      }

      const planted = grass.plant(event.clientX, event.clientY);
      if (!planted) {
        return;
      }

      setGrassPatches([ ...grass.patches ]);
      if (petState === "idle" && !targetPatchId && !eatingPatchId) {
        setTargetPatchId(planted.id);
        setPetState("walking_to_grass");
      }
    };

    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [eatingPatchId, enabled, grass, petState, targetPatchId]);

  useEffect(() => {
    if (!enabled || petState !== "walking_to_grass" || !targetPatchId) {
      return;
    }

    const timer = window.setInterval(() => {
      const activeTarget = grass.findById(targetPatchId);
      if (!activeTarget) {
        setTargetPatchId(null);
        setPetState("idle");
        return;
      }

      setPosition((current) => {
        const dx = activeTarget.x - current.x;
        const dy = activeTarget.y - current.y;
        const distance = Math.hypot(dx, dy);

        if (distance <= STEP_PX) {
          setPetState("eating");
          setEatingPatchId(activeTarget.id);
          return { x: activeTarget.x, y: activeTarget.y };
        }

        return {
          x: current.x + (dx / distance) * STEP_PX,
          y: current.y + (dy / distance) * STEP_PX,
        };
      });
    }, 16);

    return () => window.clearInterval(timer);
  }, [enabled, grass, petState, targetPatchId]);

  useEffect(() => {
    if (!enabled || petState !== "eating" || !eatingPatchId) {
      return;
    }

    const timer = window.setTimeout(() => {
      grass.removeById(eatingPatchId);
      const remainingPatches = [ ...grass.patches ];
      const nextPatch = findNearestPatch(position, remainingPatches, null);
      setGrassPatches(remainingPatches);
      setEatingPatchId(null);
      if (nextPatch) {
        setTargetPatchId(nextPatch.id);
        setPetState("walking_to_grass");
      } else {
        setTargetPatchId(null);
        setPetState("idle");
      }
    }, EAT_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [eatingPatchId, enabled, grass, petState, position]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-40">
        <AnimatePresence>
          {grassPatches.map((patch) => {
            const eating = patch.id === eatingPatchId;
            return (
              <motion.div
                key={patch.id}
                className="absolute h-8 w-8"
                style={{ left: patch.x - 16, top: patch.y - 26, transformOrigin: "center bottom" }}
                initial={{ scale: 0, y: 16, opacity: 0 }}
                animate={
                  eating
                    ? { scale: [1, 0.5], y: [0, -8], opacity: [1, 0] }
                    : { scale: 1, y: 0, opacity: 1, rotate: [-3, 3, -3] }
                }
                exit={{ scale: 0.35, y: -10, opacity: 0 }}
                transition={
                  eating
                    ? { duration: 0.5, ease: "easeIn" }
                    : { scale: { duration: 0.26, ease: "easeOut" }, y: { duration: 0.26, ease: "easeOut" }, opacity: { duration: 0.26, ease: "easeOut" }, rotate: { duration: 1.8, repeat: Infinity, ease: "easeInOut" } }
                }
              >
                <span className="absolute bottom-0 left-1.5 h-4 w-1.5 rotate-[-20deg] rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.25)]" />
                <span className="absolute bottom-0 left-3 h-6 w-1.5 rounded-full bg-emerald-600 shadow-[0_0_4px_rgba(5,150,105,0.25)]" />
                <span className="absolute bottom-0 left-[18px] h-4 w-1.5 rotate-[18deg] rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.25)]" />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div
        className="pointer-events-none fixed left-0 top-0 z-40"
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      >
        <motion.div
          className="rounded-full bg-white/92 px-3 py-1 text-xs text-slate-700 shadow-lg ring-1 ring-slate-200/70"
          animate={
            petState === "walking_to_grass"
              ? { x: [0, 1.6, 0, -1.6, 0], y: [0, -1.2, 0] }
              : petState === "eating"
                ? { rotate: [0, -8, 0, -8, 0] }
                : { y: [0, -2, 0] }
          }
          transition={{ duration: petState === "eating" ? 0.5 : 0.8, repeat: Infinity, ease: "easeInOut" }}
        >
          🐑 {petState}
        </motion.div>
      </div>
    </>
  );
}
