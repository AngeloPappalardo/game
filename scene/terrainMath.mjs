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

function saturate(value) {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0, edge1, x) {
  const t = saturate((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function fbm2D(x, z, noise2D, settings) {
  let frequency = settings.baseFrequency;
  let amplitude = 1;
  let total = 0;
  let amplitudeSum = 0;

  for (let i = 0; i < settings.octaves; i++) {
    total += noise2D(x * frequency, z * frequency) * amplitude;
    amplitudeSum += amplitude;
    frequency *= settings.lacunarity;
    amplitude *= settings.persistence;
  }

  if (amplitudeSum === 0) return 0;
  return total / amplitudeSum;
}

export const terrainProfiles = {
  plains: {
    baseFrequency: 0.02,
    octaves: 4,
    lacunarity: 2.0,
    persistence: 0.5,
    macroStrength: 0.6,
    microStrength: 0.4,
    erosionStrength: 0.12,
  },
  hills: {
    baseFrequency: 0.026,
    octaves: 5,
    lacunarity: 2.05,
    persistence: 0.5,
    macroStrength: 0.75,
    microStrength: 0.45,
    erosionStrength: 0.16,
  },
  alpine: {
    baseFrequency: 0.032,
    octaves: 6,
    lacunarity: 2.1,
    persistence: 0.48,
    macroStrength: 0.9,
    microStrength: 0.55,
    erosionStrength: 0.22,
  },
  islands: {
    baseFrequency: 0.024,
    octaves: 5,
    lacunarity: 2.0,
    persistence: 0.52,
    macroStrength: 0.7,
    microStrength: 0.4,
    erosionStrength: 0.18,
  },
};

export function getTerrainProfile(profileName = "hills") {
  return terrainProfiles[profileName] ?? terrainProfiles.hills;
}

export function computeTerrainHeight(x, z, size, maxHeight, noise2D, profile) {
  const settings = profile ?? terrainProfiles.hills;
  const d = Math.sqrt(x * x + z * z) / (size * 0.5);

  const macro = fbm2D(x, z, noise2D, settings);
  const micro = fbm2D(x + 100, z - 100, noise2D, {
    ...settings,
    baseFrequency: settings.baseFrequency * 4,
    octaves: Math.max(2, settings.octaves - 2),
    persistence: 0.45,
  });

  const baseIsland = 1 - d;
  const erosion = Math.abs(fbm2D(x + 300, z + 200, noise2D, settings));
  let h =
    baseIsland * settings.macroStrength +
    macro * settings.microStrength * 0.5 +
    micro * settings.microStrength * 0.2 -
    erosion * settings.erosionStrength;

  h = h < 0 ? 0 : h;
  h = Math.pow(h, 1.45);
  return h * maxHeight;
}

export function computeBiomeWeights(height, maxHeight, slope01) {
  const h = maxHeight > 0 ? height / maxHeight : 0;

  const sand = 1 - smoothstep(0.2, 0.36, h);
  const snow = smoothstep(0.72, 0.92, h) * (1 - smoothstep(0.55, 0.85, slope01));
  const rock = smoothstep(0.45, 0.95, slope01) * (1 - snow * 0.6);
  const grass = Math.max(0, 1 - sand - snow * 0.7 - rock * 0.9);

  const sum = sand + grass + rock + snow;
  if (sum <= 0) {
    return { sand: 0, grass: 1, rock: 0, snow: 0 };
  }

  return {
    sand: sand / sum,
    grass: grass / sum,
    rock: rock / sum,
    snow: snow / sum,
  };
}

export function getTerrainPreset(controls) {
  return {
    terrainSeed: controls.terrainSeed,
    terrainProfile: controls.terrainProfile,
    maxHeight: controls.terrainMaxHeight,
  };
}

export function applyTerrainPreset(controls, preset) {
  if (!preset) return;
  if (preset.terrainSeed !== undefined) controls.terrainSeed = preset.terrainSeed;
  if (preset.terrainProfile) controls.terrainProfile = preset.terrainProfile;
  if (preset.maxHeight !== undefined) controls.terrainMaxHeight = preset.maxHeight;
}
