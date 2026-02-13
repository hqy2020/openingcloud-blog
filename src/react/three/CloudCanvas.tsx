import { useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Cloud } from '@react-three/drei';
import * as THREE from 'three';

type InteractionRefs = {
  pointer: MutableRefObject<THREE.Vector2>;
  pulse: MutableRefObject<number>;
};

function FlowClouds({ interaction }: { interaction: InteractionRefs }) {
  const groupRef = useRef<THREE.Group>(null);
  const cloudConfigs = useMemo(
    () => [
      { position: [0, 0.4, -2.4] as [number, number, number], width: 8, depth: 2.2, opacity: 0.26, color: '#9fceff' },
      { position: [3.2, 1.2, -2.9] as [number, number, number], width: 5.8, depth: 1.6, opacity: 0.2, color: '#c2ddff' },
      { position: [-3, -0.15, -2.7] as [number, number, number], width: 5.2, depth: 1.4, opacity: 0.21, color: '#d8eaff' },
      { position: [1.5, -1.1, -2.2] as [number, number, number], width: 4.2, depth: 1.2, opacity: 0.17, color: '#e6f1ff' },
    ],
    [],
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const px = interaction.pointer.current.x;
    const py = interaction.pointer.current.y;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, px * 0.08, 0.04);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -py * 0.03, 0.04);
    groupRef.current.position.y = Math.sin(t * 0.22) * 0.1;
  });

  return (
    <group ref={groupRef}>
      {cloudConfigs.map((item, index) => (
        <Cloud
          // `Cloud` has its own noisy volume; tiny property variance prevents repetitive look.
          key={index}
          position={item.position}
          opacity={item.opacity}
          speed={0.12 + index * 0.05}
          width={item.width}
          depth={item.depth}
          segments={18 - index * 2}
          color={item.color}
        />
      ))}
    </group>
  );
}

function SheepFigure({ interaction }: { interaction: InteractionRefs }) {
  const groupRef = useRef<THREE.Group>(null);
  const woolPuffs = useMemo(
    () => [
      [-0.5, 0.1, 0.0, 1],
      [-0.1, 0.25, 0.1, 0.9],
      [0.25, 0.18, -0.04, 0.86],
      [-0.15, -0.05, 0.26, 0.82],
      [0.24, -0.02, 0.24, 0.8],
      [-0.2, 0.12, -0.28, 0.8],
      [0.2, 0.1, -0.23, 0.78],
    ] as Array<[number, number, number, number]>,
    [],
  );

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    interaction.pulse.current = Math.max(0, interaction.pulse.current - delta * 0.45);

    const t = state.clock.elapsedTime;
    const px = interaction.pointer.current.x;
    const py = interaction.pointer.current.y;
    const pulseOffset = interaction.pulse.current * 0.16;

    groupRef.current.position.y = 0.12 + Math.sin(t * 1.25) * 0.12 + pulseOffset;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, px * 0.26, 0.05);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -py * 0.08, 0.05);
    groupRef.current.rotation.z = Math.sin(t * 0.8) * 0.03;
  });

  return (
    <group ref={groupRef} position={[0.2, 0.1, 0.5]} scale={1.2}>
      <group position={[0, 0, 0]}>
        {woolPuffs.map(([x, y, z, scale], index) => (
          <mesh key={index} position={[x, y, z]} scale={scale}>
            <sphereGeometry args={[0.44, 24, 24]} />
            <meshStandardMaterial color="#f7fbff" roughness={0.42} metalness={0.04} />
          </mesh>
        ))}
      </group>

      <mesh position={[0.86, -0.08, 0.18]} scale={[0.82, 0.7, 0.7]}>
        <sphereGeometry args={[0.36, 20, 20]} />
        <meshStandardMaterial color="#607086" roughness={0.8} metalness={0.02} />
      </mesh>

      <mesh position={[1.06, -0.11, 0.42]} scale={[0.36, 0.24, 0.22]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#72839a" roughness={0.75} metalness={0.02} />
      </mesh>

      <mesh position={[0.98, 0.05, 0.47]}>
        <sphereGeometry args={[0.03, 10, 10]} />
        <meshBasicMaterial color="#111827" />
      </mesh>
      <mesh position={[1.14, 0.04, 0.45]}>
        <sphereGeometry args={[0.03, 10, 10]} />
        <meshBasicMaterial color="#111827" />
      </mesh>

      <mesh position={[-0.15, -0.62, 0.22]} scale={[0.18, 0.52, 0.18]}>
        <cylinderGeometry args={[0.2, 0.2, 1, 12]} />
        <meshStandardMaterial color="#6a7b90" roughness={0.82} metalness={0.01} />
      </mesh>
      <mesh position={[0.3, -0.63, 0.21]} scale={[0.18, 0.52, 0.18]}>
        <cylinderGeometry args={[0.2, 0.2, 1, 12]} />
        <meshStandardMaterial color="#6a7b90" roughness={0.82} metalness={0.01} />
      </mesh>
    </group>
  );
}

function SceneRig({ interaction }: { interaction: InteractionRefs }) {
  const { camera } = useThree();
  const haloRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const px = interaction.pointer.current.x;
    const py = interaction.pointer.current.y;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, px * 0.7, 0.03);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.1 + py * 0.35, 0.03);
    camera.lookAt(0, 0, 0);

    if (haloRef.current) {
      haloRef.current.scale.setScalar(1 + Math.sin(t * 1.1) * 0.06 + interaction.pulse.current * 0.08);
      (haloRef.current.material as THREE.MeshBasicMaterial).opacity = 0.1 + Math.sin(t * 0.7) * 0.02;
    }
  });

  return (
    <>
      <ambientLight intensity={0.82} />
      <hemisphereLight intensity={0.45} skyColor="#d7ebff" groundColor="#edf5ff" />
      <directionalLight position={[3, 4, 4]} intensity={0.55} color="#dceeff" />
      <FlowClouds interaction={interaction} />
      <SheepFigure interaction={interaction} />
      <mesh ref={haloRef} position={[0, -1.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.5, 48]} />
        <meshBasicMaterial color="#8ec9ff" transparent opacity={0.1} />
      </mesh>
    </>
  );
}

export default function CloudCanvas() {
  const pointer = useRef(new THREE.Vector2(0, 0));
  const pulse = useRef(0);
  const interaction = useMemo(() => ({ pointer, pulse }), []);

  const onPointerMove = (event: ThreeEvent<PointerEvent>) => {
    pointer.current.x = THREE.MathUtils.lerp(pointer.current.x, event.pointer.x, 0.35);
    pointer.current.y = THREE.MathUtils.lerp(pointer.current.y, event.pointer.y, 0.35);
  };

  const onPointerDown = () => {
    pulse.current = 1;
  };

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Canvas
        dpr={[1, 1.35]}
        frameloop="always"
        camera={{ position: [0, 0.1, 5.9], fov: 46 }}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        gl={{ antialias: true, alpha: true }}
        style={{ touchAction: 'pan-y' }}
      >
        <SceneRig interaction={interaction} />
      </Canvas>
    </div>
  );
}
