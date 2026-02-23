import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

export type Variant = "default" | "pink" | "light" | "secondary";
export type Size = "default" | "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xll" | "xxl" | "xxxl";
export type Weight = "default" | "thin" | "base" | "semi" | "bold" | "black";

type GradientHeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  weight?: Weight;
};

const variantClasses: Record<Variant, string> = {
  default: "bg-gradient-to-t from-neutral-700 to-neutral-800 dark:from-stone-200 dark:to-neutral-200",
  pink: "bg-gradient-to-t from-accent to-accent/90 dark:from-stone-200 dark:to-neutral-200",
  light: "bg-gradient-to-t from-neutral-200 to-neutral-300",
  secondary: "bg-gradient-to-t from-neutral-500 to-neutral-600 dark:from-stone-200 dark:to-neutral-200",
};

const sizeClasses: Record<Size, string> = {
  default: "text-2xl sm:text-3xl lg:text-4xl",
  xxs: "text-base sm:text-lg lg:text-lg",
  xs: "text-lg sm:text-xl lg:text-2xl",
  sm: "text-xl sm:text-2xl lg:text-3xl",
  md: "text-2xl sm:text-3xl lg:text-4xl",
  lg: "text-3xl sm:text-4xl lg:text-5xl",
  xl: "text-4xl sm:text-5xl lg:text-6xl",
  xll: "text-4xl sm:text-6xl lg:text-[5.4rem] lg:leading-[0.5rem]",
  xxl: "text-5xl sm:text-6xl lg:text-[6rem]",
  xxxl: "text-5xl sm:text-6xl lg:text-[8rem]",
};

const weightClasses: Record<Weight, string> = {
  default: "font-bold",
  thin: "font-thin",
  base: "font-normal",
  semi: "font-semibold",
  bold: "font-bold",
  black: "font-black",
};

export function GradientHeading({
  children,
  className,
  variant = "default",
  size = "default",
  weight = "default",
  ...props
}: GradientHeadingProps) {
  return (
    <h3 className={className} {...props}>
      <span
        className={cn(
          "inline-block pb-3 tracking-tight bg-clip-text text-transparent",
          variantClasses[variant],
          sizeClasses[size],
          weightClasses[weight],
        )}
      >
        {children}
      </span>
    </h3>
  );
}
