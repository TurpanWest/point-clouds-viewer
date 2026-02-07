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

const tempVec = new THREE.Vector3();

function isPointInPolygon(point: {x: number, y: number}, vs: {x: number, y: number}[]) {
    // ray-casting algorithm based on
    // https://github.com/substack/point-in-polygon
    var x = point.x, y = point.y;
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i].x, yi = vs[i].y;
        var xj = vs[j].x, yj = vs[j].y;
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

import { useSelectionStore } from '../stores/useSelectionStore';

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
    }
  }, [pcd, color]);

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
    if (!isDragging.current || !pointsRef.current) {
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
    const positions = geometry.attributes.position;
    const colors = geometry.attributes.color;
    const count = positions.count;

    // Calculate Bounding Box of the Lasso to optimize search
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    }

    const baseThreeColor = new THREE.Color(color);
    const selThreeColor = new THREE.Color(selectedColor);
    const width = size.width;
    const height = size.height;

    let selectedCount = 0;
    
    const startTime = performance.now();
    console.time("Selection Calculation"); // 计时开始

    // 遍历所有点
    for (let i = 0; i < count; i++) {
      tempVec.fromBufferAttribute(positions, i); // 获取点坐标
      tempVec.project(camera); // 投影到 NDC 空间

      // 转换 NDC 到屏幕坐标
      const sx = (tempVec.x * .5 + .5) * width;
      const sy = (-(tempVec.y * .5) + .5) * height;

      // Optimization: First check if point is within the bounding box of the lasso
      if (sx < minX || sx > maxX || sy < minY || sy > maxY) {
        // Outside bbox, definitely not inside. Reset color (optional)
        colors.setXYZ(i, baseThreeColor.r, baseThreeColor.g, baseThreeColor.b);
        continue;
      }

      // If inside bbox, perform detailed polygon check
      if (isPointInPolygon({x: sx, y: sy}, points)) {
        colors.setXYZ(i, selThreeColor.r, selThreeColor.g, selThreeColor.b);
        selectedCount++;
      } else {
        colors.setXYZ(i, baseThreeColor.r, baseThreeColor.g, baseThreeColor.b);
      }
    }
    
    console.timeEnd("Selection Calculation"); // 计时结束
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
                />
            </svg>
        )}
      </Html>
    </>
  );
}
