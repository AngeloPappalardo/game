import * as THREE from "three";

function createWaterMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uSeaLevel: { value: 1.2 },
      uDeepColor: { value: new THREE.Color(0x0a3c58) },
      uShallowColor: { value: new THREE.Color(0x2a7fa3) },
      uFoamColor: { value: new THREE.Color(0xcde8f2) },
      uSunDir: { value: new THREE.Vector3(0.5, 0.8, 0.2).normalize() },
      uOpacity: { value: 0.72 },
      uWaveAmp: { value: 0.42 },
      uWaveSpeed: { value: 0.85 },
      uWaveScale: { value: 0.085 },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uWaveAmp;
      uniform float uWaveSpeed;
      uniform float uWaveScale;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying float vCrest;

      float wave(vec2 p, vec2 dir, float freq, float phase) {
        return sin(dot(p, dir) * freq + phase);
      }

      void main() {
        vec3 p = position;
        vec2 xz = p.xz;
        float t = uTime * uWaveSpeed;

        float w1 = wave(xz, normalize(vec2(0.9, 0.4)), 1.8 * uWaveScale, t * 1.4);
        float w2 = wave(xz, normalize(vec2(-0.5, 0.86)), 2.9 * uWaveScale, t * 2.1);
        float w3 = wave(xz, normalize(vec2(0.2, -1.0)), 4.8 * uWaveScale, t * 3.2);
        float h = (w1 * 0.55 + w2 * 0.3 + w3 * 0.15) * uWaveAmp;

        p.y += h;

        float eps = 0.8;
        float hx = (
          wave(xz + vec2(eps, 0.0), normalize(vec2(0.9, 0.4)), 1.8 * uWaveScale, t * 1.4) * 0.55 +
          wave(xz + vec2(eps, 0.0), normalize(vec2(-0.5, 0.86)), 2.9 * uWaveScale, t * 2.1) * 0.3 +
          wave(xz + vec2(eps, 0.0), normalize(vec2(0.2, -1.0)), 4.8 * uWaveScale, t * 3.2) * 0.15
        ) * uWaveAmp;
        float hz = (
          wave(xz + vec2(0.0, eps), normalize(vec2(0.9, 0.4)), 1.8 * uWaveScale, t * 1.4) * 0.55 +
          wave(xz + vec2(0.0, eps), normalize(vec2(-0.5, 0.86)), 2.9 * uWaveScale, t * 2.1) * 0.3 +
          wave(xz + vec2(0.0, eps), normalize(vec2(0.2, -1.0)), 4.8 * uWaveScale, t * 3.2) * 0.15
        ) * uWaveAmp;

        vec3 dpdx = vec3(eps, hx - h, 0.0);
        vec3 dpdz = vec3(0.0, hz - h, eps);
        vec3 n = normalize(cross(dpdz, dpdx));

        vec4 worldPos = modelMatrix * vec4(p, 1.0);
        vWorldPos = worldPos.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * n);
        vCrest = smoothstep(0.2, 0.85, abs(h) / max(uWaveAmp, 0.0001));

        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uDeepColor;
      uniform vec3 uShallowColor;
      uniform vec3 uFoamColor;
      uniform vec3 uSunDir;
      uniform float uOpacity;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying float vCrest;

      void main() {
        vec3 N = normalize(vWorldNormal);
        vec3 V = normalize(cameraPosition - vWorldPos);
        vec3 L = normalize(uSunDir);
        vec3 H = normalize(V + L);

        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.2);
        float NdotL = max(dot(N, L), 0.0);
        float spec = pow(max(dot(N, H), 0.0), 84.0) * (0.25 + NdotL * 0.75);
        float diffuse = 0.45 + NdotL * 0.55;

        float depthTint = smoothstep(-4.0, 1.0, vWorldPos.y);
        vec3 base = mix(uDeepColor, uShallowColor, depthTint);
        float foamMask = smoothstep(0.58, 0.95, vCrest) * (0.55 + fresnel * 0.45);
        vec3 color = base * diffuse;
        color = mix(color, uFoamColor, foamMask);
        color += spec * vec3(0.95, 0.98, 1.0);
        color += fresnel * 0.14;

        float alpha = mix(0.34, uOpacity, clamp(depthTint * 0.7 + fresnel * 0.35, 0.0, 1.0));
        alpha += foamMask * 0.08;
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
      }
    `,
  });
}

export function createWaterSystem(scene, floor, controls) {
  const waterSize = controls.waterSize ?? 420;
  const waterSegments = controls.waterSegments ?? 220;
  const geometry = new THREE.PlaneGeometry(waterSize, waterSize, waterSegments, waterSegments);
  geometry.rotateX(-Math.PI / 2);

  const material = createWaterMaterial();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = controls.waterLevel ?? 1.2;
  mesh.receiveShadow = true;
  mesh.renderOrder = 2;
  floor.add(mesh);

  return {
    mesh,
    update(delta, sunDir) {
      material.uniforms.uTime.value += delta;
      material.uniforms.uSeaLevel.value = controls.waterLevel ?? 1.2;
      material.uniforms.uWaveAmp.value = controls.waterWaveAmplitude ?? 0.42;
      material.uniforms.uWaveSpeed.value = controls.waterWaveSpeed ?? 0.85;
      material.uniforms.uWaveScale.value = controls.waterWaveScale ?? 0.085;
      material.uniforms.uOpacity.value = controls.waterOpacity ?? 0.72;
      mesh.position.y = controls.waterLevel ?? 1.2;
      if (sunDir) {
        material.uniforms.uSunDir.value.copy(sunDir).normalize();
      }
    },
  };
}
