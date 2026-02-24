import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";
import { createPanel } from "../ui/guiPanel";

let sky, stars, moon, sunLight, ambientLight, hemiLight, dust;
let time = 0;
let exposureCurrent = 0.5;
let exposureTarget = 0.5;

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
  scene: null,
};

function smooth01(value) {
  return THREE.MathUtils.clamp(value, 0, 1);
}

function createDustParticles(scene) {
  const count = 280;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 180;
    positions[i3 + 1] = 0.5 + Math.random() * 7.5;
    positions[i3 + 2] = (Math.random() - 0.5) * 180;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xd7cfa8,
    size: 0.28,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);
  return points;
}

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

  const dayFactor = smooth01(sun.y * 1.15 + 0.08);
  const nightFactor = smooth01(-sun.y * 1.25 + 0.05);
  const twilightFactor = smooth01(1 - Math.abs(sun.y) * 3.2);

  if (stars) {
    stars.material.opacity = nightFactor * (0.65 + (1 - twilightFactor) * 0.35);
    stars.material.transparent = true;
    stars.material.needsUpdate = true;
  }

  moon.material.emissiveIntensity = nightFactor * 0.95;
  moon.material.color.setHSL(
    THREE.MathUtils.lerp(0.62, 0.58, twilightFactor),
    THREE.MathUtils.lerp(0.25, 0.42, nightFactor),
    THREE.MathUtils.lerp(0.12, 0.34, nightFactor)
  );

  if (sunLight) {
    const hue = THREE.MathUtils.lerp(0.08, 0.12, dayFactor);
    const saturation = THREE.MathUtils.lerp(0.85, 0.48, dayFactor);
    const lightness = THREE.MathUtils.lerp(0.48, 0.8, dayFactor);
    sunLight.color.setHSL(hue, saturation, lightness);
    sunLight.intensity = THREE.MathUtils.lerp(0.1, 8.2, dayFactor);
  }

  if (ambientLight) {
    ambientLight.intensity = THREE.MathUtils.lerp(0.08, 0.42, dayFactor) + twilightFactor * 0.08;
    ambientLight.color.setHSL(
      THREE.MathUtils.lerp(0.62, 0.58, dayFactor),
      THREE.MathUtils.lerp(0.22, 0.12, dayFactor),
      THREE.MathUtils.lerp(0.08, 0.4, dayFactor)
    );
  }

  if (hemiLight) {
    hemiLight.intensity = THREE.MathUtils.lerp(0.05, 0.62, dayFactor);
    hemiLight.color.setHSL(
      THREE.MathUtils.lerp(0.62, 0.56, dayFactor),
      THREE.MathUtils.lerp(0.32, 0.22, dayFactor),
      THREE.MathUtils.lerp(0.22, 0.66, dayFactor)
    );
    hemiLight.groundColor.setHSL(
      THREE.MathUtils.lerp(0.1, 0.09, dayFactor),
      THREE.MathUtils.lerp(0.35, 0.28, dayFactor),
      THREE.MathUtils.lerp(0.07, 0.25, dayFactor)
    );
  }

  skyControls.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  exposureTarget = THREE.MathUtils.lerp(
    skyControls.exposure * 0.5,
    skyControls.exposure,
    dayFactor
  );

  if (skyControls.scene) {
    const backgroundColor = new THREE.Color().setHSL(
      THREE.MathUtils.lerp(0.64, 0.57, dayFactor),
      THREE.MathUtils.lerp(0.34, 0.5, dayFactor),
      THREE.MathUtils.lerp(0.03, 0.74, dayFactor) + twilightFactor * 0.05
    );
    skyControls.scene.background = backgroundColor;

    if (skyControls.scene.fog) {
      skyControls.scene.fog.color.copy(backgroundColor).multiplyScalar(0.9);
      skyControls.scene.fog.near = THREE.MathUtils.lerp(20, 70, dayFactor);
      skyControls.scene.fog.far = THREE.MathUtils.lerp(120, 280, dayFactor);
    }
  }

  sunLight.position.set(sun.x * 300, sun.y * 300, sun.z * 300);
  sunLight.target.position.set(0, 0, 0);
  sunLight.target.updateMatrixWorld();
}

export function addSky(scene, renderer, onReady) {
  createPanel({ skyControls, updateSun });
  skyControls.renderer = renderer;
  skyControls.scene = scene;

  ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambientLight);
  hemiLight = new THREE.HemisphereLight(0xbfd8ff, 0x6f6a54, 0.46);
  scene.add(hemiLight);

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
  dust = createDustParticles(scene);

  scene.fog = new THREE.Fog(0x8da091, 55, 220);

  sky.material.uniforms["turbidity"].value = skyControls.turbidity;
  sky.material.uniforms["rayleigh"].value = skyControls.rayleigh;
  sky.material.uniforms["mieCoefficient"].value = skyControls.mieCoefficient;
  sky.material.uniforms["mieDirectionalG"].value = skyControls.mieDirectionalG;

  sunLight = new THREE.DirectionalLight(0xffffff, 10);
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

  const inclination = (Math.sin(time) + 1) / 2;
  const azimuth = (Math.cos(time) + 1) / 2;
  skyControls.inclination = inclination;
  skyControls.azimuth = azimuth;
  if (dust) {
    dust.rotation.y += delta * 0.02;
    dust.position.y = Math.sin(time * 12) * 0.45;
    dust.material.opacity = THREE.MathUtils.lerp(0.08, 0.24, Math.max(0, sun.y + 0.15));
  }
  updateSun();
  exposureCurrent = THREE.MathUtils.damp(exposureCurrent, exposureTarget, 2.4, delta);
  if (skyControls.renderer) {
    skyControls.renderer.toneMappingExposure = exposureCurrent;
  }
}
