import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "../../app/theme";

export function ThemeDockSwitcher() {
  const { theme, palettes, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const current = palettes.find((p) => p.id === theme) ?? palettes[0];

  return (
    <div ref={wrapperRef} className="relative flex items-end">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`主题：${current.label}`}
        title={`主题：${current.label}`}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white shadow-sm transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{ borderColor: current.swatch }}
      >
        <span
          className="h-4 w-4 rounded-full border border-white shadow-inner"
          style={{ backgroundColor: current.swatch }}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute bottom-full left-1/2 mb-3 w-56 -translate-x-1/2 rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-[0_14px_34px_rgba(15,23,42,0.14)] backdrop-blur-xl"
          >
            <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              主题
            </div>
            {palettes.map((p) => {
              const active = p.id === theme;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setTheme(p.id);
                    setOpen(false);
                  }}
                  className={`mt-1 flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${
                    active ? "bg-slate-100" : "hover:bg-slate-50"
                  }`}
                >
                  <span
                    className="h-5 w-5 flex-shrink-0 rounded-full border border-slate-200"
                    style={{ backgroundColor: p.swatch }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-800">{p.label}</span>
                    <span className="block text-[11px] leading-tight text-slate-500">{p.description}</span>
                  </span>
                  {active ? (
                    <span
                      className="text-xs font-bold"
                      style={{ color: p.swatch }}
                      aria-label="当前主题"
                    >
                      ✓
                    </span>
                  ) : null}
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
