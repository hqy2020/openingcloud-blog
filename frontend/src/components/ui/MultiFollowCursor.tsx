import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue, type SpringOptions } from "motion/react";
import { useEffect, useState } from "react";

type CursorLayer = {
  size: number;
  backgroundColor: string;
  borderColor?: string;
  pressedBorderColor?: string;
  borderWidth?: number;
  pressedScale: number;
  spring: SpringOptions;
  boxShadow?: string;
};

type CursorLayerNodeProps = {
  layer: CursorLayer;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  active: boolean;
  pressed: boolean;
};

const CURSOR_LAYERS: CursorLayer[] = [
  {
    size: 5,
    backgroundColor: "#ffffff",
    pressedScale: 0.5,
    spring: { stiffness: 1300, damping: 65, mass: 0.18 },
    boxShadow: "0 0 12px rgba(255, 255, 255, 0.72)",
  },
  {
    size: 13,
    backgroundColor: "transparent",
    borderColor: "var(--azure)",
    pressedBorderColor: "var(--sage)",
    borderWidth: 2,
    pressedScale: 0.6,
    spring: { stiffness: 1000, damping: 50, mass: 0.22 },
  },
  {
    size: 21,
    backgroundColor: "transparent",
    borderColor: "var(--sage)",
    pressedBorderColor: "var(--amber)",
    borderWidth: 2,
    pressedScale: 0.7,
    spring: { stiffness: 800, damping: 70, mass: 0.24 },
  },
  {
    size: 29,
    backgroundColor: "transparent",
    borderColor: "var(--amber)",
    pressedBorderColor: "var(--mauve)",
    borderWidth: 2,
    pressedScale: 0.8,
    spring: { stiffness: 700, damping: 90, mass: 0.27 },
  },
];

function CursorLayerNode({ layer, pointerX, pointerY, active, pressed }: CursorLayerNodeProps) {
  const smoothX = useSpring(pointerX, layer.spring);
  const smoothY = useSpring(pointerY, layer.spring);

  const x = useTransform(smoothX, (value) => value - layer.size / 2);
  const y = useTransform(smoothY, (value) => value - layer.size / 2);
  const borderColor = pressed && layer.pressedBorderColor ? layer.pressedBorderColor : layer.borderColor;

  return (
    <motion.span
      className="pointer-events-none fixed left-0 top-0 rounded-full"
      style={{
        x,
        y,
        width: layer.size,
        height: layer.size,
        backgroundColor: layer.backgroundColor,
        borderStyle: layer.borderWidth ? "solid" : "none",
        borderWidth: layer.borderWidth,
        borderColor,
        boxShadow: layer.boxShadow,
      }}
      animate={{
        opacity: active ? 1 : 0,
        scale: pressed ? layer.pressedScale : 1,
      }}
      transition={{
        opacity: { duration: 0.2 },
        scale: { type: "spring", stiffness: 520, damping: 30, mass: 0.22 },
      }}
    />
  );
}

export function MultiFollowCursor() {
  const reduceMotion = Boolean(useReducedMotion());
  const pointerX = useMotionValue(-100);
  const pointerY = useMotionValue(-100);
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(false);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const capability = window.matchMedia("(hover: hover) and (pointer: fine)");
    const syncCapability = () => setEnabled(!reduceMotion && capability.matches);

    syncCapability();
    capability.addEventListener("change", syncCapability);
    return () => capability.removeEventListener("change", syncCapability);
  }, [reduceMotion]);

  useEffect(() => {
    document.body.classList.toggle("cursor-multifollow-enabled", enabled);
    return () => {
      document.body.classList.remove("cursor-multifollow-enabled");
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      pointerX.set(-100);
      pointerY.set(-100);
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== "mouse") {
        return;
      }
      pointerX.set(event.clientX);
      pointerY.set(event.clientY);
      setActive(true);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== "mouse") {
        return;
      }
      setPressed(true);
    };

    const onPointerUp = () => {
      setPressed(false);
    };

    const onPointerOut = (event: PointerEvent) => {
      if (event.relatedTarget) {
        return;
      }
      setActive(false);
      setPressed(false);
    };

    const onWindowBlur = () => {
      setActive(false);
      setPressed(false);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });
    window.addEventListener("pointerout", onPointerOut, { passive: true });
    window.addEventListener("blur", onWindowBlur);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [enabled, pointerX, pointerY]);

  if (!enabled) {
    return null;
  }

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[80]">
      {CURSOR_LAYERS.map((layer) => (
        <CursorLayerNode key={layer.size} layer={layer} pointerX={pointerX} pointerY={pointerY} active={active} pressed={pressed} />
      ))}
    </div>
  );
}
