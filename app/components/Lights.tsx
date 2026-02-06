"use client";

import { DirectionalLight } from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

export default function Lights() {
  const light = useRef<any>(null)
  
  useFrame ((state) => 
    {
      light.current.position.z = state.camera.position.z + 1 - 4
      light.current.target.position.z = state.camera.position.z - 4

      light.current.position.x = state.camera.position.x + 4
      light.current.target.position.x = state.camera.position.x

      light.current.target.updateMatrixWorld()
    })

  return (
    <>
      <directionalLight
        ref={light}
        castShadow
        position={[4, 4, 1]}
        intensity={4.5}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={20}
        shadow-camera-top={20}
        shadow-camera-right={20}
        shadow-camera-bottom={-20}
        shadow-camera-left={-20}
      />
      <ambientLight intensity={1.5} />
    </>
  );
}

