import * as THREE from "three";

function unwrapRad(r) {
  return Math.atan2(Math.sin(r), Math.cos(r));
}

function setWeight(action, weight) {
  action.enabled = true;
  action.setEffectiveTimeScale(1);
  action.setEffectiveWeight(weight);
}

// Raycaster e vettori di supporto (fuori dalla funzione per evitare ricreazione ogni frame)
const downRay = new THREE.Raycaster();
const rayOrigin = new THREE.Vector3();
const rayDirection = new THREE.Vector3(0, -1, 0);

export function updateCharacter({
  delta,
  controls,
  group,
  followGroup,
  floor,
  mixer,
  actions,
  settings,
  orbitControls,
}) {
  const fade = controls.fadeDuration;
  const key = controls.key;
  const up = controls.up;
  const ease = controls.ease;
  const rotate = controls.rotate;
  const position = controls.position;
  const azimuth = orbitControls?.getAzimuthalAngle?.() ?? 0;
  controls.debugData.playerY = group.position.y;

  const active = key[0] !== 0 || key[1] !== 0;
  const play = active ? (key[2] ? "Run" : "Walk") : "Idle";
  const canAnimate =
    actions && actions.Idle && actions.Walk && actions.Run && mixer;

  // Cambio animazione
  if (canAnimate && controls.current !== play) {
    const current = actions[play];
    const old = actions[controls.current];
    controls.current = play;

    if (settings.fixe_transition) {
      current.reset();
      setWeight(current, 1.0);

      if (play !== "Idle") {
        current.time =
          old.time * (current.getClip().duration / old.getClip().duration);
      }

      old.fadeOut(fade);
      current.fadeIn(fade).play();
    } else {
      setWeight(current, 1.0);
      old.fadeOut(fade);
      current.reset().fadeIn(fade).play();
    }
  }

  if (!canAnimate) {
    controls.current = play;
  }

  // Movimento
  if (controls.current !== "Idle") {
    const velocity =
      controls.current === "Run" ? controls.runVelocity : controls.walkVelocity;

    ease.set(key[1], 0, key[0]).multiplyScalar(velocity * delta);

    const angle = unwrapRad(Math.atan2(ease.x, ease.z) + azimuth);
    rotate.setFromAxisAngle(up, angle);

    controls.ease.applyAxisAngle(up, azimuth);

    position.add(ease);

    group.position.copy(position);
    group.quaternion.rotateTowards(rotate, controls.rotateSpeed);
    followGroup.position.copy(position);

    if (floor) {
      const dx = position.x - floor.position.x;
      const dz = position.z - floor.position.z;
      const recenterSmooth = controls.floorRecenterSmooth ?? 8;
      if (Math.abs(dx) > controls.floorDecale) {
        floor.position.x = THREE.MathUtils.damp(
          floor.position.x,
          position.x,
          recenterSmooth,
          delta
        );
      }
      if (Math.abs(dz) > controls.floorDecale) {
        floor.position.z = THREE.MathUtils.damp(
          floor.position.z,
          position.z,
          recenterSmooth,
          delta
        );
      }
    }
  }

  // === Calcolo altezza dal terreno dinamica ===
  if (floor) {
    const floorTopY =
      floor.position.y +
      (floor.userData.maxTerrainHeight ?? 0) +
      (controls.raycastPadding ?? 20);
    const rayHeight = Math.max(group.position.y + 5, floorTopY);
    rayOrigin.set(group.position.x, rayHeight, group.position.z);
    downRay.set(rayOrigin, rayDirection);
    const intersects = downRay.intersectObject(floor, true);
    if (intersects.length > 0) {
      const terrainY = intersects[0].point.y;
      const heightOffset = controls.groundOffset ?? 1.0;
      const targetGroupY = terrainY + heightOffset;
      const targetFollowY = terrainY;
      const verticalSmooth = controls.playerVerticalSmooth ?? 12;

      group.position.y = THREE.MathUtils.damp(
        group.position.y,
        targetGroupY,
        verticalSmooth,
        delta
      );
      position.y = group.position.y;
      followGroup.position.y = THREE.MathUtils.damp(
        followGroup.position.y,
        targetFollowY,
        verticalSmooth,
        delta
      );
      controls.debugData.terrainY = terrainY;
      controls.debugData.playerY = group.position.y;
      controls.debugData.playerToTerrain = group.position.y - terrainY;
    } else {
      controls.debugData.terrainY = Number.NaN;
      controls.debugData.playerToTerrain = Number.NaN;
    }
  }

  if (mixer) mixer.update(delta);
}
