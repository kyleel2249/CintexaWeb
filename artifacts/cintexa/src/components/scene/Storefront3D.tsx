import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useMotion } from "@/components/motion/MotionProvider";

function Shelf({ position }: { position: [number, number, number] }) {
  return (
    <RoundedBox args={[2.4, 0.08, 0.7]} radius={0.02} position={position}>
      <meshStandardMaterial color="#1a2430" metalness={0.3} roughness={0.4} />
    </RoundedBox>
  );
}

function Product({ position, color, h = 0.35 }: { position: [number, number, number]; color: string; h?: number }) {
  return (
    <Float speed={1.2} floatIntensity={0.25} rotationIntensity={0.15}>
      <RoundedBox args={[0.28, h, 0.28]} radius={0.03} position={position}>
        <meshStandardMaterial color={color} metalness={0.25} roughness={0.35} />
      </RoundedBox>
    </Float>
  );
}

function Cart() {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (ref.current) ref.current.position.x = Math.sin(s.clock.elapsedTime * 0.5) * 0.35;
  });
  return (
    <group ref={ref} position={[0, -0.9, 0.9]}>
      <RoundedBox args={[0.5, 0.32, 0.4]} radius={0.04}>
        <meshStandardMaterial color="#F5C518" metalness={0.4} roughness={0.3} />
      </RoundedBox>
    </group>
  );
}

function StoreScene() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 5, 4]} intensity={1.1} color="#fff6d6" />
      <pointLight position={[-2, 1, 2]} intensity={0.4} color="#7DD3C7" />
      <mesh position={[0, 0.3, -0.6]}>
        <planeGeometry args={[3.2, 2.2]} />
        <meshStandardMaterial color="#0e1620" />
      </mesh>
      <Shelf position={[0, 0.55, -0.2]} />
      <Shelf position={[0, 0.05, -0.2]} />
      <Shelf position={[0, -0.45, -0.2]} />
      <Product position={[-0.7, 0.8, -0.15]} color="#F5C518" />
      <Product position={[-0.25, 0.75, -0.15]} color="#7DD3C7" h={0.28} />
      <Product position={[0.25, 0.82, -0.15]} color="#6BB3FF" h={0.4} />
      <Product position={[0.7, 0.78, -0.15]} color="#C4B5FD" />
      <Product position={[-0.5, 0.28, -0.15]} color="#9AE6B4" h={0.3} />
      <Product position={[0.1, 0.3, -0.15]} color="#F5C518" h={0.32} />
      <Product position={[0.55, 0.26, -0.15]} color="#6BB3FF" h={0.26} />
      <Product position={[-0.35, -0.22, -0.15]} color="#C4B5FD" h={0.3} />
      <Product position={[0.35, -0.2, -0.15]} color="#7DD3C7" h={0.34} />
      <Cart />
    </>
  );
}

export function StorefrontFallback() {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[24px] border border-[hsl(var(--border))] bg-[hsl(var(--foreground))] p-6" data-testid="storefront-css-fallback">
      <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--accent))]">Storefront · demo</p>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-square rounded-xl bg-[hsl(var(--background)/.12)] border border-[hsl(var(--background)/.1)]" />
        ))}
      </div>
      <div className="mt-4 h-10 rounded-xl bg-[hsl(var(--accent)/.35)]" />
      <p className="mt-4 font-mono text-[9px] uppercase tracking-[.14em] text-[hsl(var(--background)/.4)]">Sample catalog layout — not live inventory</p>
    </div>
  );
}

export function Storefront3D({ className }: { className?: string }) {
  const { allow3D, lowPower } = useMotion();
  if (!allow3D) return <StorefrontFallback />;
  return (
    <div className={className} style={{ height: "min(380px, 55vw)" }} data-testid="storefront-3d">
      <Canvas dpr={[1, lowPower ? 1.2 : 1.5]} camera={{ position: [0, 0.2, 3.2], fov: 42 }} gl={{ alpha: true, antialias: !lowPower }}>
        <Suspense fallback={null}>
          <StoreScene />
        </Suspense>
      </Canvas>
      <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">Interactive demo storefront · sample products only</p>
    </div>
  );
}
