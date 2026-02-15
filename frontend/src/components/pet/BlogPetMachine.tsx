import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GrassManager, type GrassPatch } from "./GrassManager";

type PetState = "idle" | "walking_to_grass" | "eating";
type PetFacing = "left" | "right";

type PetPosition = {
  x: number;
  y: number;
};

const EAT_DURATION_MS = 1200;
const START_SPEED_PX = 0.8;
const MAX_SPEED_PX = 6.2;
const ACCELERATION_PX = 0.24;
const ARRIVAL_THRESHOLD_PX = 4;
// Keep the sheep's mouth anchored to the same world point regardless of facing direction.
const PET_MOUTH_OFFSET_X_LEFT = 8;
const PET_MOUTH_OFFSET_X_RIGHT = 44;
const PET_MOUTH_OFFSET_Y = 24;
const PET_SHEEP_SRC = "/media/pet/sheep-cutout.png";
const PET_GRASS_SRC = "/media/pet/grass-cutout.png";
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
  const [petFacing, setPetFacing] = useState<PetFacing>("left");
  const [position, setPosition] = useState<PetPosition>({ x: 0, y: 0 });
  const positionRef = useRef<PetPosition>({ x: 0, y: 0 });
  const speedRef = useRef(0);
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
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const placePet = () => {
      const safeX = Math.max(PET_MOUTH_OFFSET_X_RIGHT + 12, window.innerWidth - 140);
      const safeY = Math.max(PET_MOUTH_OFFSET_Y + 20, window.innerHeight - 96);
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
        setPetFacing("left");
        speedRef.current = 0;
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
        setPetFacing(planted.x >= positionRef.current.x ? "right" : "left");
        setTargetPatchId(planted.id);
        speedRef.current = 0;
        setPetState("walking_to_grass");
      }
    };

    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [eatingPatchId, enabled, grass, petState, targetPatchId]);

  useEffect(() => {
    if (!enabled || petState !== "idle" || grassPatches.length === 0 || eatingPatchId) {
      return;
    }
    const nextPatch = findNearestPatch(positionRef.current, grassPatches, null);
    if (!nextPatch) {
      return;
    }
    const rafId = window.requestAnimationFrame(() => {
      setPetFacing(nextPatch.x >= positionRef.current.x ? "right" : "left");
      setTargetPatchId(nextPatch.id);
      speedRef.current = 0;
      setPetState("walking_to_grass");
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [eatingPatchId, enabled, grassPatches, petState]);

  useEffect(() => {
    if (!enabled || petState !== "walking_to_grass") {
      return;
    }

    const timer = window.setInterval(() => {
      const activeTarget = findNearestPatch(positionRef.current, grass.patches, eatingPatchId);
      if (!activeTarget) {
        setTargetPatchId(null);
        speedRef.current = 0;
        setPetState("idle");
        return;
      }
      if (targetPatchId !== activeTarget.id) {
        setTargetPatchId(activeTarget.id);
      }

      setPosition((current) => {
        const dx = activeTarget.x - current.x;
        const dy = activeTarget.y - current.y;
        const distance = Math.hypot(dx, dy);

        if (Math.abs(dx) > 0.5) {
          setPetFacing(dx > 0 ? "right" : "left");
        }

        speedRef.current = Math.min(MAX_SPEED_PX, Math.max(START_SPEED_PX, speedRef.current + ACCELERATION_PX));
        const step = Math.min(distance, speedRef.current);

        if (distance <= ARRIVAL_THRESHOLD_PX || step >= distance) {
          setPetState("eating");
          setEatingPatchId(activeTarget.id);
          speedRef.current = 0;
          return { x: activeTarget.x, y: activeTarget.y };
        }

        return {
          x: current.x + (dx / distance) * step,
          y: current.y + (dy / distance) * step,
        };
      });
    }, 16);

    return () => window.clearInterval(timer);
  }, [eatingPatchId, enabled, grass.patches, petState, targetPatchId]);

  useEffect(() => {
    if (!enabled || petState !== "eating" || !eatingPatchId) {
      return;
    }

    const timer = window.setTimeout(() => {
      grass.removeById(eatingPatchId);
      const remainingPatches = [ ...grass.patches ];
      setGrassPatches(remainingPatches);
      setEatingPatchId(null);
      speedRef.current = 0;
      setTargetPatchId(null);
      setPetState("idle");
    }, EAT_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [eatingPatchId, enabled, grass, petState]);

  if (!enabled) {
    return null;
  }

  const petRenderX = position.x - (petFacing === "right" ? PET_MOUTH_OFFSET_X_RIGHT : PET_MOUTH_OFFSET_X_LEFT);
  const petRenderY = position.y - PET_MOUTH_OFFSET_Y;

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-40">
        <AnimatePresence>
          {grassPatches.map((patch) => {
            const eating = patch.id === eatingPatchId;
            return (
              <motion.div
                key={patch.id}
                className="absolute h-8 w-14"
                style={{ left: patch.x - 28, top: patch.y - 22, transformOrigin: "center bottom" }}
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
                <img
                  src={PET_GRASS_SRC}
                  alt=""
                  className="h-full w-full select-none object-fill [transform:scaleY(0.72)]"
                  draggable={false}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div
        className="pointer-events-none fixed left-0 top-0 z-40"
        style={{ transform: `translate(${petRenderX}px, ${petRenderY}px)` }}
      >
        <motion.div
          aria-label={`pet-${petState}`}
          className="text-3xl leading-none [filter:drop-shadow(0_4px_8px_rgba(15,23,42,0.3))]"
          animate={
            petState === "walking_to_grass"
              ? { x: [0, 1.6, 0, -1.6, 0], y: [0, -1.2, 0] }
              : petState === "eating"
                ? { rotate: [0, -8, 0, -8, 0] }
                : { y: [0, -2, 0] }
          }
          transition={{ duration: petState === "eating" ? 0.5 : 0.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <span
            className="inline-block will-change-transform"
            style={{ transform: `scaleX(${petFacing === "right" ? -1 : 1})` }}
          >
            <img src={PET_SHEEP_SRC} alt="" className="h-14 w-auto select-none" draggable={false} />
          </span>
        </motion.div>
      </div>
    </>
  );
}
