import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
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
	position: new THREE.Vector3(0, 0, 0),
	up: new THREE.Vector3(0, 1, 0),
	rotate: new THREE.Quaternion(),
	current: 'Idle',
	fadeDuration: 0.5,
	runVelocity: 5,
	walkVelocity: 1.8,
	rotateSpeed: 0.05,
	floorDecale: 0,
	groundOffset: 1.0,
	spawnInitialized: false,
	raycastPadding: 20,
	floorRecenterSmooth: 8,
	playerVerticalSmooth: 12,
	cameraTargetHeight: 1.2,
	cameraTargetSmooth: 12,
	cameraPositionSmooth: 10,
	terrainSeed: 1337,
	debugEnabled: false,
	debugData: {
		playerY: 0,
		terrainY: 0,
		cameraY: 0,
		groundOffset: 1,
		spawnInitialized: false,
		floorSeed: 1337,
	},
};

const desiredCameraTarget = new THREE.Vector3();
const desiredCameraPosition = new THREE.Vector3();
const currentCameraOffset = new THREE.Vector3();
let debugOverlay;

init();

function init() {
	const container = document.getElementById('container');

	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
	camera.position.set(0, 22, -5);

	clock = new THREE.Clock();

	scene = new THREE.Scene();

	group = new THREE.Group();
	scene.add(group);

	followGroup = new THREE.Group();
	scene.add(followGroup);

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

	window.addEventListener('resize', onWindowResize);
	registerKeyboardListeners(controls);
	setupDebugOverlay();

	addSky(scene, renderer, () => {
		loadPlayer(scene, group, settings, ({ model: loadedModel, skeleton: loadedSkeleton, mixer: loadedMixer, actions: loadedActions, groundOffset }) => {
			model = loadedModel;
			skeleton = loadedSkeleton;
			mixer = loadedMixer;
			actions = loadedActions;
			if (Number.isFinite(groundOffset)) controls.groundOffset = groundOffset;
			initializeCharacterOnTerrain();
			animate();
		});

		floor = addFloor(scene, controls);
		controls.debugData.floorSeed = floor.userData.terrainSeed ?? controls.terrainSeed;
		initializeCharacterOnTerrain();
	});
}

function initializeCharacterOnTerrain() {
	if (controls.spawnInitialized || !floor || !model) return;

	const topY = floor.position.y + (floor.userData.maxTerrainHeight ?? 0) + controls.raycastPadding;
	const rayOrigin = new THREE.Vector3(controls.position.x, topY, controls.position.z);
	const rayDirection = new THREE.Vector3(0, -1, 0);
	const raycaster = new THREE.Raycaster(rayOrigin, rayDirection);
	const intersects = raycaster.intersectObject(floor, true);
	if (!intersects.length) {
		console.warn('Spawn raycast non ha trovato terreno, uso fallback y=0');
		group.position.set(controls.position.x, controls.groundOffset, controls.position.z);
		controls.position.copy(group.position);
		followGroup.position.set(controls.position.x, 0, controls.position.z);
	} else {
		const terrainY = intersects[0].point.y;
		const playerY = terrainY + controls.groundOffset;
		group.position.set(controls.position.x, playerY, controls.position.z);
		controls.position.copy(group.position);
		followGroup.position.set(controls.position.x, terrainY, controls.position.z);
	}

	orbitControls.target.copy(controls.position).add({ x: 0, y: 1, z: 0 });
	camera.position.set(controls.position.x, controls.position.y + 2, controls.position.z - 5);
	orbitControls.update();
	controls.spawnInitialized = true;
	controls.debugData.spawnInitialized = true;
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
	const delta = clock.getDelta();
	updateSky(delta);

	updateCharacter({
		delta,
		controls,
		group,
		followGroup,
		floor,
		mixer,
		actions,
		settings,
		orbitControls,
	});
	updateFollowCamera(delta);
	updateDebugOverlay();

	renderer.render(scene, camera);
}

function updateFollowCamera(delta) {
	currentCameraOffset.copy(camera.position).sub(orbitControls.target);

	desiredCameraTarget.set(
		controls.position.x,
		controls.position.y + controls.cameraTargetHeight,
		controls.position.z
	);
	desiredCameraPosition.copy(desiredCameraTarget).add(currentCameraOffset);

	const targetSmooth = controls.cameraTargetSmooth;
	const positionSmooth = controls.cameraPositionSmooth;

	orbitControls.target.x = THREE.MathUtils.damp(
		orbitControls.target.x,
		desiredCameraTarget.x,
		targetSmooth,
		delta
	);
	orbitControls.target.y = THREE.MathUtils.damp(
		orbitControls.target.y,
		desiredCameraTarget.y,
		targetSmooth,
		delta
	);
	orbitControls.target.z = THREE.MathUtils.damp(
		orbitControls.target.z,
		desiredCameraTarget.z,
		targetSmooth,
		delta
	);

	camera.position.x = THREE.MathUtils.damp(
		camera.position.x,
		desiredCameraPosition.x,
		positionSmooth,
		delta
	);
	camera.position.y = THREE.MathUtils.damp(
		camera.position.y,
		desiredCameraPosition.y,
		positionSmooth,
		delta
	);
	camera.position.z = THREE.MathUtils.damp(
		camera.position.z,
		desiredCameraPosition.z,
		positionSmooth,
		delta
	);

	orbitControls.update();
}

function setupDebugOverlay() {
	debugOverlay = document.createElement('div');
	debugOverlay.style.position = 'fixed';
	debugOverlay.style.top = '10px';
	debugOverlay.style.left = '10px';
	debugOverlay.style.zIndex = '20';
	debugOverlay.style.minWidth = '220px';
	debugOverlay.style.padding = '10px 12px';
	debugOverlay.style.border = '1px solid rgba(255,255,255,0.3)';
	debugOverlay.style.background = 'rgba(0,0,0,0.65)';
	debugOverlay.style.color = '#d9f5ff';
	debugOverlay.style.fontFamily = 'monospace';
	debugOverlay.style.fontSize = '12px';
	debugOverlay.style.whiteSpace = 'pre-line';
	debugOverlay.style.display = 'none';
	document.body.appendChild(debugOverlay);

	window.addEventListener('keydown', (event) => {
		if (event.code === 'F3') {
			event.preventDefault();
			controls.debugEnabled = !controls.debugEnabled;
			debugOverlay.style.display = controls.debugEnabled ? 'block' : 'none';
		}
	});
}

function updateDebugOverlay() {
	controls.debugData.cameraY = camera.position.y;
	controls.debugData.groundOffset = controls.groundOffset;
	controls.debugData.spawnInitialized = controls.spawnInitialized;

	if (!controls.debugEnabled || !debugOverlay) return;

	const d = controls.debugData;
	const terrainYText = Number.isFinite(d.terrainY) ? d.terrainY.toFixed(2) : 'n/a';
	const playerYText = Number.isFinite(d.playerY) ? d.playerY.toFixed(2) : 'n/a';
	const cameraYText = Number.isFinite(d.cameraY) ? d.cameraY.toFixed(2) : 'n/a';
	const deltaText = Number.isFinite(d.playerToTerrain) ? d.playerToTerrain.toFixed(2) : 'n/a';
	debugOverlay.textContent = [
		'Debug (F3)',
		`spawnInitialized: ${d.spawnInitialized}`,
		`terrainSeed: ${d.floorSeed}`,
		`terrainY: ${terrainYText}`,
		`playerY: ${playerYText}`,
		`cameraY: ${cameraYText}`,
		`player-terrain: ${deltaText}`,
		`groundOffset: ${d.groundOffset.toFixed(2)}`,
	].join('\n');
}
