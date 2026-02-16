import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { HeroAtmosphereCanvas } from "./hero/HeroAtmosphereCanvas";

type HeroSectionProps = {
  hero: {
    title: string;
    subtitle: string;
    slogans: string[];
    fallback_image: string;
    fallback_video: string;
  };
};

export function HeroSection({ hero }: HeroSectionProps) {
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
