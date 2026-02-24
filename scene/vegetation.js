import * as THREE from "three";

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

function applyGrassWind(material, uniforms) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWindTime = uniforms.uWindTime;
    shader.uniforms.uWindStrength = uniforms.uWindStrength;
    shader.uniforms.uPlayerPos = uniforms.uPlayerPos;
    shader.uniforms.uStompRadius = uniforms.uStompRadius;
    shader.uniforms.uStompStrength = uniforms.uStompStrength;
    shader.uniforms.uPushStrength = uniforms.uPushStrength;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        [
          "#include <common>",
          "uniform float uWindTime;",
          "uniform float uWindStrength;",
          "uniform vec3 uPlayerPos;",
          "uniform float uStompRadius;",
          "uniform float uStompStrength;",
          "uniform float uPushStrength;",
        ].join("\n")
      )
      .replace(
        "#include <begin_vertex>",
        [
          "#include <begin_vertex>",
          "vec3 instanceWorld = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);",
          "vec2 toPlayerXZ = instanceWorld.xz - uPlayerPos.xz;",
          "float distToPlayer = length(toPlayerXZ);",
          "float stompInfluence = 1.0 - smoothstep(0.0, uStompRadius, distToPlayer);",
          "vec2 pushDir = distToPlayer > 0.0001 ? normalize(toPlayerXZ) : vec2(0.0, 0.0);",
          "float windPhase = (instanceMatrix[3].x + instanceMatrix[3].z) * 0.35;",
          "float bend = sin(windPhase + uWindTime * 2.2) * uWindStrength;",
          "float tipMask = smoothstep(0.25, 1.0, uv.y);",
          "transformed.x += bend * tipMask * 0.18 + pushDir.x * stompInfluence * tipMask * uPushStrength;",
          "transformed.z += bend * tipMask * 0.08 + pushDir.y * stompInfluence * tipMask * uPushStrength;",
          "transformed.y *= (1.0 - stompInfluence * uStompStrength * tipMask);",
        ].join("\n")
      );
    material.userData.shader = shader;
  };
}

function createTaperedBladeGeometry(bladeWidth, bladeHeight) {
  const w = bladeWidth;
  const h = bladeHeight;

  // Blade shape: wide base -> narrow mid -> almost pointed tip.
  const positions = new Float32Array([
    -w * 0.5, 0, 0, // 0
    w * 0.5, 0, 0, // 1
    -w * 0.16, h * 0.78, 0, // 2
    w * 0.16, h * 0.78, 0, // 3
    0, h, 0, // 4 tip
  ]);

  const uvs = new Float32Array([
    0, 0,
    1, 0,
    0.28, 0.8,
    0.72, 0.8,
    0.5, 1,
  ]);

  const indices = [0, 1, 3, 0, 3, 2, 2, 3, 4];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addGrassInstances({
  floor,
  random,
  ringMin,
  ringMax,
  density,
  grassMinWeight,
  grassMaxSlope,
  copiesPerPoint,
  jitterRadius,
  bladeWidth,
  bladeHeight,
  minScaleY,
  maxScaleY,
  minScaleXZ,
  maxScaleXZ,
  colorA,
  colorB,
  uniforms,
}) {
  const geometry = createTaperedBladeGeometry(bladeWidth, bladeHeight);

  const material = new THREE.MeshStandardMaterial({
    color: 0x77aa55,
    roughness: 0.92,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  applyGrassWind(material, uniforms);

  const pos = floor.geometry.attributes.position;
  const normal = floor.geometry.attributes.normal;
  const biome = floor.geometry.attributes.biomeWeights;
  const sizeHalf = 40;

  const candidates = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const dist = Math.sqrt(x * x + z * z);
    if (dist < ringMin || dist > ringMax) continue;
    if (Math.abs(x) > sizeHalf || Math.abs(z) > sizeHalf) continue;

    const ny = normal.getY(i);
    const slope01 = 1 - Math.max(0, Math.min(1, ny));
    const grassWeight = biome.getY(i);
    if (grassWeight < (grassMinWeight ?? 0.02) || slope01 > (grassMaxSlope ?? 0.75)) {
      continue;
    }

    if (density < 0.999 && random() > density) continue;
    candidates.push({ x, y, z, grassWeight, ny });
  }

  const count = candidates.length * Math.max(1, copiesPerPoint ?? 1);
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.name = `grass-${ringMin}-${ringMax}`;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  mesh.frustumCulled = true;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.instanceColor = new THREE.InstancedBufferAttribute(
    new Float32Array(count * 3),
    3
  );
  mesh.userData.noCollision = true;

  const m = new THREE.Matrix4();
  const p = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const c = new THREE.Color();
  const up = new THREE.Vector3(0, 1, 0);
  let index = 0;
  for (let i = 0; i < candidates.length; i++) {
    const v = candidates[i];
    for (let j = 0; j < (copiesPerPoint ?? 1); j++) {
      const angle = random() * Math.PI * 2;
      const r = random() * (jitterRadius ?? 0);
      const offsetX = Math.cos(angle) * r;
      const offsetZ = Math.sin(angle) * r;
      const offsetY =
        v.ny > 0.001 ? ((-offsetX * normal.getX(i) - offsetZ * normal.getZ(i)) / v.ny) : 0;
      p.set(v.x + offsetX, v.y + offsetY, v.z + offsetZ);
      q.setFromAxisAngle(up, random() * Math.PI * 2);
      const scaleY = minScaleY + random() * (maxScaleY - minScaleY);
      const scaleXZ = minScaleXZ + random() * (maxScaleXZ - minScaleXZ);
      s.set(scaleXZ, scaleY, scaleXZ);
      m.compose(p, q, s);
      mesh.setMatrixAt(index, m);

      c.copy(colorA).lerp(colorB, random() * 0.25);
      mesh.setColorAt(index, c);
      index++;
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  floor.add(mesh);
  return mesh;
}

function addPropInstances({ floor, random, type, density }) {
  const pos = floor.geometry.attributes.position;
  const normal = floor.geometry.attributes.normal;
  const biome = floor.geometry.attributes.biomeWeights;
  const candidates = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const ny = normal.getY(i);
    const slope01 = 1 - Math.max(0, Math.min(1, ny));
    const grassWeight = biome.getY(i);
    const rockWeight = biome.getZ(i);

    if (type === "bush") {
      if (grassWeight < 0.5 || slope01 > 0.35 || random() > density * 0.35) {
        continue;
      }
    } else if (type === "tree") {
      if (grassWeight < 0.58 || slope01 > 0.28 || random() > density * 0.22) {
        continue;
      }
    } else {
      if (
        (rockWeight + grassWeight * 0.35) < 0.4 ||
        slope01 > 0.55 ||
        random() > density * 0.4
      ) {
        continue;
      }
    }
    candidates.push({ x, y, z });
  }

  if (type === "bush") {
    const geometry = new THREE.IcosahedronGeometry(0.35, 0);
    const material = new THREE.MeshStandardMaterial({
      color: 0x3e6f2f,
      roughness: 0.95,
      metalness: 0,
    });
    const mesh = new THREE.InstancedMesh(geometry, material, candidates.length);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.noCollision = true;
    mesh.name = type;

    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    for (let i = 0; i < candidates.length; i++) {
      const v = candidates[i];
      p.set(v.x, v.y, v.z);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), random() * Math.PI * 2);
      const scaleRnd = 1.0 * (0.7 + random() * 0.9);
      s.setScalar(scaleRnd);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    floor.add(mesh);
    return [mesh];
  }

  if (type === "tree") {
    const count = candidates.length;
    const trunkGeometry = new THREE.CylinderGeometry(0.08, 0.12, 1, 6);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x64492f,
      roughness: 0.95,
      metalness: 0,
    });
    const trunkMesh = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, count);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    trunkMesh.userData.noCollision = true;
    trunkMesh.name = "tree-trunks";

    const crownGeometry = new THREE.ConeGeometry(0.55, 1.15, 7, 1);
    const crownMaterial = new THREE.MeshStandardMaterial({
      color: 0x3c6f31,
      roughness: 0.86,
      metalness: 0,
      vertexColors: true,
    });
    const crownMesh = new THREE.InstancedMesh(crownGeometry, crownMaterial, count);
    crownMesh.castShadow = true;
    crownMesh.receiveShadow = true;
    crownMesh.userData.noCollision = true;
    crownMesh.name = "tree-crowns";
    crownMesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(count * 3),
      3
    );

    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const c = new THREE.Color();
    const treePalette = [
      new THREE.Color(0x3f7332),
      new THREE.Color(0x4b7d39),
      new THREE.Color(0x2f6027),
      new THREE.Color(0x5b8842),
    ];

    for (let i = 0; i < count; i++) {
      const v = candidates[i];
      const yaw = random() * Math.PI * 2;
      const trunkHeight = 1.2 + random() * 1.7;
      const trunkWidth = 0.85 + random() * 0.6;
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);

      p.set(v.x, v.y + trunkHeight * 0.5, v.z);
      s.set(trunkWidth, trunkHeight, trunkWidth);
      m.compose(p, q, s);
      trunkMesh.setMatrixAt(i, m);

      const crownHeight = trunkHeight * (1.15 + random() * 0.35);
      const crownWidth = trunkHeight * (0.35 + random() * 0.22);
      p.set(v.x, v.y + trunkHeight + crownHeight * 0.35, v.z);
      s.set(crownWidth, crownHeight, crownWidth);
      m.compose(p, q, s);
      crownMesh.setMatrixAt(i, m);

      c.copy(treePalette[Math.floor(random() * treePalette.length)]);
      c.offsetHSL((random() - 0.5) * 0.03, (random() - 0.5) * 0.12, (random() - 0.5) * 0.08);
      crownMesh.setColorAt(i, c);
    }
    trunkMesh.instanceMatrix.needsUpdate = true;
    crownMesh.instanceMatrix.needsUpdate = true;
    if (crownMesh.instanceColor) crownMesh.instanceColor.needsUpdate = true;
    floor.add(trunkMesh);
    floor.add(crownMesh);
    return [trunkMesh, crownMesh];
  }

  // Pebbles/rocks: multiple irregular shapes + random natural stone tint.
  const shapes = [
    new THREE.IcosahedronGeometry(0.16, 0),
    new THREE.DodecahedronGeometry(0.17, 0),
    new THREE.SphereGeometry(0.145, 6, 5),
  ];
  const buckets = [[], [], []];
  for (const c of candidates) {
    buckets[Math.floor(random() * buckets.length)].push(c);
  }

  const rockPalette = [
    new THREE.Color(0x7e7f83),
    new THREE.Color(0x6d7076),
    new THREE.Color(0x8b857a),
    new THREE.Color(0x5f605f),
    new THREE.Color(0x908879),
  ];

  const meshes = [];
  for (let b = 0; b < buckets.length; b++) {
    const bucket = buckets[b];
    if (!bucket.length) continue;

    const material = new THREE.MeshStandardMaterial({
      color: 0x777777,
      roughness: 0.84,
      metalness: 0.02,
      vertexColors: true,
    });
    const mesh = new THREE.InstancedMesh(shapes[b], material, bucket.length);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.noCollision = true;
    mesh.name = `${type}-${b}`;

    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const c = new THREE.Color();
    for (let i = 0; i < bucket.length; i++) {
      const v = bucket[i];
      p.set(v.x, v.y, v.z);
      q.setFromEuler(
        new THREE.Euler(
          random() * Math.PI * 2,
          random() * Math.PI * 2,
          random() * Math.PI * 2
        )
      );
      // Non-uniform scale makes each rock less geometric.
      const base = 0.75 + random() * 1.05;
      s.set(
        base * (0.75 + random() * 0.45),
        base * (0.6 + random() * 0.7),
        base * (0.75 + random() * 0.45)
      );
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);

      c.copy(rockPalette[Math.floor(random() * rockPalette.length)]);
      c.offsetHSL((random() - 0.5) * 0.04, (random() - 0.5) * 0.08, (random() - 0.5) * 0.12);
      mesh.setColorAt(i, c);
    }
    mesh.instanceMatrix.needsUpdate = true;
    floor.add(mesh);
    meshes.push(mesh);
  }

  return meshes;
}

function createRockPhysicsSystem(pebbleMeshes, floor, controls, random) {
  const sampleTerrainLocal = floor?.userData?.sampleTerrainLocal;
  if (!sampleTerrainLocal || !pebbleMeshes?.length) {
    return { bodies: [], update() {} };
  }

  const maxDynamicRocks = controls.maxDynamicRocks ?? 220;
  const picked = [];
  for (const mesh of pebbleMeshes) {
    for (let i = 0; i < mesh.count; i++) {
      picked.push({ mesh, index: i });
    }
  }

  if (picked.length > maxDynamicRocks) {
    for (let i = picked.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      const tmp = picked[i];
      picked[i] = picked[j];
      picked[j] = tmp;
    }
    picked.length = maxDynamicRocks;
  }

  const m = new THREE.Matrix4();
  const pos = new THREE.Vector3();
  const rot = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const bodies = [];
  for (const p of picked) {
    p.mesh.getMatrixAt(p.index, m);
    m.decompose(pos, rot, scale);
    const radius = 0.11 * Math.max(scale.x, scale.y, scale.z);
    bodies.push({
      mesh: p.mesh,
      index: p.index,
      pos: pos.clone(),
      rot: rot.clone(),
      scale: scale.clone(),
      vel: new THREE.Vector3(),
      radius,
    });
  }

  const gravity = new THREE.Vector3(0, -1, 0);
  const playerLocal = new THREE.Vector3();
  const downhill = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const axis = new THREE.Vector3();
  const qStep = new THREE.Quaternion();
  const relVel = new THREE.Vector3();
  const scratch = new THREE.Vector3();

  function collideBodies(a, b, restitution) {
    dir.copy(b.pos).sub(a.pos);
    const dist = dir.length();
    const minDist = a.radius + b.radius;
    if (dist <= 1e-5 || dist >= minDist) return;

    dir.multiplyScalar(1 / dist);
    const penetration = minDist - dist;
    a.pos.addScaledVector(dir, -penetration * 0.5);
    b.pos.addScaledVector(dir, penetration * 0.5);

    relVel.copy(b.vel).sub(a.vel);
    const along = relVel.dot(dir);
    if (along < 0) {
      const impulse = (-(1 + restitution) * along) * 0.5;
      a.vel.addScaledVector(dir, -impulse);
      b.vel.addScaledVector(dir, impulse);
    }
  }

  return {
    bodies,
    update(delta, playerWorldPos) {
      const damping = controls.rockDamping ?? 2.2;
      const slopeAccel = controls.rockSlopeAccel ?? 4.0;
      const pushStrength = controls.rockPlayerPush ?? 8.5;
      const playerRadius = controls.rockPlayerRadius ?? 0.75;
      const restitution = controls.rockRestitution ?? 0.22;
      const collisionIterations = controls.rockCollisionIterations ?? 2;
      const maxSpeed = controls.rockMaxSpeed ?? 3.6;
      const groundStick = controls.rockGroundStick ?? 0.58;

      if (playerWorldPos) playerLocal.copy(playerWorldPos).sub(floor.position);

      for (const body of bodies) {
        const sample = sampleTerrainLocal(body.pos.x, body.pos.z);
        downhill.copy(gravity).projectOnPlane(sample.normal);
        if (downhill.lengthSq() > 1e-6) {
          downhill.normalize();
          body.vel.addScaledVector(downhill, slopeAccel * delta);
        }

        if (playerWorldPos) {
          dir.copy(body.pos).sub(playerLocal);
          const d = dir.length();
          const influenceRadius = playerRadius + body.radius + 0.7;
          if (d > 1e-5 && d < influenceRadius) {
            const influence = 1 - d / influenceRadius;
            dir.multiplyScalar(1 / d);
            body.vel.addScaledVector(dir, pushStrength * influence * delta);
          }
        }

        body.vel.multiplyScalar(Math.max(0, 1 - damping * delta));
        if (body.vel.lengthSq() > maxSpeed * maxSpeed) {
          body.vel.setLength(maxSpeed);
        }
        body.pos.addScaledVector(body.vel, delta);

        const sampleAfter = sampleTerrainLocal(body.pos.x, body.pos.z);
        const minY = sampleAfter.height + body.radius * groundStick;
        if (body.pos.y < minY) {
          body.pos.y = minY;
          if (body.vel.y < 0) body.vel.y = 0;
        }

        // simple rolling cue from horizontal velocity
        scratch.copy(body.vel);
        scratch.y = 0;
        const speed = scratch.length();
        if (speed > 0.03) {
          axis.set(scratch.z, 0, -scratch.x).normalize();
          qStep.setFromAxisAngle(axis, speed * delta * 1.8);
          body.rot.premultiply(qStep);
        }
      }

      for (let it = 0; it < collisionIterations; it++) {
        for (let i = 0; i < bodies.length; i++) {
          for (let j = i + 1; j < bodies.length; j++) {
            collideBodies(bodies[i], bodies[j], restitution);
          }
        }
      }

      const touchedMeshes = new Set();
      for (const body of bodies) {
        m.compose(body.pos, body.rot, body.scale);
        body.mesh.setMatrixAt(body.index, m);
        touchedMeshes.add(body.mesh);
      }
      for (const mesh of touchedMeshes) {
        mesh.instanceMatrix.needsUpdate = true;
      }
    },
  };
}

export function createVegetationSystem(scene, floor, controls) {
  if (!floor?.geometry?.attributes?.biomeWeights) return null;

  const random = mulberry32(hashSeed(`${controls.terrainSeed}-vegetation`));
  const uniforms = {
    uWindTime: { value: 0 },
    uWindStrength: { value: controls.grassWindStrength ?? 0.22 },
    uPlayerPos: { value: new THREE.Vector3() },
    uStompRadius: { value: controls.grassStompRadius ?? 1.25 },
    uStompStrength: { value: controls.grassStompStrength ?? 0.82 },
    uPushStrength: { value: controls.grassPushStrength ?? 0.22 },
  };

  const nearGrass = addGrassInstances({
    floor,
    random,
    ringMin: 0,
    ringMax: controls.grassDistanceNear ?? 14,
    density: controls.grassDensityNear ?? 0.985,
    grassMinWeight: controls.grassMinWeight ?? 0.02,
    grassMaxSlope: controls.grassMaxSlope ?? 0.75,
    copiesPerPoint: controls.grassCopiesNear ?? 3,
    jitterRadius: controls.grassJitterNear ?? 0.055,
    bladeWidth: controls.grassBladeWidthNear ?? 0.028,
    bladeHeight: controls.grassBladeHeightNear ?? 0.34,
    minScaleY: controls.grassHeightMinNear ?? 0.92,
    maxScaleY: controls.grassHeightMaxNear ?? 1.05,
    minScaleXZ: controls.grassWidthMinNear ?? 0.95,
    maxScaleXZ: controls.grassWidthMaxNear ?? 1.03,
    colorA: new THREE.Color(0x5d8f41),
    colorB: new THREE.Color(0x86ba58),
    uniforms,
  });

  const farGrass = addGrassInstances({
    floor,
    random,
    ringMin: controls.grassDistanceNear ?? 14,
    ringMax: controls.grassDistanceFar ?? 28,
    density: controls.grassDensityFar ?? 0.74,
    grassMinWeight: controls.grassMinWeight ?? 0.02,
    grassMaxSlope: controls.grassMaxSlope ?? 0.75,
    copiesPerPoint: controls.grassCopiesFar ?? 2,
    jitterRadius: controls.grassJitterFar ?? 0.045,
    bladeWidth: controls.grassBladeWidthFar ?? 0.022,
    bladeHeight: controls.grassBladeHeightFar ?? 0.28,
    minScaleY: controls.grassHeightMinFar ?? 0.9,
    maxScaleY: controls.grassHeightMaxFar ?? 1.03,
    minScaleXZ: controls.grassWidthMinFar ?? 0.94,
    maxScaleXZ: controls.grassWidthMaxFar ?? 1.02,
    colorA: new THREE.Color(0x507b38),
    colorB: new THREE.Color(0x7ca850),
    uniforms,
  });

  const bushes = addPropInstances({
    floor,
    random,
    type: "bush",
    density: controls.bushDensity ?? 0.08,
  });
  const trees = addPropInstances({
    floor,
    random,
    type: "tree",
    density: controls.treeDensity ?? 0.05,
  });

  const pebbles = addPropInstances({
    floor,
    random,
    type: "pebble",
    density: controls.pebbleDensity ?? 0.12,
  });
  const rockPhysics = createRockPhysicsSystem(pebbles, floor, controls, random);

  const group = new THREE.Group();
  group.name = "vegetation-root";
  scene.add(group);
  group.visible = false; // floor already owns instances

  const setMeshesVisible = (meshes, visible) => {
    for (const mesh of meshes) mesh.visible = visible;
  };

  return {
    nearGrass,
    farGrass,
    bushes,
    pebbles,
    rockPhysics,
    setEnabled(enabled) {
      nearGrass.visible = enabled;
      farGrass.visible = enabled;
      setMeshesVisible(bushes, enabled);
      setMeshesVisible(trees, enabled);
      setMeshesVisible(pebbles, enabled);
    },
    update(delta, camera, playerPosition) {
      uniforms.uWindTime.value += delta;
      uniforms.uWindStrength.value = controls.grassWindStrength ?? 0.22;
      uniforms.uStompRadius.value = controls.grassStompRadius ?? 1.25;
      uniforms.uStompStrength.value = controls.grassStompStrength ?? 0.82;
      uniforms.uPushStrength.value = controls.grassPushStrength ?? 0.22;
      if (playerPosition) uniforms.uPlayerPos.value.copy(playerPosition);
      const maxDistance = controls.grassDistanceFar ?? 28;
      const dist = camera ? camera.position.distanceTo(floor.position) : 0;
      farGrass.visible = (controls.grassEnabled ?? true) && dist < maxDistance * 2.8;
      nearGrass.visible = controls.grassEnabled ?? true;
      setMeshesVisible(bushes, controls.secondaryVegetationEnabled ?? true);
      setMeshesVisible(trees, controls.secondaryVegetationEnabled ?? true);
      setMeshesVisible(pebbles, controls.secondaryVegetationEnabled ?? true);
      if (controls.secondaryVegetationEnabled ?? true) {
        rockPhysics.update(delta, playerPosition);
      }
    },
    trees,
  };
}
