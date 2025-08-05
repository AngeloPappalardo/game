// Player.js
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { createPanel } from "../ui/guiPanel";

export function loadPlayer(
  scene,
  group,
  settings,
  controls,
  orbitControls,
  onReady
) {
  const loader = new GLTFLoader();
  const PI = Math.PI;

  loader.load("gltf/player/Xbot.glb", function (gltf) {
    const model = gltf.scene;
    group.add(model);
    //model.rotation.y = PI;
    //group.rotation.y = PI;


    // Skeleton
    const skeleton = new THREE.SkeletonHelper(model);
    skeleton.setColors(new THREE.Color(0xe000ff), new THREE.Color(0x00e0ff));
    skeleton.visible = false;
    scene.add(skeleton);

    // GUI
    createPanel(skeleton);

    // Animation mixer e actions
    const mixer = new THREE.AnimationMixer(model);
    const animations = gltf.animations;
    // Logga tutti i nomi delle animazioni disponibili
    console.log("Animazioni disponibili nel modello GLTF:");
    animations.forEach((clip, index) => {
      console.log(`${index}: ${clip.name}`);
    });
    const actions = {
      Idle: mixer.clipAction(animations[2]),
      Walk: mixer.clipAction(animations[6]),
      Run: mixer.clipAction(animations[3]),
    };

    for (const m in actions) {
      actions[m].enabled = true;
      actions[m].setEffectiveTimeScale(1);
      if (m !== "Idle") actions[m].setEffectiveWeight(0);
    }

    actions.Idle.play();

    // Callback per comunicare gli oggetti al file principale
    onReady({ model, skeleton, mixer, actions });
  });
}
