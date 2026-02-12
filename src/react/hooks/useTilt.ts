import { useRef, useEffect, type RefObject } from 'react';
import { useReducedMotion } from './useReducedMotion';

interface TiltOptions {
  max?: number;
  speed?: number;
  scale?: number;
  glare?: boolean;
  maxGlare?: number;
}

export function useTilt<T extends HTMLElement>(
  options: TiltOptions = {}
): RefObject<T | null> {
  const ref = useRef<T>(null);
  const reduced = useReducedMotion();

  const {
    max = 5,
    speed = 400,
    scale = 1.01,
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    // Skip on touch devices
    if (window.matchMedia('(hover: none)').matches) return;

    const transitionDuration = `${speed}ms`;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const rotateX = (0.5 - y) * max * 2;
      const rotateY = (x - 0.5) * max * 2;

      el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
      el.style.transition = `transform ${transitionDuration} cubic-bezier(0.03, 0.98, 0.52, 0.99)`;
    };

    const handleMouseLeave = () => {
      el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.style.transform = '';
      el.style.transition = '';
    };
  }, [max, speed, scale, reduced]);

  return ref;
}
