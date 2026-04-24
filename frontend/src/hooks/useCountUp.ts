import { useEffect, useRef, useState } from "react";

type Options = {
  duration?: number;
  startWhenVisible?: boolean;
};

export function useCountUp(target: number, options: Options = {}) {
  const { duration = 1400, startWhenVisible = true } = options;
  const [value, setValue] = useState(0);
  const nodeRef = useRef<HTMLElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!startWhenVisible) {
      runAnimation();
      return;
    }
    const node = nodeRef.current;
    if (!node || started.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            runAnimation();
            io.disconnect();
          }
        }
      },
      { threshold: 0.2 },
    );
    io.observe(node);
    return () => io.disconnect();

    function runAnimation() {
      const startedAt = performance.now();
      const from = 0;
      const to = Math.max(0, Math.round(target));
      let raf = 0;
      const tick = (now: number) => {
        const t = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setValue(Math.round(from + (to - from) * eased));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }
  }, [target, duration, startWhenVisible]);

  return { value, nodeRef };
}
