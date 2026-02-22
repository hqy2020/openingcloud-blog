import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PET_SHEEP_TOPDOWN_ATLAS, type PetAnim, type PetFacing, type SpriteClipKey } from "./petSpriteAtlas";

type PetSpritePosition = {
  x: number;
  y: number;
};

type PetSpriteProps = {
  position: PetSpritePosition;
  state: PetAnim;
  facing: PetFacing;
  ariaLabel: string;
};

const SHEEP_SHADOW_SRC = "/media/pet/sheep-topdown-shadow.png";

export function PetSprite({ position, state, facing, ariaLabel }: PetSpriteProps) {
  const atlas = PET_SHEEP_TOPDOWN_ATLAS;
  const clipKey = `${state}_${facing}` as SpriteClipKey;
  const clip = atlas.clips[clipKey];
  const [frameCursor, setFrameCursor] = useState(0);
  const frameCursorRef = useRef(0);

  useEffect(() => {
    frameCursorRef.current = 0;
    const rafId = window.requestAnimationFrame(() => {
      setFrameCursor(0);
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [clipKey]);

  useEffect(() => {
    if (clip.frames.length <= 1) {
      return;
    }

    const frameDurationMs = 1000 / Math.max(1, clip.fps);
    let rafId = 0;
    let previousTs = 0;
    let elapsedMs = 0;

    const tick = (timestamp: number) => {
      if (previousTs === 0) {
        previousTs = timestamp;
      }
      elapsedMs += timestamp - previousTs;
      previousTs = timestamp;

      let advanced = false;
      while (elapsedMs >= frameDurationMs) {
        elapsedMs -= frameDurationMs;
        frameCursorRef.current = (frameCursorRef.current + 1) % clip.frames.length;
        advanced = true;
      }

      if (advanced) {
        setFrameCursor(frameCursorRef.current);
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [clip.fps, clip.frames]);

  const frameIndex = clip.frames[frameCursor] ?? clip.frames[0] ?? 0;
  const frameWidth = atlas.frameWidth;
  const frameHeight = atlas.frameHeight;
  const renderWidth = frameWidth * atlas.scale;
  const renderHeight = frameHeight * atlas.scale;
  const spriteOffsetX = frameIndex * frameWidth * atlas.scale;
  const spriteOffsetY = clip.row * frameHeight * atlas.scale;
  const sheetWidth = atlas.columns * frameWidth * atlas.scale;
  const sheetHeight = atlas.rows * frameHeight * atlas.scale;

  const anim = useMemo(() => {
    if (state === "run") {
      return { animate: { y: [0, -1.2, 0] }, duration: 0.45 };
    }
    if (state === "eat") {
      return { animate: { rotate: [0, -5, 0, -5, 0], y: [0, 0.5, 0] }, duration: 0.58 };
    }
    if (state === "sleep") {
      return { animate: { y: [0, -1.4, 0] }, duration: 1.8 };
    }
    return { animate: { y: [0, -1, 0] }, duration: 1.2 };
  }, [state]);

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-40"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      <motion.div
        aria-label={ariaLabel}
        className="relative"
        animate={anim.animate}
        transition={{ duration: anim.duration, repeat: Infinity, ease: "easeInOut" }}
      >
        <img
          src={SHEEP_SHADOW_SRC}
          alt=""
          className="pointer-events-none absolute left-1/2 top-[36px] w-9 select-none opacity-65"
          style={{ transform: "translateX(-50%)", imageRendering: "pixelated" }}
          draggable={false}
        />

        <div className="pointer-events-none relative overflow-hidden" style={{ width: renderWidth, height: renderHeight }}>
          <img
            src={atlas.src}
            alt=""
            className="absolute left-0 top-0 max-w-none select-none will-change-transform"
            style={{
              width: sheetWidth,
              height: sheetHeight,
              transform: `translate(${-spriteOffsetX}px, ${-spriteOffsetY}px)`,
              imageRendering: "pixelated",
            }}
            draggable={false}
          />
        </div>

        {state === "sleep" ? (
          <span className="pointer-events-none absolute -top-4 left-9 select-none text-[11px] font-semibold text-slate-500">zzz</span>
        ) : null}
      </motion.div>
    </div>
  );
}
