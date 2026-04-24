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
  quoteText?: string;
};

const profileRoles = [
  "Ant Group Engineer",
  "Zhejiang University MSc",
  "Aliyun Intern",
  "SAP Intern",
  "Tongji University BS",
  "NIO Intern",
  "Badminton Enthusiast",
  "Stephen Curry Fan",
  "AI Enthusiast",
  "Knowledge Management Researcher",
];

export function HomeHero({ hero, quoteText }: HomeHeroProps) {
  return (
    <section id="hero" className="relative left-1/2 w-screen -translate-x-1/2 scroll-mt-20 px-2 sm:px-5">
      <div className="relative min-h-[60vh] sm:min-h-[88vh] overflow-x-clip">
        <div className="relative z-10 mx-auto flex min-h-[88vh] w-full max-w-7xl items-start justify-center px-2 pt-6 pb-14 sm:pt-10 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.63, ease: "easeOut" }}
            className="w-full"
          >
            <OrbitingProfileCard
              className="h-[360px] w-[360px] sm:h-[580px] sm:w-[580px] md:h-[830px] md:w-[830px] lg:h-[1000px] lg:w-[1000px]"
              name={coverHeroConfig.spaced_name}
              nameWords={["Keyon", "云际漫游者", "codecloud", "openingClouds"]}
              roles={profileRoles}
            />
          </motion.div>

          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center font-serif text-sm italic leading-[1.6] tracking-normal text-theme-muted sm:text-base">
            {quoteText || hero.subtitle || coverHeroConfig.one_liner}
          </p>
        </div>
      </div>
    </section>
  );
}
