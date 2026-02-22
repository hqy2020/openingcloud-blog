import { motion } from "motion/react";
import { useMemo, useState } from "react";

type OrbitBadge = {
  id: string;
  label: string;
  delay: number;
  duration: number;
  distance: number;
};

const orbitBadges: OrbitBadge[] = [
  { id: "orbit-ai", label: "AI", delay: 0, duration: 7.2, distance: 86 },
  { id: "orbit-dev", label: "DEV", delay: 0.9, duration: 8.4, distance: 66 },
  { id: "orbit-vibe", label: "VIBE", delay: 0.2, duration: 9.6, distance: 104 },
  { id: "orbit-log", label: "LOG", delay: 1.4, duration: 10.2, distance: 122 },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function DynamicLogoOrb() {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const transform = useMemo(() => `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`, [rotate.x, rotate.y]);

  return (
    <motion.div
      className="relative mx-auto hidden h-[280px] w-[280px] lg:block"
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 4.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        setRotate({ x: clamp(-y * 16, -9, 9), y: clamp(x * 18, -10, 10) });
      }}
      onMouseLeave={() => setRotate({ x: 0, y: 0 })}
      style={{ transform }}
    >
      <div className="absolute inset-0 rounded-full border border-dashed border-slate-300/85" />
      <div className="absolute inset-[20px] rounded-full border border-slate-200/80" />
      <div className="absolute inset-[42px] rounded-full border border-slate-200/70" />

      {orbitBadges.map((badge, index) => (
        <div
          key={badge.id}
          className="absolute left-1/2 top-1/2"
          style={{
            animation: `revamp-orbit ${badge.duration}s linear ${badge.delay}s infinite`,
            transformOrigin: "0 0",
          }}
        >
          <span
            className="absolute inline-flex -translate-y-1/2 rounded-full border border-[#E6ECFF] bg-white px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] text-[#4F6AE5] shadow-[0_8px_18px_rgba(15,23,42,0.14)]"
            style={{ transform: `translateX(${badge.distance}px) rotate(${index % 2 === 0 ? "6deg" : "-5deg"})` }}
          >
            {badge.label}
          </span>
        </div>
      ))}

      <div className="absolute left-1/2 top-1/2 h-[156px] w-[156px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#D7E2FF] bg-[radial-gradient(circle_at_35%_25%,#ffffff,#e5ecff)] shadow-[0_24px_52px_rgba(15,23,42,0.2)]">
        <img src="/brand/logo-icon-ink.png" alt="openingCloud logo" className="h-full w-full rounded-full object-contain p-2.5" />
      </div>
    </motion.div>
  );
}
