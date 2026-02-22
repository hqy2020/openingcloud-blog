import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GrassManager, type GrassPatch } from "./GrassManager";
import { PetSprite } from "./PetSprite";
import type { PetAnim } from "./petSpriteAtlas";

type PetState = "at_home_idle" | "walking_to_grass" | "eating" | "returning_home";
type PetFacing = "left" | "right";

type PetPosition = {
  x: number;
  y: number;
};

const EAT_DURATION_MS = 1200;
const CHAT_CYCLE_MS = 6000;
const RETURN_HOME_DELAY_MS = 10_000;
const START_SPEED_PX = 0.8;
const MAX_SPEED_PX = 6.2;
const ACCELERATION_PX = 0.24;
const ARRIVAL_THRESHOLD_PX = 4;
const HOME_ARRIVAL_THRESHOLD_PX = 8;
// Keep the sheep's mouth anchored to the same world point regardless of facing direction.
const PET_MOUTH_OFFSET_X_LEFT = 14;
const PET_MOUTH_OFFSET_X_RIGHT = 50;
const PET_MOUTH_OFFSET_Y = 30;
const PET_GRASS_SRC = "/media/pet/grass-cutout.png";
const PET_CLOUD_HOME_SRC = "/media/pet/clouds-home-clean.png";
const PET_CHAT_LINES = [
  "咩咩，我在云上等你喂草呀～",
  "今天也要一起把博客养肥一点吗？",
  "轻点一下地面，我就开吃啦！",
  "我先在云上巡逻，等你的草信号。",
  "咩～别让我饿太久，我会想你。",
];
const CLOUD_HOME_WIDTH = 168;
const CLOUD_HOME_HEIGHT = 168;
const CLOUD_HOME_RIGHT = 14;
const CLOUD_HOME_BOTTOM = 10;
const CLOUD_HOME_ANCHOR_X = 74;
const CLOUD_HOME_ANCHOR_Y = 72;
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

function createHomeAnchor(viewportWidth: number, viewportHeight: number): PetPosition {
  const cloudLeft = viewportWidth - CLOUD_HOME_WIDTH - CLOUD_HOME_RIGHT;
  const cloudTop = viewportHeight - CLOUD_HOME_HEIGHT - CLOUD_HOME_BOTTOM;
  return {
    x: Math.max(PET_MOUTH_OFFSET_X_RIGHT + 12, cloudLeft + CLOUD_HOME_ANCHOR_X),
    y: Math.max(PET_MOUTH_OFFSET_Y + 16, cloudTop + CLOUD_HOME_ANCHOR_Y),
  };
}

function isNearPosition(from: PetPosition, to: PetPosition, threshold = HOME_ARRIVAL_THRESHOLD_PX) {
  return Math.hypot(from.x - to.x, from.y - to.y) <= threshold;
}

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
  const initialHomeAnchor =
    typeof window === "undefined"
      ? createHomeAnchor(0, 0)
      : createHomeAnchor(window.innerWidth, window.innerHeight);
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const lowMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    return !(media.matches || (typeof lowMemory === "number" && lowMemory <= 2));
  });
  const [petState, setPetState] = useState<PetState>("at_home_idle");
  const [petFacing, setPetFacing] = useState<PetFacing>("left");
  const [homeAnchor, setHomeAnchor] = useState<PetPosition>(initialHomeAnchor);
  const homeAnchorRef = useRef<PetPosition>(initialHomeAnchor);
  const [position, setPosition] = useState<PetPosition>(initialHomeAnchor);
  const positionRef = useRef<PetPosition>(initialHomeAnchor);
  const speedRef = useRef(0);
  const [targetPatchId, setTargetPatchId] = useState<string | null>(null);
  const [eatingPatchId, setEatingPatchId] = useState<string | null>(null);
  const [grassPatches, setGrassPatches] = useState<GrassPatch[]>([]);
  const [chatIndex, setChatIndex] = useState(0);
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
    const placeHome = () => {
      const previousHome = homeAnchorRef.current;
      const nextHome = createHomeAnchor(window.innerWidth, window.innerHeight);
      homeAnchorRef.current = nextHome;
      setHomeAnchor(nextHome);
      if (petState === "at_home_idle" && isNearPosition(positionRef.current, previousHome, HOME_ARRIVAL_THRESHOLD_PX + 6)) {
        setPosition(nextHome);
      }
    };
    placeHome();
    window.addEventListener("resize", placeHome);
    return () => window.removeEventListener("resize", placeHome);
  }, [petState]);

  useEffect(() => {
    if (!enabled) {
      const rafId = window.requestAnimationFrame(() => {
        setGrassPatches([]);
        setTargetPatchId(null);
        setEatingPatchId(null);
        setPetState("at_home_idle");
        setPetFacing("left");
        setPosition(homeAnchorRef.current);
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
      if ((petState === "at_home_idle" || petState === "returning_home") && !eatingPatchId) {
        setPetFacing(planted.x >= positionRef.current.x ? "right" : "left");
        setTargetPatchId(planted.id);
        speedRef.current = 0;
        setPetState("walking_to_grass");
      }
    };

    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [eatingPatchId, enabled, grass, petState]);

  useEffect(() => {
    if (!enabled || petState !== "at_home_idle" || grassPatches.length === 0 || eatingPatchId) {
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
    if (!enabled || (petState !== "walking_to_grass" && petState !== "returning_home")) {
      return;
    }

    const timer = window.setInterval(() => {
      if (petState === "walking_to_grass") {
        const activeTarget = findNearestPatch(positionRef.current, grass.patches, eatingPatchId);
        if (!activeTarget) {
          setTargetPatchId(null);
          speedRef.current = 0;
          setPetState("at_home_idle");
          setPetFacing("left");
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
            speedRef.current = 0;
            setPetState("eating");
            setEatingPatchId(activeTarget.id);
            return { x: activeTarget.x, y: activeTarget.y };
          }

          return {
            x: current.x + (dx / distance) * step,
            y: current.y + (dy / distance) * step,
          };
        });
        return;
      }

      const homeTarget = homeAnchorRef.current;
      if (petState === "returning_home") {
        setTargetPatchId(null);
      }

      setPosition((current) => {
        const dx = homeTarget.x - current.x;
        const dy = homeTarget.y - current.y;
        const distance = Math.hypot(dx, dy);

        if (Math.abs(dx) > 0.5) {
          setPetFacing(dx > 0 ? "right" : "left");
        }

        speedRef.current = Math.min(MAX_SPEED_PX, Math.max(START_SPEED_PX, speedRef.current + ACCELERATION_PX));
        const step = Math.min(distance, speedRef.current);

        if (distance <= ARRIVAL_THRESHOLD_PX || step >= distance) {
          speedRef.current = 0;
          setPetState("at_home_idle");
          setEatingPatchId(null);
          setPetFacing("left");
          return { x: homeTarget.x, y: homeTarget.y };
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

      if (remainingPatches.length > 0) {
        const nextPatch = findNearestPatch(positionRef.current, remainingPatches, null);
        if (nextPatch) {
          setPetFacing(nextPatch.x >= positionRef.current.x ? "right" : "left");
          setTargetPatchId(nextPatch.id);
          setPetState("walking_to_grass");
          return;
        }
      }

      setTargetPatchId(null);
      setPetState("at_home_idle");
    }, EAT_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [eatingPatchId, enabled, grass, petState]);

  useEffect(() => {
    if (!enabled || grassPatches.length > 0 || petState === "walking_to_grass" || petState === "eating" || petState === "returning_home") {
      return;
    }

    if (isNearPosition(positionRef.current, homeAnchorRef.current)) {
      if (petState !== "at_home_idle") {
        const rafId = window.requestAnimationFrame(() => {
          setPetState("at_home_idle");
        });
        return () => window.cancelAnimationFrame(rafId);
      }
      return;
    }

    const timer = window.setTimeout(() => {
      if (grass.patches.length > 0) {
        return;
      }
      const current = positionRef.current;
      const home = homeAnchorRef.current;
      if (isNearPosition(current, home)) {
        setPosition(home);
        setPetState("at_home_idle");
        setPetFacing("left");
        return;
      }
      setPetFacing(home.x >= current.x ? "right" : "left");
      setTargetPatchId(null);
      setEatingPatchId(null);
      speedRef.current = 0;
      setPetState("returning_home");
    }, RETURN_HOME_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [enabled, grass.patches, grassPatches.length, petState]);

  const showHomeBubble = petState === "at_home_idle" && grassPatches.length === 0 && isNearPosition(position, homeAnchor, HOME_ARRIVAL_THRESHOLD_PX + 2);

  useEffect(() => {
    if (!enabled || !showHomeBubble) {
      return;
    }
    const timer = window.setInterval(() => {
      setChatIndex((prev) => (prev + 1) % PET_CHAT_LINES.length);
    }, CHAT_CYCLE_MS);
    return () => window.clearInterval(timer);
  }, [enabled, showHomeBubble]);

  useEffect(() => {
    if (!showHomeBubble) {
      return;
    }
    const rafId = window.requestAnimationFrame(() => {
      setChatIndex(0);
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [showHomeBubble]);

  if (!enabled) {
    return null;
  }

  const cloudRenderX = homeAnchor.x - CLOUD_HOME_ANCHOR_X;
  const cloudRenderY = homeAnchor.y - CLOUD_HOME_ANCHOR_Y;
  const petRenderX = position.x - (petFacing === "right" ? PET_MOUTH_OFFSET_X_RIGHT : PET_MOUTH_OFFSET_X_LEFT);
  const petRenderY = position.y - PET_MOUTH_OFFSET_Y;
  const petAnimationState: PetAnim =
    petState === "walking_to_grass" || petState === "returning_home"
      ? "run"
      : petState === "eating"
        ? "eat"
        : "idle";

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

      <div className="pointer-events-none fixed left-0 top-0 z-40" style={{ transform: `translate(${cloudRenderX}px, ${cloudRenderY}px)` }}>
        <motion.img
          src={PET_CLOUD_HOME_SRC}
          alt=""
          className="h-[168px] w-[168px] select-none object-contain opacity-95"
          draggable={false}
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="pointer-events-none fixed left-0 top-0 z-50" style={{ transform: `translate(${petRenderX}px, ${petRenderY}px)` }}>
        <AnimatePresence mode="wait">
          {showHomeBubble ? (
            <motion.div
              key={`pet-bubble-${chatIndex}`}
              className="pointer-events-none absolute bottom-[56px] right-[6px] w-[220px]"
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            >
              <div className="relative rounded-2xl border border-slate-200/85 bg-white/95 px-3 py-2 text-xs text-slate-700 shadow-[0_8px_18px_rgba(15,23,42,0.08)]">
                {PET_CHAT_LINES[chatIndex]}
                <span className="absolute -bottom-1.5 right-8 h-3 w-3 rotate-45 border-b border-r border-slate-200/85 bg-white/95" />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      <PetSprite
        position={{ x: petRenderX, y: petRenderY }}
        state={petAnimationState}
        facing={petFacing}
        ariaLabel={`pet-${petState}`}
      />
    </>
  );
}
