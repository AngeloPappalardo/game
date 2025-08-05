import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { loadPlayer } from './model/player';
import { addFloor } from './scene/floor';
import { updateCharacter } from './controller/CharacterController';
import { registerKeyboardListeners } from './controller/KeyboardControls';
import { addSky, updateSky } from './scene/sky';

let scene, renderer, camera, floor, orbitControls;
let group, followGroup, model, skeleton, mixer, clock;

let actions;

const settings = {
	show_skeleton: false,
	fixe_transition: true,
};

const PI90 = Math.PI / 2;

const controls = {

	key: [0, 0],
	ease: new THREE.Vector3(),
	position: new THREE.Vector3(),
	up: new THREE.Vector3(0, 1, 0),
	rotate: new THREE.Quaternion(),
	current: 'Idle',
	fadeDuration: 0.5,
	runVelocity: 5,
	walkVelocity: 1.8,
	rotateSpeed: 0.05,
	floorDecale: 0,

};


init();

function init() {

	const container = document.getElementById('container');

	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
	camera.position.set(0, 2, - 5);

	clock = new THREE.Clock();

	scene = new THREE.Scene();

	group = new THREE.Group();
	scene.add(group);

	followGroup = new THREE.Group();
	scene.add(followGroup);

	//const dirLight = new THREE.DirectionalLight(0xffffff, 5);
	//dirLight.position.set(- 2, 5, - 3);
	//dirLight.castShadow = true;
	//const cam = dirLight.shadow.camera;
	//cam.top = cam.right = 2;
	//cam.bottom = cam.left = - 2;
	//cam.near = 3;
	//cam.far = 8;
	//dirLight.shadow.mapSize.set(1024, 1024);
	//followGroup.add(dirLight);
	//followGroup.add(dirLight.target);

	//scene.add( new THREE.CameraHelper( cam ) );

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setAnimationLoop(animate);
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 0.5;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	container.appendChild(renderer.domElement);

	orbitControls = new OrbitControls(camera, renderer.domElement);
	orbitControls.target.set(0, 1, 0);
	orbitControls.enableDamping = true;
	orbitControls.enablePan = false;
	orbitControls.maxPolarAngle = PI90 - 0.05;
	orbitControls.update();

	// EVENTS

	window.addEventListener('resize', onWindowResize);
	registerKeyboardListeners(controls);




	// DEMO
	addSky(scene, renderer, () => {
		loadPlayer(scene, group, settings, controls, orbitControls, ({ model: loadedModel, skeleton: loadedSkeleton, mixer: loadedMixer, actions: loadedActions }) => {
			model = loadedModel;
			skeleton = loadedSkeleton;
			mixer = loadedMixer;
			actions = loadedActions;
			animate(); // avvia il loop solo dopo che è tutto pronto
		});


		floor = addFloor(scene, renderer, controls);
	})

}


function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

	// Render loop

	const delta = clock.getDelta();
	updateSky(delta)

	updateCharacter({
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
	});

	renderer.render(scene, camera);

}