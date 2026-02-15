import { motion } from "motion/react";
import type { CSSProperties } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useTheme } from "../../app/theme";
import { resolveAccentByPath } from "../../theme/categoryVisuals";
import { BlogPetMachine } from "../pet/BlogPetMachine";

const links = [
  { to: "/tech", label: "技术" },
  { to: "/learning", label: "效率" },
  { to: "/life", label: "生活" },
];

function rgba(rgb: string, alpha: number) {
  return `rgba(${rgb},${alpha})`;
}

function ThemeToggleIcon({ isDark }: { isDark: boolean }) {
  if (isDark) {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.9" />
        <path
          d="M12 2.5v2.2m0 14.6v2.2M5.3 5.3l1.6 1.6m10.2 10.2 1.6 1.6M2.5 12h2.2m14.6 0h2.2M5.3 18.7l1.6-1.6m10.2-10.2 1.6-1.6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.9"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M20 14.2A8.5 8.5 0 1 1 9.8 4 7 7 0 0 0 20 14.2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

function AdminEntryIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <rect height="14" rx="3" stroke="currentColor" strokeWidth="1.8" width="14" x="5" y="5" />
      <path d="m9.2 10.2 2.1 1.8-2.1 1.8m4.1 0h2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export function AppLayout() {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const visual = resolveAccentByPath(location.pathname);
  const logoSrc = isDark ? "/brand/logo-icon-white.png" : "/brand/logo-icon-ink.png";

  const headerStyle: CSSProperties = isDark
    ? {
        borderColor: rgba(visual.glowRgb, 0.36),
        background: `linear-gradient(135deg, rgba(8,16,38,0.8), rgba(12,22,48,0.76) 54%, ${rgba(visual.glowRgb, 0.24)})`,
      }
    : {
        borderColor: rgba(visual.glowRgb, 0.24),
        background: `linear-gradient(135deg, rgba(255,255,255,0.84), rgba(247,250,255,0.78) 56%, ${rgba(visual.glowRgb, 0.16)})`,
      };

  const sharedSurfaceStyle: CSSProperties = {
    borderColor: isDark ? rgba(visual.glowRgb, 0.34) : rgba(visual.glowRgb, 0.24),
    background: isDark
      ? `linear-gradient(135deg, rgba(15,23,42,0.74), rgba(30,41,59,0.64))`
      : `linear-gradient(135deg, rgba(255,255,255,0.8), rgba(242,247,255,0.72))`,
    boxShadow: isDark ? `0 10px 24px rgba(2,6,23,0.34)` : `0 10px 24px ${rgba(visual.glowRgb, 0.12)}`,
  };

  const activePillStyle: CSSProperties = {
    background: isDark
      ? `linear-gradient(135deg, ${rgba(visual.glowRgb, 0.34)}, rgba(51,65,85,0.8))`
      : `linear-gradient(135deg, rgba(255,255,255,0.95), ${rgba(visual.glowRgb, 0.22)})`,
    boxShadow: isDark ? `0 6px 18px ${rgba(visual.glowRgb, 0.26)}` : `0 6px 14px ${rgba(visual.glowRgb, 0.2)}`,
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950 text-slate-100" : "bg-[#F6F7FB] text-slate-900"}`}>
      <header className="sticky top-0 z-30 border-b backdrop-blur-xl" style={headerStyle}>
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:grid sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-3 sm:py-3">
          <NavLink aria-label="返回首页" className="inline-flex items-center justify-center" title="首页" to="/">
            <img alt="启云博客" className="h-9 w-auto select-none sm:h-10" src={logoSrc} />
          </NavLink>

          <nav
            className={`order-3 mt-1 flex w-full items-center justify-center gap-1 rounded-full border p-1 text-sm font-medium sm:order-none sm:mt-0 sm:mx-0 sm:w-full sm:justify-stretch ${
              isDark ? "glass-surface-dark" : "glass-surface-light"
            }`}
            style={sharedSurfaceStyle}
          >
            {links.map((item) => (
              <NavLink key={item.to} className="flex-1 rounded-full transition" to={item.to}>
                {({ isActive }) => (
                  <span className="relative block min-w-[4.2rem] px-3.5 py-1.5 text-center sm:min-w-0 sm:w-full sm:px-4 sm:py-2">
                    {isActive ? (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full"
                        style={activePillStyle}
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      />
                    ) : null}
                    <span
                      className={`relative transition-colors ${
                        isActive
                          ? ""
                          : isDark
                            ? "text-slate-300 hover:text-slate-50"
                            : "text-slate-600 hover:text-slate-900"
                      }`}
                      style={isActive ? { color: isDark ? "#E2ECFF" : visual.accentHex } : undefined}
                    >
                      {item.label}
                    </span>
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="order-2 flex items-center justify-end gap-2 sm:order-none">
            <a
              href="/admin/"
              aria-label="后台管理"
              title="后台管理"
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition sm:h-10 sm:w-10 ${
                isDark ? "glass-surface-dark text-slate-100 hover:text-white" : "glass-surface-light text-slate-700 hover:text-slate-900"
              }`}
              style={sharedSurfaceStyle}
            >
              <AdminEntryIcon />
            </a>

            <button
              aria-label={isDark ? "切换到浅色模式" : "切换到深色模式"}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition sm:h-11 sm:w-11 ${
                isDark ? "glass-surface-dark" : "glass-surface-light"
              }`}
              style={{ ...sharedSurfaceStyle, color: isDark ? "#FCD34D" : "#334155" }}
              onClick={toggleTheme}
              type="button"
            >
              <ThemeToggleIcon isDark={isDark} />
            </button>
          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 -bottom-5 h-5"
          style={{
            background: isDark
              ? `linear-gradient(180deg, ${rgba(visual.glowRgb, 0.2)}, rgba(15,23,42,0))`
              : `linear-gradient(180deg, ${rgba(visual.glowRgb, 0.14)}, rgba(248,249,252,0))`,
          }}
        />
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-8">
        <Outlet />
      </main>

      <footer className={`mx-auto mt-12 w-full max-w-6xl px-4 pb-10 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        © {new Date().getFullYear()} openingClouds
      </footer>
      <BlogPetMachine />
    </div>
  );
}
