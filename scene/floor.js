import * as THREE from "three";
import {
  createTerrainNoise2D,
  computeTerrainHeight,
  computeBiomeWeights,
  getTerrainProfile,
} from "./terrainMath.mjs";

function blendBiomeColor(weights) {
  // Unified "grassy" palette so the ground reads as continuous lawn.
  const sandColor = { r: 0x72 / 255, g: 0xa2 / 255, b: 0x53 / 255 };
  const grassColor = { r: 0x5f / 255, g: 0x95 / 255, b: 0x45 / 255 };
  const rockColor = { r: 0x55 / 255, g: 0x84 / 255, b: 0x3f / 255 };
  const snowColor = { r: 0x86 / 255, g: 0xb6 / 255, b: 0x63 / 255 };

  return new THREE.Color(
    sandColor.r * weights.sand +
      grassColor.r * weights.grass +
      rockColor.r * weights.rock +
      snowColor.r * weights.snow,
    sandColor.g * weights.sand +
      grassColor.g * weights.grass +
      rockColor.g * weights.rock +
      snowColor.g * weights.snow,
    sandColor.b * weights.sand +
      grassColor.b * weights.grass +
      rockColor.b * weights.rock +
      snowColor.b * weights.snow
  );
}

function blendBiomeRoughness(weights) {
  return (
    weights.sand * 0.92 +
    weights.grass * 0.82 +
    weights.rock * 0.66 +
    weights.snow * 0.88
  );
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function saturate(value) {
  return Math.max(0, Math.min(1, value));
}

function createBiomeTextureSet(seed, palette, roughnessRange, normalStrength) {
  const resolution = 128;
  const pixelCount = resolution * resolution;
  const albedoData = new Uint8Array(pixelCount * 3);
  const roughnessData = new Uint8Array(pixelCount * 3);
  const normalData = new Uint8Array(pixelCount * 3);

  const nBase = createTerrainNoise2D(`${seed}-base`);
  const nDetail = createTerrainNoise2D(`${seed}-detail`);
  const nMicro = createTerrainNoise2D(`${seed}-micro`);

  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      const i = y * resolution + x;
      const i3 = i * 3;
      const u = x / (resolution - 1);
      const v = y / (resolution - 1);

      const hBase = nBase(u * 5.5, v * 5.5) * 0.5 + 0.5;
      const hDetail = nDetail(u * 15.5, v * 15.5) * 0.5 + 0.5;
      const hMicro = nMicro(u * 42.0, v * 42.0) * 0.5 + 0.5;

      const blend = saturate(hBase * 0.7 + hDetail * 0.22 + hMicro * 0.08);
      const shade = 0.78 + blend * 0.42;
      const tint = (hDetail - 0.5) * 0.08;
      albedoData[i3] = Math.round(
        saturate((palette.r * shade + tint) * 255)
      );
      albedoData[i3 + 1] = Math.round(
        saturate((palette.g * shade + tint * 0.55) * 255)
      );
      albedoData[i3 + 2] = Math.round(
        saturate((palette.b * shade - tint * 0.3) * 255)
      );

      const roughness =
        lerp(roughnessRange.min, roughnessRange.max, hBase * 0.65 + hMicro * 0.35);
      const roughByte = Math.round(saturate(roughness) * 255);
      roughnessData[i3] = roughByte;
      roughnessData[i3 + 1] = roughByte;
      roughnessData[i3 + 2] = roughByte;

      const eps = 1 / resolution;
      const hL = nBase((u - eps) * 5.5, v * 5.5) * 0.5 + 0.5;
      const hR = nBase((u + eps) * 5.5, v * 5.5) * 0.5 + 0.5;
      const hD = nBase(u * 5.5, (v - eps) * 5.5) * 0.5 + 0.5;
      const hU = nBase(u * 5.5, (v + eps) * 5.5) * 0.5 + 0.5;
      const dx = (hR - hL) * normalStrength;
      const dz = (hU - hD) * normalStrength;
      const nx = -dx;
      const ny = 1;
      const nz = -dz;
      const invLen = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz);
      normalData[i3] = Math.round((nx * invLen * 0.5 + 0.5) * 255);
      normalData[i3 + 1] = Math.round((ny * invLen * 0.5 + 0.5) * 255);
      normalData[i3 + 2] = Math.round((nz * invLen * 0.5 + 0.5) * 255);
    }
  }

  const albedoTex = new THREE.DataTexture(albedoData, resolution, resolution, THREE.RGBFormat);
  albedoTex.wrapS = THREE.RepeatWrapping;
  albedoTex.wrapT = THREE.RepeatWrapping;
  albedoTex.colorSpace = THREE.SRGBColorSpace;
  albedoTex.needsUpdate = true;

  const roughnessTex = new THREE.DataTexture(
    roughnessData,
    resolution,
    resolution,
    THREE.RGBFormat
  );
  roughnessTex.wrapS = THREE.RepeatWrapping;
  roughnessTex.wrapT = THREE.RepeatWrapping;
  roughnessTex.needsUpdate = true;

  const normalTex = new THREE.DataTexture(normalData, resolution, resolution, THREE.RGBFormat);
  normalTex.wrapS = THREE.RepeatWrapping;
  normalTex.wrapT = THREE.RepeatWrapping;
  normalTex.needsUpdate = true;

  return {
    albedo: albedoTex,
    roughness: roughnessTex,
    normal: normalTex,
  };
}

export function addFloor(scene, controls) {
  const size = 80;
  const segments = controls.terrainSegments ?? 220;
  const maxHeight = controls.terrainMaxHeight ?? 12;
  const seed = controls.terrainSeed ?? 1337;
  const profileName = controls.terrainProfile ?? "hills";
  const profile = getTerrainProfile(profileName);

  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const noise2D = createTerrainNoise2D(seed);
  const pos = geometry.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const roughnessValues = new Float32Array(pos.count);
  const aoValues = new Float32Array(pos.count);
  const biomeWeights = new Float32Array(pos.count * 4);
  let maxTerrainHeight = -Infinity;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const height = computeTerrainHeight(x, z, size, maxHeight, noise2D, profile);
    pos.setY(i, height);
    if (height > maxTerrainHeight) maxTerrainHeight = height;
  }

  pos.needsUpdate = true;
  geometry.computeVertexNormals();

  const normalAttr = geometry.attributes.normal;
  const gridSize = segments + 1;
  for (let i = 0; i < pos.count; i++) {
    const height = pos.getY(i);
    const ny = normalAttr.getY(i);
    const slope01 = 1 - Math.max(0, Math.min(1, ny));
    const weights = computeBiomeWeights(height, maxHeight, slope01);

    biomeWeights[i * 4] = weights.sand;
    biomeWeights[i * 4 + 1] = weights.grass;
    biomeWeights[i * 4 + 2] = weights.rock;
    biomeWeights[i * 4 + 3] = weights.snow;

    const color = blendBiomeColor(weights);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    roughnessValues[i] = blendBiomeRoughness(weights);

    const gx = i % gridSize;
    const gz = Math.floor(i / gridSize);
    const ix0 = Math.max(0, gx - 1);
    const ix1 = Math.min(segments, gx + 1);
    const iz0 = Math.max(0, gz - 1);
    const iz1 = Math.min(segments, gz + 1);
    const hC = pos.getY(i);
    const hL = pos.getY(gz * gridSize + ix0);
    const hR = pos.getY(gz * gridSize + ix1);
    const hD = pos.getY(iz0 * gridSize + gx);
    const hU = pos.getY(iz1 * gridSize + gx);
    const laplacian = hL + hR + hD + hU - hC * 4;
    const cavity = saturate((-laplacian / Math.max(0.001, maxHeight)) * 0.9);
    const ao = saturate(1 - cavity * 0.55 - slope01 * 0.22);
    aoValues[i] = Math.max(0.58, ao);
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute(
    "roughnessWeight",
    new THREE.BufferAttribute(roughnessValues, 1)
  );
  geometry.setAttribute("aoWeight", new THREE.BufferAttribute(aoValues, 1));
  geometry.setAttribute("biomeWeights", new THREE.BufferAttribute(biomeWeights, 4));

  const textureSets = {
    sand: createBiomeTextureSet(
      `${seed}-sand`,
      { r: 0.65, g: 0.59, b: 0.42 },
      { min: 0.82, max: 0.96 },
      3.2
    ),
    grass: createBiomeTextureSet(
      `${seed}-grass`,
      { r: 0.36, g: 0.52, b: 0.26 },
      { min: 0.62, max: 0.86 },
      4.0
    ),
    rock: createBiomeTextureSet(
      `${seed}-rock`,
      { r: 0.45, g: 0.45, b: 0.43 },
      { min: 0.56, max: 0.76 },
      4.8
    ),
    snow: createBiomeTextureSet(
      `${seed}-snow`,
      { r: 0.8, g: 0.85, b: 0.84 },
      { min: 0.68, max: 0.92 },
      2.2
    ),
  };

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.85,
    metalness: 0,
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSandAlbedo = { value: textureSets.sand.albedo };
    shader.uniforms.uGrassAlbedo = { value: textureSets.grass.albedo };
    shader.uniforms.uRockAlbedo = { value: textureSets.rock.albedo };
    shader.uniforms.uSnowAlbedo = { value: textureSets.snow.albedo };

    shader.uniforms.uSandRoughness = { value: textureSets.sand.roughness };
    shader.uniforms.uGrassRoughness = { value: textureSets.grass.roughness };
    shader.uniforms.uRockRoughness = { value: textureSets.rock.roughness };
    shader.uniforms.uSnowRoughness = { value: textureSets.snow.roughness };

    shader.uniforms.uSandNormal = { value: textureSets.sand.normal };
    shader.uniforms.uGrassNormal = { value: textureSets.grass.normal };
    shader.uniforms.uRockNormal = { value: textureSets.rock.normal };
    shader.uniforms.uSnowNormal = { value: textureSets.snow.normal };

    shader.uniforms.uTriplanarScale = { value: 0.2 };
    shader.uniforms.uNormalBlend = { value: 0.45 };
    shader.uniforms.uGradeLift = { value: new THREE.Vector3(0.01, 0.008, 0.0) };
    shader.uniforms.uGradeGamma = { value: new THREE.Vector3(0.96, 0.97, 0.98) };
    shader.uniforms.uGradeGain = { value: new THREE.Vector3(1.04, 1.03, 1.02) };

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        [
          "#include <common>",
          "attribute float roughnessWeight;",
          "attribute float aoWeight;",
          "attribute vec4 biomeWeights;",
          "varying float vRoughnessWeight;",
          "varying float vAoWeight;",
          "varying vec4 vBiomeWeights;",
          "varying vec3 vWorldPos;",
          "varying vec3 vWorldNormal;",
        ].join("\n")
      )
      .replace(
        "#include <begin_vertex>",
        [
          "#include <begin_vertex>",
          "vRoughnessWeight = roughnessWeight;",
          "vAoWeight = aoWeight;",
          "vBiomeWeights = biomeWeights;",
          "vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;",
          "vWorldNormal = normalize(mat3(modelMatrix) * normal);",
        ].join("\n")
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        [
          "#include <common>",
          "uniform sampler2D uSandAlbedo;",
          "uniform sampler2D uGrassAlbedo;",
          "uniform sampler2D uRockAlbedo;",
          "uniform sampler2D uSnowAlbedo;",
          "uniform sampler2D uSandRoughness;",
          "uniform sampler2D uGrassRoughness;",
          "uniform sampler2D uRockRoughness;",
          "uniform sampler2D uSnowRoughness;",
          "uniform sampler2D uSandNormal;",
          "uniform sampler2D uGrassNormal;",
          "uniform sampler2D uRockNormal;",
          "uniform sampler2D uSnowNormal;",
          "uniform float uTriplanarScale;",
          "uniform float uNormalBlend;",
          "uniform vec3 uGradeLift;",
          "uniform vec3 uGradeGamma;",
          "uniform vec3 uGradeGain;",
          "varying float vRoughnessWeight;",
          "varying float vAoWeight;",
          "varying vec4 vBiomeWeights;",
          "varying vec3 vWorldPos;",
          "varying vec3 vWorldNormal;",
          "vec3 getTriBlend(vec3 n) {",
          "  vec3 b = pow(abs(normalize(n)), vec3(4.0));",
          "  return b / max(dot(b, vec3(1.0)), 0.0001);",
          "}",
          "vec3 sampleTriColor(sampler2D tex, vec3 p, vec3 b, float s) {",
          "  vec3 x = texture2D(tex, p.yz * s).rgb;",
          "  vec3 y = texture2D(tex, p.xz * s).rgb;",
          "  vec3 z = texture2D(tex, p.xy * s).rgb;",
          "  return x * b.x + y * b.y + z * b.z;",
          "}",
          "float sampleTriScalar(sampler2D tex, vec3 p, vec3 b, float s) {",
          "  float x = texture2D(tex, p.yz * s).r;",
          "  float y = texture2D(tex, p.xz * s).r;",
          "  float z = texture2D(tex, p.xy * s).r;",
          "  return x * b.x + y * b.y + z * b.z;",
          "}",
          "vec3 sampleTriWorldNormal(sampler2D tex, vec3 p, vec3 b, float s) {",
          "  vec3 nx = texture2D(tex, p.yz * s).xyz * 2.0 - 1.0;",
          "  vec3 ny = texture2D(tex, p.xz * s).xyz * 2.0 - 1.0;",
          "  vec3 nz = texture2D(tex, p.xy * s).xyz * 2.0 - 1.0;",
          "  vec3 wx = normalize(vec3(nx.z, nx.x, nx.y));",
          "  vec3 wy = normalize(vec3(ny.x, ny.z, ny.y));",
          "  vec3 wz = normalize(vec3(nz.x, nz.y, nz.z));",
          "  return normalize(wx * b.x + wy * b.y + wz * b.z);",
          "}",
        ].join("\n")
      )
      .replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        [
          "vec3 triBlend = getTriBlend(vWorldNormal);",
          "vec3 sandColor = sampleTriColor(uSandAlbedo, vWorldPos, triBlend, uTriplanarScale);",
          "vec3 grassColor = sampleTriColor(uGrassAlbedo, vWorldPos, triBlend, uTriplanarScale);",
          "vec3 rockColor = sampleTriColor(uRockAlbedo, vWorldPos, triBlend, uTriplanarScale);",
          "vec3 snowColor = sampleTriColor(uSnowAlbedo, vWorldPos, triBlend, uTriplanarScale);",
          "vec3 blendedColor =",
          "  sandColor * vBiomeWeights.x +",
          "  grassColor * vBiomeWeights.y +",
          "  rockColor * vBiomeWeights.z +",
          "  snowColor * vBiomeWeights.w;",
          "blendedColor = clamp(blendedColor * uGradeGain + uGradeLift, 0.0, 1.0);",
          "blendedColor = pow(blendedColor, uGradeGamma);",
          "blendedColor *= mix(0.62, 1.0, vAoWeight);",
          "vec4 diffuseColor = vec4(blendedColor, opacity);",
        ].join("\n")
      )
      .replace(
        "float roughnessFactor = roughness;",
        [
          "float sandRough = sampleTriScalar(uSandRoughness, vWorldPos, triBlend, uTriplanarScale);",
          "float grassRough = sampleTriScalar(uGrassRoughness, vWorldPos, triBlend, uTriplanarScale);",
          "float rockRough = sampleTriScalar(uRockRoughness, vWorldPos, triBlend, uTriplanarScale);",
          "float snowRough = sampleTriScalar(uSnowRoughness, vWorldPos, triBlend, uTriplanarScale);",
          "float biomeRoughness =",
          "  sandRough * vBiomeWeights.x +",
          "  grassRough * vBiomeWeights.y +",
          "  rockRough * vBiomeWeights.z +",
          "  snowRough * vBiomeWeights.w;",
          "float roughnessFactor = clamp(roughness * vRoughnessWeight * biomeRoughness, 0.28, 1.0);",
        ].join("\n")
      )
      .replace(
        "#include <normal_fragment_maps>",
        [
          "#include <normal_fragment_maps>",
          "vec3 sandNormal = sampleTriWorldNormal(uSandNormal, vWorldPos, triBlend, uTriplanarScale);",
          "vec3 grassNormal = sampleTriWorldNormal(uGrassNormal, vWorldPos, triBlend, uTriplanarScale);",
          "vec3 rockNormal = sampleTriWorldNormal(uRockNormal, vWorldPos, triBlend, uTriplanarScale);",
          "vec3 snowNormal = sampleTriWorldNormal(uSnowNormal, vWorldPos, triBlend, uTriplanarScale);",
          "vec3 worldDetailNormal = normalize(",
          "  sandNormal * vBiomeWeights.x +",
          "  grassNormal * vBiomeWeights.y +",
          "  rockNormal * vBiomeWeights.z +",
          "  snowNormal * vBiomeWeights.w",
          ");",
          "vec3 detailNormalView = normalize((viewMatrix * vec4(worldDetailNormal, 0.0)).xyz);",
          "normal = normalize(mix(normal, detailNormalView, uNormalBlend));",
        ].join("\n")
      );
  };

  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.userData.maxTerrainHeight = maxTerrainHeight;
  mesh.userData.terrainSeed = seed;
  mesh.userData.terrainProfile = profileName;
  mesh.userData.terrainMaxHeight = maxHeight;
  mesh.userData.terrainSize = size;
  mesh.userData.terrainSegments = segments;
  mesh.userData.sampleTerrainLocal = (x, z) => {
    const gridSize = segments + 1;
    const u = ((x / size) + 0.5) * segments;
    const v = ((z / size) + 0.5) * segments;
    const iu0 = Math.max(0, Math.min(segments, Math.floor(u)));
    const iv0 = Math.max(0, Math.min(segments, Math.floor(v)));
    const iu1 = Math.max(0, Math.min(segments, iu0 + 1));
    const iv1 = Math.max(0, Math.min(segments, iv0 + 1));
    const fu = Math.max(0, Math.min(1, u - iu0));
    const fv = Math.max(0, Math.min(1, v - iv0));

    const idx00 = iv0 * gridSize + iu0;
    const idx10 = iv0 * gridSize + iu1;
    const idx01 = iv1 * gridSize + iu0;
    const idx11 = iv1 * gridSize + iu1;

    const h00 = pos.getY(idx00);
    const h10 = pos.getY(idx10);
    const h01 = pos.getY(idx01);
    const h11 = pos.getY(idx11);
    const h0 = lerp(h00, h10, fu);
    const h1 = lerp(h01, h11, fu);
    const height = lerp(h0, h1, fv);

    const nx00 = normalAttr.getX(idx00);
    const ny00 = normalAttr.getY(idx00);
    const nz00 = normalAttr.getZ(idx00);
    const nx10 = normalAttr.getX(idx10);
    const ny10 = normalAttr.getY(idx10);
    const nz10 = normalAttr.getZ(idx10);
    const nx01 = normalAttr.getX(idx01);
    const ny01 = normalAttr.getY(idx01);
    const nz01 = normalAttr.getZ(idx01);
    const nx11 = normalAttr.getX(idx11);
    const ny11 = normalAttr.getY(idx11);
    const nz11 = normalAttr.getZ(idx11);

    const nx0 = lerp(nx00, nx10, fu);
    const ny0 = lerp(ny00, ny10, fu);
    const nz0 = lerp(nz00, nz10, fu);
    const nx1 = lerp(nx01, nx11, fu);
    const ny1 = lerp(ny01, ny11, fu);
    const nz1 = lerp(nz01, nz11, fu);
    const normal = new THREE.Vector3(
      lerp(nx0, nx1, fv),
      lerp(ny0, ny1, fv),
      lerp(nz0, nz1, fv)
    ).normalize();

    return { height, normal };
  };
  mesh.userData.sampleTerrainWorld = (x, z) => {
    const lx = x - mesh.position.x;
    const lz = z - mesh.position.z;
    const sample = mesh.userData.sampleTerrainLocal(lx, lz);
    return {
      height: sample.height + mesh.position.y,
      normal: sample.normal,
    };
  };
  scene.add(mesh);

  controls.floorDecale = size / 4;
  return mesh;
}
