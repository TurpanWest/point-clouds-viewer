"use client";

import { Canvas } from "@react-three/fiber";
import { PerfMonitor } from "r3f-monitor";
import { OrbitControls} from "@react-three/drei";
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
            up: [0, 0, 1],
            position: [0, -50, 30],
          }}
        >
          <axesHelper args={[25]} />
          <PerfMonitor style={{ transform: "scale(1.5)", transformOrigin: "100% 0" }} />
          <Experience />
          <OrbitControls enablePan={false}/>
        </Canvas>
        <Interface />
    </main>
  );
}
