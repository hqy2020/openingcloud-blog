import { motion } from "motion/react";
import { coverHeroConfig } from "../../../data/revamp/coverHero";
import { BackgroundBeams } from "../../ui/BackgroundBeams";
import { OrbitingProfileCard } from "./OrbitingProfileCard";

type HomeHeroProps = {
  hero: {
    title: string;
    subtitle: string;
    slogans: string[];
    fallback_image: string;
    fallback_video: string;
  };
};

const profileRoles = [
  "Tongji University BS",
  "Zhejiang University MSc",
  "Aliyun Java Developer",
  "Badminton Enthusiast",
  "Stephen Curry Fan",
  "AI Enthusiast",
  "Knowledge Management Researcher",
];

export function HomeHero({ hero }: HomeHeroProps) {
  return (
    <section id="hero" className="relative left-1/2 w-screen -translate-x-1/2 scroll-mt-20 px-2 sm:px-5">
      <div className="relative min-h-[88vh] overflow-hidden rounded-[34px] border border-slate-200/80 bg-white/78 shadow-md backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-6%,rgba(255,236,184,0.45),transparent_34%),radial-gradient(circle_at_15%_20%,rgba(79,106,229,0.16),transparent_42%),radial-gradient(circle_at_84%_16%,rgba(16,185,129,0.14),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.74),rgba(248,250,255,0.94)_56%,rgba(241,245,255,0.98))]" />
        <BackgroundBeams colors={["#4F6AE5", "#84CC16", "#60A5FA"]} className="opacity-45" />

        <div className="relative z-10 mx-auto flex min-h-[88vh] w-full max-w-7xl items-center justify-center px-2 py-14 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.42, ease: "easeOut" }}
            className="w-full"
          >
            <OrbitingProfileCard
              className="h-[420px] w-[420px] sm:h-[620px] sm:w-[620px] lg:h-[680px] lg:w-[680px]"
              name={coverHeroConfig.spaced_name}
              nameWords={["codecloud", "openClouds", "胡启云"]}
              roles={profileRoles}
            />
          </motion.div>

          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-xs font-semibold tracking-[0.16em] text-slate-500 sm:text-sm">
            {hero.subtitle || coverHeroConfig.one_liner}
          </p>
        </div>
      </div>
    </section>
  );
}
