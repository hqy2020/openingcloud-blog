import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { GrassManager } from "./GrassManager";
import { PetEffects } from "./PetEffects";
import {
  PET_PARTS,
  PET_SOURCES,
  PET_WORLD,
  type GrassPatch,
  type PetPartId,
  type PetPosition,
  type PetState,
} from "./petRigConfig";
import { usePetStateMachine } from "./usePetStateMachine";

type PartAnimate = {
  x?: number | number[];
  y?: number | number[];
  rotate?: number | number[];
  scale?: number | number[];
  scaleX?: number | number[];
  scaleY?: number | number[];
  opacity?: number | number[];
};

type PartTransition = {
  duration: number;
  ease?: "easeIn" | "easeOut" | "easeInOut" | "linear";
  repeat?: number;
  delay?: number;
};

function createHomeAnchor(viewportWidth: number, viewportHeight: number): PetPosition {
  const cloudLeft = viewportWidth - PET_WORLD.cloudHomeWidth - PET_WORLD.cloudHomeRight;
  const cloudTop = viewportHeight - PET_WORLD.cloudHomeHeight - PET_WORLD.cloudHomeBottom;
  return {
    x: Math.max(PET_WORLD.mouthOffsetXRight + 12, cloudLeft + PET_WORLD.cloudHomeAnchorX),
    y: Math.max(PET_WORLD.mouthOffsetY + 16, cloudTop + PET_WORLD.cloudHomeAnchorY),
  };
}

function isWalkingState(state: PetState) {
  return state === "walking_to_grass" || state === "returning_home";
}

function getPartMotion(partId: PetPartId, petState: PetState, lookAngleDeg: number) {
  const walking = isWalkingState(petState);
  const dragging = petState === "dragging";

  const fallback = {
    animate: { x: 0, y: 0, rotate: 0, scale: 1, scaleX: 1, scaleY: 1, opacity: 1 } satisfies PartAnimate,
    transition: { duration: 0.001 } satisfies PartTransition,
  };

  if (partId === "sheep_shadow") {
    if (walking || dragging) {
      return {
        animate: { scaleX: [1, 0.92, 1], opacity: [0.32, 0.24, 0.32] } satisfies PartAnimate,
        transition: { duration: 0.55, repeat: Infinity, ease: "easeInOut" } satisfies PartTransition,
      };
    }
    if (petState === "happy") {
      return {
        animate: { scaleX: [1, 0.86, 1], opacity: [0.28, 0.18, 0.28] } satisfies PartAnimate,
        transition: { duration: 0.45, repeat: Infinity, ease: "easeInOut" } satisfies PartTransition,
      };
    }
    if (petState === "sleeping") {
      return {
        animate: { scaleX: [1, 1.05, 1], opacity: [0.28, 0.22, 0.28] } satisfies PartAnimate,
        transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" } satisfies PartTransition,
      };
    }
    return {
      animate: { scaleX: [1, 0.98, 1], opacity: [0.3, 0.26, 0.3] } satisfies PartAnimate,
      transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } satisfies PartTransition,
    };
  }

  if (partId === "sheep_body") {
    if (walking || dragging) {
      return {
        animate: { y: [0, -1.6, 0], rotate: [0, 0.8, 0, -0.8, 0] } satisfies PartAnimate,
        transition: { duration: 0.55, repeat: Infinity, ease: "easeInOut" } satisfies PartTransition,
      };
    }
    if (petState === "eating") {
      return {
        animate: { y: [0, 0.8, 0] } satisfies PartAnimate,
        transition: { duration: 0.42, repeat: Infinity, ease: "easeInOut" } satisfies PartTransition,
      };
    }
    if (petState === "happy") {
      return {
        animate: { y: [0, -4.2, 0], scale: [1, 1.04, 1] } satisfies PartAnimate,
        transition: { duration: 0.45, repeat: Infinity, ease: "easeInOut" } satisfies PartTransition,
      };
    }
    if (petState === "sleeping") {
      return {
        animate: { y: [0, 1.2, 0] } satisfies PartAnimate,
        transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" } satisfies PartTransition,
      };
    }
    return {
      animate: { y: [0, -1.3, 0], scaleY: [1, 1.02, 1] } satisfies PartAnimate,
      transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } satisfies PartTransition,
    };
  }

  if (partId === "sheep_head") {
    if (petState === "eating") {
      return {
        animate: { rotate: [lookAngleDeg, lookAngleDeg + 8, lookAngleDeg, lookAngleDeg + 6, lookAngleDeg] } satisfies PartAnimate,
        transition: { duration: 0.42, repeat: Infinity, ease: "easeInOut" } satisfies PartTransition,
      };
    }
    if (petState === "happy") {
      return {
        animate: { rotate: [lookAngleDeg, lookAngleDeg - 8, lookAngleDeg + 6, lookAngleDeg] } satisfies PartAnimate,
        transition: { duration: 0.32, repeat: Infinity, ease: "easeInOut" } satisfies PartTransition,
      };
    }
    if (petState === "sleeping") {
      return {
        animate: { rotate: [10, 11, 10] } satisfies PartAnimate,
        transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" } satisfies PartTransition,
      };
    }
    if (petState === "waking") {
      return {
        animate: { rotate: [8, -4, 0] } satisfies PartAnimate,
        transition: { duration: 0.6, ease: "easeOut" } satisfies PartTransition,
      };
    }
    if (walking || dragging) {
      return {
        animate: { rotate: [0, 1.4, 0, -1.2, 0] } satisfies PartAnimate,
        transition: { duration: 0.55, repeat: Infinity, ease: "easeInOut" } satisfies PartTransition,
      };
    }
    return {
      animate: { rotate: lookAngleDeg } satisfies PartAnimate,
      transition: { duration: 0.16, ease: "easeOut" } satisfies PartTransition,
    };
  }

  if (partId === "sheep_ear_l") {
    if (petState === "sleeping") {
      return {
        animate: { rotate: [14, 16, 14] } satisfies PartAnimate,
        transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" } satisfies PartTransition,
      };
    }
    if (dragging) {
      return {
        animate: { rotate: [0, -12, 0, 10, 0] } satisfies PartAnimate,
        transition: { duration: 0.36, repeat: Infinity, ease: "easeInOut" } satisfies PartTransition,
      };
    }
    return {
      animate: { rotate: [0, -7, 0] } satisfies PartAnimate,
      transition: { duration: 4.2, repeat: Infinity, ease: "easeInOut" } satisfies PartTransition,
    };
  }

  if (partId === "sheep_ear_r") {
    if (petState === "sleeping") {
      return {
        animate: { rotate: [-14, -16, -14] } satisfies PartAnimate,
        transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" } satisfies PartTransition,
      };
    }
    if (dragging) {
      return {
        animate: { rotate: [0, 12, 0, -10, 0] } satisfies PartAnimate,
        transition: { duration: 0.36, repeat: Infinity, ease: "easeInOut" } satisfies PartTransition,
      };
    }
    return {
      animate: { rotate: [0, 7, 0] } satisfies PartAnimate,
      transition: { duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.16 } satisfies PartTransition,
    };
  }

  if (partId === "sheep_tail") {
    if (petState === "sleeping") {
      return {
        animate: { rotate: [8, 10, 8] } satisfies PartAnimate,
        transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" } satisfies PartTransition,
      };
    }
    if (petState === "happy" || walking || dragging) {
      return {
        animate: { rotate: [0, 15, 0, -12, 0] } satisfies PartAnimate,
        transition: { duration: 0.42, repeat: Infinity, ease: "easeInOut" } satisfies PartTransition,
      };
    }
    return {
      animate: { rotate: [0, 8, 0, -8, 0] } satisfies PartAnimate,
      transition: { duration: 1.3, repeat: Infinity, ease: "easeInOut" } satisfies PartTransition,
    };
  }

  if (partId === "sheep_leg_fl") {
    if (walking || dragging) {
      return {
        animate: { rotate: [16, -12, 16] } satisfies PartAnimate,
        transition: { duration: 0.55, repeat: Infinity, ease: "linear" } satisfies PartTransition,
      };
    }
    if (petState === "eating") {
      return {
        animate: { rotate: [5, -6, 5] } satisfies PartAnimate,
        transition: { duration: 0.42, repeat: Infinity, ease: "easeInOut" } satisfies PartTransition,
      };
    }
    if (petState === "sleeping") {
      return {
        animate: { rotate: 18 } satisfies PartAnimate,
        transition: { duration: 0.2, ease: "easeOut" } satisfies PartTransition,
      };
    }
    return fallback;
  }

  if (partId === "sheep_leg_fr") {
    if (walking || dragging) {
      return {
        animate: { rotate: [-12, 16, -12] } satisfies PartAnimate,
        transition: { duration: 0.55, repeat: Infinity, ease: "linear" } satisfies PartTransition,
      };
    }
    if (petState === "eating") {
      return {
        animate: { rotate: [-6, 5, -6] } satisfies PartAnimate,
        transition: { duration: 0.42, repeat: Infinity, ease: "easeInOut" } satisfies PartTransition,
      };
    }
    if (petState === "sleeping") {
      return {
        animate: { rotate: 16 } satisfies PartAnimate,
        transition: { duration: 0.2, ease: "easeOut" } satisfies PartTransition,
      };
    }
    return fallback;
  }

  if (partId === "sheep_leg_bl") {
    if (walking || dragging) {
      return {
        animate: { rotate: [-10, 10, -10] } satisfies PartAnimate,
        transition: { duration: 0.55, repeat: Infinity, ease: "linear" } satisfies PartTransition,
      };
    }
    if (petState === "sleeping") {
      return {
        animate: { rotate: 18 } satisfies PartAnimate,
        transition: { duration: 0.2, ease: "easeOut" } satisfies PartTransition,
      };
    }
    return fallback;
  }

  if (partId === "sheep_leg_br") {
    if (walking || dragging) {
      return {
        animate: { rotate: [10, -10, 10] } satisfies PartAnimate,
        transition: { duration: 0.55, repeat: Infinity, ease: "linear" } satisfies PartTransition,
      };
    }
    if (petState === "sleeping") {
      return {
        animate: { rotate: 18 } satisfies PartAnimate,
        transition: { duration: 0.2, ease: "easeOut" } satisfies PartTransition,
      };
    }
    return fallback;
  }

  return fallback;
}

function getGrassFrame(patch: GrassPatch) {
  switch (patch.stage) {
    case "sprout":
      return patch.createdAt % 2 === 0 ? PET_SOURCES.grass.sproutA : PET_SOURCES.grass.sproutB;
    case "being_eaten":
      return patch.createdAt % 2 === 0 ? PET_SOURCES.grass.eatA : PET_SOURCES.grass.eatB;
    case "vanishing":
      return PET_SOURCES.grass.eatB;
    case "grown":
    default:
      return patch.createdAt % 2 === 0 ? PET_SOURCES.grass.growB : PET_SOURCES.grass.full;
  }
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

  const [homeAnchor, setHomeAnchor] = useState<PetPosition>(initialHomeAnchor);
  const [allowDrag, setAllowDrag] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    const pointerFine = window.matchMedia("(pointer: fine)").matches;
    return pointerFine && window.innerWidth >= 768;
  });

  const grass = useMemo(() => new GrassManager(10, 200), []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerFine = window.matchMedia("(pointer: fine)");

    const updateFeatureFlags = () => {
      const lowMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
      setEnabled(!(reducedMotion.matches || (typeof lowMemory === "number" && lowMemory <= 2)));
      setAllowDrag(pointerFine.matches && window.innerWidth >= 768);
    };

    const placeHome = () => {
      setHomeAnchor(createHomeAnchor(window.innerWidth, window.innerHeight));
      setAllowDrag(pointerFine.matches && window.innerWidth >= 768);
    };

    updateFeatureFlags();
    placeHome();

    reducedMotion.addEventListener("change", updateFeatureFlags);
    pointerFine.addEventListener("change", updateFeatureFlags);
    window.addEventListener("resize", placeHome);

    return () => {
      reducedMotion.removeEventListener("change", updateFeatureFlags);
      pointerFine.removeEventListener("change", updateFeatureFlags);
      window.removeEventListener("resize", placeHome);
    };
  }, []);

  const {
    petState,
    petMood,
    petFacing,
    position,
    grassPatches,
    targetPatchId,
    chatIndex,
    eatLineIndex,
    showHomeBubble,
    showGuideTip,
    blinkClosed,
    mouthOpen,
    lookAngleDeg,
    onPetPointerDown,
  } = usePetStateMachine({
    enabled,
    homeAnchor,
    grass,
    allowDrag,
  });

  if (!enabled) {
    return null;
  }

  const cloudRenderX = homeAnchor.x - PET_WORLD.cloudHomeAnchorX;
  const cloudRenderY = homeAnchor.y - PET_WORLD.cloudHomeAnchorY;
  const petRenderX = position.x - (petFacing === "right" ? PET_WORLD.mouthOffsetXRight : PET_WORLD.mouthOffsetXLeft);
  const petRenderY = position.y - PET_WORLD.mouthOffsetY;
  const effectiveLook = petFacing === "right" ? -lookAngleDeg : lookAngleDeg;

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-40">
        <AnimatePresence>
          {grassPatches.map((patch) => {
            const isVanishing = patch.stage === "vanishing";
            const isBeingEaten = patch.stage === "being_eaten";
            return (
              <motion.div
                key={patch.id}
                className="absolute"
                style={{ left: patch.x - 34, top: patch.y - 30, transformOrigin: "center bottom" }}
                initial={{ scale: 0, y: 16, opacity: 0 }}
                animate={
                  isVanishing
                    ? { scale: [0.9, 0.38], y: [0, -9], opacity: [0.8, 0] }
                    : isBeingEaten
                      ? { scale: [1, 0.72, 0.86], y: [0, -4, -1], opacity: [1, 0.92, 0.88] }
                      : { scale: 1, y: 0, opacity: 1, rotate: [-2, 2, -2] }
                }
                exit={{ scale: 0.32, y: -10, opacity: 0 }}
                transition={
                  isVanishing
                    ? { duration: 0.42, ease: "easeIn" }
                    : isBeingEaten
                      ? { duration: 0.42, ease: "easeInOut", repeat: Infinity }
                      : {
                          scale: { duration: 0.28, ease: "easeOut" },
                          y: { duration: 0.28, ease: "easeOut" },
                          opacity: { duration: 0.28, ease: "easeOut" },
                          rotate: { duration: 1.7, repeat: Infinity, ease: "easeInOut" },
                        }
                }
              >
                <img
                  src={getGrassFrame(patch)}
                  alt=""
                  className="h-[68px] w-[68px] select-none object-contain"
                  draggable={false}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="pointer-events-none fixed left-0 top-0 z-40" style={{ transform: `translate(${cloudRenderX}px, ${cloudRenderY}px)` }}>
        <motion.img
          src={PET_SOURCES.cloudHome}
          alt=""
          className="h-[168px] w-[168px] select-none object-contain opacity-95"
          draggable={false}
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <PetEffects
        petState={petState}
        petMood={petMood}
        petRenderX={petRenderX}
        petRenderY={petRenderY}
        chatIndex={chatIndex}
        eatLineIndex={eatLineIndex}
        showHomeBubble={showHomeBubble}
        showGuideTip={showGuideTip}
      />

      <div className="pointer-events-none fixed left-0 top-0 z-40" style={{ transform: `translate(${petRenderX}px, ${petRenderY}px)` }}>
        <div
          data-pet-draggable="true"
          aria-label={targetPatchId ? `pet-${petState}-to-${targetPatchId}` : `pet-${petState}`}
          className={`pointer-events-auto relative select-none ${allowDrag ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
          onPointerDown={onPetPointerDown}
          style={{
            width: PET_WORLD.renderWidth,
            height: PET_WORLD.renderHeight,
            filter: "drop-shadow(0 4px 8px rgba(15,23,42,0.28))",
          }}
        >
          <div
            className="absolute left-0 top-0"
            style={{
              width: PET_WORLD.rigLogicalWidth,
              height: PET_WORLD.rigLogicalHeight,
              transform: `scale(${PET_WORLD.rigScale}) scaleX(${petFacing === "right" ? -1 : 1})`,
              transformOrigin: petFacing === "right" ? "top right" : "top left",
            }}
          >
            {PET_PARTS.map((part) => {
              if (part.id === "sheep_eye_open" && (blinkClosed || petState === "sleeping")) {
                return null;
              }
              if (part.id === "sheep_eye_closed" && !(blinkClosed || petState === "sleeping")) {
                return null;
              }
              if (part.id === "sheep_mouth_open" && !(mouthOpen && petState === "eating")) {
                return null;
              }
              if (part.id === "sheep_mouth_closed" && mouthOpen && petState === "eating") {
                return null;
              }

              const partMotion = getPartMotion(part.id, petState, effectiveLook);

              return (
                <motion.img
                  key={part.id}
                  src={part.src}
                  alt=""
                  draggable={false}
                  className="absolute select-none"
                  style={{
                    left: part.defaultX,
                    top: part.defaultY,
                    zIndex: part.zIndex,
                    transformOrigin: `${part.pivotX}px ${part.pivotY}px`,
                  }}
                  animate={partMotion.animate}
                  transition={partMotion.transition}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
