import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

let sun, sky, stars, moon, time = 0;
let originalBackground = null;
/**
 * Cielo dinamico con ciclo giorno-notte e stelle semplici
 * @param {THREE.Scene} scene
 * @param {THREE.Renderer} renderer
 * @param {function} onReady
 */
export function addSky(scene, renderer, onReady) {
    // Cielo atmosferico
    sky = new Sky();
    sky.scale.setScalar(450000);
    scene.add(sky);

    // Sole
    sun = new THREE.Vector3();
    originalBackground = scene.background;
    // Luna
    const moonGeo = new THREE.SphereGeometry(10, 32, 32);
    const moonMat = new THREE.MeshStandardMaterial({
        emissive: new THREE.Color(0x223366),
        color: 0x111122,
    });
    moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(-100, 100, -100);
    scene.add(moon);

    // Stelle generate proceduralmente
    const starGeo = new THREE.BufferGeometry();
    const starCount = 1000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
        starPositions[i] = (Math.random() - 0.5) * 4000; // distribuzione ampia
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.5,
        transparent: true,
        opacity: 0, // inizialmente invisibili
        sizeAttenuation: true,
    });
    stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Impostazioni cielo fisico
    const effectController = {
        turbidity: 0,
        rayleigh: 0.1,
        mieCoefficient: 0.005,
        mieDirectionalG: 0.7,
        inclination: 0.49,
        azimuth: 0.25,
        exposure: renderer.toneMappingExposure,
    };

    function updateSun() {
        const theta = Math.PI * (effectController.inclination - 0.5);
        const phi = 2 * Math.PI * (effectController.azimuth - 0.5);

        sun.x = Math.cos(phi);
        sun.y = Math.sin(theta);
        sun.z = Math.sin(phi);

        sky.material.uniforms['sunPosition'].value.copy(sun);
        moon.position.set(-sun.x * 300, -sun.y * 300, -sun.z * 300);

        // Calcolo notte
        const nightFactor = Math.max(0, -sun.y);
        if (stars) {
            stars.material.opacity = nightFactor;
            stars.material.transparent = true;
            stars.material.needsUpdate = true;
        }
        moon.material.emissiveIntensity = nightFactor;

        // Espone meno di notte
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = THREE.MathUtils.lerp(0.5, 0.15, nightFactor);

        // Nascondi cielo fisico quasi completamente di notte
        sky.visible = nightFactor < 0.1;
        scene.background = new THREE.Color(0x000000);

    }

    // Set iniziale shader cielo
    sky.material.uniforms['turbidity'].value = effectController.turbidity;
    sky.material.uniforms['rayleigh'].value = effectController.rayleigh;
    sky.material.uniforms['mieCoefficient'].value = effectController.mieCoefficient;
    sky.material.uniforms['mieDirectionalG'].value = effectController.mieDirectionalG;
    updateSun();
    if (onReady) onReady();
}

/**
 * Chiama ogni frame per aggiornare il cielo
 */
export function updateSky(delta) {
    time += delta * 0.01;
    const inclination = (Math.sin(time) + 1) / 2;

    const theta = Math.PI * (inclination - 0.5);
    const phi = 2 * Math.PI * 0.25;
    const sunX = Math.cos(phi);
    const sunY = Math.sin(theta);
    const sunZ = Math.sin(phi);
    sun.set(sunX, sunY, sunZ);

    sky.material.uniforms['sunPosition'].value.copy(sun);
    moon.position.set(-sunX * 300, -sunY * 300, -sunZ * 300);

    const nightFactor = Math.max(0, -sunY);
    if (stars) stars.material.opacity = nightFactor;
    moon.material.emissiveIntensity = nightFactor;
    sky.visible = nightFactor < 0.1;
}
