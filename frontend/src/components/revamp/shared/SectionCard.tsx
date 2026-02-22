import type { ReactNode } from "react";
import { cn } from "../../../lib/utils";

type SectionCardProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
};

export function SectionCard({ id, children, className, fullWidth }: SectionCardProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-20",
        fullWidth && "w-full",
        className,
      )}
    >
      {children}
    </section>
  );
}
