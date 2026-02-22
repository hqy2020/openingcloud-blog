import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { coverHeroConfig } from "../../../data/revamp/coverHero";
import { BackgroundBeams } from "../../ui/BackgroundBeams";
import { HeroR3FScene } from "./HeroR3FScene";

type HomeHeroProps = {
  hero: {
    title: string;
    subtitle: string;
    slogans: string[];
    fallback_image: string;
    fallback_video: string;
  };
};

export function HomeHero({ hero }: HomeHeroProps) {
  const [sloganIndex, setSloganIndex] = useState(0);

  useEffect(() => {
    if (hero.slogans.length <= 1) {
      return;
    }
    const timer = window.setInterval(() => {
      setSloganIndex((current) => (current + 1) % hero.slogans.length);
    }, 3600);
    return () => window.clearInterval(timer);
  }, [hero.slogans.length]);

  const activeSlogan = useMemo(
    () => hero.slogans[sloganIndex] ?? hero.slogans[0] ?? "",
    [hero.slogans, sloganIndex],
  );
  const spacedNameChars = useMemo(() => coverHeroConfig.spaced_name.split(""), []);

  return (
    <section id="hero" className="relative left-1/2 w-screen -translate-x-1/2 scroll-mt-20 px-2 sm:px-5">
      <div className="relative min-h-[88vh] overflow-hidden rounded-[34px] border border-slate-200/80 bg-white/78 shadow-md backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-6%,rgba(255,236,184,0.45),transparent_34%),radial-gradient(circle_at_15%_20%,rgba(79,106,229,0.16),transparent_42%),radial-gradient(circle_at_84%_16%,rgba(16,185,129,0.14),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.74),rgba(248,250,255,0.94)_56%,rgba(241,245,255,0.98))]" />
        <BackgroundBeams colors={["#4F6AE5", "#84CC16", "#60A5FA"]} className="opacity-50" />

        <div className="relative z-10 mx-auto flex min-h-[88vh] w-full max-w-6xl items-center px-6 py-16 sm:px-10">
          <div className="w-full rounded-[32px] border border-slate-200/85 bg-white/75 p-6 shadow-[0_24px_62px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-10">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
              <div>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.36 }}
                  className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500"
                >
                  {coverHeroConfig.my_name_is}
                </motion.p>

                <motion.h1
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="mt-2 text-3xl font-bold tracking-[0.16em] text-slate-800 sm:text-5xl"
                >
                  {spacedNameChars.map((char, index) => (
                    <motion.span
                      key={`${char}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, delay: 0.03 * index, ease: "easeOut" }}
                      className="inline-block"
                    >
                      {char}
                    </motion.span>
                  ))}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.34, delay: 0.3 }}
                  className="mt-5 text-base font-medium tracking-wide text-slate-700"
                >
                  {coverHeroConfig.role_line}
                </motion.p>

                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.34, delay: 0.42 }}
                  className="mt-3 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg"
                >
                  {coverHeroConfig.one_liner}
                </motion.p>

                <div className="mt-4 h-8 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={activeSlogan}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                      className="text-sm font-semibold text-slate-500"
                    >
                      {activeSlogan || hero.subtitle}
                    </motion.p>
                  </AnimatePresence>
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <motion.a
                    href={coverHeroConfig.cta.primary_href}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center rounded-full bg-slate-800 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(15,23,42,0.24)] transition hover:bg-slate-700"
                  >
                    {coverHeroConfig.cta.primary_label}
                  </motion.a>
                  <motion.a
                    href={coverHeroConfig.cta.secondary_href}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center rounded-full border border-slate-300/80 bg-white/72 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
                  >
                    {coverHeroConfig.cta.secondary_label}
                  </motion.a>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {coverHeroConfig.badges.map((badge, badgeIndex) => (
                    <motion.article
                      key={badge.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.34, delay: 0.5 + badgeIndex * 0.08 }}
                      className="rounded-2xl border border-slate-200/85 bg-white/72 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.09)] backdrop-blur"
                    >
                      <div className="flex items-start gap-3">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-semibold text-slate-700">
                          {badge.icon_src ? (
                            <img src={badge.icon_src} alt={badge.label} className="h-full w-full rounded-xl object-cover p-1" />
                          ) : (
                            badge.icon_text
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">{badge.label}</p>
                          <p className="text-xs tracking-[0.12em] text-slate-500">{badge.subtitle}</p>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1.5">
                        {badge.stats.map((stat) => (
                          <p key={`${badge.id}-${stat.label}`} className="text-xs text-slate-600">
                            <span className="font-medium text-slate-700">{stat.label}:</span> {stat.value}
                          </p>
                        ))}
                      </div>
                    </motion.article>
                  ))}
                </div>
              </div>

              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, delay: 0.2 }}>
                <HeroR3FScene logoSrc="/brand/logo-icon-ink.png" />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
