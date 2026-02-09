
attribute vec2 uvOffset; // Pre-calculated (u, v) for data texture
attribute vec3 position; // Explicitly declared for RawShaderMaterial

uniform mat4 worldViewProjection; // Combined matrix for performance

varying vec4 vScreenPos;

void main() {
    // 1. Calculate Output Position in the Data Texture (GPGPU Grid)
    // Use pre-calculated UV directly to avoid float precision issues with large indices
    
    // uvOffset is in 0..1 range. Map to -1..1 for gl_Position
    gl_Position = vec4(uvOffset * 2.0 - 1.0, 0.0, 1.0);
    gl_PointSize = 1.0;

    // 2. Calculate "Real" Screen Position for the Logic Check
    vScreenPos = worldViewProjection * vec4(position, 1.0);
}
