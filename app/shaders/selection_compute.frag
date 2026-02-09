
precision highp float;

uniform sampler2D lassoMask;

varying vec4 vScreenPos;

void main() {
    // 1. Perspective Divide to get NDC
    vec3 ndc = vScreenPos.xyz / vScreenPos.w;
    
    // 2. Map to Screen UV 0..1
    vec2 screenUV = ndc.xy * 0.5 + 0.5;
    
    // 3. Check Bounds (Clipping)
    // If point is behind camera or off-screen, it can't be selected
    if (vScreenPos.w < 0.0 || screenUV.x < 0.0 || screenUV.x > 1.0 || screenUV.y < 0.0 || screenUV.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        return;
    }
    
    // 4. Sample the Lasso Mask
    // Mask should be White (1.0) inside, Black (0.0) outside
    float maskVal = texture2D(lassoMask, screenUV).r;
    
    if (maskVal > 0.5) {
        // Selected
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    } else {
        // Not selected
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
}
