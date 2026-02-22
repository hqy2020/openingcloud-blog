import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";
import { cn } from "../../lib/utils";

type DockProps = {
  children: ReactNode;
  className?: string;
  magnification?: number;
  distance?: number;
};

type DockIconProps = {
  children: ReactNode;
  className?: string;
  label?: string;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  magnification: number;
  distance: number;
  onClick?: () => void;
  href?: string;
  external?: boolean;
};

function Dock({ children, className, magnification = 60, distance = 140 }: DockProps) {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      className={cn(
        "fixed bottom-6 left-1/2 z-50 hidden -translate-x-1/2 items-end gap-3 rounded-2xl border border-slate-200/60 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-xl md:flex",
        className,
      )}
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
    >
      {Array.isArray(children)
        ? children.map((child, i) => {
            if (child && typeof child === "object" && "props" in child) {
              return (
                <DockIcon
                  key={i}
                  mouseX={mouseX}
                  magnification={magnification}
                  distance={distance}
                  {...child.props}
                >
                  {child.props.children}
                </DockIcon>
              );
            }
            return child;
          })
        : children}
    </motion.div>
  );
}

function DockIcon({
  children,
  className,
  label,
  mouseX,
  magnification,
  distance,
  onClick,
  href,
  external,
}: DockIconProps) {
  const ref = useRef<HTMLDivElement>(null);

  const distanceCalc = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distanceCalc, [-distance, 0, distance], [40, magnification, 40]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  const content = (
    <motion.div
      ref={ref}
      style={{ width, height: width }}
      className={cn(
        "group relative flex aspect-square items-center justify-center rounded-full bg-slate-100/80 text-slate-700 transition-colors hover:bg-slate-200/90",
        className,
      )}
      onClick={onClick}
    >
      {children}
      {label ? (
        <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
          {label}
        </span>
      ) : null}
    </motion.div>
  );

  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className="flex items-end"
      >
        {content}
      </a>
    );
  }

  return content;
}

export { Dock, DockIcon };
