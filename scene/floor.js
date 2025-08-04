// model/floor.js
import * as THREE from 'three';

export function addFloor(scene, renderer, controls) {
	const PI90 = Math.PI / 2;
	const size = 50;
	const repeat = 16;

	const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

	const floorT = new THREE.TextureLoader().load('textures/floors/FloorsCheckerboard_S_Diffuse.jpg');
	floorT.colorSpace = THREE.SRGBColorSpace;
	floorT.repeat.set(repeat, repeat);
	floorT.wrapS = floorT.wrapT = THREE.RepeatWrapping;
	floorT.anisotropy = maxAnisotropy;

	const floorN = new THREE.TextureLoader().load('textures/floors/FloorsCheckerboard_S_Normal.jpg');
	floorN.repeat.set(repeat, repeat);
	floorN.wrapS = floorN.wrapT = THREE.RepeatWrapping;
	floorN.anisotropy = maxAnisotropy;

	const mat = new THREE.MeshStandardMaterial({
		map: floorT,
		normalMap: floorN,
		normalScale: new THREE.Vector2(0.5, 0.5),
		color: 0x404040,
		depthWrite: false,
		roughness: 0.85,
	});

	const g = new THREE.PlaneGeometry(size, size, 50, 50);
	g.rotateX(-PI90);

	const floor = new THREE.Mesh(g, mat);
	floor.receiveShadow = true;
	scene.add(floor);

	controls.floorDecale = (size / repeat) * 4;

	// Light
	const bulbGeometry = new THREE.SphereGeometry(0.05, 16, 8);
	const bulbLight = new THREE.PointLight(0xffee88, 2, 500, 2);

	const bulbMat = new THREE.MeshStandardMaterial({
		emissive: 0xffffee,
		emissiveIntensity: 1,
		color: 0x000000,
	});

	bulbLight.add(new THREE.Mesh(bulbGeometry, bulbMat));
	bulbLight.position.set(1, 0.1, -3);
	bulbLight.castShadow = true;

	floor.add(bulbLight);

	// Ritorna il riferimento al floor se ti serve per aggiornamenti futuri
	return floor;
}
