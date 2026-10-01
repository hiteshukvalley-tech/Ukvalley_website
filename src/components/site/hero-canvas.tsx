"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Float, Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

function Orb() {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.18;
      mesh.current.rotation.x += delta * 0.05;
    }
  });
  return (
    <Float speed={1.4} rotationIntensity={0.4} floatIntensity={1.1}>
      <mesh ref={mesh} scale={2.1}>
        <icosahedronGeometry args={[1, 12]} />
        <MeshDistortMaterial
          color="#3100ff"
          emissive="#2400c7"
          emissiveIntensity={0.45}
          roughness={0.22}
          metalness={0.75}
          distort={0.42}
          speed={1.6}
        />
      </mesh>
      {/* wireframe halo */}
      <mesh scale={2.55}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial color="#287bff" wireframe transparent opacity={0.14} />
      </mesh>
    </Float>
  );
}

// Deterministic seeded PRNG (mulberry32) so particle positions are stable
// across renders — keeps the component pure (no Math.random during render).
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Particles({ count = 220 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const rand = mulberry32(count * 2654435761);
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 6 + rand() * 6;
      const t = rand() * Math.PI * 2;
      const p = Math.acos(2 * rand() - 1);
      arr[i * 3] = r * Math.sin(p) * Math.cos(t);
      arr[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
      arr[i * 3 + 2] = r * Math.cos(p);
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.04;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#3100ff"
        size={0.045}
        sizeAttenuation
        depthWrite={false}
        opacity={0.55}
      />
    </Points>
  );
}

export function HeroCanvas() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 0, 7], fov: 45 }}
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={2.2} color="#3100ff" />
      <pointLight position={[-5, -3, 2]} intensity={1.4} color="#fff500" />
      <Suspense fallback={null}>
        <Orb />
        <Particles />
      </Suspense>
    </Canvas>
  );
}