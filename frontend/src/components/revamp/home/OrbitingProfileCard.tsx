import { motion, useReducedMotion, useTime, useTransform } from "motion/react";
import { cn } from "../../../lib/utils";
import { CardBody, CardContainer, CardItem } from "../../ui/ThreeDCard";
import { TextAnimate } from "../../ui/TextAnimate";
import { WordRotate } from "../../ui/WordRotate";

type OrbitingProfileCardProps = {
  className?: string;
  name?: string;
  nameWords?: string[];
  roles?: string[];
};

type OrbitingBadge = {
  id: string;
  label: string;
  src: string;
  radius: number;
  duration: number;
  delay: number;
  width: number;
  height: number;
  angle: number;
  wrapperClassName?: string;
  imageClassName?: string;
};

const ORBIT_RADIUS_SCALE = 1.4;
const ORBIT_ELLIPSE_X_SCALE = 1.0;
const ORBIT_ELLIPSE_Y_SCALE = 1.0;

const orbitingBadges: OrbitingBadge[] = [
  {
    id: "zju-badge",
    label: "Zhejiang University",
    src: "/brand/badge-zju.png",
    radius: 312,
    duration: 6.2,
    delay: 0.2,
    width: 96,
    height: 96,
    angle: 214,
  },
  {
    id: "aliyun-badge",
    label: "Aliyun",
    src: "/brand/logo-aliyun.png",
    radius: 320,
    duration: 7.4,
    delay: 0.8,
    width: 102,
    height: 102,
    angle: 12,
  },
  {
    id: "tongji-badge",
    label: "Tongji University",
    src: "/brand/badge-tongji.png",
    radius: 334,
    duration: 8.6,
    delay: 1.1,
    width: 96,
    height: 96,
    angle: 108,
  },
  {
    id: "personal-logo",
    label: "OpeningCloud",
    src: "/brand/logo-personal.png",
    radius: 360,
    duration: 9.8,
    delay: 0.4,
    width: 144,
    height: 144,
    angle: 302,
    imageClassName: "h-full w-full object-contain",
  },
  {
    id: "nio-badge",
    label: "NIO",
    src: "/brand/logo-nio.png",
    radius: 296,
    duration: 7.8,
    delay: 0.6,
    width: 88,
    height: 88,
    angle: 160,
    imageClassName: "h-full w-full rounded-full object-contain bg-white/90",
  },
  {
    id: "sap-badge",
    label: "SAP",
    src: "/brand/logo-sap.png",
    radius: 308,
    duration: 8.2,
    delay: 1.4,
    width: 88,
    height: 88,
    angle: 260,
    imageClassName: "h-full w-full rounded-full object-contain bg-white/90",
  },
];

const defaultRoles = [
  "Tongji University Alumni",
  "Zhejiang University MSc",
  "Aliyun Cloud Builder",
  "Full-stack Developer",
  "Long-term Writer",
];

const defaultNameWords = ["Keyon", "云际漫游者", "codecloud", "openingClouds"];

function OrbitingBadgeNode({ badge, reducedMotion }: { badge: OrbitingBadge; reducedMotion: boolean }) {
  const wrapperClassName =
    badge.wrapperClassName ??
    "inline-flex items-center justify-center";
  const imageClassName = badge.imageClassName ?? "h-full w-full object-contain";
  const orbitRadiusX = badge.radius * ORBIT_RADIUS_SCALE * ORBIT_ELLIPSE_X_SCALE;
  const orbitRadiusY = badge.radius * ORBIT_RADIUS_SCALE * ORBIT_ELLIPSE_Y_SCALE;
  const time = useTime();
  const angle = useTransform(time, (latest) => {
    if (reducedMotion) {
      return badge.angle;
    }
    return badge.angle + ((latest / 1000 + badge.delay) / badge.duration) * 360;
  });
  const x = useTransform(angle, (value) => orbitRadiusX * Math.cos((value * Math.PI) / 180));
  const y = useTransform(angle, (value) => orbitRadiusY * Math.sin((value * Math.PI) / 180));

  return (
    <motion.div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 will-change-transform" style={{ x, y }}>
      <span
        className={wrapperClassName}
        style={{ width: `${badge.width}px`, height: `${badge.height}px` }}
      >
        <img alt={badge.label} src={badge.src} className={cn(imageClassName)} />
      </span>
    </motion.div>
  );
}

export function OrbitingProfileCard({
  className,
  name = "Keyon",
  nameWords = defaultNameWords,
  roles = defaultRoles,
}: OrbitingProfileCardProps) {
  const reduceMotion = Boolean(useReducedMotion());
  const activeNameWords = nameWords.length > 0 ? nameWords : [name];

  return (
    <div
      className={cn("relative mx-auto", className)}
    >
      <div className="absolute left-1/2 top-1/2 z-[1] aspect-square w-full -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-slate-400/50" />
      <div className="absolute left-1/2 top-1/2 z-[1] aspect-square w-[94%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-slate-400/40" />

      <div className="absolute inset-0 scale-[0.55] sm:scale-[0.72] md:scale-100">
        {orbitingBadges.map((badge) => (
          <OrbitingBadgeNode key={badge.id} badge={badge} reducedMotion={reduceMotion} />
        ))}
      </div>

      <div className="absolute inset-0 z-[2] flex items-center justify-center">
        <CardContainer>
          <CardBody className="relative flex flex-col w-[200px] h-[270px] rounded-[20px] border border-white/40 bg-white/70 p-4 pt-8 shadow-xl backdrop-blur-md sm:w-[310px] sm:h-[419px] sm:rounded-[30px] sm:p-7 sm:pt-12 md:w-[450px] md:h-[608px] md:p-10 md:pt-16 lg:w-[538px] lg:h-[727px] lg:pt-20">
            <CardItem as="p" translateZ={24} className="text-xs font-bold tracking-[0.08em] text-slate-600 sm:text-base sm:text-[34px] sm:leading-[1.1]">
              My name is:
            </CardItem>
            <CardItem as="div" translateZ={44} className="mt-3 min-h-[2rem] sm:min-h-[3rem] md:min-h-[4.2rem]">
              <WordRotate
                words={activeNameWords}
                duration={2600}
                motionProps={{
                  initial: { opacity: 0, x: -26, filter: "blur(8px)" },
                  animate: { opacity: 1, x: 0, filter: "blur(0px)" },
                  exit: { opacity: 0, x: 26, filter: "blur(8px)" },
                  transition: { duration: 0.42, ease: "easeOut" },
                }}
                className="inline-block text-left text-2xl font-black leading-none text-[#f79237] sm:text-4xl md:text-[4rem]"
              />
            </CardItem>
            <div className="mt-5 h-px w-full bg-[linear-gradient(90deg,rgba(15,23,42,0.16),rgba(15,23,42,0.32),rgba(15,23,42,0.16))]" />
            <CardItem as="p" translateZ={24} className="mt-6 text-xs font-bold tracking-[0.08em] text-slate-600 sm:text-base sm:text-[34px] sm:leading-[1.1]">
              I&apos;m a:
            </CardItem>
            <CardItem
              as="ul"
              translateZ={38}
              className="mt-3 w-full space-y-1 text-right text-[10px] font-medium leading-5 text-slate-700 sm:text-sm sm:leading-7 md:text-[22px] md:leading-[1.4]"
            >
              {roles.map((role, index) => (
                <li key={role} className="overflow-hidden">
                  <TextAnimate animation="whipInRight" delay={index * 0.12} className="inline-block">
                    {role}
                  </TextAnimate>
                </li>
              ))}
            </CardItem>
            {/* 左下角橙色装饰圆 */}
            <div className="pointer-events-none absolute bottom-4 left-4 h-10 w-10 rounded-full bg-orange-400/80 shadow-[0_0_20px_rgba(251,146,60,0.5)] sm:bottom-6 sm:left-6 sm:h-14 sm:w-14 md:bottom-8 md:left-8 md:h-20 md:w-20" />
          </CardBody>
        </CardContainer>
      </div>
    </div>
  );
}
