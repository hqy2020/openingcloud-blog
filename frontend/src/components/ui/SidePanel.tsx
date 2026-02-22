import { forwardRef, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { cn } from "../../lib/utils";

type SidePanelProps = {
  panelOpen: boolean;
  handlePanelOpen: () => void;
  className?: string;
  side?: "left" | "right";
  expandedWidth?: number | string;
  collapsedWidth?: number | string;
  reducedMotion?: boolean;
  renderButton?: (handleToggle: () => void, panelOpen: boolean) => ReactNode;
  children: ReactNode;
};

const easeCurve = [0.42, 0, 0.58, 1] as const;

export const SidePanel = forwardRef<HTMLDivElement, SidePanelProps>(
  (
    {
      panelOpen,
      handlePanelOpen,
      className,
      side = "right",
      expandedWidth = 320,
      collapsedWidth = 56,
      reducedMotion = false,
      renderButton,
      children,
    },
    ref,
  ) => {
    const sectionVariants = {
      open: {
        width: expandedWidth,
        transition: { duration: reducedMotion ? 0 : 0.3, ease: easeCurve },
      },
      closed: {
        width: collapsedWidth,
        transition: { duration: reducedMotion ? 0 : 0.2, ease: easeCurve },
      },
    };

    const contentAnimation = reducedMotion
      ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } }
      : {
          initial: { opacity: 0, x: side === "right" ? 14 : -14 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: side === "right" ? 14 : -14 },
        };

    return (
      <MotionConfig transition={{ type: "tween", ease: easeCurve, duration: reducedMotion ? 0 : 0.35 }}>
        <AnimatePresence initial={false}>
          {panelOpen ? (
            <motion.button
              type="button"
              aria-label="关闭侧边栏"
              className="fixed inset-0 z-40 hidden bg-slate-900/8 backdrop-blur-[1px] lg:block"
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.22, ease: easeCurve }}
              onClick={handlePanelOpen}
            />
          ) : null}
        </AnimatePresence>

        <motion.aside
          ref={ref}
          className={cn(
            "fixed top-0 z-50 hidden h-screen lg:flex",
            side === "right" ? "right-0" : "left-0",
            className,
          )}
          animate={panelOpen ? "open" : "closed"}
          initial={false}
          variants={sectionVariants}
        >
          <div
            className={cn(
              "flex h-full w-full flex-col overflow-hidden",
              panelOpen
                ? cn(
                    "bg-white/88 text-slate-800 ring-1 ring-slate-200/70 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.38)] backdrop-blur-xl",
                    side === "right" ? "rounded-l-[34px]" : "rounded-r-[34px]",
                  )
                : cn(
                    "bg-white/78 text-slate-700 ring-1 ring-slate-200/65 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.35)] backdrop-blur-xl",
                    side === "right" ? "rounded-l-[18px]" : "rounded-r-[18px]",
                  ),
            )}
          >
            <div
              className={cn(
                "flex shrink-0",
                panelOpen ? "items-center justify-between border-b border-slate-200/70 px-4 pb-3 pt-20" : "h-full items-start justify-center px-1.5 pt-[32vh]",
              )}
            >
              {renderButton ? renderButton(handlePanelOpen, panelOpen) : null}
            </div>

            <AnimatePresence initial={false}>
              {panelOpen ? (
                <motion.div
                  className="flex-1 overflow-hidden"
                  {...contentAnimation}
                  transition={{ duration: reducedMotion ? 0 : 0.24, ease: easeCurve }}
                >
                  {children}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </motion.aside>
      </MotionConfig>
    );
  },
);

SidePanel.displayName = "SidePanel";
