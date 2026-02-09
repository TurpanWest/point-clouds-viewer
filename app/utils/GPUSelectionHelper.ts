
import * as THREE from 'three';
// @ts-ignore
import computeVert from '../shaders/selection_compute.vert';
// @ts-ignore
import computeFrag from '../shaders/selection_compute.frag';

export class GPUSelectionHelper {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  
  // FBOs
  private lassoMaskTarget: THREE.WebGLRenderTarget;
  private computeTarget: THREE.WebGLRenderTarget;
  
  // Compute Resources
  private computeMaterial: THREE.RawShaderMaterial;
  private computeMesh: THREE.Points;
  private computeGeometry: THREE.BufferGeometry;
  
  // Lasso Resources
  private lassoScene: THREE.Scene;
  private lassoMesh: THREE.Mesh;
  private lassoGeometry: THREE.BufferGeometry;
  private lassoMaterial: THREE.MeshBasicMaterial;

  private textureSize: number = 1024; // Default to 1M points support (1024x1024)
  private initialized: boolean = false;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); // Fullscreen quad logic

    // Initialize Targets
    this.lassoMaskTarget = new THREE.WebGLRenderTarget(1, 1); // Will resize
    this.computeTarget = new THREE.WebGLRenderTarget(this.textureSize, this.textureSize, {
      type: THREE.UnsignedByteType,
      format: THREE.RGBAFormat,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
    });

    // Initialize Lasso Mesh (Reusable)
    this.lassoScene = new THREE.Scene();
    this.lassoGeometry = new THREE.BufferGeometry();
    this.lassoMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    this.lassoMesh = new THREE.Mesh(this.lassoGeometry, this.lassoMaterial);
    this.lassoScene.add(this.lassoMesh);

    // Initialize Compute Material
    this.computeMaterial = new THREE.RawShaderMaterial({
      vertexShader: computeVert,
      fragmentShader: computeFrag,
      uniforms: {
        lassoMask: { value: null },
        worldViewProjection: { value: new THREE.Matrix4() },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.computeGeometry = new THREE.BufferGeometry();
    this.computeMesh = new THREE.Points(this.computeGeometry, this.computeMaterial);
    this.computeMesh.frustumCulled = false; // Important!
    this.scene.add(this.computeMesh);
  }

  public initPoints(positionAttribute: THREE.BufferAttribute) {
    const count = positionAttribute.count;
    
    // Resize compute target if needed
    const size = Math.ceil(Math.sqrt(count));
    let texSize = 1024;
    while (texSize < size) texSize *= 2;
    
    if (texSize !== this.textureSize) {
      this.textureSize = texSize;
      this.computeTarget.setSize(this.textureSize, this.textureSize);
      // We don't need textureWidth uniform anymore
    }

    // Generate UV offsets attribute instead of pointIndex
    const uvOffsets = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
        const col = i % texSize;
        const row = Math.floor(i / texSize);
        // Calculate center of pixel
        uvOffsets[i * 2] = (col + 0.5) / texSize;
        uvOffsets[i * 2 + 1] = (row + 0.5) / texSize;
    }
    
    this.computeGeometry.setAttribute('position', positionAttribute);
    this.computeGeometry.setAttribute('uvOffset', new THREE.BufferAttribute(uvOffsets, 2));
    this.initialized = true;
  }

  public compute(
    camera: THREE.Camera,
    lassoPoints: { x: number; y: number }[],
    screenWidth: number,
    screenHeight: number
  ): Uint8Array | null {
    if (!this.initialized || lassoPoints.length < 3) return null;

    // 1. Render Lasso Mask
    this.lassoMaskTarget.setSize(screenWidth, screenHeight);
    this.updateLassoGeometry(lassoPoints, screenWidth, screenHeight);
    
    this.renderer.setRenderTarget(this.lassoMaskTarget);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.clear();
    this.renderer.render(this.lassoScene, this.camera);

    // 2. Compute Selection
    // Update Uniforms
    const m = new THREE.Matrix4();
    m.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    // Assuming object is at identity, otherwise multiply model matrix
    
    this.computeMaterial.uniforms.lassoMask.value = this.lassoMaskTarget.texture;
    this.computeMaterial.uniforms.worldViewProjection.value = m;

    this.renderer.setRenderTarget(this.computeTarget);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    
    this.renderer.setRenderTarget(null);

    // 3. Readback
    const buffer = new Uint8Array(this.textureSize * this.textureSize * 4);
    this.renderer.readRenderTargetPixels(
      this.computeTarget,
      0, 0,
      this.textureSize, this.textureSize,
      buffer
    );

    return buffer;
  }

  private updateLassoGeometry(points: { x: number; y: number }[], w: number, h: number) {
    // Convert screen points (px) to NDC (-1..1)
    
    // Triangulate? No, Lasso is usually a non-convex polygon.
    // Three.js ShapeUtils or ShapeGeometry can handle triangulation.
    
    const shape = new THREE.Shape();
    
    // Map screen (0..w, 0..h) to (-1..1, 1..-1)
    const toX = (x: number) => (x / w) * 2 - 1;
    const toY = (y: number) => -(y / h) * 2 + 1;

    shape.moveTo(toX(points[0].x), toY(points[0].y));
    for (let i = 1; i < points.length; i++) {
        shape.lineTo(toX(points[i].x), toY(points[i].y));
    }
    shape.closePath();

    const geometry = new THREE.ShapeGeometry(shape);
    // Copy positions to our reusable geometry
    this.lassoMesh.geometry.dispose();
    this.lassoMesh.geometry = geometry;
  }
  
  public dispose() {
    this.lassoMaskTarget.dispose();
    this.computeTarget.dispose();
    this.computeGeometry.dispose();
    this.lassoGeometry.dispose();
    // materials...
  }
}
