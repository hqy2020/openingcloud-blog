import { Environment, OrbitControls, Stage, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, type ThreeElements } from "@react-three/fiber";
import { Bloom, EffectComposer, ToneMapping } from "@react-three/postprocessing";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { Link } from "react-router-dom";
import * as THREE from "three";
import type { GLTF } from "three-stdlib";

import kamdoGlbUrl from "../../assets/pet/kamdo.glb?url";

const MODEL_SRC = kamdoGlbUrl;

type KamdoGLTF = GLTF & {
  nodes: {
    body001: THREE.Mesh;
    head001: THREE.Mesh;
    stripe001: THREE.Mesh;
  };
  materials: {
    Body: THREE.Material;
    Head: THREE.Material;
  };
};

type PointerState = {
  x: number;
  y: number;
};

type KamdoProps = ThreeElements["group"] & {
  pointerRef: MutableRefObject<PointerState>;
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

function Kamdo({ pointerRef, ...props }: KamdoProps) {
  const headRef = useRef<THREE.Group>(null);
  const stripeRef = useRef<THREE.MeshBasicMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const { nodes, materials } = useGLTF(MODEL_SRC) as unknown as KamdoGLTF;

  useFrame((state, delta) => {
    const head = headRef.current;
    const stripe = stripeRef.current;
    const light = lightRef.current;
    if (!head || !stripe || !light) {
      return;
    }

    const t = (1 + Math.sin(state.clock.elapsedTime * 2)) / 2;
    stripe.color.setRGB(2 + t * 20, 2, 20 + t * 50);
    const worldPointer = pointerRef.current;
    const targetY = -worldPointer.x * (state.camera.position.z > 1 ? 1 : -1);
    const targetX = THREE.MathUtils.clamp(-worldPointer.y * 0.35, -0.35, 0.35);
    head.rotation.x = THREE.MathUtils.damp(head.rotation.x, targetX, 7.5, delta);
    head.rotation.y = THREE.MathUtils.damp(head.rotation.y, targetY, 7.5, delta);
    light.intensity = 1 + t * 4;
  });

  return (
    <group {...props}>
      <mesh castShadow receiveShadow geometry={nodes.body001.geometry} material={materials.Body} />
      <group ref={headRef}>
        <mesh castShadow receiveShadow geometry={nodes.head001.geometry} material={materials.Head} />
        <mesh castShadow receiveShadow geometry={nodes.stripe001.geometry}>
          <meshBasicMaterial ref={stripeRef} toneMapped={false} />
          <pointLight ref={lightRef} color={[10, 2, 5]} distance={2.5} intensity={1} />
        </mesh>
      </group>
    </group>
  );
}

useGLTF.preload(MODEL_SRC);

function StaticKamdoFallback() {
  return (
    <div className="absolute bottom-5 right-5 flex h-28 w-28 items-center justify-center sm:bottom-6 sm:right-8 sm:h-36 sm:w-36">
      <div className="absolute inset-x-5 bottom-1 h-4 rounded-full bg-slate-950/18 blur-md" />
      <div className="relative h-[74px] w-[82px] rounded-[24px] border border-white/70 bg-[linear-gradient(145deg,#121826,#273449)] shadow-[0_18px_38px_rgba(15,23,42,0.28)] sm:h-[96px] sm:w-[106px]">
        <div className="absolute -top-8 left-1/2 h-10 w-[58px] -translate-x-1/2 rounded-[20px] border border-white/75 bg-[linear-gradient(145deg,#f8fafc,#cbd5e1)] shadow-[0_12px_26px_rgba(15,23,42,0.18)] sm:-top-10 sm:h-12 sm:w-[70px]">
          <div className="absolute left-3 top-4 h-2.5 w-2.5 rounded-full bg-[#f79237] shadow-[0_0_14px_rgba(247,146,55,0.8)] sm:left-4 sm:top-5" />
          <div className="absolute right-3 top-4 h-2.5 w-2.5 rounded-full bg-[#f79237] shadow-[0_0_14px_rgba(247,146,55,0.8)] sm:right-4 sm:top-5" />
        </div>
        <div className="absolute left-1/2 top-4 h-1.5 w-10 -translate-x-1/2 rounded-full bg-[#f79237] shadow-[0_0_18px_rgba(247,146,55,0.72)] sm:top-5 sm:w-12" />
        <div className="absolute bottom-3 left-4 h-4 w-4 rounded-full border border-white/20 bg-slate-950/80" />
        <div className="absolute bottom-3 right-4 h-4 w-4 rounded-full border border-white/20 bg-slate-950/80" />
      </div>
    </div>
  );
}

export function BlogPetMachine() {
  const reduceMotion = Boolean(useReducedMotion());
  const [canRenderCanvas, setCanRenderCanvas] = useState(false);
  const pointerRef = useRef<PointerState>({ x: 0, y: 0 });
  const worldHref = import.meta.env.VITE_WORLD_URL ?? "/world/";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      const lowMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
      const isLowMemory = typeof lowMemory === "number" && lowMemory <= 2;
      setCanRenderCanvas(!isLowMemory && canUseWebGL());
    };

    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      const width = Math.max(window.innerWidth, 1);
      const height = Math.max(window.innerHeight, 1);
      pointerRef.current.x = THREE.MathUtils.clamp((event.clientX / width) * 2 - 1, -1, 1);
      pointerRef.current.y = THREE.MathUtils.clamp((event.clientY / height) * 2 - 1, -1, 1);
    };

    const resetPointer = () => {
      pointerRef.current.x = 0;
      pointerRef.current.y = 0;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("blur", resetPointer);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", resetPointer);
    };
  }, []);

  return (
    <Link
      aria-label="进入 3D 世界"
      className="pointer-events-auto fixed bottom-0 right-0 z-40 block h-[220px] w-[min(88vw,420px)] cursor-pointer no-underline outline-none transition-transform duration-200 hover:scale-[1.01] focus-visible:scale-[1.01]"
      to={worldHref}
      title="点击进入 3D 世界"
    >
      {canRenderCanvas && !reduceMotion ? (
        <Canvas flat shadows camera={{ position: [-15, 0, 10], fov: 25 }} gl={{ alpha: true }} style={{ background: "transparent" }}>
          <fog attach="fog" args={["black", 12, 20]} />
          <Stage
            adjustCamera={false}
            environment={{ files: "/hdr/potsdamer_platz_1k.hdr" }}
            intensity={0.5}
            shadows={{ type: "accumulative", bias: -0.001, intensity: Math.PI }}
          >
            <Kamdo pointerRef={pointerRef} rotation={[0, Math.PI, 0]} />
          </Stage>
          <OrbitControls
            autoRotate
            autoRotateSpeed={0.05}
            enablePan={false}
            enableZoom={false}
            makeDefault
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 2}
          />
          <EffectComposer enableNormalPass={false}>
            <Bloom luminanceThreshold={4} mipmapBlur />
            <ToneMapping />
          </EffectComposer>
          <Environment blur={0.5} files="/hdr/venice_sunset_1k.hdr" />
        </Canvas>
      ) : (
        <StaticKamdoFallback />
      )}
    </Link>
  );
}
