import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

type InteractiveHoverButtonBaseProps = {
  children: ReactNode;
  className?: string;
  hoverText?: ReactNode;
};

type InteractiveHoverButtonAnchorProps = InteractiveHoverButtonBaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

type InteractiveHoverButtonButtonProps = InteractiveHoverButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

export type InteractiveHoverButtonProps =
  | InteractiveHoverButtonAnchorProps
  | InteractiveHoverButtonButtonProps;

function ArrowRightIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

function isAnchorProps(
  props: InteractiveHoverButtonProps,
): props is InteractiveHoverButtonAnchorProps {
  return typeof (props as InteractiveHoverButtonAnchorProps).href === "string";
}

function Content({ children, hoverText }: { children: ReactNode; hoverText?: ReactNode }) {
  return (
    <>
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-indigo-500 transition-all duration-300 group-hover:scale-[1.08]" />
        <span className="inline-block whitespace-nowrap transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
          {children}
        </span>
      </div>
      <div className="pointer-events-none absolute inset-0 z-10 flex translate-x-12 items-center justify-center gap-2 opacity-0 text-white transition-all duration-300 group-hover:-translate-x-5 group-hover:opacity-100">
        <span className="whitespace-nowrap">{hoverText ?? children}</span>
        <ArrowRightIcon />
      </div>
    </>
  );
}

const baseClassName =
  "group relative inline-flex w-auto cursor-pointer items-center overflow-hidden rounded-full border border-slate-300/80 bg-white/90 p-2 px-5 text-center text-xs font-semibold text-slate-700 transition-all duration-300 hover:border-slate-400 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-60";

export function InteractiveHoverButton(props: InteractiveHoverButtonProps) {
  if (isAnchorProps(props)) {
    const { children, className, hoverText, href, ...anchorProps } = props;
    return (
      <a
        className={cn(baseClassName, className)}
        href={href}
        {...anchorProps}
      >
        <Content hoverText={hoverText}>{children}</Content>
      </a>
    );
  }

  const { children, className, hoverText, type, ...buttonProps } = props;
  return (
    <button
      className={cn(baseClassName, className)}
      type={type ?? "button"}
      {...buttonProps}
    >
      <Content hoverText={hoverText}>{children}</Content>
    </button>
  );
}
