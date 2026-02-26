import * as THREE from "three";

function createWaterMaterial(envMap) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,

    uniforms: {
      uTime: { value: 0 },

      uSunDir: { value: new THREE.Vector3(1, 1, 0).normalize() },
      uMoonDir: { value: new THREE.Vector3(-1, 0.6, 0).normalize() },
      uLightIntensity: { value: 1.0 },

      uEnvMap: { value: envMap },

      uDeepColor: { value: new THREE.Color(0x0a2e48) },
      uShallowColor: { value: new THREE.Color(0x2a85b8) },
      uNightColor: { value: new THREE.Color(0x0b1624) },
      uFoamColor: { value: new THREE.Color(0xe6f7ff) },

      uWaveAmp: { value: 0.5 },
      uWaveSpeed: { value: 0.8 },
      uWaveScale: { value: 0.08 },

      uOpacity: { value: 0.85 }
    },

    vertexShader: /* glsl */`

      uniform float uTime;
      uniform float uWaveAmp;
      uniform float uWaveSpeed;
      uniform float uWaveScale;

      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying float vHeight;

      vec3 gerstner(vec3 pos, vec2 dir, float steep, float wavelength, float speed) {
        float k = 2.0 * 3.14159 / wavelength;
        float f = k * dot(dir, pos.xz) - speed * uTime * uWaveSpeed;
        float a = steep / k;

        pos.x += dir.x * (a * cos(f));
        pos.z += dir.y * (a * cos(f));
        pos.y += a * sin(f);

        return pos;
      }

      void main() {

        vec3 pos = position;

        pos = gerstner(pos, normalize(vec2(1.0, 0.3)), 0.6 * uWaveAmp, 12.0 * uWaveScale, 1.0);
        pos = gerstner(pos, normalize(vec2(-0.4, 0.9)), 0.4 * uWaveAmp, 8.0 * uWaveScale, 1.4);
        pos = gerstner(pos, normalize(vec2(0.2, -1.0)), 0.3 * uWaveAmp, 5.0 * uWaveScale, 1.8);

        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vWorldPos = worldPos.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);
        vHeight = pos.y;

        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,

    fragmentShader: /* glsl */`

      uniform samplerCube uEnvMap;

      uniform vec3 uSunDir;
      uniform vec3 uMoonDir;
      uniform float uLightIntensity;

      uniform vec3 uDeepColor;
      uniform vec3 uShallowColor;
      uniform vec3 uNightColor;
      uniform vec3 uFoamColor;
      uniform float uOpacity;

      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying float vHeight;

      void main() {

        vec3 N = normalize(vNormal);
        vec3 V = normalize(cameraPosition - vWorldPos);

        // Fresnel Schlick
        float F0 = 0.02;
        float fresnel = F0 + (1.0 - F0) * pow(1.0 - max(dot(N, V), 0.0), 5.0);

        // Reflection
        vec3 R = reflect(-V, N);
        vec3 envColor = textureCube(uEnvMap, R).rgb;

        // Depth absorption
        float depth = clamp((vHeight + 2.0) * 0.25, 0.0, 1.0);

        vec3 dayColor = mix(uDeepColor, uShallowColor, depth);
        vec3 base = mix(uNightColor, dayColor, uLightIntensity);

        // Diffuse
        float sunDiffuse = max(dot(N, normalize(uSunDir)), 0.0);
        float moonDiffuse = max(dot(N, normalize(uMoonDir)), 0.0);

        float diffuse = mix(0.15 + moonDiffuse * 0.2,
                            0.4 + sunDiffuse * 0.6,
                            uLightIntensity);

        vec3 color = base * diffuse;

        // Specular cinematic
        vec3 H = normalize(V + normalize(uSunDir));
        float spec = pow(max(dot(N, H), 0.0), 128.0);
        color += spec * uLightIntensity;

        // Reflection mix
        color = mix(color, envColor, fresnel * 1.2);

        // Foam on crests
        float foam = smoothstep(0.35, 0.7, abs(vHeight));
        color = mix(color, uFoamColor, foam * uLightIntensity * 0.5);

        float alpha = mix(0.5, uOpacity, uLightIntensity);
        gl_FragColor = vec4(color, alpha);
      }
    `
  });
}

export function createWaterSystem(scene, floor, controls, envMap) {

  const waterSize = controls.waterSize ?? 420;
  const waterSegments = controls.waterSegments ?? 220;

  const geometry = new THREE.PlaneGeometry(
    waterSize,
    waterSize,
    waterSegments,
    waterSegments
  );

  geometry.rotateX(-Math.PI / 2);

  const material = createWaterMaterial(envMap); // ✅ PASSATO QUI

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = controls.waterLevel ?? 1.2;
  floor.add(mesh);

  return {
    mesh,
    update(delta, sunDir, lightIntensity = 1.0) {

      material.uniforms.uTime.value += delta;
      material.uniforms.uLightIntensity.value = lightIntensity;

      if (sunDir) {
        material.uniforms.uSunDir.value.copy(sunDir).normalize();
      }

      material.uniforms.uWaveAmp.value = controls.waterWaveAmplitude ?? 0.5;
      material.uniforms.uWaveSpeed.value = controls.waterWaveSpeed ?? 0.8;
      material.uniforms.uWaveScale.value = controls.waterWaveScale ?? 0.08;
      material.uniforms.uOpacity.value = controls.waterOpacity ?? 0.85;

      mesh.position.y = controls.waterLevel ?? 1.2;
    }
  };
}
