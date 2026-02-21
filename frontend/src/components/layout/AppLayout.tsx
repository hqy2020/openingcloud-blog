import { motion } from "motion/react";
import type { CSSProperties } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import type { HomePayload } from "../../api/home";
import { useTheme } from "../../app/theme";
import { resolveAccentByPath } from "../../theme/categoryVisuals";
import { usePageVisitTracker } from "../../hooks/usePageVisitTracker";
import { useSiteAudio } from "../../hooks/useSiteAudio";
import { ContactSection } from "../home/ContactSection";
import { GlobalSloganTicker } from "./GlobalSloganTicker";
import { BlogPetMachine } from "../pet/BlogPetMachine";
import { BarrageCommentsSidebar } from "./BarrageCommentsSidebar";

const links = [
  { to: "/tech", label: "技术" },
  { to: "/learning", label: "效率" },
  { to: "/life", label: "生活" },
];

const footerContact: HomePayload["contact"] = {
  email: "hqy200091@163.com",
  github: "https://github.com/hqy2020",
};

function rgba(rgb: string, alpha: number) {
  return `rgba(${rgb},${alpha})`;
}

function ThemeToggleIcon({ isDark }: { isDark: boolean }) {
  if (isDark) {
    return (
      <svg aria-hidden="true" className="h-[1.1rem] w-[1.1rem]" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M12 2.5v2.2m0 14.6v2.2M5.3 5.3l1.6 1.6m10.2 10.2 1.6 1.6M2.5 12h2.2m14.6 0h2.2M5.3 18.7l1.6-1.6m10.2-10.2 1.6-1.6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-[1.1rem] w-[1.1rem]" fill="none" viewBox="0 0 24 24">
      <path
        d="M20 14.2A8.5 8.5 0 1 1 9.8 4 7 7 0 0 0 20 14.2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function AudioToggleIcon({ enabled, playing }: { enabled: boolean; playing: boolean }) {
  if (!enabled) {
    return (
      <svg aria-hidden="true" className="h-[1.1rem] w-[1.1rem]" fill="none" viewBox="0 0 24 24">
        <path
          d="M14.8 6.1a8.5 8.5 0 0 1 0 11.8M17.8 3.2a12.7 12.7 0 0 1 0 17.6M10.3 8.4l-2.7 2.3H5.2v2.6h2.4l2.7 2.3V8.4Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path d="m4.5 4.5 15 15" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-[1.1rem] w-[1.1rem]" fill="none" viewBox="0 0 24 24">
      <path
        d="M10.3 8.4l-2.7 2.3H5.2v2.6h2.4l2.7 2.3V8.4Zm4.5-2.3a8.5 8.5 0 0 1 0 11.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      {playing ? (
        <path
          d="M17.8 3.2a12.7 12.7 0 0 1 0 17.6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      ) : null}
    </svg>
  );
}

function AdminEntryIcon() {
  return (
    <svg aria-hidden="true" className="h-[1.1rem] w-[1.1rem]" fill="none" viewBox="0 0 24 24">
      <rect height="14" rx="3" stroke="currentColor" strokeWidth="1.8" width="14" x="5" y="5" />
      <path d="m9.2 10.2 2.1 1.8-2.1 1.8m4.1 0h2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export function AppLayout() {
  const { theme, isDark, toggleTheme } = useTheme();
  const location = useLocation();
  usePageVisitTracker();
  const isHomeRoute = location.pathname === "/";
  const isCategoryRoute = links.some((item) => item.to === location.pathname);
  const useFusionTabStyle = isDark && (isHomeRoute || isCategoryRoute);
  const useFusionHomeStyle = isHomeRoute && isDark;
  const { enabled: audioEnabled, playing: audioPlaying, toggleEnabled: toggleAudio, ready: audioReady } = useSiteAudio({
    theme,
    homeRouteActive: isHomeRoute,
  });
  const visual = resolveAccentByPath(location.pathname);
  const logoSrc = isDark ? "/brand/logo-icon-white.png" : "/brand/logo-icon-ink.png";

  const headerStyle: CSSProperties = useFusionHomeStyle
    ? {
        borderColor: "rgba(126, 154, 236, 0.24)",
        background:
          "linear-gradient(180deg, rgba(2,6,23,0.82) 0%, rgba(3,10,26,0.66) 64%, rgba(2,6,23,0.04) 100%)",
      }
    : isDark
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

  const navSurfaceStyle: CSSProperties = useFusionTabStyle
    ? {
        borderColor: "rgba(140, 168, 255, 0.28)",
        background: `linear-gradient(145deg, rgba(7,14,34,0.82), rgba(8,18,43,0.66) 58%, ${rgba(visual.glowRgb, 0.2)})`,
        boxShadow: `0 22px 48px rgba(2,6,23,0.5), inset 0 0 0 1px rgba(148,163,184,0.14), 0 0 34px ${rgba(visual.glowRgb, 0.16)}`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }
    : sharedSurfaceStyle;

  const activePillStyle: CSSProperties = useFusionTabStyle
    ? {
        background: `linear-gradient(135deg, ${rgba(visual.glowRgb, 0.42)}, rgba(30,41,59,0.88))`,
        boxShadow: `0 10px 28px ${rgba(visual.glowRgb, 0.28)}, inset 0 0 0 1px rgba(191,219,254,0.22)`,
      }
    : {
        background: isDark
          ? `linear-gradient(135deg, ${rgba(visual.glowRgb, 0.34)}, rgba(51,65,85,0.8))`
          : `linear-gradient(135deg, rgba(255,255,255,0.95), ${rgba(visual.glowRgb, 0.22)})`,
        boxShadow: isDark ? `0 6px 18px ${rgba(visual.glowRgb, 0.26)}` : `0 6px 14px ${rgba(visual.glowRgb, 0.2)}`,
      };

  return (
    <div className={`relative min-h-screen ${isDark ? "bg-slate-950 text-slate-300" : "bg-[#F6F7FB] text-slate-900"} ${useFusionHomeStyle ? "home-fusion-shell" : ""}`}>
      <header className={`${useFusionHomeStyle ? "fixed top-0 z-40" : "sticky top-0 z-30"} inset-x-0 border-b backdrop-blur-xl`} style={headerStyle}>
        <div className={`mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 ${useFusionHomeStyle ? "py-2.5 sm:py-3" : "py-1.5 sm:grid sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-2.5 sm:py-2"}`}>
          <NavLink aria-label="返回首页" className="inline-flex items-center justify-center" title="首页" to="/">
            <img alt="启云博客" className="h-8 w-auto select-none sm:h-9" src={logoSrc} />
          </NavLink>

          <nav
            className={`order-3 mt-1 mx-auto flex w-[96%] items-center justify-center rounded-[24px] border p-0.5 text-sm font-medium sm:order-none sm:mt-0 ${useFusionTabStyle ? "sm:w-[72%]" : "sm:w-[80%] sm:justify-stretch"} ${
              isDark ? "glass-surface-dark" : "glass-surface-light"
            }`}
            style={navSurfaceStyle}
          >
            {links.map((item, index) => (
              <div key={item.to} className="relative flex min-w-0 flex-1 items-stretch">
                {index > 0 && !useFusionTabStyle ? (
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute left-0 top-1/2 z-[1] h-5 -translate-y-1/2 border-l ${
                      isDark ? "border-slate-600/75" : "border-slate-300/85"
                    }`}
                  />
                ) : null}
                <NavLink className="flex-1 rounded-[20px] transition" to={item.to}>
                  {({ isActive }) => (
                    <span
                      className={`relative block min-w-[4.2rem] rounded-[18px] px-3 py-1 text-center sm:min-w-0 sm:w-full ${
                        useFusionTabStyle ? "sm:px-4 sm:py-1.5" : "sm:px-3.5 sm:py-1.5"
                      }`}
                    >
                      {isActive ? (
                        <motion.span
                          layoutId="nav-pill"
                          className="absolute inset-0 rounded-[18px]"
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
                        style={
                          isActive
                            ? { color: useFusionTabStyle ? "#e5ecff" : isDark ? "#D1DCF0" : visual.accentHex }
                            : useFusionTabStyle
                              ? { color: "rgba(206, 220, 255, 0.86)" }
                              : undefined
                        }
                      >
                        {item.label}
                      </span>
                    </span>
                  )}
                </NavLink>
              </div>
            ))}
          </nav>

          <div className="order-2 flex items-center justify-end gap-2 sm:order-none">
            <a
              href="/admin/"
              aria-label="后台管理"
              title="后台管理"
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
                isDark ? "glass-surface-dark text-slate-200 hover:text-slate-50" : "glass-surface-light text-slate-700 hover:text-slate-900"
              }`}
              style={sharedSurfaceStyle}
            >
              <AdminEntryIcon />
            </a>

            <button
              aria-label={audioEnabled ? "关闭背景音乐" : "开启背景音乐"}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
                isDark ? "glass-surface-dark" : "glass-surface-light"
              }`}
              disabled={!audioReady}
              onClick={toggleAudio}
              style={{
                ...sharedSurfaceStyle,
                color: audioEnabled
                  ? isDark
                    ? "#A5F3FC"
                    : "#0F766E"
                  : isDark
                    ? "#94A3B8"
                    : "#64748B",
                opacity: audioReady ? 1 : 0.72,
              }}
              title={audioEnabled ? "背景音乐已开启" : "背景音乐已关闭"}
              type="button"
            >
              <AudioToggleIcon enabled={audioEnabled} playing={audioPlaying} />
            </button>

            <button
              aria-label={isDark ? "切换到浅色模式" : "切换到深色模式"}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
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
        <GlobalSloganTicker accentRgb={visual.glowRgb} isDark={isDark} mode={useFusionHomeStyle ? "floating" : "strip"} />
        <div
          className="pointer-events-none absolute inset-x-0 -bottom-4 h-4"
          style={{
            background: useFusionHomeStyle
              ? `linear-gradient(180deg, rgba(56,189,248,0.18), rgba(2,6,23,0))`
              : isDark
              ? `linear-gradient(180deg, ${rgba(visual.glowRgb, 0.2)}, rgba(15,23,42,0))`
              : `linear-gradient(180deg, ${rgba(visual.glowRgb, 0.14)}, rgba(248,249,252,0))`,
          }}
        />
      </header>

      <main className={`mx-auto w-full max-w-6xl px-4 pb-8 ${useFusionHomeStyle ? "pt-0" : "pt-6"}`}>
        <Outlet />
      </main>

      <footer
        className={`mt-12 w-full border-t ${
          isDark ? "border-slate-800/80 text-slate-400" : "border-slate-200/90 text-slate-500"
        }`}
      >
        <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-4 text-sm">
          <ContactSection contact={footerContact} variant="footer" />
          <p className="mt-4 text-xs">© {new Date().getFullYear()} openingClouds</p>
        </div>
      </footer>
      <BarrageCommentsSidebar />
      <BlogPetMachine />
    </div>
  );
}
