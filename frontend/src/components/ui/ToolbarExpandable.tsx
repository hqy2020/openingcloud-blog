import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { cn } from "../../lib/utils";

type ToolbarStep = {
  id: string;
  label: string;
  icon: ReactNode;
  content: ReactNode;
};

type ToolbarExpandableProps = {
  steps: ToolbarStep[];
  className?: string;
};

export function ToolbarExpandable({ steps, className }: ToolbarExpandableProps) {
  const [activeStep, setActiveStep] = useState<string | null>(null);

  return (
    <div className={cn("flex flex-col items-start gap-2", className)}>
      <div className="flex items-center gap-2">
        {steps.map((step) => {
          const isActive = activeStep === step.id;
          return (
            <button
              key={step.id}
              type="button"
              className={cn(
                "relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                isActive
                  ? "border-[#4f6ae5]/40 bg-[#4f6ae5]/10 text-[#4f6ae5]"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
              )}
              onClick={() => setActiveStep(isActive ? null : step.id)}
            >
              <span className="text-base">{step.icon}</span>
              <span>{step.label}</span>
              <motion.span
                animate={{ rotate: isActive ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="ml-1 text-xs"
              >
                ▾
              </motion.span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeStep ? (
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="w-full overflow-hidden"
          >
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur">
              {steps.find((s) => s.id === activeStep)?.content}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
