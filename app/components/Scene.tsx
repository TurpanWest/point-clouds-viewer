import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { useThree, useLoader } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { PCDLoader } from 'three-stdlib';
import * as THREE from 'three';
import { GPUSelectionHelper } from '../utils/GPUSelectionHelper';
import { useSelectionStore } from '../stores/useSelectionStore';

interface SceneProps {
  color?: string;
  selectedColor?: string;
  enableSelection?: boolean;
}

export default function Scene({
  color = '#F6F6F6',
  selectedColor = '#86FFAF',
  enableSelection = true,
}: SceneProps) {

  const { camera, gl, size } = useThree();
  const setSelectionResult = useSelectionStore(state => state.setSelectionResult);

  // 使用 GitHub LFS 的媒体直链 (注意：media.githubusercontent.com)
  const pcd = useLoader(PCDLoader, 'https://media.githubusercontent.com/media/TurpanWest/point-clouds-viewer/main/public/kitti_2000w.pcd')
  const pointsRef = useRef<THREE.Points>(null)
  
  // GPU Selection Helper
  const gpuHelper = useRef<GPUSelectionHelper | null>(null);

  // State for rendering the lasso line
  const [lassoPoints, setLassoPoints] = useState<{ x: number; y: number }[]>([]);
  // Ref for logic to avoid re-binding event listeners on every move
  const lassoPointsRef = useRef<{ x: number; y: number }[]>([]);
  const isDragging = useRef(false);


  // Initial setup
  useEffect(() => {
    if (pcd){
      pcd.geometry.center()

      if (!pcd.geometry.attributes.color) {
        const count = pcd.geometry.attributes.position.count;
        const colors = new Float32Array(count * 3);
        const baseColor = new THREE.Color(color);
        for (let i = 0; i < count; i++) {
          colors[i * 3] = baseColor.r;
          colors[i * 3 + 1] = baseColor.g;
          colors[i * 3 + 2] = baseColor.b;
        }
        pcd.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      }
      
      // Initialize GPU Helper
      if (!gpuHelper.current) {
        gpuHelper.current = new GPUSelectionHelper(gl);
      }
      gpuHelper.current.initPoints(pcd.geometry.attributes.position as THREE.BufferAttribute);
    }
    
    // Cleanup
    return () => {
        if (gpuHelper.current) {
            gpuHelper.current.dispose();
            gpuHelper.current = null;
        }
    }
  }, [pcd, color, gl]);

  // Selection Logic
  const handlePointerDown = useCallback((e: PointerEvent) => {
    if (!enableSelection || e.button !== 0 || !e.shiftKey) return;
    e.stopPropagation();
    isDragging.current = true;
    const rect = gl.domElement.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    
    lassoPointsRef.current = [point];
    setLassoPoints([point]);
  }, [enableSelection, gl.domElement]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current) return;
    const rect = gl.domElement.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    
    lassoPointsRef.current.push(point);
    // Create a new array reference to trigger render
    setLassoPoints([...lassoPointsRef.current]);
  }, [gl.domElement]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current || !pointsRef.current || !gpuHelper.current) {
        isDragging.current = false;
        lassoPointsRef.current = [];
        setLassoPoints([]);
        return;
    }
    isDragging.current = false;

    const points = lassoPointsRef.current;

    // Minimum points for a polygon
    if (points.length < 3) {
        lassoPointsRef.current = [];
        setLassoPoints([]);
        return;
    }

    const geometry = pointsRef.current.geometry;
    const colors = geometry.attributes.color;
    const count = geometry.attributes.position.count;

    const baseThreeColor = new THREE.Color(color);
    const selThreeColor = new THREE.Color(selectedColor);
    
    const startTime = performance.now();
    console.time("GPU Selection"); // 计时开始

    // --- GPU Calculation Start ---
    const buffer = gpuHelper.current.compute(camera, points, size.width, size.height);
    // --- GPU Calculation End ---

    let selectedCount = 0;
    
    if (buffer) {
        // Readback buffer is RGBA. Red channel > 0 means selected.
        for (let i = 0; i < count; i++) {
            // Buffer size is textureSize * textureSize * 4
            // pointIndex i maps to pixel i.
            // But texture might be larger than count. Check bound.
            if (buffer[i * 4] > 128) { // Threshold 0.5 (128/255)
                colors.setXYZ(i, selThreeColor.r, selThreeColor.g, selThreeColor.b);
                selectedCount++;
            } else {
                colors.setXYZ(i, baseThreeColor.r, baseThreeColor.g, baseThreeColor.b);
            }
        }
    }
    
    console.timeEnd("GPU Selection"); // 计时结束
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.log(`Selected ${selectedCount} points from ${count} total`);

    setSelectionResult(selectedCount, count, duration);

    colors.needsUpdate = true; // 关键：通知 GPU 更新颜色
    
    lassoPointsRef.current = [];
    setLassoPoints([]); // Clear lasso

  }, [camera, size, color, selectedColor]);

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerDown, handlePointerMove, handlePointerUp, gl.domElement]);

  // Generate SVG path for lasso
  const lassoPath = useMemo(() => {
      if (lassoPoints.length === 0) return '';
      // 移除 'Z'，保持路径开放，不自动闭合
      return lassoPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [lassoPoints]);

  return (
    <>
      <points ref={pointsRef} geometry={pcd.geometry} rotation={[0, 0, 0]}>
        <pointsMaterial 
          size={0.01} 
          sizeAttenuation={true} 
          vertexColors={true} 
          transparent={true}
          opacity={0.15} 
          depthWrite={false}
          />
      </points>
      
      <Html fullscreen style={{ pointerEvents: 'none', overflow: 'hidden' }}>
        {lassoPoints.length > 0 && (
            <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                {/* 
                    根据图片要求：
                    1. 红色虚线 (stroke="#ff3333", strokeDasharray="8,8")
                    2. 无填充 (fill="none")
                    3. 视觉上不闭合，直到逻辑计算时才隐式闭合
                */}
                <path 
                    d={lassoPath} 
                    stroke="#ff3333" 
                    strokeWidth="3" 
                    strokeDasharray="8,8" 
                    fill="none" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    fillRule="evenodd"
                />
            </svg>
        )}
      </Html>
    </>
  );
}
