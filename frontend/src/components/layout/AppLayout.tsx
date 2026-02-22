import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState, type CSSProperties, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { usePageVisitTracker } from "../../hooks/usePageVisitTracker";
import { resolveAccentByPath } from "../../theme/categoryVisuals";
import { BlogPetMachine } from "../pet/BlogPetMachine";
import { BarrageCommentsSidebar } from "./BarrageCommentsSidebar";
import { GlobalSloganTicker } from "./GlobalSloganTicker";
import { DotBackground } from "../ui/DotBackground";
import { DistortedGlassSurface } from "../ui/DistortedGlassSurface";
import { MultiFollowCursor } from "../ui/MultiFollowCursor";
import { StripeBgGuides } from "../ui/StripeBgGuides";

const headerTabs = [
  { to: "/tech", label: "文章" },
  { to: "/#achievements", label: "高光时刻", nativeAnchor: true },
  { to: "/#projects", label: "代码", nativeAnchor: true },
  { to: "/#game", label: "游戏", nativeAnchor: true },
  { to: "/#timeline", label: "人生旅程", nativeAnchor: true },
  { to: "/life", label: "愿望清单" },
];

const navbarShadow =
  "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset";

const socialPulseStyle = {
  "--pulse-color": "rgba(226, 232, 240, 0.82)",
  "--pulse-duration": "1.5s",
} as CSSProperties;

type PulsatingSocialLinkProps = {
  href: string;
  label: string;
  children: ReactNode;
};

function PulsatingSocialLink({ href, label, children }: PulsatingSocialLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="navbar-pulsating-link inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:text-slate-800"
      style={socialPulseStyle}
    >
      <span aria-hidden="true" className="pointer-events-none navbar-pulsating-link__pulse" />
      <span className="relative z-10">{children}</span>
    </a>
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

function XiaohongshuIcon() {
  return (
    <svg aria-hidden="true" className="h-[1.1rem] w-[1.1rem]" fill="currentColor" viewBox="0 0 24 24">
      <path d="M22.405 9.879c.002.016.01.02.07.019h.725a.797.797 0 0 0 .78-.972.794.794 0 0 0-.884-.618.795.795 0 0 0-.692.794c0 .101-.002.666.001.777zm-11.509 4.808c-.203.001-1.353.004-1.685.003a2.528 2.528 0 0 1-.766-.126.025.025 0 0 0-.03.014L7.7 16.127a.025.025 0 0 0 .01.032c.111.06.336.124.495.124.66.01 1.32.002 1.981 0 .01 0 .02-.006.023-.015l.712-1.545a.025.025 0 0 0-.024-.036zM.477 9.91c-.071 0-.076.002-.076.01a.834.834 0 0 0-.01.08c-.027.397-.038.495-.234 3.06-.012.24-.034.389-.135.607-.026.057-.033.042.003.112.046.092.681 1.523.787 1.74.008.015.011.02.017.02.008 0 .033-.026.047-.044.147-.187.268-.391.371-.606.306-.635.44-1.325.486-1.706.014-.11.021-.22.03-.33l.204-2.616.022-.293c.003-.029 0-.033-.03-.034zm7.203 3.757a1.427 1.427 0 0 1-.135-.607c-.004-.084-.031-.39-.235-3.06a.443.443 0 0 0-.01-.082c-.004-.011-.052-.008-.076-.008h-1.48c-.03.001-.034.005-.03.034l.021.293c.076.982.153 1.964.233 2.946.05.4.186 1.085.487 1.706.103.215.223.419.37.606.015.018.037.051.048.049.02-.003.742-1.642.804-1.765.036-.07.03-.055.003-.112zm3.861-.913h-.872a.126.126 0 0 1-.116-.178l1.178-2.625a.025.025 0 0 0-.023-.035l-1.318-.003a.148.148 0 0 1-.135-.21l.876-1.954a.025.025 0 0 0-.023-.035h-1.56c-.01 0-.02.006-.024.015l-.926 2.068c-.085.169-.314.634-.399.938a.534.534 0 0 0-.02.191.46.46 0 0 0 .23.378.981.981 0 0 0 .46.119h.59c.041 0-.688 1.482-.834 1.972a.53.53 0 0 0-.023.172.465.465 0 0 0 .23.398c.15.092.342.12.475.12l1.66-.001c.01 0 .02-.006.023-.015l.575-1.28a.025.025 0 0 0-.024-.035zm-6.93-4.937H3.1a.032.032 0 0 0-.034.033c0 1.048-.01 2.795-.01 6.829 0 .288-.269.262-.28.262h-.74c-.04.001-.044.004-.04.047.001.037.465 1.064.555 1.263.01.02.03.033.051.033.157.003.767.009.938-.014.153-.02.3-.06.438-.132.3-.156.49-.419.595-.765.052-.172.075-.353.075-.533.002-2.33 0-4.66-.007-6.991a.032.032 0 0 0-.032-.032zm11.784 6.896c0-.014-.01-.021-.024-.022h-1.465c-.048-.001-.049-.002-.05-.049v-4.66c0-.072-.005-.07.07-.07h.863c.08 0 .075.004.075-.074V8.393c0-.082.006-.076-.08-.076h-3.5c-.064 0-.075-.006-.075.073v1.445c0 .083-.006.077.08.077h.854c.075 0 .07-.004.07.07v4.624c0 .095.008.084-.085.084-.37 0-1.11-.002-1.304 0-.048.001-.06.03-.06.03l-.697 1.519s-.014.025-.008.036c.006.01.013.008.058.008 1.748.003 3.495.002 5.243.002.03-.001.034-.006.035-.033v-1.539zm4.177-3.43c0 .013-.007.023-.02.024-.346.006-.692.004-1.037.004-.014-.002-.022-.01-.022-.024-.005-.434-.007-.869-.01-1.303 0-.072-.006-.071.07-.07l.733-.003c.041 0 .081.002.12.015.093.025.16.107.165.204.006.431.002 1.153.001 1.153zm2.67.244a1.953 1.953 0 0 0-.883-.222h-.18c-.04-.001-.04-.003-.042-.04V10.21c0-.132-.007-.263-.025-.394a1.823 1.823 0 0 0-.153-.53 1.533 1.533 0 0 0-.677-.71 2.167 2.167 0 0 0-1-.258c-.153-.003-.567 0-.72 0-.07 0-.068.004-.068-.065V7.76c0-.031-.01-.041-.046-.039H17.93s-.016 0-.023.007c-.006.006-.008.012-.008.023v.546c-.008.036-.057.015-.082.022h-.95c-.022.002-.028.008-.03.032v1.481c0 .09-.004.082.082.082h.913c.082 0 .072.128.072.128V11.19s.003.117-.06.117h-1.482c-.068 0-.06.082-.06.082v1.445s-.01.068.064.068h1.457c.082 0 .076-.006.076.079v3.225c0 .088-.007.081.082.081h1.43c.09 0 .082.007.082-.08v-3.27c0-.029.006-.035.033-.035l2.323-.003c.098 0 .191.02.28.061a.46.46 0 0 1 .274.407c.008.395.003.79.003 1.185 0 .259-.107.367-.33.367h-1.218c-.023.002-.029.008-.028.033.184.437.374.871.57 1.303a.045.045 0 0 0 .04.026c.17.005.34.002.51.003.15-.002.517.004.666-.01a2.03 2.03 0 0 0 .408-.075c.59-.18.975-.698.976-1.313v-1.981c0-.128-.01-.254-.034-.38 0 .078-.029-.641-.724-.998z" />
    </svg>
  );
}

function ZhihuIcon() {
  return (
    <svg aria-hidden="true" className="h-[1.1rem] w-[1.1rem]" fill="currentColor" viewBox="0 0 24 24">
      <path d="M5.721 0C2.251 0 0 2.25 0 5.719V18.28C0 21.751 2.252 24 5.721 24h12.56C21.751 24 24 21.75 24 18.281V5.72C24 2.249 21.75 0 18.281 0zm1.964 4.078c-.271.73-.5 1.434-.68 2.11h4.587c.545-.006.445 1.168.445 1.171H9.384a58.104 58.104 0 01-.112 3.797h2.712c.388.023.393 1.251.393 1.266H9.183a9.223 9.223 0 01-.408 2.102l.757-.604c.452.456 1.512 1.712 1.906 2.177.473.681.063 2.081.063 2.081l-2.794-3.382c-.653 2.518-1.845 3.607-1.845 3.607-.523.468-1.58.82-2.64.516 2.218-1.73 3.44-3.917 3.667-6.497H4.491c0-.015.197-1.243.806-1.266h2.71c.024-.32.086-3.254.086-3.797H6.598c-.136.406-.158.447-.268.753-.594 1.095-1.603 1.122-1.907 1.155.906-1.821 1.416-3.6 1.591-4.064.425-1.124 1.671-1.125 1.671-1.125zM13.078 6h6.377v11.33h-2.573l-2.184 1.373-.401-1.373h-1.219zm1.313 1.219v8.86h.623l.263.937 1.455-.938h1.456v-8.86z" />
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
  const location = useLocation();
  usePageVisitTracker();

  const isHomeRoute = location.pathname === "/";
  const visual = resolveAccentByPath(location.pathname);

  const [mobileMenuOwnerKey, setMobileMenuOwnerKey] = useState<string | null>(null);
  const [hoveredNavIndex, setHoveredNavIndex] = useState<number | null>(null);
  const [compactNavbar, setCompactNavbar] = useState(false);
  const locationKey = location.key || `${location.pathname}${location.search}${location.hash}`;
  const mobileMenuOpen = mobileMenuOwnerKey === locationKey;
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const nextCompact = latest > 80;
    setCompactNavbar((current) => (current === nextCompact ? current : nextCompact));
  });

  const activeDesktopIndex = headerTabs.findIndex((item) => !item.nativeAnchor && item.to === location.pathname);

  return (
    <DotBackground className="min-h-screen text-slate-800">
      <header className="sticky inset-x-0 top-0 z-40">
        <div className="mx-auto w-full max-w-7xl px-3 pt-3 sm:px-4">
          <motion.div
            animate={{
              width: compactNavbar ? "74%" : "100%",
              y: compactNavbar ? 16 : 0,
              boxShadow: compactNavbar ? navbarShadow : "none",
              borderColor: compactNavbar ? "rgba(226,232,240,0.8)" : "rgba(226,232,240,0)",
            }}
            transition={{
              type: "spring",
              stiffness: 220,
              damping: 36,
            }}
            className="relative z-[60] mx-auto hidden w-full max-w-7xl items-center justify-between overflow-hidden rounded-full border border-slate-200/70 px-4 py-2 isolate lg:flex"
          >
            <DistortedGlassSurface intensity={compactNavbar ? "regular" : "soft"} className="absolute inset-0 rounded-full" />

            <NavLink
              aria-label="返回首页"
              className="relative z-20 inline-flex items-center px-2 py-1 text-2xl font-semibold tracking-tight text-slate-800"
              title="首页"
              to="/"
            >
              OpeningClouds
            </NavLink>

            <nav
              onMouseLeave={() => setHoveredNavIndex(null)}
              className="absolute inset-0 z-10 hidden items-center justify-center gap-1 text-sm font-medium lg:flex"
            >
              {headerTabs.map((item, index) => {
                const showHighlight = hoveredNavIndex === index || (hoveredNavIndex === null && activeDesktopIndex === index);
                const content = (
                  <>
                    {showHighlight ? (
                      <motion.span
                        layoutId="desktop-navbar-hover"
                        className="absolute inset-0 rounded-full bg-slate-200/70"
                        transition={{ type: "spring", stiffness: 280, damping: 28 }}
                      />
                    ) : null}
                    <span className="relative z-10">{item.label}</span>
                  </>
                );

                if (item.nativeAnchor) {
                  return (
                    <a
                      key={item.label}
                      href={item.to}
                      className="relative rounded-full px-3 py-1.5 text-slate-600 transition hover:text-slate-900"
                      onFocus={() => setHoveredNavIndex(index)}
                      onMouseEnter={() => setHoveredNavIndex(index)}
                    >
                      {content}
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="relative rounded-full px-3 py-1.5 text-slate-600 transition hover:text-slate-900"
                    onFocus={() => setHoveredNavIndex(index)}
                    onMouseEnter={() => setHoveredNavIndex(index)}
                  >
                    {content}
                  </Link>
                );
              })}
            </nav>

            <div className="relative z-20 flex items-center gap-1">
              <PulsatingSocialLink href="https://github.com/hqy2020" label="GitHub">
                <GithubIcon />
              </PulsatingSocialLink>
              <PulsatingSocialLink href="https://xhslink.com/m/7jfSehmMT7r" label="小红书">
                <XiaohongshuIcon />
              </PulsatingSocialLink>
              <PulsatingSocialLink href="https://www.zhihu.com/people/hu-qi-yun-1" label="知乎">
                <ZhihuIcon />
              </PulsatingSocialLink>
              <span className="mx-1 h-5 w-px bg-slate-200" />
              <a
                href="/admin/"
                aria-label="后台管理"
                title="后台管理"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <AdminEntryIcon />
              </a>
            </div>
          </motion.div>

          <motion.div
            animate={{
              width: compactNavbar ? "90%" : "100%",
              y: compactNavbar ? 10 : 0,
              boxShadow: compactNavbar ? navbarShadow : "none",
              borderColor: compactNavbar ? "rgba(226,232,240,0.8)" : "rgba(226,232,240,0)",
            }}
            transition={{
              type: "spring",
              stiffness: 220,
              damping: 36,
            }}
            className="relative z-50 mx-auto flex w-full max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-[2rem] border border-slate-200/70 px-3 py-2 isolate lg:hidden"
          >
            <DistortedGlassSurface intensity={compactNavbar ? "regular" : "soft"} className="absolute inset-0 rounded-[2rem]" />

            <div className="relative z-10 flex w-full items-center justify-between">
              <NavLink
                aria-label="返回首页"
                className="inline-flex items-center px-1.5 py-0.5 text-lg font-semibold tracking-tight text-slate-800"
                title="首页"
                to="/"
              >
                OpeningClouds
              </NavLink>

              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
                onClick={() => setMobileMenuOwnerKey((current) => (current === locationKey ? null : locationKey))}
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? "关闭菜单" : "打开菜单"}
              >
                {mobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
              </button>
            </div>

            <AnimatePresence>
              {mobileMenuOpen ? (
                <motion.nav
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="relative mt-3 flex flex-col gap-1 overflow-hidden rounded-2xl border border-slate-200/70 px-3 py-3 shadow-lg"
                >
                  <DistortedGlassSurface intensity="soft" className="absolute inset-0 rounded-2xl" />

                  <div className="relative z-10 flex flex-col gap-1">
                    {headerTabs.map((item) =>
                      item.nativeAnchor ? (
                        <a
                          key={item.label}
                          href={item.to}
                          className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                          onClick={() => setMobileMenuOwnerKey(null)}
                        >
                          {item.label}
                        </a>
                      ) : (
                        <Link
                          key={item.label}
                          to={item.to}
                          className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                          onClick={() => setMobileMenuOwnerKey(null)}
                        >
                          {item.label}
                        </Link>
                      ),
                    )}

                    <div className="mt-1 flex items-center gap-1 border-t border-slate-100 pt-2">
                      <PulsatingSocialLink href="https://github.com/hqy2020" label="GitHub">
                        <GithubIcon />
                      </PulsatingSocialLink>
                      <PulsatingSocialLink href="https://xhslink.com/m/7jfSehmMT7r" label="小红书">
                        <XiaohongshuIcon />
                      </PulsatingSocialLink>
                      <PulsatingSocialLink href="https://www.zhihu.com/people/hu-qi-yun-1" label="知乎">
                        <ZhihuIcon />
                      </PulsatingSocialLink>
                      <a
                        href="/admin/"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
                        onClick={() => setMobileMenuOwnerKey(null)}
                      >
                        <AdminEntryIcon />
                      </a>
                    </div>
                  </div>
                </motion.nav>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </div>

        {isHomeRoute ? <GlobalSloganTicker accentRgb={visual.glowRgb} isDark={false} /> : null}
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-8">
        <Outlet />
      </main>

      <footer className="relative mt-12 w-full overflow-hidden border-t border-slate-200/90 bg-gradient-to-b from-white/94 via-slate-50/80 to-slate-100/70 text-slate-600">
        <StripeBgGuides
          animated
          animationDelay={0.55}
          animationDuration={36}
          className="opacity-75"
          columnCount={6}
          contained
          direction="both"
          glowColor="rgba(79, 106, 229, 0.58)"
          glowOpacity={0.46}
          glowSize="20vh"
          maxActiveColumns={3}
          minColumnWidth="5rem"
          randomInterval={7800}
          responsive
          solidLines={[1, 6]}
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-8">
          <p className="text-sm text-slate-600">联系方式：hqy200091@163.com</p>
        </div>
      </footer>

      <BarrageCommentsSidebar />
      <BlogPetMachine />
      <MultiFollowCursor />
    </DotBackground>
  );
}
