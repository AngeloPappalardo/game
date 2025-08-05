import * as THREE from 'three';

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
	camera,
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
	const azimuth = orbitControls.getAzimuthalAngle();

	const active = key[0] !== 0 || key[1] !== 0;
	const play = active ? (key[2] ? 'Run' : 'Walk') : 'Idle';

	// Cambio animazione
	if (controls.current !== play) {
		const current = actions[play];
		const old = actions[controls.current];
		controls.current = play;

		if (settings.fixe_transition) {
			current.reset();
			current.weight = 1.0;
			current.stopFading();
			old.stopFading();

			if (play !== 'Idle') {
				current.time =
					old.time * (current.getClip().duration / old.getClip().duration);
			}

			old._scheduleFading(fade, old.getEffectiveWeight(), 0);
			current._scheduleFading(fade, current.getEffectiveWeight(), 1);
			current.play();
		} else {
			setWeight(current, 1.0);
			old.fadeOut(fade);
			current.reset().fadeIn(fade).play();
		}
	}

	// Movimento
	if (controls.current !== 'Idle') {
		const velocity =
			controls.current === 'Run'
				? controls.runVelocity
				: controls.walkVelocity;

		ease.set(key[1], 0, key[0]).multiplyScalar(velocity * delta);

		const angle = unwrapRad(Math.atan2(ease.x, ease.z) + azimuth);
		rotate.setFromAxisAngle(up, angle);

		controls.ease.applyAxisAngle(up, azimuth);

		position.add(ease);
		camera.position.add(ease);

		group.position.copy(position);
		group.quaternion.rotateTowards(rotate, controls.rotateSpeed);

		orbitControls.target.copy(position).add({ x: 0, y: 1, z: 0 });
		followGroup.position.copy(position);

		const dx = position.x - floor.position.x;
		const dz = position.z - floor.position.z;
		if (Math.abs(dx) > controls.floorDecale) floor.position.x += dx;
		if (Math.abs(dz) > controls.floorDecale) floor.position.z += dz;
	}

	// === Calcolo altezza dal terreno dinamica ===
	if (floor && floor.mesh) {
		const rayHeight = group.position.y + 5;
		rayOrigin.set(group.position.x, rayHeight, group.position.z);
		downRay.set(rayOrigin, rayDirection);
		const intersects = downRay.intersectObject(floor.mesh, true);
		if (intersects.length > 0) {
			const terrainY = intersects[0].point.y;
			const heightOffset = 1.0; // distanza sopra il terreno
			group.position.y = terrainY + heightOffset;
			position.y = group.position.y;
			followGroup.position.y = terrainY;
			camera.position.y = terrainY + 2; // altezza camera opzionale
		}
	}

	if (mixer) mixer.update(delta);
	orbitControls.update();
}
