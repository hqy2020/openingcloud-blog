import { motion } from "motion/react";
import { coverHeroConfig } from "../../../data/revamp/coverHero";
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
      <div className="relative min-h-[88vh] overflow-hidden rounded-[34px] border border-slate-200/80 bg-white shadow-md">
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
              nameWords={["Keyon", "云际漫游者"]}
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
