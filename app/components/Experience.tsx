"use client";

import Lights from "./Lights";
import Scene from "./Scene";
import { Mesh } from "three";
import { useKeyboardControls, OrbitControls } from "@react-three/drei";
import { useEffect } from "react";


export default function Experience() {
  return (
    <>
      <color args={ [ '#bdedfc']} attach="background"/>
        <Lights />
        <Scene/>
    </>
  );
}
