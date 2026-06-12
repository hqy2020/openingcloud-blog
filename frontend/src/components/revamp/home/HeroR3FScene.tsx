import { ContactShadows, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import type { GLTF } from "three-stdlib";

import truckModelUrl from "../../../../world/static/vehicle/default.glb?url";

type HeroR3FSceneProps = {
  className?: string;
};

const TRUCK_MODEL_SRC = truckModelUrl;

type PointerState = {
  x: number;
  y: number;
};

type TruckGLTF = GLTF & {
  scene: THREE.Group;
};

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

function TruckModel({
  hovered,
  reducedMotion,
  pointerRef,
}: {
  hovered: boolean;
  reducedMotion: boolean;
  pointerRef: MutableRefObject<PointerState>;
}) {
  const truckRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(TRUCK_MODEL_SRC) as unknown as TruckGLTF;
  const baseYaw = Math.PI * 0.42;
  const truckScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      if (!("isMesh" in object) || !object.isMesh) {
        return;
      }

      object.castShadow = true;
      object.receiveShadow = true;
    });
    return clone;
  }, [scene]);

  useFrame((_, delta) => {
    const truck = truckRef.current;
    if (!truck) {
      return;
    }

    const pointer = pointerRef.current;
    const hoverBoost = hovered && !reducedMotion ? 1 : 0;
    const targetYaw = baseYaw + pointer.x * 0.35 + hoverBoost * 0.08;
    const targetPitch = -0.08 + pointer.y * 0.12 - hoverBoost * 0.025;
    truck.rotation.y = THREE.MathUtils.damp(truck.rotation.y, targetYaw, 5.4, delta);
    truck.rotation.x = THREE.MathUtils.damp(truck.rotation.x, targetPitch, 5.4, delta);
    truck.rotation.z = THREE.MathUtils.damp(truck.rotation.z, pointer.x * -0.05, 5.4, delta);
    truck.position.y = THREE.MathUtils.damp(
      truck.position.y,
      Math.sin(performance.now() * 0.0014) * 0.03 + hoverBoost * 0.045,
      3.2,
      delta,
    );
    truck.position.x = THREE.MathUtils.damp(truck.position.x, hoverBoost * -0.03, 3.2, delta);
  });

  return (
    <group ref={truckRef} position={[0, -0.72, 0]} scale={1.58} rotation={[0, baseYaw, 0]}>
      <primitive object={truckScene} />
      <ContactShadows
        blur={2.8}
        color="#0f172a"
        far={5}
        opacity={0.34}
        resolution={256}
        scale={8.5}
        position={[0, -1.45, 0]}
      />
    </group>
  );
}

function FallbackTruck({ reducedMotion, className }: { reducedMotion: boolean; className?: string }) {
  const rootClassName = className ?? "aspect-[4/3] w-full";

  return (
    <div className={`relative overflow-hidden rounded-[2rem] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(248,250,252,0.98))] shadow-[0_18px_44px_rgba(15,23,42,0.14)] ${rootClassName}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(247,146,55,0.16),transparent_26%),radial-gradient(circle_at_76%_20%,rgba(59,130,246,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.78),rgba(245,247,250,0.95))]" />
      <div className="absolute inset-x-8 top-8 h-px bg-[linear-gradient(90deg,transparent,rgba(15,23,42,0.16),transparent)]" />
      <div className="absolute inset-x-6 bottom-10 h-2 rounded-full bg-[linear-gradient(90deg,rgba(15,23,42,0.04),rgba(15,23,42,0.12),rgba(15,23,42,0.04))] blur-[1px]" />
      <div className="absolute left-1/2 top-1/2 h-[104px] w-[196px] -translate-x-1/2 -translate-y-[45%]">
        <div className="absolute left-0 top-8 h-[60px] w-[98px] rounded-[1.4rem] border border-slate-300/80 bg-[linear-gradient(135deg,#0f172a,#334155)] shadow-[0_18px_32px_rgba(15,23,42,0.24)]" />
        <div className="absolute left-[84px] top-[18px] h-[56px] w-[86px] rounded-[1.3rem] border border-slate-300/80 bg-[linear-gradient(135deg,#ffffff,#dbe4f0)] shadow-[0_18px_32px_rgba(15,23,42,0.14)]" />
        <div className="absolute left-[17px] top-[48px] h-[15px] w-[20px] rounded-full bg-[#f79237] shadow-[0_0_18px_rgba(247,146,55,0.55)]" />
        <div className="absolute left-[131px] top-[48px] h-[15px] w-[20px] rounded-full bg-[#f79237] shadow-[0_0_18px_rgba(247,146,55,0.55)]" />
        <div className="absolute bottom-0 left-[12px] h-8 w-8 rounded-full border border-slate-700/90 bg-slate-950" />
        <div className="absolute bottom-0 left-[134px] h-8 w-8 rounded-full border border-slate-700/90 bg-slate-950" />
      </div>
      <div
        className="absolute inset-0"
        style={{
          animation: reducedMotion ? undefined : "revamp-orbit 8.8s linear infinite",
        }}
      />
    </div>
  );
}

useGLTF.preload(TRUCK_MODEL_SRC);

export function HeroR3FScene({ className }: HeroR3FSceneProps) {
  const reduceMotion = Boolean(useReducedMotion());
  const [hovered, setHovered] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const canRenderCanvas = useMemo(() => !reduceMotion && canUseWebGL(), [reduceMotion]);
  const pointerRef = useRef<PointerState>({ x: 0, y: 0 });

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
    return <FallbackTruck reducedMotion={reduceMotion} className={className} />;
  }

  const rootClassName = className ?? "aspect-[4/3] w-full";

  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,246,250,0.98))] shadow-[0_18px_44px_rgba(15,23,42,0.14)] ${rootClassName}`}
      onMouseEnter={enableHover ? () => setHovered(true) : undefined}
      onMouseLeave={enableHover ? () => setHovered(false) : undefined}
      onPointerMove={
        enableHover
          ? (event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              pointerRef.current.x = THREE.MathUtils.clamp(((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1, -1, 1);
              pointerRef.current.y = THREE.MathUtils.clamp(((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1, -1, 1);
            }
          : undefined
      }
      onPointerLeave={
        enableHover
          ? () => {
              setHovered(false);
              pointerRef.current.x = 0;
              pointerRef.current.y = 0;
            }
          : undefined
      }
    >
      <Canvas dpr={[1, 1.5]} camera={{ fov: 32, position: [0, 1.5, 6.5] }} gl={{ antialias: true, alpha: true }}>
        <color attach="background" args={["#f8fafc"]} />
        <fog attach="fog" args={["#f8fafc", 9, 18]} />
        <ambientLight intensity={1.08} />
        <hemisphereLight args={["#f8fbff", "#cbd5e1", 1.2]} />
        <directionalLight position={[4, 5, 4]} intensity={1.6} color="#fff4e6" />
        <directionalLight position={[-4, 1.5, -5]} intensity={0.42} color="#cbd5e1" />
        <TruckModel hovered={hovered && enableHover} reducedMotion={reduceMotion} pointerRef={pointerRef} />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,0.84),transparent_30%),radial-gradient(circle_at_78%_22%,rgba(247,146,55,0.12),transparent_26%),linear-gradient(180deg,transparent,rgba(255,255,255,0.24))]" />
    </div>
  );
}
