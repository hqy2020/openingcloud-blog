import { createElement, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { cn } from "../../lib/utils";

function CardContainer({
  children,
  className,
  containerClassName,
}: {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / 14;
    const y = -(e.clientY - rect.top - rect.height / 2) / 14;
    setRotateX(y);
    setRotateY(x);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      className={cn("flex items-center justify-center", containerClassName)}
      style={{ perspective: "1000px" }}
    >
      <div
        ref={containerRef}
        className={cn("relative transition-all duration-200 ease-linear", className)}
        style={{
          transform: `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`,
          transformStyle: "preserve-3d",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
    </div>
  );
}

function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn("h-auto w-auto", className)}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}

function CardItem({
  as: Tag = "div",
  children,
  className,
  translateX = 0,
  translateY = 0,
  translateZ = 0,
  ...rest
}: {
  as?: React.ElementType;
  children: ReactNode;
  className?: string;
  translateX?: number | string;
  translateY?: number | string;
  translateZ?: number | string;
  [key: string]: unknown;
}) {
  const toTransformValue = (value: number | string) => (typeof value === "number" ? `${value}px` : value);

  return createElement(
    Tag as React.ElementType,
    {
      className: cn("w-fit transition duration-200 ease-linear", className),
      style: {
        transform: `translateX(${toTransformValue(translateX)}) translateY(${toTransformValue(translateY)}) translateZ(${toTransformValue(translateZ)})`,
      },
      ...(rest as Record<string, unknown>),
    },
    children,
  );
}

export { CardContainer, CardBody, CardItem };
