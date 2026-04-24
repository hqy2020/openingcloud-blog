/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        theme: {
          bg: "rgb(var(--theme-bg) / <alpha-value>)",
          surface: "rgb(var(--theme-surface) / <alpha-value>)",
          "surface-raised": "rgb(var(--theme-surface-raised) / <alpha-value>)",
          accent: "rgb(var(--theme-accent) / <alpha-value>)",
          "accent-soft": "rgb(var(--theme-accent-soft) / <alpha-value>)",
          ink: "rgb(var(--theme-ink) / <alpha-value>)",
          muted: "rgb(var(--theme-muted) / <alpha-value>)",
          soft: "rgb(var(--theme-soft) / <alpha-value>)",
          line: "rgb(var(--theme-line) / <alpha-value>)",
          "line-strong": "rgb(var(--theme-line-strong) / <alpha-value>)",
        },
        claude: {
          parchment: "#f5f4ed",
          ivory: "#faf9f5",
          "warm-sand": "#e8e6dc",
          "border-cream": "#f0eee6",
          "border-warm": "#e8e6dc",
          "ring-warm": "#d1cfc5",
          "ring-deep": "#c2c0b6",
          terracotta: "#c96442",
          coral: "#d97757",
          "near-black": "#141413",
          "deep-dark": "#141413",
          "dark-surface": "#30302e",
          "dark-warm": "#3d3d3a",
          "charcoal-warm": "#4d4c48",
          "olive-gray": "#5e5d59",
          "stone-gray": "#87867f",
          "warm-silver": "#b0aea5",
          "error-crimson": "#b53333",
          "focus-blue": "#3898ec",
        },
      },
      fontFamily: {
        // Default sans/serif/display point at theme vars — any font-* class
        // in the codebase automatically follows the active theme.
        sans: ["var(--theme-font-sans)"],
        serif: ["var(--theme-font-display)"],
        display: ["var(--theme-font-display)"],
        mono: [
          '"JetBrains Mono"',
          '"SFMono-Regular"',
          "Menlo",
          "monospace",
        ],
        // Explicit theme aliases (already used in some components)
        "theme-display": ["var(--theme-font-display)"],
        "theme-body": ["var(--theme-font-body)"],
        "theme-sans": ["var(--theme-font-sans)"],
      },
      // Border radius — every size is keyed to --theme-radius via calc(),
      // so switching theme rescales every rounded-* class in the codebase.
      // Claude radius=16 / Apple=14 / Notion=6 → all corners flow from there.
      borderRadius: {
        none: "0",
        sm: "calc(var(--theme-radius) * 0.25)",
        DEFAULT: "calc(var(--theme-radius) * 0.4)",
        md: "calc(var(--theme-radius) * 0.5)",
        lg: "calc(var(--theme-radius) * 0.6)",
        xl: "calc(var(--theme-radius) * 0.85)",
        "2xl": "var(--theme-radius)",
        "3xl": "calc(var(--theme-radius) * 1.5)",
        full: "9999px",
        theme: "var(--theme-radius)",
        // Legacy claude-* aliases, kept for any residual component references
        "claude-sm": "calc(var(--theme-radius) * 0.4)",
        claude: "calc(var(--theme-radius) * 0.5)",
        "claude-md": "calc(var(--theme-radius) * 0.75)",
        "claude-lg": "var(--theme-radius)",
        "claude-xl": "calc(var(--theme-radius) * 1.5)",
        "claude-2xl": "calc(var(--theme-radius) * 2)",
      },
      boxShadow: {
        "ring-warm": "0 0 0 1px #d1cfc5",
        "ring-deep": "0 0 0 1px #c2c0b6",
        "ring-dark": "0 0 0 1px #30302e",
        "ring-terracotta": "0 0 0 1px #c96442",
        whisper: "rgba(0, 0, 0, 0.05) 0px 4px 24px",
        "whisper-lg": "rgba(0, 0, 0, 0.06) 0px 8px 32px",
      },
      lineHeight: {
        "claude-tight": "1.10",
        "claude-heading": "1.20",
        "claude-relaxed": "1.60",
      },
    },
  },
  plugins: [],
};
