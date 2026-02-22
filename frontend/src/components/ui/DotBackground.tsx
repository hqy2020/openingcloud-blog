import { cn } from "../../lib/utils";

export function DotBackground({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative w-full bg-transparent",
        className,
      )}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(248,249,252,0.6) 85%, rgba(248,249,252,0.8) 100%)",
        }}
      />
      {children ? <div className="relative">{children}</div> : null}
    </div>
  );
}
