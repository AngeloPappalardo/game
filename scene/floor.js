import * as THREE from "three";
import { createTerrainNoise2D, computeTerrainHeight } from "./terrainMath.mjs";

export function addFloor(scene, controls) {
  const size = 80;
  const segments = 108;
  const maxHeight = 12;
  const seed = controls.terrainSeed ?? 1337;

  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const noise2D = createTerrainNoise2D(seed);

  const pos = geometry.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  let maxTerrainHeight = -Infinity;

  const color = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const height = computeTerrainHeight(x, z, size, maxHeight, noise2D);
    pos.setY(i, height);
    if (height > maxTerrainHeight) maxTerrainHeight = height;

    // Colore in base all’altezza
    const t = height / maxHeight;
    if (t < 0.3) {
      // mare
      color.setRGB(0, 0, 0.5 + t * 0.5);
    } else if (t < 0.5) {
      // spiaggia
      color.setRGB(0.8, 0.7, 0.4);
    } else if (t < 0.8) {
      // prato
      color.setRGB(0.2, 0.7, 0.2);
    } else {
      // vetta
      color.setRGB(1, 1, 1);
    }
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 1,
    metalness: 0,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.userData.maxTerrainHeight = maxTerrainHeight;
  mesh.userData.terrainSeed = seed;
  scene.add(mesh);

  controls.floorDecale = size / 4;
  return mesh;
}
