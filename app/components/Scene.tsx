import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { useThree, useLoader } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { PCDLoader } from 'three-stdlib';
import * as THREE from 'three';

interface SceneProps {
  color?: string;
  selectedColor?: string;
  enableSelection?: boolean;
}

const tempColor = new THREE.Color();
const tempVec = new THREE.Vector3();

export default function Scene({
  color = '#F6F6F6',
  selectedColor = '#86FFAF',
  enableSelection = true,
}: SceneProps) {

  const { camera, gl, size } = useThree();

  // 使用 GitHub LFS 的媒体直链 (注意：media.githubusercontent.com)
  const pcd = useLoader(PCDLoader, 'https://media.githubusercontent.com/media/TurpanWest/point-clouds-viewer/main/public/kitti_2000w.pcd')
  const pointsRef = useRef<THREE.Points>(null)
  const [selectionBox, setSelectionBox] = useState<{ start: { x: number; y: number } | null; current: { x: number; y: number } | null }>({ start: null, current: null });


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
    }
  }, [pcd, color]);

  // Selection Logic
  const handlePointerDown = useCallback((e: PointerEvent) => {
    if (!enableSelection || e.button !== 0 || !e.shiftKey) return;
    e.stopPropagation();
    const rect = gl.domElement.getBoundingClientRect();
    setSelectionBox({ 
      start: { x: e.clientX - rect.left, y: e.clientY - rect.top }, 
      current: { x: e.clientX - rect.left, y: e.clientY - rect.top } 
    });
  }, [enableSelection, gl.domElement]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!selectionBox.start) return;
    const rect = gl.domElement.getBoundingClientRect();
    setSelectionBox(prev => ({ ...prev, current: { x: e.clientX - rect.left, y: e.clientY - rect.top } }));
  }, [selectionBox.start, gl.domElement]);

  const handlePointerUp = useCallback(() => {
    if (!selectionBox.start || !selectionBox.current || !pointsRef.current) {
      setSelectionBox({ start: null, current: null });
      return;
    }

    const geometry = pointsRef.current.geometry;
    const positions = geometry.attributes.position;
    const colors = geometry.attributes.color;
    const count = positions.count;

    const startX = Math.min(selectionBox.start.x, selectionBox.current.x);
    const endX = Math.max(selectionBox.start.x, selectionBox.current.x);
    const startY = Math.min(selectionBox.start.y, selectionBox.current.y);
    const endY = Math.max(selectionBox.start.y, selectionBox.current.y);

    const baseThreeColor = new THREE.Color(color);
    const selThreeColor = new THREE.Color(selectedColor);
    const width = size.width;
    const height = size.height;

    let selectedCount = 0;
    
    console.time("Selection Calculation"); // 计时开始

    // 遍历所有点 (注意：2000万次循环在 JS 中非常慢，可能卡顿 1-3秒)
    for (let i = 0; i < count; i++) {
      tempVec.fromBufferAttribute(positions, i); // 获取点坐标
      tempVec.project(camera); // 投影到 NDC 空间

      // 转换 NDC 到屏幕坐标
      const sx = (tempVec.x * .5 + .5) * width;
      const sy = (-(tempVec.y * .5) + .5) * height;

      if (sx >= startX && sx <= endX && sy >= startY && sy <= endY) {
        colors.setXYZ(i, selThreeColor.r, selThreeColor.g, selThreeColor.b);
        selectedCount++;
      } else {
        // 可选：如果不希望重置未选中的点，可以注释掉下面这行
        colors.setXYZ(i, baseThreeColor.r, baseThreeColor.g, baseThreeColor.b);
      }
    }
    
    console.timeEnd("Selection Calculation"); // 计时结束
    console.log(`Selected ${selectedCount} points from ${count} total`);

    colors.needsUpdate = true; // 关键：通知 GPU 更新颜色
    setSelectionBox({ start: null, current: null });

  }, [selectionBox, camera, size, color, selectedColor]);

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

  // 样式保持不变
  const boxStyle: React.CSSProperties = selectionBox.start && selectionBox.current ? {
    position: 'absolute',
    left: Math.min(selectionBox.start.x, selectionBox.current.x),
    top: Math.min(selectionBox.start.y, selectionBox.current.y),
    width: Math.abs(selectionBox.current.x - selectionBox.start.x),
    height: Math.abs(selectionBox.current.y - selectionBox.start.y),
    border: '1px solid #fff',
    backgroundColor: 'rgba(0, 150, 255, 0.3)',
    pointerEvents: 'none',
    zIndex: 10
  } : { display: 'none' };

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
        <div style={boxStyle} />
      </Html>
    </>
  );
}
