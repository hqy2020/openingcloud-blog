import { motion } from "motion/react";
import type { CSSProperties } from "react";
import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import type { HomePayload } from "../../api/home";
import { useTheme } from "../../app/theme";
import { usePageVisitTracker } from "../../hooks/usePageVisitTracker";
import { useSiteAudio } from "../../hooks/useSiteAudio";
import { resolveAccentByPath } from "../../theme/categoryVisuals";
import { ContactSection } from "../home/ContactSection";
import { BlogPetMachine } from "../pet/BlogPetMachine";
import { BarrageCommentsSidebar } from "./BarrageCommentsSidebar";
import { GlobalSloganTicker } from "./GlobalSloganTicker";
import { DotBackground } from "../ui/DotBackground";

const navLinks = [
  { to: "/tech", label: "技术" },
  { to: "/learning", label: "效率" },
  { to: "/life", label: "生活" },
];

const homeAnchors = [
  { href: "#hero", label: "首页" },
  { href: "#achievements", label: "成就" },
  { href: "#projects", label: "项目" },
  { href: "#time", label: "Time" },
  { href: "#map", label: "地图" },
  { href: "#radar", label: "雷达" },
  { href: "#timeline", label: "经历" },
  { href: "#stats", label: "数据" },
  { href: "#contact", label: "联系" },
];

const footerContact: HomePayload["contact"] = {
  email: "hqy200091@163.com",
  github: "https://github.com/hqy2020",
};

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

function GithubIcon() {
  return (
    <svg aria-hidden="true" className="h-[1.1rem] w-[1.1rem]" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.59 2 12.25c0 4.53 2.87 8.38 6.84 9.74.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.38-3.37-1.38-.46-1.2-1.11-1.52-1.11-1.52-.91-.63.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.37-2.22-.26-4.55-1.14-4.55-5.08 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.45c.85 0 1.7.12 2.5.36 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.64 1.03 2.76 0 3.95-2.33 4.82-4.56 5.08.36.32.67.95.67 1.91 0 1.38-.01 2.5-.01 2.84 0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.59 17.52 2 12 2z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg aria-hidden="true" className="h-[1.1rem] w-[1.1rem]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

export function AppLayout() {
  const { theme } = useTheme();
  const location = useLocation();
  usePageVisitTracker();

  const isHomeRoute = location.pathname === "/";
  const { enabled: audioEnabled, playing: audioPlaying, toggleEnabled: toggleAudio, ready: audioReady } = useSiteAudio({
    theme,
    homeRouteActive: isHomeRoute,
  });

  const visual = resolveAccentByPath(location.pathname);
  const logoSrc = "/brand/logo-icon-ink.png";

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const headerStyle: CSSProperties = {
    background: "rgba(255,255,255,0.8)",
  };

  const currentLinks = isHomeRoute ? homeAnchors : navLinks;

  return (
    <DotBackground className="min-h-screen text-slate-800">
      <header className="sticky top-0 z-30 border-b border-slate-200/60 backdrop-blur-xl" style={headerStyle}>
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2">
          {/* Left: Logo + site name */}
          <NavLink aria-label="返回首页" className="inline-flex items-center gap-2.5" title="首页" to="/">
            <img
              alt="启云博客"
              className="h-10 w-10 select-none rounded-full object-contain"
              src={logoSrc}
            />
            <span className="hidden text-base font-semibold tracking-tight text-slate-800 sm:inline">
              openingClouds
            </span>
          </NavLink>

          {/* Center: Navigation links (desktop) */}
          <nav className="hidden items-center gap-1 md:flex">
            {currentLinks.map((item) => {
              const isAnchor = "href" in item;
              if (isAnchor) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
                  >
                    {item.label}
                  </a>
                );
              }
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="rounded-full px-3 py-1.5 text-sm font-medium transition"
                >
                  {({ isActive }) => (
                    <span className="relative">
                      {isActive ? (
                        <motion.span
                          layoutId="nav-pill"
                          className="absolute inset-0 -mx-1 -my-0.5 rounded-full bg-slate-100"
                          transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        />
                      ) : null}
                      <span
                        className={`relative ${isActive ? "text-slate-800" : "text-slate-600 hover:text-slate-800"}`}
                      >
                        {item.label}
                      </span>
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right: Social icons + admin + audio + mobile menu */}
          <div className="flex items-center gap-1.5">
            <a
              href="https://github.com/hqy2020"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              title="GitHub"
              className="hidden h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 sm:inline-flex"
            >
              <GithubIcon />
            </a>

            <a
              href="mailto:hqy200091@163.com"
              aria-label="邮箱"
              title="邮箱"
              className="hidden h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 sm:inline-flex"
            >
              <MailIcon />
            </a>

            <a
              href="/admin/"
              aria-label="后台管理"
              title="后台管理"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <AdminEntryIcon />
            </a>

            <button
              aria-label={audioEnabled ? "关闭背景音乐" : "开启背景音乐"}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-slate-100"
              disabled={!audioReady}
              onClick={toggleAudio}
              style={{
                color: audioEnabled ? "#0F766E" : "#64748B",
                opacity: audioReady ? 1 : 0.72,
              }}
              title={audioEnabled ? "背景音乐已开启" : "背景音乐已关闭"}
              type="button"
            >
              <AudioToggleIcon enabled={audioEnabled} playing={audioPlaying} />
            </button>

            {/* Mobile hamburger */}
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="菜单"
            >
              {mobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen ? (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-200/50 bg-white/95 backdrop-blur-xl md:hidden"
          >
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
              {currentLinks.map((item) => {
                const isAnchor = "href" in item;
                if (isAnchor) {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </a>
                  );
                }
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                );
              })}
              <div className="flex items-center gap-2 border-t border-slate-100 pt-2 sm:hidden">
                <a
                  href="https://github.com/hqy2020"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
                >
                  <GithubIcon />
                </a>
                <a
                  href="mailto:hqy200091@163.com"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
                >
                  <MailIcon />
                </a>
              </div>
            </div>
          </motion.nav>
        ) : null}

        {isHomeRoute ? <GlobalSloganTicker accentRgb={visual.glowRgb} isDark={false} /> : null}
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-8">
        <Outlet />
      </main>

      <footer className="mt-12 w-full border-t border-slate-200/90 text-slate-500">
        <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-4 text-sm">
          <ContactSection contact={footerContact} variant="footer" />
          <p className="mt-4 text-xs">&copy; {new Date().getFullYear()} openingClouds</p>
        </div>
      </footer>

      <BarrageCommentsSidebar />
      <BlogPetMachine />
    </DotBackground>
  );
}
