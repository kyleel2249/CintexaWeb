import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox, Html } from "@react-three/drei";
import * as THREE from "three";

const PILLARS: Array<{ label: string; color: string; angle: number }> = [
  { label: "Technology", color: "#6BB3FF", angle: 0 },
  { label: "Commerce", color: "#F5C518", angle: Math.PI / 2 },
  { label: "Motion", color: "#7DD3C7", angle: Math.PI },
  { label: "Intelligence", color: "#C4B5FD", angle: (3 * Math.PI) / 2 },
];

function CoreNode() {
  return (
    <Float speed={1} floatIntensity={0.3} rotationIntensity={0.1}>
      <RoundedBox args={[0.6, 0.6, 0.6]} radius={0.08}>
        <meshStandardMaterial color="#F5C518" metalness={0.5} roughness={0.25} emissive="#8a6600" emissiveIntensity={0.25} />
      </RoundedBox>
    </Float>
  );
}

function OrbitPillar({ label, color, angle }: { label: string; color: string; angle: number }) {
  const ref = useRef<THREE.Group>(null);
  const radius = 1.6;
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime * 0.25 + angle;
    ref.current.position.x = Math.cos(t) * radius;
    ref.current.position.z = Math.sin(t) * radius;
    ref.current.position.y = Math.sin(t * 1.3) * 0.2;
  });
  return (
    <group ref={ref}>
      <Float speed={1.4} floatIntensity={0.4}>
        <mesh>
          <sphereGeometry args={[0.22, 24, 24]} />
          <meshStandardMaterial color={color} metalness={0.3} roughness={0.35} emissive={color} emissiveIntensity={0.18} />
        </mesh>
        <Html center distanceFactor={8} style={{ pointerEvents: "none" }}>
          <div
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: "11px",
              color: "#F7F4EE",
              background: "rgba(11,15,20,0.65)",
              padding: "2px 8px",
              borderRadius: "999px",
              whiteSpace: "nowrap",
              transform: "translateY(22px)",
            }}
          >
            {label}
          </div>
        </Html>
      </Float>
    </group>
  );
}

function OrbitRing() {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.55, 1.58, 64]} />
      <meshBasicMaterial color="#2B3641" transparent opacity={0.6} side={THREE.DoubleSide} />
    </mesh>
  );
}

function EcosystemScene() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 4]} intensity={1} color="#fff6d6" />
      <pointLight position={[-3, -2, 2]} intensity={0.35} color="#7DD3C7" />
      <CoreNode />
      <OrbitRing />
      {PILLARS.map((p) => (
        <OrbitPillar key={p.label} {...p} />
      ))}
    </>
  );
}

/** Interactive 3D business ecosystem — hero scene for the homepage. */
export function BusinessEcosystem3D() {
  return (
    <div className="aspect-square w-full max-w-[480px] mx-auto">
      <Canvas camera={{ position: [0, 1.6, 4], fov: 42 }} dpr={[1, 1.75]}>
        <Suspense fallback={null}>
          <EcosystemScene />
        </Suspense>
      </Canvas>
    </div>
  );
}
