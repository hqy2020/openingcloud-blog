import type { ReactNode } from "react";
import { cn } from "../../../lib/utils";

type SectionCardProps = {
  id?: string;
  title?: string;
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
};

export function SectionCard({ id, title, children, className, fullWidth }: SectionCardProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-20",
        fullWidth && "w-full",
        className,
      )}
    >
      {title && (
        <h2 className="px-6 pt-6 text-xl font-bold text-theme-ink">{title}</h2>
      )}
      {children}
    </section>
  );
}
