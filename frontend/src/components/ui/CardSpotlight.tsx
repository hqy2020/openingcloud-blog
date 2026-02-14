import { useMemo, useState } from "react";
import type { CSSProperties, PropsWithChildren } from "react";

type CardSpotlightProps = PropsWithChildren<{
  className?: string;
  glowColor?: string;
  style?: CSSProperties;
}>;

export function CardSpotlight({ children, className = "", glowColor = "79, 106, 229", style: externalStyle }: CardSpotlightProps) {
  const [position, setPosition] = useState({ x: 50, y: 50, active: false });

  const style = useMemo(() => {
    const alpha = position.active ? 0.26 : 0.14;
    return {
      ...externalStyle,
      "--spotlight": `radial-gradient(380px circle at ${position.x}% ${position.y}%, rgba(${glowColor}, ${alpha}), transparent 70%)`,
    } as CSSProperties;
  }, [externalStyle, glowColor, position.active, position.x, position.y]);

  return (
    <article
      className={`relative overflow-hidden ${className}`}
      style={style}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        setPosition({ x, y, active: true });
      }}
      onMouseLeave={() => setPosition((prev) => ({ ...prev, active: false }))}
    >
      <div className="pointer-events-none absolute inset-0 opacity-90" style={{ backgroundImage: "var(--spotlight)" }} />
      <div className="relative">{children}</div>
    </article>
  );
}
