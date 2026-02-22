import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import type { PropsWithChildren } from "react";

export type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (next: ThemeMode) => void;
  toggleTheme: () => void;
};

const THEME_STORAGE_KEY = "openingcloud-theme";
const FORCED_THEME: ThemeMode = "light";

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const theme = FORCED_THEME;
  const isDark = false;

  const setTheme = useCallback((next: ThemeMode) => {
    // Keep the public API stable while forcing light-only mode.
    void next;
  }, []);

  const toggleTheme = useCallback(() => {
    // Intentionally no-op in light-only mode.
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.remove("dark");
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage write failures.
    }
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark,
      setTheme,
      toggleTheme,
    }),
    [isDark, setTheme, theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
