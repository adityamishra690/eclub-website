import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Icosahedron,
  Torus,
  MeshDistortMaterial,
  Sparkles,
  Float,
  Environment,
} from "@react-three/drei";
import * as THREE from "three";

const LIME = "#bbdf4d";
const CYAN = "#3df2ff";

/* device tier — downgrade the scene on phones / touch for perf + battery */
const mq = (q) =>
  typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia(q).matches
    : false;
const IS_MOBILE = mq("(max-width: 640px)");
const FINE_POINTER = mq("(hover: hover) and (pointer: fine)");
const NODE_COUNT = IS_MOBILE ? 8 : 14;

/* Central pulsing distorted core */
function Core() {
  const mat = useRef();
  useFrame(({ clock }) => {
    if (mat.current) {
      mat.current.distort = 0.35 + Math.sin(clock.elapsedTime * 1.5) * 0.12;
    }
  });
  return (
    <Icosahedron args={[1.15, 4]}>
      <MeshDistortMaterial
        ref={mat}
        color={LIME}
        emissive={LIME}
        emissiveIntensity={0.35}
        roughness={0.15}
        metalness={0.9}
        distort={0.4}
        speed={2}
      />
    </Icosahedron>
  );
}

/* Wireframe shell that rotates around the core */
function Shell() {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.25;
      ref.current.rotation.x += delta * 0.12;
    }
  });
  return (
    <Icosahedron ref={ref} args={[1.85, 1]}>
      <meshBasicMaterial color={LIME} wireframe transparent opacity={0.28} />
    </Icosahedron>
  );
}

/* Orbiting neon rings */
function Rings() {
  const g = useRef();
  useFrame((_, delta) => {
    if (g.current) g.current.rotation.z += delta * 0.4;
  });
  return (
    <group ref={g}>
      <Torus args={[2.6, 0.015, 16, 120]} rotation={[Math.PI / 2.2, 0, 0]}>
        <meshBasicMaterial color={CYAN} transparent opacity={0.65} />
      </Torus>
      <Torus args={[3.1, 0.01, 16, 120]} rotation={[Math.PI / 1.7, 0.5, 0]}>
        <meshBasicMaterial color={LIME} transparent opacity={0.5} />
      </Torus>
      <Torus args={[3.6, 0.008, 16, 120]} rotation={[Math.PI / 2.6, -0.6, 0.4]}>
        <meshBasicMaterial color={CYAN} transparent opacity={0.35} />
      </Torus>
    </group>
  );
}

/* Small nodes orbiting like electrons */
function Electrons() {
  const g = useRef();
  const nodes = useMemo(() => {
    const arr = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      const a = (i / 14) * Math.PI * 2;
      const r = 2.6 + (i % 3) * 0.5;
      arr.push({
        a,
        r,
        y: (Math.sin(i) * 1.2),
        s: 0.03 + (i % 3) * 0.015,
      });
    }
    return arr;
  }, []);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = clock.elapsedTime;
    g.current.children.forEach((m, i) => {
      const n = nodes[i];
      m.position.x = Math.cos(n.a + t * 0.5) * n.r;
      m.position.z = Math.sin(n.a + t * 0.5) * n.r;
      m.position.y = n.y + Math.sin(t + i) * 0.3;
    });
  });
  return (
    <group ref={g}>
      {nodes.map((n, i) => (
        <mesh key={i}>
          <sphereGeometry args={[n.s, 12, 12]} />
          <meshBasicMaterial color={i % 2 ? CYAN : LIME} />
        </mesh>
      ))}
    </group>
  );
}

/* Rotate whole rig toward pointer for parallax (fine pointers only —
   on touch the pointer sticks at the last tap and skews the rig) */
function Rig({ children }) {
  const g = useRef();
  useFrame((state) => {
    if (!g.current) return;
    if (FINE_POINTER) {
      const { x, y } = state.pointer;
      g.current.rotation.y = THREE.MathUtils.lerp(g.current.rotation.y, x * 0.4, 0.05);
      g.current.rotation.x = THREE.MathUtils.lerp(g.current.rotation.x, -y * 0.3, 0.05);
    } else {
      // gentle idle drift instead of pointer-follow
      g.current.rotation.y = THREE.MathUtils.lerp(g.current.rotation.y, 0, 0.02);
      g.current.rotation.x = THREE.MathUtils.lerp(g.current.rotation.x, 0, 0.02);
    }
  });
  return <group ref={g}>{children}</group>;
}

export default function Reactor({ active = true }) {
  return (
    <Canvas
      // pause the render loop when the hero is offscreen / tab hidden (battery + GPU)
      frameloop={active ? "always" : "never"}
      dpr={[1, IS_MOBILE ? 1.5 : 2]}
      camera={{ position: [0, 0, 7.5], fov: 45 }}
      gl={{ antialias: !IS_MOBILE, alpha: true, powerPreference: "high-performance" }}
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={2} color={LIME} />
      <pointLight position={[-5, -3, 2]} intensity={1.5} color={CYAN} />
      <Rig>
        <Float speed={2} rotationIntensity={0.6} floatIntensity={0.8}>
          <Core />
          <Shell />
        </Float>
        <Rings />
        <Electrons />
        <Sparkles count={IS_MOBILE ? 40 : 90} scale={9} size={2.2} speed={0.4} color={LIME} opacity={0.7} />
        <Sparkles count={IS_MOBILE ? 22 : 50} scale={12} size={1.4} speed={0.2} color={CYAN} opacity={0.5} />
      </Rig>
      <Environment preset="night" />
    </Canvas>
  );
}
