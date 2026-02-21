import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { GrassManager } from "./GrassManager";
import {
  PET_CHAT_LINES,
  PET_CLIP_DURATION,
  PET_EAT_LINES,
  clamp,
  isNearPosition,
  type GrassPatch,
  type PetFacing,
  type PetMood,
  type PetPosition,
  type PetState,
} from "./petRigConfig";

const ARRIVAL_THRESHOLD_PX = 4;
const HOME_ARRIVAL_THRESHOLD_PX = 8;
const START_SPEED_PX = 0.8;
const MAX_SPEED_PX = 6.2;
const ACCELERATION_PX = 0.24;
const RETURN_HOME_DELAY_MS = 10_000;
const SLEEP_IDLE_DELAY_MS = 45_000;
const HOVER_RADIUS_PX = 132;
const GUIDE_STORAGE_KEY = "openingcloud-pet-guide-v2";
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
  "[data-pet-draggable='true']",
].join(",");

type UsePetStateMachineOptions = {
  enabled: boolean;
  homeAnchor: PetPosition;
  grass: GrassManager;
  allowDrag: boolean;
};

type UsePetStateMachineResult = {
  petState: PetState;
  petMood: PetMood;
  petFacing: PetFacing;
  position: PetPosition;
  grassPatches: GrassPatch[];
  targetPatchId: string | null;
  eatingPatchId: string | null;
  chatIndex: number;
  eatLineIndex: number;
  showHomeBubble: boolean;
  showGuideTip: boolean;
  blinkClosed: boolean;
  mouthOpen: boolean;
  lookAngleDeg: number;
  onPetPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

export function usePetStateMachine({ enabled, homeAnchor, grass, allowDrag }: UsePetStateMachineOptions): UsePetStateMachineResult {
  const [petState, setPetState] = useState<PetState>("idle");
  const [petFacing, setPetFacing] = useState<PetFacing>("left");
  const [position, setPosition] = useState<PetPosition>(homeAnchor);
  const [targetPatchId, setTargetPatchId] = useState<string | null>(null);
  const [eatingPatchId, setEatingPatchId] = useState<string | null>(null);
  const [grassPatches, setGrassPatches] = useState<GrassPatch[]>([]);
  const [chatIndex, setChatIndex] = useState(0);
  const [eatLineIndex, setEatLineIndex] = useState(0);
  const [showGuideTip, setShowGuideTip] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return !window.localStorage.getItem(GUIDE_STORAGE_KEY);
  });
  const [blinkClosed, setBlinkClosed] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);
  const [lookAngleDeg, setLookAngleDeg] = useState(0);

  const homeAnchorRef = useRef(homeAnchor);
  const positionRef = useRef(position);
  const petStateRef = useRef(petState);
  const targetPatchIdRef = useRef<string | null>(null);
  const eatingPatchIdRef = useRef<string | null>(null);
  const pendingTargetPatchRef = useRef<string | null>(null);
  const speedRef = useRef(0);
  const pointerPosRef = useRef<PetPosition>(homeAnchor);
  const dragOffsetRef = useRef<PetPosition>({ x: 0, y: 0 });
  const dragPointerIdRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const dragBlockClickUntilRef = useRef(0);
  const lastInteractionRef = useRef(0);
  const idleNoGrassSinceRef = useRef<number | null>(null);
  const timeoutIdsRef = useRef<number[]>([]);

  const registerTimeout = useCallback((callback: () => void, delayMs: number) => {
    const timeoutId = window.setTimeout(() => {
      timeoutIdsRef.current = timeoutIdsRef.current.filter((id) => id !== timeoutId);
      callback();
    }, delayMs);
    timeoutIdsRef.current.push(timeoutId);
    return timeoutId;
  }, []);

  const syncPatches = useCallback(() => {
    setGrassPatches([ ...grass.patches ]);
  }, [grass]);

  const noteInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now();
    idleNoGrassSinceRef.current = null;
    setShowGuideTip(false);
  }, []);

  const resetToHome = useCallback(() => {
    const home = homeAnchorRef.current;
    positionRef.current = home;
    setPosition(home);
    setPetState("idle");
    setPetFacing("left");
    setTargetPatchId(null);
    setEatingPatchId(null);
    setLookAngleDeg(0);
    setBlinkClosed(false);
    setMouthOpen(false);
    speedRef.current = 0;
    targetPatchIdRef.current = null;
    eatingPatchIdRef.current = null;
    pendingTargetPatchRef.current = null;
  }, []);

  const startWalkingToPatch = useCallback(
    (preferredId: string | null = null) => {
      const current = positionRef.current;

      let target = preferredId ? grass.findById(preferredId) : null;
      if (target && (target.stage === "vanishing" || target.claimedBy)) {
        target = null;
      }

      if (!target) {
        target = grass.findNearestAvailable(current.x, current.y, eatingPatchIdRef.current);
      }

      if (!target) {
        return false;
      }

      setPetFacing(target.x >= current.x ? "right" : "left");
      setPetState("walking_to_grass");
      setTargetPatchId(target.id);
      targetPatchIdRef.current = target.id;
      speedRef.current = 0;
      setLookAngleDeg(0);
      return true;
    },
    [grass],
  );

  useEffect(() => {
    homeAnchorRef.current = homeAnchor;
  }, [homeAnchor]);

  useEffect(() => {
    if (!lastInteractionRef.current) {
      lastInteractionRef.current = Date.now();
    }
  }, []);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    petStateRef.current = petState;
  }, [petState]);

  useEffect(() => {
    targetPatchIdRef.current = targetPatchId;
  }, [targetPatchId]);

  useEffect(() => {
    eatingPatchIdRef.current = eatingPatchId;
  }, [eatingPatchId]);

  useEffect(() => {
    if (!enabled) {
      const rafId = window.requestAnimationFrame(() => {
        resetToHome();
        setGrassPatches([]);
      });
      return () => window.cancelAnimationFrame(rafId);
    }

    const syncRafId = window.requestAnimationFrame(() => {
      syncPatches();
    });

    const previousHome = positionRef.current;
    if (petStateRef.current === "idle" && isNearPosition(previousHome, homeAnchorRef.current, HOME_ARRIVAL_THRESHOLD_PX + 6)) {
      const rafId = window.requestAnimationFrame(() => {
        positionRef.current = homeAnchorRef.current;
        setPosition(homeAnchorRef.current);
      });
      return () => {
        window.cancelAnimationFrame(syncRafId);
        window.cancelAnimationFrame(rafId);
      };
    }

    return () => window.cancelAnimationFrame(syncRafId);
  }, [enabled, homeAnchor, resetToHome, syncPatches]);

  useEffect(() => {
    if (!enabled || !showGuideTip) {
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(GUIDE_STORAGE_KEY, "1");
    }
    registerTimeout(() => setShowGuideTip(false), 9_000);
  }, [enabled, registerTimeout, showGuideTip]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onClick = (event: MouseEvent) => {
      if (Date.now() < dragBlockClickUntilRef.current) {
        return;
      }

      const targetNode = event.target as Element | null;
      if (targetNode?.closest(INTERACTIVE_SELECTOR)) {
        return;
      }

      noteInteraction();

      const planted = grass.plant(event.clientX, event.clientY);
      if (!planted) {
        return;
      }

      syncPatches();
      registerTimeout(() => {
        grass.markStage(planted.id, "grown");
        syncPatches();
      }, 260);

      const currentState = petStateRef.current;
      if (currentState === "sleeping" || currentState === "waking") {
        pendingTargetPatchRef.current = planted.id;
        if (currentState === "sleeping") {
          setPetState("waking");
        }
        return;
      }

      if (currentState === "eating" || currentState === "dragging") {
        return;
      }

      if (currentState !== "walking_to_grass") {
        startWalkingToPatch(planted.id);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerPosRef.current = { x: event.clientX, y: event.clientY };

      if (isDraggingRef.current) {
        noteInteraction();
        if (dragPointerIdRef.current !== null && event.pointerId !== dragPointerIdRef.current) {
          return;
        }

        const newX = event.clientX + dragOffsetRef.current.x;
        const newY = event.clientY + dragOffsetRef.current.y;
        const previous = positionRef.current;
        if (Math.abs(newX - previous.x) > 0.4) {
          setPetFacing(newX > previous.x ? "right" : "left");
        }
        const next = { x: newX, y: newY };
        positionRef.current = next;
        setPosition(next);
        return;
      }

      const currentState = petStateRef.current;
      if (currentState === "sleeping") {
        noteInteraction();
        setPetState("waking");
        return;
      }

      if (currentState !== "idle" && currentState !== "hover_watch") {
        return;
      }

      const current = positionRef.current;
      const distance = Math.hypot(event.clientX - current.x, event.clientY - current.y);
      if (distance <= HOVER_RADIUS_PX) {
        if (currentState === "idle") {
          setPetState("hover_watch");
        }
        const desiredAngle = clamp((event.clientX - current.x) / 9, -14, 14);
        setLookAngleDeg((existing) => (Math.abs(existing - desiredAngle) > 0.4 ? desiredAngle : existing));
      } else if (currentState === "hover_watch") {
        setPetState("idle");
        setLookAngleDeg(0);
      }
    };

    const finishDrag = (pointerId: number | null) => {
      if (!isDraggingRef.current) {
        return;
      }
      if (dragPointerIdRef.current !== null && pointerId !== null && pointerId !== dragPointerIdRef.current) {
        return;
      }

      isDraggingRef.current = false;
      dragPointerIdRef.current = null;
      speedRef.current = 0;
      dragBlockClickUntilRef.current = Date.now() + 360;

      if (grass.patches.length > 0 && startWalkingToPatch()) {
        return;
      }

      setPetState("returning_home");
      setTargetPatchId(null);
      targetPatchIdRef.current = null;
      setLookAngleDeg(0);
    };

    const onPointerUp = (event: PointerEvent) => {
      finishDrag(event.pointerId);
    };

    const onPointerCancel = (event: PointerEvent) => {
      finishDrag(event.pointerId);
    };

    window.addEventListener("click", onClick);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);

    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [enabled, grass, noteInteraction, registerTimeout, startWalkingToPatch, syncPatches]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const timer = window.setInterval(() => {
      const state = petStateRef.current;

      if (state === "walking_to_grass") {
        const current = positionRef.current;
        let target = targetPatchIdRef.current ? grass.findById(targetPatchIdRef.current) : null;
        if (!target || target.stage === "vanishing") {
          target = grass.findNearestAvailable(current.x, current.y, eatingPatchIdRef.current);
          if (!target) {
            setTargetPatchId(null);
            targetPatchIdRef.current = null;
            speedRef.current = 0;
            setPetState("idle");
            setPetFacing("left");
            return;
          }
          setTargetPatchId(target.id);
          targetPatchIdRef.current = target.id;
        }

        const dx = target.x - current.x;
        const dy = target.y - current.y;
        const distance = Math.hypot(dx, dy);

        if (Math.abs(dx) > 0.5) {
          setPetFacing(dx > 0 ? "right" : "left");
        }

        speedRef.current = Math.min(MAX_SPEED_PX, Math.max(START_SPEED_PX, speedRef.current + ACCELERATION_PX));
        const step = Math.min(distance, speedRef.current);

        if (distance <= ARRIVAL_THRESHOLD_PX || step >= distance) {
          const arrived = { x: target.x, y: target.y };
          positionRef.current = arrived;
          setPosition(arrived);
          speedRef.current = 0;

          grass.markStage(target.id, "being_eaten");
          grass.claim(target.id, "sheep");
          syncPatches();

          setEatingPatchId(target.id);
          eatingPatchIdRef.current = target.id;
          setPetState("eating");
          setLookAngleDeg(0);
          return;
        }

        const next = {
          x: current.x + (dx / distance) * step,
          y: current.y + (dy / distance) * step,
        };
        positionRef.current = next;
        setPosition(next);
        return;
      }

      if (state !== "returning_home") {
        return;
      }

      setTargetPatchId(null);
      targetPatchIdRef.current = null;

      const current = positionRef.current;
      const home = homeAnchorRef.current;
      const dx = home.x - current.x;
      const dy = home.y - current.y;
      const distance = Math.hypot(dx, dy);

      if (Math.abs(dx) > 0.5) {
        setPetFacing(dx > 0 ? "right" : "left");
      }

      speedRef.current = Math.min(MAX_SPEED_PX, Math.max(START_SPEED_PX, speedRef.current + ACCELERATION_PX));
      const step = Math.min(distance, speedRef.current);

      if (distance <= ARRIVAL_THRESHOLD_PX || step >= distance) {
        speedRef.current = 0;
        const arrived = { x: home.x, y: home.y };
        positionRef.current = arrived;
        setPosition(arrived);
        setPetState("idle");
        setPetFacing("left");
        setLookAngleDeg(0);
        return;
      }

      const next = {
        x: current.x + (dx / distance) * step,
        y: current.y + (dy / distance) * step,
      };
      positionRef.current = next;
      setPosition(next);
    }, 16);

    return () => window.clearInterval(timer);
  }, [enabled, grass, syncPatches]);

  useEffect(() => {
    if (!enabled || petState !== "eating" || !eatingPatchId) {
      return;
    }

    const finishEating = registerTimeout(() => {
      grass.markStage(eatingPatchId, "vanishing");
      syncPatches();

      registerTimeout(() => {
        grass.removeById(eatingPatchId);
        syncPatches();
        setEatingPatchId(null);
        eatingPatchIdRef.current = null;
        setTargetPatchId(null);
        targetPatchIdRef.current = null;

        if (grass.patches.length > 0 && startWalkingToPatch()) {
          return;
        }

        setPetState("happy");
      }, 420);
    }, 2_250);

    return () => window.clearTimeout(finishEating);
  }, [eatingPatchId, enabled, grass, petState, registerTimeout, startWalkingToPatch, syncPatches]);

  useEffect(() => {
    if (!enabled || petState !== "happy") {
      return;
    }

    const timer = window.setTimeout(() => {
      if (grass.patches.length > 0 && startWalkingToPatch()) {
        return;
      }
      setPetState("idle");
      setLookAngleDeg(0);
    }, PET_CLIP_DURATION.happyHop * 1000);

    return () => window.clearTimeout(timer);
  }, [enabled, grass.patches.length, petState, startWalkingToPatch]);

  useEffect(() => {
    if (!enabled || petState !== "waking") {
      return;
    }

    const timer = window.setTimeout(() => {
      const pending = pendingTargetPatchRef.current;
      pendingTargetPatchRef.current = null;
      if (pending && startWalkingToPatch(pending)) {
        return;
      }
      if (grass.patches.length > 0 && startWalkingToPatch()) {
        return;
      }
      setPetState("idle");
      setLookAngleDeg(0);
    }, PET_CLIP_DURATION.wakeUpMs);

    return () => window.clearTimeout(timer);
  }, [enabled, grass.patches.length, petState, startWalkingToPatch]);

  useEffect(() => {
    if (!enabled) {
      const timer = window.setTimeout(() => setMouthOpen(false), 0);
      return () => window.clearTimeout(timer);
    }

    if (petState !== "eating") {
      const timer = window.setTimeout(() => setMouthOpen(false), 0);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setInterval(() => {
      setMouthOpen((open) => !open);
    }, Math.max(160, PET_CLIP_DURATION.eatCycle * 500));

    return () => window.clearInterval(timer);
  }, [enabled, petState]);

  useEffect(() => {
    if (!enabled) {
      const timer = window.setTimeout(() => setBlinkClosed(false), 0);
      return () => window.clearTimeout(timer);
    }

    if (petState === "sleeping") {
      const timer = window.setTimeout(() => setBlinkClosed(true), 0);
      return () => window.clearTimeout(timer);
    }
    const resetTimer = window.setTimeout(() => setBlinkClosed(false), 0);

    let scheduleTimer = 0;
    let closeTimer = 0;

    const scheduleBlink = () => {
      scheduleTimer = window.setTimeout(() => {
        if (petStateRef.current === "sleeping") {
          setBlinkClosed(true);
          return;
        }
        setBlinkClosed(true);
        closeTimer = window.setTimeout(() => {
          if (petStateRef.current !== "sleeping") {
            setBlinkClosed(false);
          }
        }, PET_CLIP_DURATION.idleBlinkMs);
        scheduleBlink();
      }, 1800 + Math.round(Math.random() * 2600));
    };

    scheduleBlink();
    return () => {
      window.clearTimeout(resetTimer);
      window.clearTimeout(scheduleTimer);
      window.clearTimeout(closeTimer);
    };
  }, [enabled, petState]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const timer = window.setInterval(() => {
      const now = Date.now();
      const state = petStateRef.current;
      const hasGrass = grass.patches.length > 0;
      const nearHome = isNearPosition(positionRef.current, homeAnchorRef.current, HOME_ARRIVAL_THRESHOLD_PX + 4);

      if (!hasGrass && (state === "idle" || state === "hover_watch")) {
        if (!nearHome) {
          if (!idleNoGrassSinceRef.current) {
            idleNoGrassSinceRef.current = now;
          } else if (now - idleNoGrassSinceRef.current >= RETURN_HOME_DELAY_MS) {
            const current = positionRef.current;
            const home = homeAnchorRef.current;
            setPetFacing(home.x >= current.x ? "right" : "left");
            setPetState("returning_home");
            idleNoGrassSinceRef.current = null;
          }
        } else {
          idleNoGrassSinceRef.current = null;
        }
      } else {
        idleNoGrassSinceRef.current = null;
      }

      const canSleep = !hasGrass && (state === "idle" || state === "hover_watch");
      if (canSleep && nearHome && now - lastInteractionRef.current >= SLEEP_IDLE_DELAY_MS) {
        setPetState("sleeping");
        setLookAngleDeg(0);
      }
    }, 800);

    return () => window.clearInterval(timer);
  }, [enabled, grass]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (petState !== "eating") {
      return;
    }

    const timer = window.setInterval(() => {
      setEatLineIndex((index) => (index + 1) % PET_EAT_LINES.length);
    }, 920);

    return () => window.clearInterval(timer);
  }, [enabled, petState]);

  const isNearHome = useMemo(
    () => isNearPosition(position, homeAnchor, HOME_ARRIVAL_THRESHOLD_PX + 2),
    [homeAnchor, position],
  );

  const showHomeBubble =
    petState === "idle" &&
    grassPatches.length === 0 &&
    isNearHome;

  const petMood: PetMood = useMemo(() => {
    switch (petState) {
      case "walking_to_grass":
      case "eating":
        return "hungry";
      case "happy":
      case "dragging":
        return "excited";
      case "sleeping":
      case "waking":
        return "sleepy";
      default:
        return "neutral";
    }
  }, [petState]);

  useEffect(() => {
    if (!enabled || !showHomeBubble) {
      return;
    }

    const timer = window.setInterval(() => {
      setChatIndex((previous) => (previous + 1) % PET_CHAT_LINES.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [enabled, showHomeBubble]);

  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutIdsRef.current = [];
    };
  }, []);

  const onPetPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!enabled || !allowDrag) {
        return;
      }
      if (event.pointerType === "touch") {
        return;
      }

      const currentState = petStateRef.current;
      if (currentState !== "idle" && currentState !== "hover_watch" && currentState !== "sleeping" && currentState !== "returning_home") {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      noteInteraction();

      if (currentState === "sleeping") {
        setPetState("waking");
        return;
      }

      const pointerId = event.pointerId;
      dragPointerIdRef.current = pointerId;
      isDraggingRef.current = true;

      const current = positionRef.current;
      dragOffsetRef.current = {
        x: current.x - event.clientX,
        y: current.y - event.clientY,
      };

      speedRef.current = 0;
      setTargetPatchId(null);
      targetPatchIdRef.current = null;
      setPetState("dragging");
      setLookAngleDeg(0);
    },
    [allowDrag, enabled, noteInteraction],
  );

  return {
    petState,
    petMood,
    petFacing,
    position,
    grassPatches,
    targetPatchId,
    eatingPatchId,
    chatIndex,
    eatLineIndex,
    showHomeBubble,
    showGuideTip,
    blinkClosed,
    mouthOpen,
    lookAngleDeg,
    onPetPointerDown,
  };
}
