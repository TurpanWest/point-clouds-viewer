"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stats } from "@react-three/drei";
import Experience from "./components/Experience";
import Interface from "./components/Interface";
import "./globals.css"; 

export default function Page() {
  return (
    <main className="fixed inset-0 w-full h-full bg-[ivory]">
        <Canvas
          className="pointer-events-none"
          shadows
          camera={{
            fov: 60,
            near: 0.1,
            far: 2000,
            position: [100, 100, 100],
          }}
        >
          <Experience />
          <OrbitControls />
          <Stats />
        </Canvas>
        <Interface />
    </main>
  );
}
