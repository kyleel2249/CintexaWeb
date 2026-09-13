import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox, Text, Line } from "@react-three/drei";
import * as THREE from "three";

/** Exact brand tokens from logo.tsx */
const AMBER = "#F5C518";
const INK = "#0B0F14";
const PAPER = "#F7F4EE";
const SKY = "#6BB3FF";
const TEAL = "#7DD3C7";
const VIOLET = "#C4B5FD";

const DURATION = 5;

function phase(t: number): number {
  return Math.min(Math.max(t, 0), DURATION);
}

function smooth(a: number, b: number, t: number) {
  const x = Math.min(Math.max((t - a) / (b - a), 0), 1);
  return x * x * (3 - 2 * x);
}

/** Stylized professional figure — readable silhouette, not cartoon. */
function Professional({
  position,
  color = "#3a4550",
  scale = 1,
  opacity = 1,
}: {
  position: [number, number, number];
  color?: string;
  scale?: number;
  opacity?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#c4a882" roughness={0.55} metalness={0.05} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <capsuleGeometry args={[0.22, 0.45, 6, 12]} />
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.1} transparent opacity={opacity} />
      </mesh>
      <mesh position={[-0.1, 0.4, 0]}>
        <capsuleGeometry args={[0.08, 0.45, 4, 8]} />
        <meshStandardMaterial color={INK} roughness={0.5} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0.1, 0.4, 0]}>
        <capsuleGeometry args={[0.08, 0.45, 4, 8]} />
        <meshStandardMaterial color={INK} roughness={0.5} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

function AssessmentPanel({ progress }: { progress: number }) {
  const labels = ["Performance", "Sales", "Marketing", "Customers", "Operations", "Growth"];
  const visible = smooth(0.7, 1.4, progress);
  return (
    <group position={[0.9, 1.2, 0.2]} rotation={[0, -0.35, 0]} scale={0.85 + visible * 0.15}>
      <RoundedBox args={[1.6, 1.4, 0.06]} radius={0.06}>
        <meshStandardMaterial
          color={INK}
          transparent
          opacity={0.75 * visible}
          metalness={0.4}
          roughness={0.3}
        />
      </RoundedBox>
      <Text
        position={[0, 0.52, 0.04]}
        fontSize={0.1}
        color={AMBER}
        anchorX="center"
        anchorY="middle"
        fillOpacity={visible}
      >
        BUSINESS ASSESSMENT
      </Text>
      {labels.map((label, i) => (
        <group key={label} position={[-0.55, 0.28 - i * 0.18, 0.04]}>
          <mesh position={[0.35, 0, 0]}>
            <planeGeometry args={[0.9 * Math.min(1, 0.4 + ((progress * 3 + i * 0.2) % 1)), 0.06]} />
            <meshBasicMaterial color={i % 2 === 0 ? SKY : TEAL} transparent opacity={0.55 * visible} />
          </mesh>
          <Text position={[0, 0, 0.01]} fontSize={0.07} color={PAPER} anchorX="left" fillOpacity={visible * 0.9}>
            {label}
          </Text>
        </group>
      ))}
    </group>
  );
}

function DataStream({
  points,
  color,
  progress,
  start,
  end,
}: {
  points: [number, number, number][];
  color: string;
  progress: number;
  start: number;
  end: number;
}) {
  const alpha = smooth(start, end, progress) * (1 - smooth(end, end + 0.6, progress) * 0.4);
  const pts = useMemo(() => points.map((p) => new THREE.Vector3(...p)), [points]);
  if (alpha < 0.02) return null;
  return (
    <Line points={pts} color={color} lineWidth={1.5} transparent opacity={alpha * 0.85} dashed={false} />
  );
}

/** Faithful 3D reconstruction of BrandMark + wordmark from logo.tsx */
function CintexaLogo({ progress }: { progress: number }) {
  const assemble = smooth(3.5, 4.2, progress);
  const hold = smooth(4.1, 4.6, progress);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.2) * 0.012 * hold;
    groupRef.current.scale.setScalar(assemble * pulse * 1.15);
    groupRef.current.rotation.y = (1 - assemble) * 0.4;
  });

  const markOpacity = assemble;
  const textOpacity = smooth(4.0, 4.5, progress);

  return (
    <group ref={groupRef} position={[0, 0.3, 0]}>
      <RoundedBox args={[1.2, 1.2, 0.18]} radius={0.28} position={[0, 0.55, 0]}>
        <meshStandardMaterial
          color={AMBER}
          metalness={0.45}
          roughness={0.22}
          emissive={AMBER}
          emissiveIntensity={0.2 * hold}
          transparent
          opacity={markOpacity}
        />
      </RoundedBox>
      <mesh position={[0, 0.55, 0.1]}>
        <torusGeometry args={[0.38, 0.028, 12, 48]} />
        <meshStandardMaterial color={INK} transparent opacity={0.9 * markOpacity} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.55, 0.12]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.72, 0.028, 0.02]} />
        <meshStandardMaterial color={INK} transparent opacity={0.55 * markOpacity} />
      </mesh>
      <mesh position={[0, 0.55, 0.14]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color={INK} transparent opacity={markOpacity} />
      </mesh>
      <Text
        position={[0, -0.35, 0]}
        fontSize={0.32}
        color={PAPER}
        anchorX="center"
        anchorY="middle"
        letterSpacing={-0.02}
        fillOpacity={textOpacity}
      >
        CINTEXA
      </Text>
      <Text
        position={[0, -0.65, 0]}
        fontSize={0.08}
        color={PAPER}
        anchorX="center"
        anchorY="middle"
        fillOpacity={textOpacity * 0.7}
      >
        Technology that helps businesses understand, improve, and grow.
      </Text>
      <mesh position={[0, 0.4, -0.3]}>
        <circleGeometry args={[1.8, 48]} />
        <meshBasicMaterial color={AMBER} transparent opacity={0.06 * hold} depthWrite={false} />
      </mesh>
    </group>
  );
}

function GrowthBars({ progress }: { progress: number }) {
  const rise = smooth(2.7, 3.5, progress);
  return (
    <group position={[-1.2, 0.2, -0.4]}>
      {[0.4, 0.7, 1.0, 1.35, 1.6].map((h, i) => (
        <mesh key={i} position={[i * 0.28, (h * rise) / 2, 0]}>
          <boxGeometry args={[0.18, Math.max(0.05, h * rise), 0.18]} />
          <meshStandardMaterial
            color={i === 4 ? AMBER : SKY}
            emissive={i === 4 ? AMBER : SKY}
            emissiveIntensity={0.15 * rise}
            metalness={0.2}
            roughness={0.35}
          />
        </mesh>
      ))}
    </group>
  );
}

function BrandRevealScene({ playing }: { playing: boolean }) {
  const [t, setT] = useState(0);
  const startRef = useRef<number | null>(null);

  useFrame((state) => {
    if (!playing) return;
    if (startRef.current === null) startRef.current = state.clock.elapsedTime;
    const elapsed = state.clock.elapsedTime - startRef.current;
    const cycle = elapsed % 6.5;
    setT(phase(cycle > 5.2 ? 5 : cycle));
  });

  const challenge = 1 - smooth(0.5, 0.9, t);
  const assess = smooth(0.7, 1.5, t) * (1 - smooth(2.4, 2.9, t));
  const solutions = smooth(1.5, 2.5, t) * (1 - smooth(3.3, 3.8, t));
  const growth = smooth(2.6, 3.4, t);
  const logoPhase = t;

  return (
    <>
      <color attach="background" args={["#0B0F14"]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 3]} intensity={1.1} color="#fff5e0" />
      <pointLight position={[-3, 2, 2]} intensity={0.4} color={SKY} />
      <pointLight position={[2, 1, -2]} intensity={0.35 * growth} color={AMBER} />

      <Professional
        position={[-0.9, -0.9, 0.4]}
        color="#2a3540"
        scale={0.95}
        opacity={0.35 + challenge * 0.55 + assess * 0.3}
      />

      {assess > 0.05 && <AssessmentPanel progress={t} />}

      <DataStream
        points={[
          [-0.5, 0.8, 0.3],
          [0.2, 1.0, 0],
          [0.9, 1.1, 0.1],
        ]}
        color={AMBER}
        progress={t}
        start={1.2}
        end={2.0}
      />
      <DataStream
        points={[
          [0.9, 0.9, 0],
          [1.4, 0.5, -0.5],
          [0.6, 0.2, -1.0],
          [-0.8, 0.4, -0.6],
        ]}
        color={SKY}
        progress={t}
        start={1.8}
        end={2.8}
      />
      <DataStream
        points={[
          [-0.8, 0.5, -0.5],
          [-0.2, 0.9, 0.2],
          [0.5, 1.2, 0.4],
          [0, 0.6, 0.8],
        ]}
        color={TEAL}
        progress={t}
        start={2.2}
        end={3.2}
      />

      {solutions > 0.05 && (
        <group>
          <Float speed={1.2} floatIntensity={0.2}>
            <mesh position={[1.5, 0.3, -0.6]} scale={solutions}>
              <boxGeometry args={[0.35, 0.35, 0.08]} />
              <meshStandardMaterial color={VIOLET} emissive={VIOLET} emissiveIntensity={0.2} metalness={0.3} roughness={0.3} />
            </mesh>
          </Float>
          <Float speed={1.4} floatIntensity={0.25}>
            <mesh position={[1.2, -0.2, -1.0]} scale={solutions}>
              <boxGeometry args={[0.4, 0.28, 0.06]} />
              <meshStandardMaterial color={SKY} emissive={SKY} emissiveIntensity={0.18} metalness={0.25} roughness={0.35} />
            </mesh>
          </Float>
          <Float speed={1.1} floatIntensity={0.2}>
            <mesh position={[-1.4, 0.5, -0.8]} scale={solutions}>
              <octahedronGeometry args={[0.2]} />
              <meshStandardMaterial color={TEAL} emissive={TEAL} emissiveIntensity={0.2} metalness={0.35} roughness={0.3} />
            </mesh>
          </Float>
        </group>
      )}

      <Professional position={[1.1, -0.9, -0.3]} color="#3d4a38" scale={0.9} opacity={0.15 + growth * 0.7} />

      <GrowthBars progress={t} />

      <CintexaLogo progress={logoPhase} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.95, 0]}>
        <circleGeometry args={[3.5, 48]} />
        <meshStandardMaterial color="#121820" roughness={0.9} metalness={0.05} />
      </mesh>
    </>
  );
}

/**
 * Cinematic 5-second CINTEXA brand reveal.
 * Story: challenge → assessment → technology solutions → growth → logo hold.
 * Performance: pauses when off-screen; respects parent allow3D gating.
 */
export function BrandReveal3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.08,
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto aspect-[4/3] w-full max-w-[560px] overflow-hidden rounded-2xl"
      style={{ background: INK }}
      role="img"
      aria-label="CINTEXA brand reveal: business assessment, technology solutions, and growth culminating in the CINTEXA logo"
    >
      <Canvas
        camera={{ position: [0, 1.2, 4.2], fov: 40 }}
        dpr={[1, 1.5]}
        frameloop={visible ? "always" : "never"}
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={null}>
          <BrandRevealScene playing={visible} />
        </Suspense>
      </Canvas>
    </div>
  );
}
