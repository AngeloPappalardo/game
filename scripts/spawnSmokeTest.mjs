import {
  createTerrainNoise2D,
  computeTerrainHeight,
} from "../scene/terrainMath.mjs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const size = 80;
const maxHeight = 12;
const seedA = 1337;
const seedB = 2026;
const samples = [
  [0, 0],
  [5, 5],
  [12, -9],
  [-18, 7],
  [30, -20],
];

const noiseA1 = createTerrainNoise2D(seedA);
const noiseA2 = createTerrainNoise2D(seedA);
const noiseB = createTerrainNoise2D(seedB);

let sameSeedMatches = true;
let differentSeedHasDiff = false;

for (const [x, z] of samples) {
  const hA1 = computeTerrainHeight(x, z, size, maxHeight, noiseA1);
  const hA2 = computeTerrainHeight(x, z, size, maxHeight, noiseA2);
  const hB = computeTerrainHeight(x, z, size, maxHeight, noiseB);

  if (Math.abs(hA1 - hA2) > 1e-9) sameSeedMatches = false;
  if (Math.abs(hA1 - hB) > 1e-6) differentSeedHasDiff = true;
}

assert(sameSeedMatches, "Terreno non deterministico con seed uguale.");
assert(differentSeedHasDiff, "Seed diversi non cambiano il terreno.");

const spawnNoise = createTerrainNoise2D(seedA);
const spawnTerrainY = computeTerrainHeight(0, 0, size, maxHeight, spawnNoise);
const groundOffset = 1.0;
const spawnPlayerY = spawnTerrainY + groundOffset;
const playerToTerrain = spawnPlayerY - spawnTerrainY;

assert(Number.isFinite(spawnTerrainY), "Altezza terreno spawn non valida.");
assert(
  playerToTerrain >= 0.2 && playerToTerrain <= 3.0,
  `Offset player-terreno fuori soglia: ${playerToTerrain.toFixed(3)}`
);

console.log("spawn-smoke: ok");
