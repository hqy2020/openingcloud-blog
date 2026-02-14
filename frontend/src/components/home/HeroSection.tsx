import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (hero.slogans.length <= 1) {
      return;
    }
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % hero.slogans.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [hero.slogans.length]);

  const activeSlogan = hero.slogans[index] ?? hero.slogans[0] ?? "";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-slate-900 text-white shadow-2xl">
      <div className="absolute inset-0">
        <img alt="云海背景" className="h-full w-full object-cover" src={hero.fallback_image} />
        {hero.fallback_video ? (
          <video
            autoPlay
            className="absolute inset-0 h-full w-full object-cover opacity-40"
            loop
            muted
            playsInline
            preload="metadata"
          >
            <source src={hero.fallback_video} type="video/mp4" />
          </video>
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-950/60 to-slate-950/90" />
      </div>

      <div className="relative px-6 py-16 sm:px-10 sm:py-24">
        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold tracking-tight sm:text-7xl"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          {hero.title}
        </motion.h1>

        <p className="mt-5 text-base text-slate-200 sm:text-lg">{hero.subtitle}</p>

        <div className="mt-10 h-12 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={activeSlogan}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-medium text-cyan-100 sm:text-2xl"
              exit={{ opacity: 0, y: -10 }}
              initial={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.45 }}
            >
              {activeSlogan}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
