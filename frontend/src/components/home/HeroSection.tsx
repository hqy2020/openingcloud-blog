import { AnimatePresence, motion } from "motion/react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { TextGenerateEffect } from "../ui/TextGenerateEffect";

const HeroCloudScene = lazy(async () => {
  const mod = await import("./hero/HeroCloudScene");
  return { default: mod.HeroCloudScene };
});

type HeroSectionProps = {
  hero: {
    title: string;
    subtitle: string;
    slogans: string[];
    fallback_image: string;
    fallback_video: string;
  };
};

function canUseWebGL() {
  const canvas = document.createElement("canvas");
  return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
}

export function HeroSection({ hero }: HeroSectionProps) {
  const [index, setIndex] = useState(0);
  const [canRender3D, setCanRender3D] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [allowVideo, setAllowVideo] = useState(false);

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
      const lowMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
      const reduced = reduceMotionMedia.matches;
      const isMobile = mobileMedia.matches;
      const connection = navigator as Navigator & { connection?: { effectiveType?: string } };
      const effectiveType = connection.connection?.effectiveType ?? "";
      setMobile(isMobile);
      setCanRender3D(!isMobile && !reduced && !(typeof lowMemory === "number" && lowMemory <= 2) && canUseWebGL());
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
    <section className="relative left-1/2 min-h-[100vh] w-screen -translate-x-1/2 overflow-hidden bg-[#0B0E18] text-white">
      <div className="absolute inset-0">
        <img alt="云海背景" className="h-full w-full object-cover opacity-45" src={hero.fallback_image} loading="eager" />
        {allowVideo && hero.fallback_video ? (
          <video
            autoPlay
            className="absolute inset-0 h-full w-full object-cover opacity-30"
            loop
            muted
            playsInline
            preload="metadata"
          >
            <source src={hero.fallback_video} type="video/mp4" />
          </video>
        ) : null}
      </div>

      {canRender3D ? (
        <Suspense fallback={null}>
          <HeroCloudScene mobile={mobile} />
        </Suspense>
      ) : null}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(79,106,229,0.35),transparent_42%),radial-gradient(circle_at_88%_18%,rgba(150,132,168,0.25),transparent_38%),linear-gradient(180deg,rgba(11,14,24,0.54),rgba(11,14,24,0.88))]" />

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
              <TextGenerateEffect text={activeSlogan} />
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
