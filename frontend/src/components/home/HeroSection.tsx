import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
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
};

const DEFAULT_GITHUB_PROFILE = "https://github.com/hqy2020";

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

export function HeroSection({ hero, githubUrl }: HeroSectionProps) {
  const [index, setIndex] = useState(0);
  const [mobile, setMobile] = useState(false);
  const [allowVideo, setAllowVideo] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

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
      setMobile(isMobile);
      setReducedMotion(reduced);
      setAllowVideo(!isMobile && !reduced && (effectiveType === "" || effectiveType === "4g"));
    };

    updateCapability();
    reduceMotionMedia.addEventListener("change", updateCapability);
    mobileMedia.addEventListener("change", updateCapability);

    return () => {
      reduceMotionMedia.removeEventListener("change", updateCapability);
      mobileMedia.removeEventListener("change", updateCapability);
    };
  }, []);

  const activeSlogan = useMemo(() => hero.slogans[index] ?? hero.slogans[0] ?? "", [hero.slogans, index]);
  const githubProfile = useMemo(() => resolveGithubProfile(githubUrl), [githubUrl]);
  const followLabel = githubProfile.handle === "GitHub" ? "关注 GitHub" : `关注 GitHub @${githubProfile.handle}`;
  const followers = useGithubFollowers(githubProfile.handle);

  return (
    <section className="relative left-1/2 min-h-[100vh] w-screen -translate-x-1/2 overflow-hidden bg-[#1C2E57] text-white">
      <div className="absolute inset-0">
        <img
          alt="云海背景"
          className="h-full w-full object-cover opacity-82 saturate-[1.18] brightness-[1.08]"
          src={hero.fallback_image}
          loading="eager"
        />
        {allowVideo && hero.fallback_video ? (
          <video
            autoPlay
            className="absolute inset-0 h-full w-full object-cover opacity-46 saturate-[1.1] brightness-[1.05]"
            loop
            muted
            playsInline
            preload="metadata"
          >
            <source src={hero.fallback_video} type="video/mp4" />
          </video>
        ) : null}
      </div>

      <HeroAtmosphereCanvas mobile={mobile} reducedMotion={reducedMotion} />

      <motion.div
        className="pointer-events-none absolute -top-32 left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-[#FFE0A9]/28 blur-3xl"
        animate={reducedMotion ? undefined : { opacity: [0.2, 0.34, 0.2], x: [-20, 16, -20] }}
        transition={reducedMotion ? undefined : { duration: 8.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -right-24 top-12 h-[24rem] w-[24rem] rounded-full bg-[#A9C4FF]/22 blur-3xl"
        animate={reducedMotion ? undefined : { opacity: [0.12, 0.24, 0.12], y: [-10, 16, -10] }}
        transition={reducedMotion ? undefined : { duration: 9.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,236,190,0.38),transparent_32%),radial-gradient(circle_at_16%_18%,rgba(92,124,223,0.28),transparent_44%),radial-gradient(circle_at_84%_14%,rgba(170,190,255,0.26),transparent_38%),linear-gradient(180deg,rgba(16,32,74,0.1),rgba(10,24,60,0.42)_72%,rgba(8,16,44,0.58))]" />

      <div className="relative mx-auto flex min-h-[100vh] w-full max-w-6xl flex-col items-center justify-center px-6 text-center sm:px-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-5xl tracking-tight sm:text-7xl"
          style={{ fontFamily: "'LXGW WenKai', 'Kaiti SC', serif" }}
        >
          opening
          <span className="bg-gradient-to-r from-[#4F6AE5] via-[#84A3FF] to-[#C7D6FF] bg-clip-text text-transparent">Clouds</span>
        </motion.h1>

        <p className="mt-4 max-w-2xl text-base text-slate-200 sm:text-lg">{hero.subtitle}</p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.45, ease: "easeOut" }}
          className="group relative mt-8"
        >
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
        </motion.div>

        <div className="mt-10 h-16 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlogan}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="text-lg font-medium text-[#EAF0FF] sm:text-2xl"
            >
              {activeSlogan}
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.4 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-2 text-xs tracking-[0.28em] text-slate-300"
        >
          <span className="rounded-full border border-white/20 px-3 py-1">Tech</span>
          <span className="rounded-full border border-white/20 px-3 py-1">Efficiency</span>
          <span className="rounded-full border border-white/20 px-3 py-1">Life</span>
        </motion.div>

        <motion.div
          animate={{ y: [0, 8, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="absolute bottom-8 text-xs uppercase tracking-[0.22em] text-slate-300"
        >
          Scroll
        </motion.div>
      </div>
    </section>
  );
}
