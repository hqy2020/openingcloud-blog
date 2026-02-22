import { motion, useReducedMotion, type MotionProps } from "motion/react";
import { cn } from "../../lib/utils";

type TextAnimateProps = {
  children: string;
  className?: string;
  animation?: "whipInUp";
  delay?: number;
  duration?: number;
};

export function TextAnimate({
  children,
  className,
  animation = "whipInUp",
  delay = 0,
  duration = 0.55,
}: TextAnimateProps) {
  const reducedMotion = Boolean(useReducedMotion());

  if (reducedMotion) {
    return <span className={className}>{children}</span>;
  }

  const motionProps: MotionProps =
    animation === "whipInUp"
      ? {
          initial: {
            opacity: 0,
            y: 28,
            rotateX: 74,
            scale: 0.94,
            filter: "blur(8px)",
          },
          animate: {
            opacity: 1,
            y: 0,
            rotateX: 0,
            scale: 1,
            filter: "blur(0px)",
          },
          transition: {
            delay,
            duration,
            ease: [0.22, 1, 0.36, 1],
          },
        }
      : {};

  return (
    <motion.span
      {...motionProps}
      className={cn("inline-block transform-gpu [transform-origin:50%_100%]", className)}
    >
      {children}
    </motion.span>
  );
}
