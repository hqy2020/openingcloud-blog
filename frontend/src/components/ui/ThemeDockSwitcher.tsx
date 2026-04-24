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
        aria-label="切换主题"
        title="切换主题"
        className="flex h-10 w-10 items-center justify-center rounded-full border bg-theme-surface shadow-[var(--theme-shadow-whisper)] transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-accent"
        style={{ borderColor: current.swatch }}
      >
        <span
          className="h-4 w-4 rounded-full shadow-inner"
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
            className="absolute bottom-full left-1/2 mb-3 -translate-x-1/2 rounded-[var(--theme-radius)] border border-theme-line bg-theme-surface-raised p-2 shadow-[var(--theme-shadow-lifted)]"
          >
            <div className="flex items-center gap-2">
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
                    aria-label={`切换到 ${p.label} 主题`}
                    title={p.label}
                    className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                      active ? "border-transparent ring-2 ring-offset-2" : "border-theme-line"
                    }`}
                    style={
                      active
                        ? ({ ["--tw-ring-color" as string]: p.swatch } as React.CSSProperties)
                        : undefined
                    }
                  >
                    <span
                      className="h-5 w-5 rounded-full shadow-inner"
                      style={{ backgroundColor: p.swatch }}
                    />
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
