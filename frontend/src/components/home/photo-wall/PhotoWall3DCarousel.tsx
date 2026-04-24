import { ScrollControls, useScroll } from "@react-three/drei";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import type { PhotoWallRenderItem } from "./photoWallUtils";

type PhotoWall3DCarouselProps = {
  photos: PhotoWallRenderItem[];
  onPreview: (item: PhotoWallRenderItem) => void;
};

type PhotoCardProps = {
  photo: PhotoWallRenderItem;
  position: [number, number, number];
  rotation: [number, number, number];
  geometry: THREE.PlaneGeometry;
  alphaMap: THREE.Texture | null;
  onPreview: (item: PhotoWallRenderItem) => void;
};

function createBentPlaneGeometry(radius: number, width: number, height: number, widthSegments: number, heightSegments: number) {
  const geometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
  const parameters = geometry.parameters;
  const halfWidth = parameters.width * 0.5;

  const pointA = new THREE.Vector2(-halfWidth, 0);
  const pointB = new THREE.Vector2(0, radius);
  const pointC = new THREE.Vector2(halfWidth, 0);
  const edgeAB = new THREE.Vector2().subVectors(pointA, pointB);
  const edgeBC = new THREE.Vector2().subVectors(pointB, pointC);
  const edgeAC = new THREE.Vector2().subVectors(pointA, pointC);

  const circumRadius = (edgeAB.length() * edgeBC.length() * edgeAC.length()) / (2 * Math.abs(edgeAB.cross(edgeAC)));
  const center = new THREE.Vector2(0, radius - circumRadius);
  const baseVector = new THREE.Vector2().subVectors(pointA, center);
  const baseAngle = baseVector.angle() - Math.PI * 0.5;
  const arc = baseAngle * 2;

  const uv = geometry.attributes.uv;
  const positions = geometry.attributes.position;
  const rotatedVector = new THREE.Vector2();
  for (let index = 0; index < uv.count; index += 1) {
    const uvRatio = 1 - uv.getX(index);
    const y = positions.getY(index);
    rotatedVector.copy(pointC).rotateAround(center, arc * uvRatio);
    positions.setXYZ(index, rotatedVector.x, y, -rotatedVector.y);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function drawRoundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function createRoundedMaskTexture(size = 512, radius = 58) {
  if (typeof document === "undefined") {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }

  ctx.clearRect(0, 0, size, size);
  drawRoundedRectPath(ctx, 0, 0, size, size, radius);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

function Rig({ children }: { children: ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  const scroll = useScroll();

  useFrame((state, delta) => {
    const targetX = -state.pointer.x * 1.35;
    const targetY = 1 + state.pointer.y * 0.32;
    const targetZ = 9.1;

    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, targetX, 4, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, targetY, 4, delta);
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, targetZ, 4, delta);
    state.camera.lookAt(0, 0, 0);

    if (groupRef.current) {
      groupRef.current.rotation.y = -scroll.offset * (Math.PI * 2);
    }

    state.events.update?.();
  });

  return <group ref={groupRef}>{children}</group>;
}

function PhotoCard({ photo, position, rotation, geometry, alphaMap, onPreview }: PhotoCardProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const textureZoomRef = useRef(1.34);

  useEffect(() => {
    let alive = true;
    const loader = new THREE.TextureLoader();

    loader.load(
      photo.__normalizedImageUrl,
      (loadedTexture) => {
        if (!alive) {
          loadedTexture.dispose();
          return;
        }
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTexture.wrapS = THREE.ClampToEdgeWrapping;
        loadedTexture.wrapT = THREE.ClampToEdgeWrapping;
        loadedTexture.anisotropy = 8;
        setTexture(loadedTexture);
      },
      undefined,
      () => {
        if (!alive) {
          return;
        }
        setTexture(null);
      },
    );

    return () => {
      alive = false;
    };
  }, [photo.__normalizedImageUrl]);

  useEffect(
    () => () => {
      texture?.dispose();
    },
    [texture],
  );

  useFrame((_, delta) => {
    if (meshRef.current) {
      const targetScale = hovered ? 1.14 : 1;
      const nextScale = THREE.MathUtils.damp(meshRef.current.scale.x, targetScale, 6, delta);
      meshRef.current.scale.setScalar(nextScale);
    }
    if (materialRef.current) {
      materialRef.current.metalness = THREE.MathUtils.damp(materialRef.current.metalness, hovered ? 0.2 : 0.08, 6, delta);
      materialRef.current.roughness = THREE.MathUtils.damp(materialRef.current.roughness, hovered ? 0.36 : 0.62, 6, delta);
      materialRef.current.emissiveIntensity = THREE.MathUtils.damp(materialRef.current.emissiveIntensity, hovered ? 0.08 : 0.02, 8, delta);
    }

    if (texture) {
      textureZoomRef.current = THREE.MathUtils.damp(textureZoomRef.current, hovered ? 1 : 1.34, 7, delta);
      const repeat = 1 / textureZoomRef.current;
      texture.repeat.set(repeat, repeat);
      texture.offset.set((1 - repeat) * 0.5, (1 - repeat) * 0.5);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onPreview(photo);
      }}
    >
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial
        ref={materialRef}
        alphaMap={alphaMap ?? undefined}
        alphaTest={alphaMap ? 0.06 : 0}
        color="#f8fafc"
        emissive="#93c5fd"
        emissiveIntensity={0.02}
        map={texture ?? undefined}
        metalness={0.08}
        roughness={0.62}
        side={THREE.DoubleSide}
        transparent={Boolean(alphaMap)}
      />
    </mesh>
  );
}

function Carousel({ photos, onPreview }: { photos: PhotoWallRenderItem[]; onPreview: (item: PhotoWallRenderItem) => void }) {
  const count = photos.length;
  const radius = useMemo(() => {
    const dynamicRadius = 1.08 + count * 0.24;
    return Math.min(3.35, Math.max(1.5, dynamicRadius));
  }, [count]);

  const geometry = useMemo(() => createBentPlaneGeometry(0.11, 1.02, 1.36, 24, 28), []);
  const alphaMap = useMemo(() => createRoundedMaskTexture(512, 68), []);

  useEffect(
    () => () => {
      geometry.dispose();
      alphaMap?.dispose();
    },
    [geometry, alphaMap],
  );

  return (
    <>
      {photos.map((photo, index) => {
        const angle = (index / count) * Math.PI * 2;
        const position: [number, number, number] = [
          Math.sin(angle) * radius,
          0,
          Math.cos(angle) * radius,
        ];
        const rotation: [number, number, number] = [0, Math.PI + angle, 0];
        return (
          <PhotoCard
            key={photo.__instanceId}
            alphaMap={alphaMap}
            geometry={geometry}
            onPreview={onPreview}
            photo={photo}
            position={position}
            rotation={rotation}
          />
        );
      })}
    </>
  );
}

export function PhotoWall3DCarousel({ photos, onPreview }: PhotoWall3DCarouselProps) {
  return (
    <div className="relative h-[300px] overflow-hidden rounded-2xl border border-theme-line/80 bg-[linear-gradient(160deg,#f8fbff,#eef4ff)]">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0.6, 7.8], fov: 24 }}>
        <color attach="background" args={["#f6f9ff"]} />
        <fog attach="fog" args={["#e8eefb", 7.8, 15]} />
        <ambientLight intensity={0.8} />
        <directionalLight color="#fff7ed" intensity={1.05} position={[2.8, 2.5, 2.6]} />
        <directionalLight color="#dbeafe" intensity={0.5} position={[-2.8, -1.8, -2.2]} />

        <ScrollControls pages={4} infinite damping={0.18}>
          <Rig>
            <Carousel photos={photos} onPreview={onPreview} />
          </Rig>
        </ScrollControls>
      </Canvas>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(255,255,255,0.7),transparent_42%),radial-gradient(circle_at_84%_16%,rgba(147,197,253,0.24),transparent_46%)]" />
    </div>
  );
}
