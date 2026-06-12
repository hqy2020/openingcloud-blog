import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { Link } from "react-router-dom";
import { coverHeroConfig } from "../../../data/revamp/coverHero";
import { cn } from "../../../lib/utils";
import { OrbitingProfileCard } from "./OrbitingProfileCard";

type HomeHeroProps = {
  hero: {
    title: string;
    subtitle: string;
    slogans: string[];
    fallback_image: string;
    fallback_video: string;
  };
  quoteText?: string;
};

type HeroBackdropLayerProps = {
  eyeTitle: string;
  heroTitle: string;
  heroSubtitle: string;
  slogans: string[];
  variant: "base" | "reveal";
};

const profileRoles = [
  "Software Engineer",
  "Zhejiang University MSc",
  "CAD&CG State Key Lab Researcher",
  "Cloud Computing Intern",
  "Tongji University BS",
  "EV Startup Intern",
  "AI Enthusiast",
  "Knowledge Management Researcher",
];

function HeroBackdropLayer({ eyeTitle, heroTitle, heroSubtitle, slogans, variant }: HeroBackdropLayerProps) {
  const repeatedTitle = Array.from({ length: 6 }, () => heroTitle.toUpperCase());
  const supportingSlogans = slogans.slice(0, 3);
  const isReveal = variant === "reveal";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        isReveal ? "text-[rgb(var(--theme-surface-raised))]" : "text-theme-ink/90",
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-4 flex gap-6 whitespace-nowrap px-5 text-[clamp(2.2rem,8vw,7rem)] font-black uppercase leading-none tracking-[-0.08em] sm:top-6 sm:px-8 lg:px-12",
          isReveal ? "opacity-[0.18]" : "opacity-[0.07]",
        )}
      >
        {repeatedTitle.map((item, index) => (
          <span key={`${variant}-headline-${index}`} className="shrink-0">
            {item}
          </span>
        ))}
      </div>

      <div
        className={cn(
          "absolute left-4 top-16 max-w-[min(32rem,76vw)] sm:left-8 sm:top-24 lg:left-14 lg:top-24",
          isReveal ? "opacity-[0.96]" : "opacity-[0.88]",
        )}
      >
        <p
          className={cn(
            "font-theme-sans text-[10px] font-semibold uppercase tracking-[0.48em] sm:text-xs",
            isReveal ? "text-[rgb(var(--theme-surface-raised))/0.74]" : "text-theme-muted/80",
          )}
        >
          {coverHeroConfig.my_name_is}
        </p>
        <h2
          className={cn(
            "mt-3 font-theme-display text-[clamp(3rem,11vw,7.8rem)] font-semibold leading-[0.88] tracking-[-0.06em]",
            isReveal ? "text-[rgb(var(--theme-surface-raised))]" : "text-theme-ink/92",
          )}
        >
          {eyeTitle}
        </h2>
        <p
          className={cn(
            "mt-3 max-w-[22rem] font-theme-sans text-xs uppercase tracking-[0.28em] sm:text-sm",
            isReveal ? "text-[rgb(var(--theme-surface-raised))/0.75]" : "text-theme-muted/80",
          )}
        >
          {heroSubtitle}
        </p>
      </div>

      <div
        className={cn(
          "absolute bottom-24 right-4 hidden max-w-[26rem] flex-col items-end gap-2 text-right sm:flex sm:right-8 lg:right-14",
          isReveal ? "opacity-[0.94]" : "opacity-[0.76]",
        )}
      >
        {supportingSlogans.map((slogan) => (
          <p
            key={`${variant}-${slogan}`}
            className={cn(
              "rounded-full px-4 py-2 font-theme-sans text-[11px] uppercase tracking-[0.18em]",
              isReveal
                ? "border border-white/20 bg-white/10 text-[rgb(var(--theme-surface-raised))/0.92]"
                : "border border-theme-line/70 bg-white/35 text-theme-muted shadow-[0_8px_24px_rgba(15,23,42,0.05)]",
            )}
          >
            {slogan}
          </p>
        ))}
      </div>
    </div>
  );
}

export function HomeHero({ hero, quoteText }: HomeHeroProps) {
  const reduceMotion = Boolean(useReducedMotion());
  const sectionRef = useRef<HTMLElement | null>(null);
  const [lensActive, setLensActive] = useState(false);
  const heroNarrative = quoteText || hero.subtitle || coverHeroConfig.one_liner;
  const heroSignals = hero.slogans.slice(0, 3);
  const heroLensStyle = {
    "--hero-lens-x": "50%",
    "--hero-lens-y": "36%",
    "--hero-lens-size": "clamp(150px, 20vw, 260px)",
  } as CSSProperties;
  const revealClipPath = reduceMotion
    ? "none"
    : lensActive
      ? "circle(var(--hero-lens-size) at var(--hero-lens-x) var(--hero-lens-y))"
      : "circle(0px at var(--hero-lens-x) var(--hero-lens-y))";

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (reduceMotion) {
      return;
    }
    const currentTarget = event.currentTarget;
    const rect = currentTarget.getBoundingClientRect();
    currentTarget.style.setProperty("--hero-lens-x", `${event.clientX - rect.left}px`);
    currentTarget.style.setProperty("--hero-lens-y", `${event.clientY - rect.top}px`);
    if (!lensActive) {
      setLensActive(true);
    }
  };

  useEffect(() => {
    if (!sectionRef.current || reduceMotion) {
      return;
    }
    const rect = sectionRef.current.getBoundingClientRect();
    sectionRef.current.style.setProperty("--hero-lens-x", `${rect.width * 0.52}px`);
    sectionRef.current.style.setProperty("--hero-lens-y", `${rect.height * 0.34}px`);
  }, [reduceMotion]);

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden scroll-mt-28 px-0"
      style={heroLensStyle}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setLensActive(false)}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(255,255,255,0.94),transparent_22%),radial-gradient(circle_at_50%_-4%,rgba(255,255,255,0.82),transparent_34%),radial-gradient(circle_at_84%_16%,rgba(247,146,55,0.18),transparent_26%),linear-gradient(180deg,rgba(255,252,248,0.96),rgba(255,249,243,0.92)_24%,rgba(255,255,255,0.78)_46%,rgba(247,146,55,0.06)_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.2] [background-image:linear-gradient(to_right,rgba(17,24,39,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(17,24,39,0.04)_1px,transparent_1px),radial-gradient(circle_at_center,rgba(247,146,55,0.24)_0,rgba(247,146,55,0.24)_1px,transparent_1.6px)] [background-size:clamp(3rem,6vw,5rem)_clamp(3rem,6vw,5rem),clamp(3rem,6vw,5rem)_clamp(3rem,6vw,5rem),2.1rem_2.1rem]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28vh] bg-[linear-gradient(180deg,rgba(255,255,255,0.48),rgba(255,255,255,0.08)_70%,transparent)]" />
      <div className="pointer-events-none absolute inset-0 hidden sm:block">
        <HeroBackdropLayer
          eyeTitle="Keyon"
          heroTitle={hero.title || coverHeroConfig.spaced_name}
          heroSubtitle={hero.subtitle || coverHeroConfig.one_liner}
          slogans={hero.slogans}
          variant="base"
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0 hidden sm:block bg-[linear-gradient(138deg,#ff8f2f_0%,#ffb765_24%,#1f2937_100%)] opacity-[0.98]"
        style={{
          clipPath: revealClipPath,
          WebkitClipPath: revealClipPath,
          transition: "clip-path 260ms ease-out, -webkit-clip-path 260ms ease-out",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(255,255,255,0.28),transparent_24%),radial-gradient(circle_at_86%_20%,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_50%_50%,rgba(20,20,19,0.22),transparent_62%)]" />
        <HeroBackdropLayer
          eyeTitle="Keyon"
          heroTitle={hero.title || coverHeroConfig.spaced_name}
          heroSubtitle={hero.subtitle || coverHeroConfig.one_liner}
          slogans={hero.slogans}
          variant="reveal"
        />
      </div>
      <div className="relative min-h-[90vh] sm:min-h-screen">
        <div className="relative z-10 mx-auto flex min-h-[90vh] w-full max-w-7xl items-start justify-center px-2 pt-18 pb-44 sm:min-h-screen sm:px-6 sm:pt-24 sm:pb-44 lg:pt-26 lg:pb-48">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.63, ease: "easeOut" }}
            className="w-full"
          >
            <OrbitingProfileCard
              className="h-[340px] w-[340px] sm:h-[560px] sm:w-[560px] md:h-[690px] md:w-[690px] lg:h-[720px] lg:w-[720px]"
              name={coverHeroConfig.spaced_name}
              nameWords={["Keyon"]}
              roles={profileRoles}
            />
          </motion.div>
        </div>
        <div className="absolute inset-x-4 bottom-6 z-20 sm:inset-x-8 lg:bottom-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-[1.75rem] border border-white/80 bg-white/74 px-4 py-4 shadow-[0_24px_64px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:px-6 sm:py-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {["MiMo Hero", "Hermes Field", "Personal Homepage"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-black/8 bg-black/[0.03] px-3 py-1 font-theme-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-theme-soft"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <p className="max-w-2xl font-theme-body text-sm leading-6 text-theme-muted sm:text-[15px]">
                {heroNarrative}
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <div className="flex flex-wrap gap-2 lg:justify-end">
                {heroSignals.map((signal) => (
                  <span
                    key={signal}
                    className="rounded-full border border-[#f79237]/20 bg-[#fff5eb] px-3 py-1 font-theme-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8d5423]"
                  >
                    {signal}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to={coverHeroConfig.cta.primary_href}
                  className="inline-flex items-center justify-center rounded-full bg-[#111827] px-5 py-3 font-theme-sans text-xs font-semibold uppercase tracking-[0.24em] text-white no-underline transition hover:bg-[#1f2937]"
                >
                  {coverHeroConfig.cta.primary_label}
                </Link>
                <Link
                  to="/#life"
                  className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 font-theme-sans text-xs font-semibold uppercase tracking-[0.24em] text-theme-ink no-underline transition hover:border-[#f79237]/45 hover:text-[#c96442]"
                >
                  看看时间轴
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute left-0 top-0 hidden rounded-full sm:block",
            "border border-white/75 bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.72),rgba(255,255,255,0.14)_50%,rgba(255,255,255,0)_72%)]",
            "shadow-[0_18px_45px_rgba(15,23,42,0.16),inset_0_0_0_1px_rgba(255,255,255,0.22)] backdrop-blur-[2px]",
            lensActive ? "opacity-100" : "opacity-0",
          )}
          style={{
            left: "var(--hero-lens-x)",
            top: "var(--hero-lens-y)",
            width: "var(--hero-lens-size)",
            height: "var(--hero-lens-size)",
            transform: "translate(-50%, -50%)",
            transition: "opacity 220ms ease-out",
          }}
        >
          <div className="absolute inset-[10%] rounded-full border border-white/55" />
          <div className="absolute inset-[18%] rounded-full border border-white/30" />
        </div>
      </div>
    </section>
  );
}
