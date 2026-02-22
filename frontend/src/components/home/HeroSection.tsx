import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchHomeLikeStatus, toggleHomeLike } from "../../api/home";
import { useTheme } from "../../app/theme";
import { useGithubFollowers } from "../../hooks/useGithubFollowers";
import { HeroAtmosphereCanvas } from "./hero/HeroAtmosphereCanvas";

type HeroSectionProps = {
  hero: {
    title: string;
    subtitle: string;
    slogans: string[];
    fallback_image: string;
    fallback_video: string;
  };
  githubUrl: string;
  siteVisits?: number;
};

const DEFAULT_GITHUB_PROFILE = "https://github.com/hqy2020";
const DARK_HERO_VIDEO_SRC = "/media/hero/hero-dark-clouds.mp4";

function resolveGithubProfile(url: string) {
  const raw = String(url || "").trim();
  if (!raw) {
    return {
      profileUrl: DEFAULT_GITHUB_PROFILE,
      handle: "hqy2020",
    };
  }

  try {
    const candidate = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
    const parsed = new URL(candidate);
    const pathSegments = parsed.pathname.split("/").filter(Boolean);
    const handle = (pathSegments[0] ?? "").replace(/^@/, "");
    if (parsed.hostname.toLowerCase().endsWith("github.com") && handle) {
      return {
        profileUrl: `https://github.com/${handle}`,
        handle,
      };
    }
    return {
      profileUrl: candidate,
      handle: "GitHub",
    };
  } catch {
    return {
      profileUrl: DEFAULT_GITHUB_PROFILE,
      handle: "hqy2020",
    };
  }
}

function AnimatedFollowerCount({ value }: { value: number }) {
  const reduceMotion = Boolean(useReducedMotion());
  const [display, setDisplay] = useState(0);
  const previousRef = useRef(0);

  useEffect(() => {
    if (reduceMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplay(value);
      previousRef.current = value;
      return;
    }

    let raf = 0;
    const start = performance.now();
    const duration = 700;
    const from = previousRef.current;
    const delta = value - from;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(from + delta * progress));
      if (progress < 1) {
        raf = window.requestAnimationFrame(tick);
      } else {
        previousRef.current = value;
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [value, reduceMotion]);

  return <>{display.toLocaleString("zh-CN")}</>;
}

function FollowerBadge({ count }: { count: number | null }) {
  return (
    <AnimatePresence>
      {count !== null && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8, width: 0 }}
          animate={{ opacity: 1, scale: 1, width: "auto" }}
          exit={{ opacity: 0, scale: 0.8, width: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="inline-flex items-center overflow-hidden rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium tabular-nums"
        >
          <AnimatedFollowerCount value={count} />
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export function HeroSection({ hero, githubUrl, siteVisits }: HeroSectionProps) {
  const { isDark, theme } = useTheme();
  const [index, setIndex] = useState(0);
  const [mobile, setMobile] = useState(false);
  const [networkFast, setNetworkFast] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [homeLiked, setHomeLiked] = useState(false);
  const [homeLikes, setHomeLikes] = useState<number | null>(null);
  const [homeLikeLoading, setHomeLikeLoading] = useState(false);
  const homeLikeLoadingRef = useRef(false);

  useEffect(() => {
    if (hero.slogans.length <= 1) {
      return;
    }
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % hero.slogans.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [hero.slogans.length]);

  useEffect(() => {
    const reduceMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileMedia = window.matchMedia("(max-width: 768px)");

    const updateCapability = () => {
      const reduced = reduceMotionMedia.matches;
      const isMobile = mobileMedia.matches;
      const connection = navigator as Navigator & { connection?: { effectiveType?: string } };
      const effectiveType = connection.connection?.effectiveType ?? "";
      const fastNetwork = effectiveType === "" || effectiveType === "4g";
      setMobile(isMobile);
      setReducedMotion(reduced);
      setNetworkFast(fastNetwork);
    };

    updateCapability();
    reduceMotionMedia.addEventListener("change", updateCapability);
    mobileMedia.addEventListener("change", updateCapability);

    return () => {
      reduceMotionMedia.removeEventListener("change", updateCapability);
      mobileMedia.removeEventListener("change", updateCapability);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchHomeLikeStatus()
      .then((result) => {
        if (cancelled) {
          return;
        }
        setHomeLiked(result.liked);
        setHomeLikes(result.likes);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const activeSlogan = useMemo(() => hero.slogans[index] ?? hero.slogans[0] ?? "", [hero.slogans, index]);
  const githubProfile = useMemo(() => resolveGithubProfile(githubUrl), [githubUrl]);
  const followLabel = githubProfile.handle === "GitHub" ? "关注 GitHub" : `关注 GitHub @${githubProfile.handle}`;
  const followers = useGithubFollowers(githubProfile.handle);
  const heroVideoSource = isDark ? DARK_HERO_VIDEO_SRC : hero.fallback_video;
  const heroVideoKey = `${theme}-${heroVideoSource}`;
  const allowVideo = !mobile && (isDark || (!reducedMotion && networkFast));
  const titleShadow = isDark ? "drop-shadow-[0_8px_22px_rgba(2,6,23,0.82)]" : "drop-shadow-[0_8px_18px_rgba(8,24,54,0.42)]";
  const homeLikeLabel = homeLiked ? "取消首页点赞" : "点赞首页";

  const handleToggleHomeLike = async () => {
    if (homeLikeLoadingRef.current) {
      return;
    }
    homeLikeLoadingRef.current = true;
    setHomeLikeLoading(true);
    try {
      const result = await toggleHomeLike();
      setHomeLiked(result.liked);
      setHomeLikes(result.likes);
    } catch {
      // Ignore transient network failures and keep current UI state.
    } finally {
      homeLikeLoadingRef.current = false;
      setHomeLikeLoading(false);
    }
  };

  return (
    <section className={`relative left-1/2 min-h-[100vh] w-screen -translate-x-1/2 overflow-hidden text-white ${isDark ? "bg-[#060D1E]" : "bg-[#1C2E57]"}`}>
      <div className="absolute inset-0">
        <img
          alt="云海背景"
          className={`h-full w-full object-cover ${
            isDark ? "opacity-48 saturate-[0.7] brightness-[0.4]" : "opacity-82 saturate-[1.18] brightness-[1.08]"
          }`}
          src={hero.fallback_image}
          loading="eager"
        />
        {allowVideo && heroVideoSource ? (
          <video
            key={heroVideoKey}
            autoPlay
            className={`absolute inset-0 h-full w-full object-cover ${
              isDark ? "opacity-80 saturate-[0.86] brightness-[0.72]" : "opacity-46 saturate-[1.1] brightness-[1.05]"
            }`}
            loop
            muted
            playsInline
            preload="metadata"
            src={heroVideoSource}
          />
        ) : null}
      </div>

      <HeroAtmosphereCanvas mobile={mobile} reducedMotion={reducedMotion} themeMode={theme} />

      <motion.div
        className={`pointer-events-none absolute -top-32 left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full blur-3xl ${
          isDark ? "bg-[#60A5FA]/8" : "bg-[#FFE0A9]/28"
        }`}
        animate={reducedMotion ? undefined : { opacity: [0.2, 0.34, 0.2], x: [-20, 16, -20] }}
        transition={reducedMotion ? undefined : { duration: 8.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className={`pointer-events-none absolute -right-24 top-12 h-[24rem] w-[24rem] rounded-full blur-3xl ${
          isDark ? "bg-[#38BDF8]/10" : "bg-[#A9C4FF]/22"
        }`}
        animate={reducedMotion ? undefined : { opacity: [0.12, 0.24, 0.12], y: [-10, 16, -10] }}
        transition={reducedMotion ? undefined : { duration: 9.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <div
        className={`pointer-events-none absolute inset-0 ${
          isDark
            ? "bg-[radial-gradient(circle_at_50%_-4%,rgba(125,211,252,0.16),transparent_36%),radial-gradient(circle_at_16%_18%,rgba(56,189,248,0.11),transparent_46%),radial-gradient(circle_at_84%_14%,rgba(129,140,248,0.1),transparent_40%),linear-gradient(180deg,rgba(2,6,23,0.46),rgba(2,6,23,0.72)_68%,rgba(2,6,23,0.88))]"
            : "bg-[radial-gradient(circle_at_50%_0%,rgba(255,236,190,0.38),transparent_32%),radial-gradient(circle_at_16%_18%,rgba(92,124,223,0.28),transparent_44%),radial-gradient(circle_at_84%_14%,rgba(170,190,255,0.26),transparent_38%),linear-gradient(180deg,rgba(16,32,74,0.1),rgba(10,24,60,0.42)_72%,rgba(8,16,44,0.58))]"
        }`}
      />

      <div className="relative mx-auto flex min-h-[100vh] w-full max-w-6xl flex-col items-center justify-center px-6 text-center sm:px-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className={`text-5xl tracking-tight sm:text-7xl ${titleShadow}`}
          style={{ fontFamily: "'LXGW WenKai', 'Kaiti SC', serif" }}
        >
          opening
          <span className="bg-gradient-to-r from-[#4F6AE5] via-[#84A3FF] to-[#C7D6FF] bg-clip-text text-transparent">Clouds</span>
        </motion.h1>

        <p className={`mt-4 max-w-2xl text-base sm:text-lg ${isDark ? "text-slate-200/95 drop-shadow-[0_4px_14px_rgba(2,6,23,0.7)]" : "text-slate-200"}`}>
          {hero.subtitle}
        </p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.45, ease: "easeOut" }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <div className="group relative">
            <div className="pointer-events-none absolute -inset-3 rounded-full bg-[#4F6AE5]/0 blur-xl transition-colors duration-300 group-hover:bg-[#4F6AE5]/15" />
            <a
              aria-label={followLabel}
              className="relative inline-flex items-center gap-2.5 rounded-full border border-white/35 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(10,22,62,0.35)] backdrop-blur transition-all duration-200 hover:scale-[1.03] hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
              href={githubProfile.profileUrl}
              rel="noopener noreferrer"
              target="_blank"
              title="打开 GitHub 主页并关注"
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.59 2 12.25c0 4.53 2.87 8.38 6.84 9.74.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.38-3.37-1.38-.46-1.2-1.11-1.52-1.11-1.52-.91-.63.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.37-2.22-.26-4.55-1.14-4.55-5.08 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.45c.85 0 1.7.12 2.5.36 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.64 1.03 2.76 0 3.95-2.33 4.82-4.56 5.08.36.32.67.95.67 1.91 0 1.38-.01 2.5-.01 2.84 0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.59 17.52 2 12 2z" />
              </svg>
              <span>{followLabel}</span>
              <FollowerBadge count={followers} />
            </a>
          </div>

          {typeof siteVisits === "number" && siteVisits > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.35, ease: "easeOut" }}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/8 px-5 py-3 text-sm font-medium text-white/90 backdrop-blur"
            >
              <svg aria-hidden="true" className="h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z" />
              </svg>
              <span className="tabular-nums"><AnimatedFollowerCount value={siteVisits} /></span>
              <span className="text-white/55">visits</span>
            </motion.div>
          )}

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.78, duration: 0.35, ease: "easeOut" }}
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/8 px-5 py-3 text-sm font-medium text-white/90 backdrop-blur transition hover:bg-white/18 disabled:cursor-not-allowed disabled:opacity-70"
            type="button"
            onClick={handleToggleHomeLike}
            disabled={homeLikeLoading}
            aria-label={homeLikeLabel}
            title={homeLikeLabel}
          >
            <svg aria-hidden="true" className={`h-4 w-4 ${homeLiked ? "text-rose-300" : "text-white/70"}`} fill={homeLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 20.3 4.4 12.9a4.7 4.7 0 0 1 6.7-6.6L12 7.2l.9-.9a4.7 4.7 0 0 1 6.7 6.6L12 20.3Z"
              />
            </svg>
            <span className="tabular-nums">{homeLikes ?? 0}</span>
            <span className="text-white/55">likes</span>
          </motion.button>
        </motion.div>

        <div className="mt-10 h-16 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlogan}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className={`text-lg font-medium sm:text-2xl ${isDark ? "text-slate-200 drop-shadow-[0_4px_14px_rgba(2,6,23,0.72)]" : "text-[#EAF0FF]"}`}
            >
              {activeSlogan}
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.4 }}
          className={`mt-10 flex flex-wrap items-center justify-center gap-2 text-xs tracking-[0.28em] ${isDark ? "text-slate-300" : "text-slate-300"}`}
        >
          <span className="rounded-full border border-white/20 px-3 py-1">Tech</span>
          <span className="rounded-full border border-white/20 px-3 py-1">Efficiency</span>
          <span className="rounded-full border border-white/20 px-3 py-1">Life</span>
        </motion.div>

        <motion.div
          animate={{ y: [0, 8, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className={`absolute bottom-8 text-xs uppercase tracking-[0.22em] ${isDark ? "text-slate-300" : "text-slate-300"}`}
        >
          Scroll
        </motion.div>
      </div>
    </section>
  );
}
