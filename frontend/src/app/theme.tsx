import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";

export type ThemePalette = "claude" | "apple" | "notion";

/** Legacy alias kept for backwards compatibility with old light/dark consumers. */
export type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  theme: ThemePalette;
  isDark: boolean; // retained for backwards compatibility with legacy consumers; always false.
  setTheme: (next: ThemePalette) => void;
  cycleTheme: () => void;
  palettes: ReadonlyArray<{ id: ThemePalette; label: string; swatch: string; description: string }>;
};

const THEME_STORAGE_KEY = "oc-theme";
const DEFAULT_THEME: ThemePalette = "claude";

export const THEME_PALETTES = [
  { id: "claude" as const, label: "Claude", swatch: "#c96442", description: "Warm terracotta · serif" },
  { id: "apple" as const, label: "Apple", swatch: "#0071E3", description: "Premium white · SF Pro" },
  { id: "notion" as const, label: "Notion", swatch: "#2383E2", description: "Warm minimal · serif" },
];

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readInitialTheme(): ThemePalette {
  if (typeof document === "undefined") return DEFAULT_THEME;
  const attr = document.documentElement.dataset.theme as ThemePalette | undefined;
  if (attr && THEME_PALETTES.some((p) => p.id === attr)) return attr;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemePalette | null;
    if (stored && THEME_PALETTES.some((p) => p.id === stored)) return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<ThemePalette>(readInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.remove("dark");
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const setTheme = useCallback((next: ThemePalette) => {
    setThemeState(next);
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState((prev) => {
      const idx = THEME_PALETTES.findIndex((p) => p.id === prev);
      return THEME_PALETTES[(idx + 1) % THEME_PALETTES.length].id;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, isDark: false, setTheme, cycleTheme, palettes: THEME_PALETTES }),
    [theme, setTheme, cycleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
