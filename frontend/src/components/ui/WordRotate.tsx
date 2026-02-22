import { AnimatePresence, motion, type MotionProps } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

type WordRotateProps = {
  words: string[];
  duration?: number;
  motionProps?: MotionProps;
  className?: string;
};

const defaultMotionProps: MotionProps = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.25, ease: "easeOut" },
};

export function WordRotate({ words, duration = 2500, motionProps = defaultMotionProps, className }: WordRotateProps) {
  const safeWords = words.filter((word) => word.trim().length > 0);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (safeWords.length <= 1) {
      return;
    }
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % safeWords.length);
    }, duration);
    return () => window.clearInterval(timer);
  }, [duration, safeWords]);

  if (safeWords.length === 0) {
    return null;
  }

  const activeWord = safeWords[index] ?? safeWords[0];

  return (
    <AnimatePresence mode="wait">
      <motion.span key={activeWord} {...motionProps} className={cn("inline-block", className)}>
        {activeWord}
      </motion.span>
    </AnimatePresence>
  );
}
