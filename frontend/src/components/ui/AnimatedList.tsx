import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

type AnimatedListProps = {
  children: React.ReactNode[];
  delay?: number;
  className?: string;
};

export function AnimatedList({ children, delay = 2000, className }: AnimatedListProps) {
  const [index, setIndex] = useState(0);
  const childrenArray = useMemo(() => [...children], [children]);

  useEffect(() => {
    if (childrenArray.length === 0) {
      return;
    }
    const timer = setInterval(() => {
      setIndex((prev) => {
        const next = prev + 1;
        if (next >= childrenArray.length) {
          clearInterval(timer);
          return prev;
        }
        return next;
      });
    }, delay);
    return () => clearInterval(timer);
  }, [childrenArray.length, delay]);

  const visibleItems = useMemo(() => {
    const result: { item: React.ReactNode; key: number }[] = [];
    for (let i = 0; i <= index; i++) {
      result.push({ item: childrenArray[i % childrenArray.length], key: i });
    }
    return result.slice(-5).reverse();
  }, [index, childrenArray]);

  return (
    <div className={className}>
      <AnimatePresence initial={false}>
        {visibleItems.map(({ item, key }) => (
          <motion.div
            key={key}
            layout
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          >
            {item}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
