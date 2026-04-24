import {
  AnimatePresence,
  motion,
  type MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { Children, cloneElement, isValidElement, useRef, useState, type ReactNode } from "react";
import { cn } from "../../lib/utils";

type DockProps = {
  children: ReactNode;
  className?: string;
  magnification?: number;
  distance?: number;
  baseSize?: number;
  iconBaseSize?: number;
  iconMagnification?: number;
  draggable?: boolean;
};

type DockIconProps = {
  children: ReactNode;
  className?: string;
  label?: string;
  mouseX?: MotionValue<number>;
  magnification?: number;
  distance?: number;
  baseSize?: number;
  iconBaseSize?: number;
  iconMagnification?: number;
  onClick?: () => void;
  href?: string;
  external?: boolean;
};

function Dock({
  children,
  className,
  magnification = 80,
  distance = 150,
  baseSize = 40,
  iconBaseSize = 20,
  iconMagnification = 40,
  draggable = true,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      drag={draggable}
      dragMomentum={false}
      dragElastic={0.12}
      whileDrag={draggable ? { scale: 1.01, cursor: "grabbing" } : undefined}
      className={cn(
        "fixed bottom-6 left-1/2 z-50 hidden -translate-x-1/2 items-end gap-4 rounded-2xl border border-theme-line/70 bg-theme-surface/90 px-4 pb-3 pt-2 shadow-[0_14px_34px_rgba(15,23,42,0.14)] md:flex",
        className,
      )}
      style={{ cursor: draggable ? "grab" : "default" }}
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
    >
      {Children.map(children, (child, i) => {
        if (!isValidElement<DockIconProps>(child)) {
          return child;
        }
        return cloneElement(child, {
          key: child.key ?? i,
          mouseX,
          magnification: child.props.magnification ?? magnification,
          distance: child.props.distance ?? distance,
          baseSize: child.props.baseSize ?? baseSize,
          iconBaseSize: child.props.iconBaseSize ?? iconBaseSize,
          iconMagnification: child.props.iconMagnification ?? iconMagnification,
        });
      })}
    </motion.div>
  );
}

function DockIcon({
  children,
  className,
  label,
  mouseX,
  magnification = 80,
  distance = 150,
  baseSize = 40,
  iconBaseSize = 20,
  iconMagnification = 40,
  onClick,
  href,
  external,
}: DockIconProps) {
  const fallbackMouseX = useMotionValue(Infinity);
  const resolvedMouseX = mouseX ?? fallbackMouseX;
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const distanceCalc = useTransform(resolvedMouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distanceCalc, [-distance, 0, distance], [baseSize, magnification, baseSize]);
  const heightSync = useTransform(distanceCalc, [-distance, 0, distance], [baseSize, magnification, baseSize]);
  const widthIconSync = useTransform(distanceCalc, [-distance, 0, distance], [iconBaseSize, iconMagnification, iconBaseSize]);
  const heightIconSync = useTransform(distanceCalc, [-distance, 0, distance], [iconBaseSize, iconMagnification, iconBaseSize]);

  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });
  const height = useSpring(heightSync, { mass: 0.1, stiffness: 150, damping: 12 });
  const widthIcon = useSpring(widthIconSync, { mass: 0.1, stiffness: 150, damping: 12 });
  const heightIcon = useSpring(heightIconSync, { mass: 0.1, stiffness: 150, damping: 12 });

  const item = (
    <motion.div
      ref={ref}
      style={{ width, height }}
      className={cn(
        "relative flex aspect-square items-center justify-center rounded-full bg-theme-surface-raised/85 text-theme-ink",
        className,
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AnimatePresence>
        {hovered && label ? (
          <motion.div
            initial={{ opacity: 0, y: 10, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 2, x: "-50%" }}
            className="pointer-events-none absolute -top-9 left-1/2 w-max rounded-md border border-theme-line bg-theme-surface px-2 py-0.5 text-xs whitespace-pre text-theme-ink"
          >
            {label}
          </motion.div>
        ) : null}
      </AnimatePresence>
      <motion.div style={{ width: widthIcon, height: heightIcon }} className="flex items-center justify-center">
        {children}
      </motion.div>
    </motion.div>
  );

  if (href) {
    return (
      <a
        aria-label={label}
        title={label}
        href={href}
        onClick={onClick}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className="flex items-end"
      >
        {item}
      </a>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex items-end rounded-full border-0 bg-transparent p-0"
    >
      {item}
    </button>
  );
}

export { Dock, DockIcon };
