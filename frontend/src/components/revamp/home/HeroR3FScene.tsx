import { Sparkles, useTexture } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type HeroR3FSceneProps = {
  logoSrc?: string;
  className?: string;
};

const PLANET_ORBIT_RADIUS = 1.68;

function canUseWebGL() {
  if (typeof document === "undefined") {
    return false;
  }
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function PlanetSystem({ hovered, reducedMotion, logoSrc }: { hovered: boolean; reducedMotion: boolean; logoSrc: string }) {
  const orbitRef = useRef<THREE.Group>(null);
  const planetRef = useRef<THREE.Mesh>(null);
  const sunRef = useRef<THREE.Mesh>(null);
  const logoTexture = useTexture(logoSrc);

  useFrame((_, delta) => {
    if (!reducedMotion && orbitRef.current) {
      const orbitSpeed = hovered ? 1.18 : 0.84;
      orbitRef.current.rotation.y += delta * orbitSpeed;
    }
    if (!reducedMotion && planetRef.current) {
      const selfSpeed = hovered ? 2.16 : 1.62;
      planetRef.current.rotation.y += delta * selfSpeed;
    }
    if (sunRef.current) {
      sunRef.current.rotation.y += delta * 0.16;
    }
  });

  return (
    <>
      <mesh ref={sunRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.48, 48, 48]} />
        <meshStandardMaterial color="#FDBA74" emissive="#FB923C" emissiveIntensity={hovered ? 1.06 : 0.78} roughness={0.25} metalness={0.08} />
      </mesh>

      <mesh position={[0, 0, -0.02]}>
        <torusGeometry args={[PLANET_ORBIT_RADIUS, 0.018, 20, 144]} />
        <meshBasicMaterial color="#BFDBFE" transparent opacity={hovered ? 0.8 : 0.62} />
      </mesh>

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.78, 40, 40]} />
        <meshBasicMaterial color="#F59E0B" transparent opacity={hovered ? 0.12 : 0.08} />
      </mesh>

      <group ref={orbitRef}>
        <mesh ref={planetRef} position={[PLANET_ORBIT_RADIUS, 0, 0]}>
          <sphereGeometry args={[0.33, 40, 40]} />
          <meshStandardMaterial map={logoTexture} roughness={0.35} metalness={0.22} />
        </mesh>
      </group>

      <Sparkles count={hovered ? 38 : 26} speed={hovered ? 0.95 : 0.58} size={3.2} opacity={0.6} scale={[5.2, 2.8, 1.6]} color="#FDE68A" />
    </>
  );
}

function FallbackOrbit({ logoSrc, reducedMotion }: { logoSrc: string; reducedMotion: boolean }) {
  return (
    <div className="relative mx-auto h-[270px] w-[270px] rounded-[36px] border border-slate-200/70 bg-white/70 shadow-[0_18px_44px_rgba(15,23,42,0.14)] backdrop-blur-xl">
      <div className="absolute left-1/2 top-1/2 h-[210px] w-[210px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-300/75" />
      <div className="absolute left-1/2 top-1/2 h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#fde68a,#fb923c)] shadow-[0_0_32px_rgba(251,146,60,0.55)]" />
      <div
        className="absolute left-1/2 top-1/2 h-0 w-0"
        style={{
          animation: reducedMotion ? undefined : "revamp-orbit 8.4s linear infinite",
        }}
      >
        <img
          alt="Logo orbit"
          src={logoSrc}
          className="absolute h-16 w-16 -translate-y-1/2 rounded-full border border-slate-200/80 bg-white/95 object-contain p-1.5 shadow-[0_10px_20px_rgba(15,23,42,0.18)]"
          style={{ transform: `translateX(${PLANET_ORBIT_RADIUS * 48}px) translateY(-50%)` }}
        />
      </div>
    </div>
  );
}

export function HeroR3FScene({ logoSrc = "/brand/logo-icon-ink.png", className }: HeroR3FSceneProps) {
  const reduceMotion = Boolean(useReducedMotion());
  const [hovered, setHovered] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const canRenderCanvas = useMemo(() => !reduceMotion && canUseWebGL(), [reduceMotion]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const media = window.matchMedia("(hover: none), (pointer: coarse)");
    const sync = () => setCoarsePointer(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const enableHover = !coarsePointer && canRenderCanvas;

  if (!canRenderCanvas) {
    return <FallbackOrbit logoSrc={logoSrc} reducedMotion={reduceMotion} />;
  }

  return (
    <div
      className={`relative mx-auto h-[270px] w-[270px] overflow-hidden rounded-[36px] border border-slate-200/70 bg-white/70 shadow-[0_18px_44px_rgba(15,23,42,0.14)] backdrop-blur-xl ${className ?? ""}`}
      onMouseEnter={enableHover ? () => setHovered(true) : undefined}
      onMouseLeave={enableHover ? () => setHovered(false) : undefined}
    >
      <Canvas dpr={[1, 1.5]} camera={{ fov: 34, position: [0, 0.2, 5.8] }}>
        <color attach="background" args={["#F8FAFF"]} />
        <ambientLight intensity={0.88} />
        <directionalLight position={[2.6, 2.6, 2.8]} intensity={1.05} color="#FFF7ED" />
        <directionalLight position={[-2.2, -1.4, -2.3]} intensity={0.42} color="#DBEAFE" />
        <PlanetSystem hovered={hovered && enableHover} reducedMotion={reduceMotion} logoSrc={logoSrc} />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_4%,rgba(255,255,255,0.72),transparent_40%),radial-gradient(circle_at_84%_24%,rgba(79,106,229,0.16),transparent_46%)]" />
    </div>
  );
}
