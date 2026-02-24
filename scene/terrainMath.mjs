import { createNoise2D } from "simplex-noise";

function hashSeed(seed) {
  const seedText = String(seed);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedText.length; i++) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function createTerrainNoise2D(seed) {
  const random = mulberry32(hashSeed(seed));
  return createNoise2D(random);
}

export function computeTerrainHeight(x, z, size, maxHeight, noise2D) {
  const d = Math.sqrt(x * x + z * z) / (size * 0.5);
  const noise = noise2D(x * 0.05, z * 0.05);
  let h = (1 - d) * 0.8 + noise * 0.2;
  h = h < 0 ? 0 : h;
  return Math.pow(h, 1.5) * maxHeight;
}
