import { Cloud, Sparkles } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Mesh, Object3D } from "three";
import { AdditiveBlending, Color, DoubleSide } from "three";

type CloudConfig = {
  x: number;
  y: number;
  z: number;
  speed: number;
  opacity: number;
  scale: number;
};

type HeroCloudSceneProps = {
  mobile?: boolean;
};

function pseudoRandom(seed: number) {
  const raw = Math.sin(seed * 12.9898) * 43758.5453123;
  return raw - Math.floor(raw);
}

function CloudField({ mobile = false }: HeroCloudSceneProps) {
  const groupRefs = useRef<Array<Object3D | null>>([]);

  const cloudConfigs = useMemo<CloudConfig[]>(() => {
    const count = mobile ? 4 : 8;
    return new Array(count).fill(null).map((_, index) => ({
      x: -8 + pseudoRandom(index + 1) * 16,
      y: -2 + pseudoRandom(index + 11) * 5,
      z: -20 + pseudoRandom(index + 21) * 25,
      speed: 0.35 + pseudoRandom(index + 31) * 0.9,
      opacity: 0.15 + pseudoRandom(index + 41) * 0.2,
      scale: 0.6 + pseudoRandom(index + 51) * 1.4,
    }));
  }, [mobile]);

  const rayRefs = useRef<Array<Mesh | null>>([]);

  useFrame((state, delta) => {
    state.camera.position.z -= delta * 0.9;

    for (const node of groupRefs.current) {
      if (!node) {
        continue;
      }
      const speed = Number(node.userData.speed || 0.5);
      node.position.z += speed * delta * 2.2;
      if (node.position.z > state.camera.position.z + 3) {
        node.position.z = state.camera.position.z - 24 - Math.random() * 8;
        node.position.x = -8 + Math.random() * 16;
        node.position.y = -2 + Math.random() * 5;
      }
    }

    for (const [index, mesh] of rayRefs.current.entries()) {
      if (!mesh) {
        continue;
      }
      mesh.rotation.z += delta * (0.06 + index * 0.02);
      const material = mesh.material;
      if (Array.isArray(material)) {
        continue;
      }
      material.opacity = 0.08 + Math.sin(state.clock.elapsedTime * 1.8 + index) * 0.03;
    }
  });

  return (
    <>
      <fog attach="fog" args={[new Color("#0B0E18"), 3, 15]} />
      <ambientLight intensity={0.4} />
      <hemisphereLight intensity={0.45} color="#cdd6ff" groundColor="#111827" />
      <spotLight position={[0.6, 7, -4]} intensity={2.2} angle={0.45} penumbra={0.75} color="#d5defc" />

      {cloudConfigs.map((config, index) => (
        <Cloud
          key={`cloud-${index}`}
          ref={(node) => {
            groupRefs.current[index] = node as unknown as Object3D | null;
            if (node) {
              node.userData.speed = config.speed;
            }
          }}
          position={[config.x, config.y, config.z]}
          speed={config.speed}
          opacity={config.opacity}
          segments={20}
          bounds={[4.5 * config.scale, 1.8 * config.scale, 1.2 * config.scale]}
          color="#dde7ff"
          concentrate="inside"
        />
      ))}

      {[0, 1, 2].map((index) => (
        <mesh
          key={`ray-${index}`}
          ref={(node) => {
            rayRefs.current[index] = node;
          }}
          position={[index * 0.9 - 0.7, 1.2 + index * 0.2, -4.2 + index * -1.6]}
          rotation={[Math.PI / 2.4, 0.06 * index, 0]}
        >
          <planeGeometry args={[1.3, 7.2]} />
          <meshBasicMaterial
            color="#cfd9ff"
            transparent
            opacity={0.09}
            side={DoubleSide}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      <Sparkles
        count={mobile ? 45 : 80}
        scale={[18, 8, 20]}
        position={[0, 0.8, -8]}
        size={1.5}
        speed={0.5}
        noise={0.1}
        color="#b6c4ff"
      />
    </>
  );
}

export function HeroCloudScene({ mobile = false }: HeroCloudSceneProps) {
  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={mobile ? [1, 1] : [1, 1.5]}
        camera={{ position: [0, 0.5, 4], fov: 55, near: 0.1, far: 60 }}
        gl={{ antialias: true }}
      >
        <CloudField mobile={mobile} />
      </Canvas>
    </div>
  );
}
