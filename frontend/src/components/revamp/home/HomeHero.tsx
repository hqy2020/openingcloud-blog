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
  "Software Engineer",
  "Zhejiang University MSc",
  "CAD&CG State Key Lab Researcher",
  "Cloud Computing Intern",
  "Tongji University BS",
  "EV Startup Intern",
  "AI Enthusiast",
  "Knowledge Management Researcher",
];

export function HomeHero({ hero, quoteText }: HomeHeroProps) {
  return (
    <section id="hero" className="relative left-1/2 w-screen -translate-x-1/2 scroll-mt-20 px-2 sm:px-5">
      <div className="relative min-h-[78vh] sm:min-h-[calc(100vh-5.5rem)]">
        <div className="relative z-10 mx-auto flex min-h-[78vh] w-full max-w-7xl items-start justify-center px-2 pt-8 pb-24 sm:min-h-[calc(100vh-5.5rem)] sm:px-6 sm:pt-20 sm:pb-28 lg:pt-20 lg:pb-32">
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

          <p className="absolute bottom-7 left-1/2 max-w-[min(42rem,calc(100vw-3rem))] -translate-x-1/2 text-center font-serif text-sm italic leading-[1.6] tracking-normal text-theme-muted sm:bottom-9 sm:text-base lg:bottom-10">
            {quoteText || hero.subtitle || coverHeroConfig.one_liner}
          </p>
        </div>
      </div>
    </section>
  );
}
