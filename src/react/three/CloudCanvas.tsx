import { Canvas } from '@react-three/fiber';
import { Cloud, Float, OrbitControls } from '@react-three/drei';

function Clouds() {
  return (
    <>
      <Float speed={1} rotationIntensity={0.2} floatIntensity={1}>
        <Cloud
          opacity={0.3}
          speed={0.3}
          width={8}
          depth={2}
          segments={20}
          color="#8EC9FF"
        />
      </Float>
      <Float speed={0.8} rotationIntensity={0.1} floatIntensity={0.8}>
        <Cloud
          position={[4, 1, -3]}
          opacity={0.2}
          speed={0.2}
          width={6}
          depth={1.5}
          segments={15}
          color="#BAD9FF"
        />
      </Float>
      <Float speed={1.2} rotationIntensity={0.15} floatIntensity={1.2}>
        <Cloud
          position={[-3, -0.5, -2]}
          opacity={0.25}
          speed={0.25}
          width={5}
          depth={1}
          segments={12}
          color="#E0EFFF"
        />
      </Float>
    </>
  );
}

export default function CloudCanvas() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas
        frameloop="demand"
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 10], fov: 50 }}
        style={{ pointerEvents: 'none' }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} />
        <Clouds />
      </Canvas>
    </div>
  );
}
