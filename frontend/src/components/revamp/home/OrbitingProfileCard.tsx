import { useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";
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

const ORBIT_ELLIPSE_X = 1.14;
const ORBIT_ELLIPSE_Y = 0.78;

const orbitingBadges: OrbitingBadge[] = [
  {
    id: "zju-badge",
    label: "Zhejiang University",
    src: "/brand/badge-zju.png",
    radius: 312,
    duration: 7.4,
    delay: 0.2,
    width: 64,
    height: 64,
    angle: 214,
  },
  {
    id: "aliyun-badge",
    label: "Aliyun",
    src: "/brand/logo-aliyun.png",
    radius: 320,
    duration: 8.9,
    delay: 0.8,
    width: 68,
    height: 68,
    angle: 12,
  },
  {
    id: "tongji-badge",
    label: "Tongji University",
    src: "/brand/badge-tongji.png",
    radius: 334,
    duration: 10.3,
    delay: 1.1,
    width: 64,
    height: 64,
    angle: 108,
  },
  {
    id: "personal-logo",
    label: "OpeningCloud",
    src: "/brand/logo-personal.png",
    radius: 344,
    duration: 11.7,
    delay: 0.4,
    width: 176,
    height: 176,
    angle: 302,
    wrapperClassName:
      "inline-flex items-center justify-center rounded-full border border-slate-300/85 bg-white p-1.5",
    imageClassName: "h-full w-full rounded-full object-cover",
  },
];

const defaultRoles = [
  "Tongji University Alumni",
  "Zhejiang University MSc",
  "Aliyun Cloud Builder",
  "Full-stack Developer",
  "Long-term Writer",
];

const defaultNameWords = ["codecloud", "openClouds", "胡启云"];

function OrbitingBadgeNode({ badge, reducedMotion }: { badge: OrbitingBadge; reducedMotion: boolean }) {
  const wrapperClassName =
    badge.wrapperClassName ??
    "inline-flex items-center justify-center rounded-full border border-slate-300/80 bg-white p-1.5";
  const imageClassName = badge.imageClassName ?? "h-full w-full rounded-full object-contain";

  const orbitStyle: CSSProperties = reducedMotion
    ? {}
    : {
        animation: `revamp-orbit ${badge.duration}s linear ${badge.delay}s infinite`,
        animationDirection: "normal",
      };
  const counterStyle: CSSProperties = reducedMotion
    ? {}
    : {
        animation: `revamp-orbit ${badge.duration}s linear ${badge.delay}s infinite`,
        animationDirection: "reverse",
      };

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 h-0 w-0">
      <div style={{ transform: `rotate(${badge.angle}deg)` }}>
        <div style={orbitStyle}>
          <div style={{ transform: `scale(${ORBIT_ELLIPSE_X}, ${ORBIT_ELLIPSE_Y})` }}>
            <div style={{ transform: `translateX(${badge.radius}px)` }}>
              <div style={counterStyle}>
                <div style={{ transform: `scale(${1 / ORBIT_ELLIPSE_X}, ${1 / ORBIT_ELLIPSE_Y}) rotate(${-badge.angle}deg)` }}>
                  <span
                    className={wrapperClassName}
                    style={{ width: `${badge.width}px`, height: `${badge.height}px` }}
                  >
                    <img alt={badge.label} src={badge.src} className={cn(imageClassName)} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrbitingProfileCard({
  className,
  name = "openingClouds",
  nameWords = defaultNameWords,
  roles = defaultRoles,
}: OrbitingProfileCardProps) {
  const reduceMotion = Boolean(useReducedMotion());
  const activeNameWords = nameWords.length > 0 ? nameWords : [name];

  return (
    <div
      className={cn("relative mx-auto h-[380px] w-[380px] sm:h-[450px] sm:w-[450px] lg:h-[400px] lg:w-[400px] xl:h-[450px] xl:w-[450px]", className)}
    >
      <div className="absolute left-1/2 top-1/2 h-[82%] w-[98%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-dashed border-slate-300/75" />
      <div className="absolute left-1/2 top-1/2 h-[72%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-dashed border-slate-300/65" />

      {orbitingBadges.map((badge) => (
        <OrbitingBadgeNode key={badge.id} badge={badge} reducedMotion={reduceMotion} />
      ))}

      <CardContainer containerClassName="absolute inset-0 flex items-center justify-center">
        <CardBody className="w-[248px] rounded-[24px] border border-slate-200/90 bg-white/90 p-6 shadow-[0_24px_58px_rgba(15,23,42,0.18)] backdrop-blur sm:w-[360px] sm:p-8 lg:w-[430px]">
          <CardItem as="p" translateZ={24} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 sm:text-base sm:tracking-[0.08em]">
            My name is:
          </CardItem>
          <CardItem as="div" translateZ={44} className="mt-3 min-h-[3rem] sm:min-h-[4.2rem]">
            <WordRotate
              words={activeNameWords}
              duration={2400}
              className="text-4xl font-black leading-none text-[#f79237] sm:text-6xl"
            />
          </CardItem>
          <div className="mt-4 h-px w-full bg-[linear-gradient(90deg,rgba(15,23,42,0.16),rgba(15,23,42,0.32),rgba(15,23,42,0.16))]" />
          <CardItem as="p" translateZ={24} className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 sm:text-base sm:tracking-[0.08em]">
            I am:
          </CardItem>
          <CardItem
            as="ul"
            translateZ={38}
            className="mt-3 w-full space-y-1 text-right text-sm font-medium leading-6 text-slate-700 sm:text-[25px] sm:leading-[1.45]"
          >
            {roles.map((role, index) => (
              <li key={role} className="overflow-hidden">
                <TextAnimate animation="whipInUp" delay={index * 0.12} className="inline-block">
                  {role}
                </TextAnimate>
              </li>
            ))}
          </CardItem>
        </CardBody>
      </CardContainer>
    </div>
  );
}
