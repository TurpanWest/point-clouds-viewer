"use client";

import Scene from "./Scene";
import { Suspense, useState, useEffect } from "react";
import { Html } from "@react-three/drei";

export default function Experience() {
  const [start, setStart] = useState(false);

  useEffect(() => {
    // 延迟加载以确保 UI 有机会渲染 Loading 状态
    // Delay loading to ensure the UI has a chance to render the Loading state
    const t = setTimeout(() => setStart(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <color args={ [ '#181818']} attach="background"/>
      {start && (
        <Suspense fallback={<Html center style={{ color: 'white' }}>Loading Point Cloud...</Html>}>
          <Scene/>
        </Suspense>
      )}
    </>
  );
}
