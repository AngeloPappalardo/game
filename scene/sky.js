import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";
import { createPanel } from "../ui/guiPanel";

let sky, stars, moon, sunLight;
let time = 0;

export const sun = new THREE.Vector3();

export const skyControls = {
  turbidity: 10,
  rayleigh: 0.5,
  mieCoefficient: 0.005,
  mieDirectionalG: 0.15,
  inclination: 0.49,
  azimuth: 0.25,
  exposure: 0.5,
  renderer: null,
  scene: null, // AGGIUNTO per gestire lo sfondo
};

export function updateSun() {
  const theta = Math.PI * (skyControls.inclination - 0.5);
  const phi = 2 * Math.PI * (skyControls.azimuth - 0.5);

  sun.x = Math.cos(phi);
  sun.y = Math.sin(theta);
  sun.z = Math.sin(phi);

  sky.material.uniforms["sunPosition"].value.copy(sun);
  moon.position.set(-sun.x * 300, -sun.y * 300, -sun.z * 300);

  sky.material.uniforms["turbidity"].value = skyControls.turbidity;
  sky.material.uniforms["rayleigh"].value = skyControls.rayleigh;
  sky.material.uniforms["mieCoefficient"].value = skyControls.mieCoefficient;
  sky.material.uniforms["mieDirectionalG"].value = skyControls.mieDirectionalG;

  const nightFactor = Math.max(0, -sun.y);
  if (stars) {
    stars.material.opacity = nightFactor;
    stars.material.transparent = true;
    stars.material.needsUpdate = true;
  }
  moon.material.emissiveIntensity = nightFactor;

  skyControls.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  skyControls.renderer.toneMappingExposure = skyControls.exposure;

  sky.visible = nightFactor < 0.1;

  // CORRETTO: usa la scena e non il renderer
  if (skyControls.scene) {
    skyControls.scene.background = new THREE.Color(0x000000);
  }

  sunLight.position.set(sun.x * 300, sun.y * 300, sun.z * 300);
  sunLight.target.position.set(0, 0, 0);
  sunLight.target.updateMatrixWorld();
}

export function addSky(scene, renderer, onReady) {
  createPanel(null, skyControls, updateSun);
  skyControls.renderer = renderer;
  skyControls.scene = scene; // AGGIUNTO
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  sky = new Sky();
  sky.scale.setScalar(450000);
  scene.add(sky);

  const moonGeo = new THREE.SphereGeometry(10, 32, 32);
  const moonMat = new THREE.MeshStandardMaterial({
    emissive: new THREE.Color(0x223366),
    color: 0x111122,
  });
  moon = new THREE.Mesh(moonGeo, moonMat);
  moon.position.set(-100, 100, -100);
  scene.add(moon);

  const starGeo = new THREE.BufferGeometry();
  const starCount = 1000;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i++) {
    starPositions[i] = (Math.random() - 0.5) * 4000;
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1.5,
    transparent: true,
    opacity: 0,
    sizeAttenuation: true,
  });
  stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  sky.material.uniforms["turbidity"].value = skyControls.turbidity;
  sky.material.uniforms["rayleigh"].value = skyControls.rayleigh;
  sky.material.uniforms["mieCoefficient"].value = skyControls.mieCoefficient;
  sky.material.uniforms["mieDirectionalG"].value = skyControls.mieDirectionalG;

  sunLight = new THREE.DirectionalLight(0xffffff, 10);
  const dayFactor = Math.max(0, sun.y);

  // Tonalità fissa (rosso/arancio), ma varia saturazione e luminosità
  const hue = 0.1;
  const saturation = THREE.MathUtils.lerp(1.0, 0.6, dayFactor); // alba/tramonto → meno saturo a mezzogiorno
  const lightness = THREE.MathUtils.lerp(0.3, 0.9, dayFactor);
  sunLight.color.setHSL(hue, saturation, lightness);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 1000;
  sunLight.shadow.camera.left = -200;
  sunLight.shadow.camera.right = 200;
  sunLight.shadow.camera.top = 200;
  sunLight.shadow.camera.bottom = -200;
  scene.add(sunLight);

  updateSun();
  if (onReady) onReady();
}

export function updateSky(delta) {
  time += delta * 0.01;
  // Simula inclinazione (altezza del sole nel cielo)
  const inclination = (Math.sin(time) + 1) / 2;

  // Simula azimuth (posizione da Est a Ovest nel cielo)
  const azimuth = (Math.cos(time) + 1) / 2;
  skyControls.inclination = inclination;
  skyControls.azimuth = azimuth;
  updateSun();
}
