import { AnimatePresence, motion } from "motion/react";
import { PET_CHAT_LINES, PET_EAT_LINES, PET_GUIDE_LINE, type PetMood, type PetState } from "./petRigConfig";

type PetEffectsProps = {
  petState: PetState;
  petMood: PetMood;
  petRenderX: number;
  petRenderY: number;
  chatIndex: number;
  eatLineIndex: number;
  showHomeBubble: boolean;
  showGuideTip: boolean;
};

export function PetEffects({
  petState,
  petMood,
  petRenderX,
  petRenderY,
  chatIndex,
  eatLineIndex,
  showHomeBubble,
  showGuideTip,
}: PetEffectsProps) {
  const bubbleX = petRenderX - 166;
  const bubbleY = petRenderY - 56;

  return (
    <div className="pointer-events-none fixed inset-0 z-40" aria-hidden="true">
      <AnimatePresence mode="wait">
        {showHomeBubble ? (
          <motion.div
            key={`pet-home-bubble-${chatIndex}`}
            className="absolute w-[220px]"
            style={{ transform: `translate(${bubbleX}px, ${bubbleY}px)` }}
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

      <AnimatePresence>
        {showGuideTip ? (
          <motion.div
            key="pet-guide-tip"
            className="absolute w-[214px]"
            style={{ transform: `translate(${bubbleX - 14}px, ${bubbleY - 40}px)` }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.26, ease: "easeOut" }}
          >
            <div className="rounded-xl border border-cyan-200/80 bg-cyan-50/95 px-3 py-2 text-xs font-medium text-cyan-800 shadow-[0_8px_16px_rgba(14,116,144,0.16)]">
              {PET_GUIDE_LINE}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {petState === "eating" ? (
          <motion.div
            key={`pet-eat-line-${eatLineIndex}`}
            className="absolute"
            style={{ transform: `translate(${petRenderX - 28}px, ${petRenderY - 34}px)` }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: -2 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <span className="rounded-full bg-white/92 px-2.5 py-1 text-[11px] text-slate-700 shadow">{PET_EAT_LINES[eatLineIndex]}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {petState === "happy" ? (
          <>
            <motion.span
              key="pet-heart-a"
              className="absolute text-sm"
              style={{ transform: `translate(${petRenderX + 22}px, ${petRenderY - 12}px)` }}
              initial={{ opacity: 0, y: 8, scale: 0.7 }}
              animate={{ opacity: [0, 1, 0], y: [8, -4, -18], scale: [0.7, 1, 0.9] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            >
              💖
            </motion.span>
            <motion.span
              key="pet-heart-b"
              className="absolute text-sm"
              style={{ transform: `translate(${petRenderX + 34}px, ${petRenderY - 20}px)` }}
              initial={{ opacity: 0, y: 8, scale: 0.7 }}
              animate={{ opacity: [0, 1, 0], y: [8, -2, -16], scale: [0.7, 1, 0.9] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.82, ease: "easeOut", delay: 0.08 }}
            >
              ✨
            </motion.span>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {petState === "sleeping" ? (
          <motion.div
            key="pet-sleep"
            className="absolute text-base"
            style={{ transform: `translate(${petRenderX + 42}px, ${petRenderY - 18}px)` }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: [0.4, 0.86, 0.4], y: [4, -4, -10] }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 2.3, repeat: Infinity, ease: "easeInOut" }}
          >
            Zzz
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {petMood === "hungry" && petState === "idle" ? (
          <motion.span
            key="pet-hungry"
            className="absolute text-base"
            style={{ transform: `translate(${petRenderX + 12}px, ${petRenderY - 10}px)` }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: [0, 1, 0], y: [6, -2, -10] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
          >
            !
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
