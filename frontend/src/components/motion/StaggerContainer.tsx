import { motion, useReducedMotion } from "motion/react";
import type { PropsWithChildren } from "react";

type StaggerContainerProps = PropsWithChildren<{
  className?: string;
  stagger?: number;
  delayChildren?: number;
  once?: boolean;
}>;

export function StaggerContainer({
  children,
  className,
  stagger = 0.07,
  delayChildren = 0,
  once = true,
}: StaggerContainerProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.1 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger,
            delayChildren,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: PropsWithChildren<{ className?: string }>) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        // Keep cards visible even before IntersectionObserver marks the section in-view.
        hidden: { opacity: 1, y: 14 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: "easeOut" },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
