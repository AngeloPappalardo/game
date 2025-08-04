// Player.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { createPanel } from '../ui/guiPanel';

export function loadPlayer(scene, group, settings, controls, orbitControls, onReady) {
	const loader = new GLTFLoader();
	const PI = Math.PI;

	loader.load('gltf/player/Soldier.glb', function (gltf) {
		const model = gltf.scene;
		group.add(model);
		model.rotation.y = PI;
		group.rotation.y = PI;

		model.traverse(function (object) {
			if (object.isMesh) {
				if (object.name === 'vanguard_Mesh') {
					object.castShadow = true;
					object.receiveShadow = true;
					object.material.metalness = 1.0;
					object.material.roughness = 0.2;
					object.material.color.set(1, 1, 1);
					object.material.metalnessMap = object.material.map;
				} else {
					object.material.metalness = 1;
					object.material.roughness = 0;
					object.material.transparent = true;
					object.material.opacity = 0.8;
					object.material.color.set(1, 1, 1);
				}
			}
		});

		// Skeleton
		const skeleton = new THREE.SkeletonHelper(model);
		skeleton.setColors(new THREE.Color(0xe000ff), new THREE.Color(0x00e0ff));
		skeleton.visible = false;
		scene.add(skeleton);

		// GUI
		createPanel(skeleton)

		// Animation mixer e actions
		const mixer = new THREE.AnimationMixer(model);
		const animations = gltf.animations;
		const actions = {
			Idle: mixer.clipAction(animations[0]),
			Walk: mixer.clipAction(animations[3]),
			Run: mixer.clipAction(animations[1]),
		};

		for (const m in actions) {
			actions[m].enabled = true;
			actions[m].setEffectiveTimeScale(1);
			if (m !== 'Idle') actions[m].setEffectiveWeight(0);
		}

		actions.Idle.play();

		// Callback per comunicare gli oggetti al file principale
		onReady({ model, skeleton, mixer, actions });
	});
}
