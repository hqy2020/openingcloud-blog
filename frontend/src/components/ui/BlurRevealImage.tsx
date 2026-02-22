import { useEffect, useRef, useState } from "react";
import type { ImgHTMLAttributes } from "react";

type BlurRevealImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  wrapperClassName?: string;
  once?: boolean;
};

export function BlurRevealImage({
  wrapperClassName = "",
  className = "",
  once = true,
  src,
  alt,
  ...props
}: BlurRevealImageProps) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRevealed(true);
      return;
    }

    const mobilePointer = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (!mobilePointer) {
      setRevealed(true);
      return;
    }

    const target = imageRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((entry) => entry.isIntersecting);
        if (!hit) {
          return;
        }
        setRevealed(true);
        if (once) {
          observer.disconnect();
        }
      },
      { threshold: 0.22, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [once, src]);

  return (
    <div className={`blur-reveal-shell ${wrapperClassName}`.trim()}>
      <img
        {...props}
        ref={imageRef}
        src={src}
        alt={alt}
        className={`blur-reveal-media ${revealed ? "is-revealed" : ""} ${className}`.trim()}
      />
    </div>
  );
}
