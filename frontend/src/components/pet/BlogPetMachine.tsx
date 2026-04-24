import { Environment, OrbitControls, Stage, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, type ThreeElements } from "@react-three/fiber";
import { Bloom, EffectComposer, ToneMapping } from "@react-three/postprocessing";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type MutableRefObject } from "react";
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

export function BlogPetMachine() {
  const reduceMotion = Boolean(useReducedMotion());
  const [canRenderCanvas, setCanRenderCanvas] = useState(false);
  const pointerRef = useRef<PointerState>({ x: 0, y: 0 });

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

  if (reduceMotion || !canRenderCanvas) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-40 h-[220px] w-[min(88vw,420px)]">
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
    </div>
  );
}
