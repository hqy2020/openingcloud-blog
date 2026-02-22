import { Environment, Grid, OrbitControls, Stage, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, type ThreeElements } from "@react-three/fiber";
import { Bloom, EffectComposer, ToneMapping } from "@react-three/postprocessing";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { GLTF } from "three-stdlib";

const MODEL_SRC = "/media/pet/s2wt_kamdo_industrial_divinities-transformed.glb";

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

function Kamdo(props: ThreeElements["group"]) {
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
    const targetY = state.pointer.x * (state.camera.position.z > 1 ? 1 : -1);
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

function FallbackCard() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-900 text-center text-[11px] text-slate-200">
      <div className="space-y-1.5 px-4">
        <p className="font-medium tracking-wide">3D PET</p>
        <p className="text-slate-400">WebGL 不可用，已降级。</p>
      </div>
    </div>
  );
}

export function BlogPetMachine() {
  const reduceMotion = Boolean(useReducedMotion());
  const [canRenderCanvas, setCanRenderCanvas] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      const lowMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
      const isLowMemory = typeof lowMemory === "number" && lowMemory <= 2;
      setCanRenderCanvas(!media.matches && !isLowMemory && canUseWebGL());
    };

    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  if (reduceMotion) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-40 h-[220px] w-[min(88vw,420px)] overflow-hidden rounded-3xl border border-slate-200/50 bg-slate-950/90 shadow-[0_16px_40px_rgba(15,23,42,0.35)]">
      {canRenderCanvas ? (
        <Canvas flat shadows camera={{ position: [-15, 0, 10], fov: 25 }}>
          <fog attach="fog" args={["black", 15, 22.5]} />
          <Stage
            adjustCamera={false}
            environment="city"
            intensity={0.5}
            shadows={{ type: "accumulative", bias: -0.001, intensity: Math.PI }}
          >
            <Kamdo rotation={[0, Math.PI, 0]} />
          </Stage>
          <Grid
            cellSize={0.6}
            cellThickness={0.6}
            fadeDistance={30}
            infiniteGrid
            position={[0, -1.85, 0]}
            renderOrder={-1}
            sectionColor="#7f7fff"
            sectionSize={3.3}
            sectionThickness={1.5}
          />
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
            <Bloom luminanceThreshold={2} mipmapBlur />
            <ToneMapping />
          </EffectComposer>
          <Environment background blur={0.8} preset="sunset" />
        </Canvas>
      ) : (
        <FallbackCard />
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-white/10 to-transparent" />
    </div>
  );
}
