import { animate, useInView, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import { cn } from "../../lib/utils";

type NumberTickerProps = {
  value: number;
  className?: string;
  direction?: "up" | "down";
  delay?: number;
  duration?: number;
  decimalPlaces?: number;
  startValue?: number;
  locale?: string;
  once?: boolean;
  disabled?: boolean;
};

export function NumberTicker({
  value,
  className,
  direction = "up",
  delay = 0,
  duration = 1.6,
  decimalPlaces = 0,
  startValue = 0,
  locale = "zh-CN",
  once = true,
  disabled = false,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const initialValue = direction === "down" ? value : startValue;
  const targetValue = direction === "down" ? startValue : value;

  const motionValue = useMotionValue(initialValue);
  const springValue = useSpring(motionValue, { damping: 60, stiffness: 100 });
  const inView = useInView(ref, { once, amount: 0.3 });

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }),
    [decimalPlaces, locale],
  );

  const rounded = useTransform(springValue, (latest) => {
    const safe = Number(latest.toFixed(decimalPlaces));
    return formatter.format(safe);
  });

  useEffect(() => {
    if (!disabled && !inView) {
      return;
    }

    if (disabled || duration <= 0) {
      motionValue.set(targetValue);
      return;
    }

    const controls = animate(motionValue, targetValue, {
      duration,
      delay,
      ease: "easeOut",
    });
    return controls.stop;
  }, [delay, disabled, duration, inView, motionValue, targetValue]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = latest;
      }
    });
    return unsubscribe;
  }, [rounded]);

  const initialText = formatter.format(Number((disabled ? targetValue : initialValue).toFixed(decimalPlaces)));

  return (
    <span ref={ref} className={cn("inline-block tabular-nums", className)}>
      {initialText}
    </span>
  );
}
