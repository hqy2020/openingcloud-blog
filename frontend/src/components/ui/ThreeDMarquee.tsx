import { type ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

/**
 * Generalized 3D Marquee — based on Aceternity UI's 3D Marquee.
 * Accepts generic `items: T[]` + `renderItem` to render any content
 * in a 3D isometric scrolling grid.
 */
export function ThreeDMarquee<T>({
  items,
  renderItem,
  className,
}: {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
}) {
  const chunkSize = Math.ceil(items.length / 4);
  const chunks = Array.from({ length: 4 }, (_, colIndex) => {
    const start = colIndex * chunkSize;
    return items.slice(start, start + chunkSize);
  });

  return (
    <div
      className={cn(
        "relative mx-auto block h-[600px] overflow-hidden rounded-2xl max-sm:h-[400px]",
        className,
      )}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 1920,
          height: 1920,
          transform:
            "translate(-50%, -50%) rotateX(55deg) rotateY(0deg) rotateZ(-45deg)",
          transformStyle: "preserve-3d",
        }}
        className="grid grid-cols-4 gap-8"
      >
        {chunks.map((subarray, colIndex) => (
          <motion.div
            animate={{ y: colIndex % 2 === 0 ? 100 : -100 }}
            transition={{
              duration: colIndex % 2 === 0 ? 10 : 15,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            key={colIndex + "marquee"}
            className="flex flex-col items-stretch gap-8"
          >
            <GridLineVertical className="-left-4" offset="80px" />
            {subarray.map((item, itemIndex) => (
              <div className="relative" key={`${colIndex}-${itemIndex}`}>
                <GridLineHorizontal className="-top-4" offset="20px" />
                <motion.div
                  whileHover={{ y: -10 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {renderItem(item, colIndex * chunkSize + itemIndex)}
                </motion.div>
              </div>
            ))}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function GridLineHorizontal({
  className,
  offset,
}: {
  className?: string;
  offset?: string;
}) {
  return (
    <div
      style={
        {
          "--background": "#ffffff",
          "--color": "rgba(0, 0, 0, 0.2)",
          "--height": "1px",
          "--width": "5px",
          "--fade-stop": "90%",
          "--offset": offset || "200px",
          "--color-dark": "rgba(255, 255, 255, 0.2)",
          maskComposite: "exclude",
        } as React.CSSProperties
      }
      className={cn(
        "absolute left-[calc(var(--offset)/2*-1)] h-[var(--height)] w-[calc(100%+var(--offset))]",
        "bg-[linear-gradient(to_right,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "[background-size:var(--width)_var(--height)]",
        "[mask:linear-gradient(to_left,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_right,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
        "[mask-composite:exclude]",
        "z-30",
        className,
      )}
    />
  );
}

function GridLineVertical({
  className,
  offset,
}: {
  className?: string;
  offset?: string;
}) {
  return (
    <div
      style={
        {
          "--background": "#ffffff",
          "--color": "rgba(0, 0, 0, 0.2)",
          "--height": "5px",
          "--width": "1px",
          "--fade-stop": "90%",
          "--offset": offset || "150px",
          "--color-dark": "rgba(255, 255, 255, 0.2)",
          maskComposite: "exclude",
        } as React.CSSProperties
      }
      className={cn(
        "absolute top-[calc(var(--offset)/2*-1)] h-[calc(100%+var(--offset))] w-[var(--width)]",
        "bg-[linear-gradient(to_bottom,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "[background-size:var(--width)_var(--height)]",
        "[mask:linear-gradient(to_top,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_bottom,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
        "[mask-composite:exclude]",
        "z-30",
        className,
      )}
    />
  );
}
