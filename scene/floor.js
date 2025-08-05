// model/floor.js
import * as THREE from "three";

export function addFloor(scene, renderer, controls) {
  const PI90 = Math.PI / 2;
  const size = 50;
  const repeat = 16;

  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

  const floorT = new THREE.TextureLoader().load("textures/floors/erba.jpg");
  floorT.colorSpace = THREE.SRGBColorSpace;
  floorT.repeat.set(repeat, repeat);
  floorT.wrapS = floorT.wrapT = THREE.RepeatWrapping;
  floorT.anisotropy = maxAnisotropy;

  const floorN = new THREE.TextureLoader().load("textures/floors/erba.jpg");
  floorN.repeat.set(repeat, repeat);
  floorN.wrapS = floorN.wrapT = THREE.RepeatWrapping;
  floorN.anisotropy = maxAnisotropy;

  const mat = new THREE.MeshStandardMaterial({
    map: floorT,
    normalMap: floorN,
    normalScale: new THREE.Vector2(0.5, 0.5),
    color: 0xffffff,
    depthWrite: false,
    roughness: 0.85,
    //roughness: 0.4, // <- PIÙ LUCIDO
    //metalness: 0.1, // <- UN PO’ DI RIFLESSO
  });

  const g = new THREE.PlaneGeometry(size, size, 80, 50);
  g.rotateX(-PI90);

  const floor = new THREE.Mesh(g, mat);
  floor.receiveShadow = true;
  scene.add(floor);

  controls.floorDecale = (size / repeat) * 4;

  // Ritorna il riferimento al floor se ti serve per aggiornamenti futuri
  return floor;
}
