import type { CSSProperties, ReactNode } from "react";
import { cn } from "../../lib/utils";

const sizeMap = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
  xl: "text-5xl",
  xxl: "text-7xl",
} as const;

const weightMap = {
  normal: "font-normal",
  medium: "font-medium",
  semi: "font-semibold",
  bold: "font-bold",
} as const;

type TextGifProps = {
  gifUrl: string;
  children: ReactNode;
  size?: keyof typeof sizeMap;
  weight?: keyof typeof weightMap;
  className?: string;
};

export function TextGif({
  gifUrl,
  children,
  size = "xl",
  weight = "bold",
  className,
}: TextGifProps) {
  const style: CSSProperties = {
    backgroundImage: `url(${gifUrl})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };

  return (
    <span
      className={cn(
        "inline-block leading-tight",
        sizeMap[size],
        weightMap[weight],
        className,
      )}
      style={style}
    >
      {children}
    </span>
  );
}
