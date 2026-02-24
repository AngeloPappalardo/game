// Player.js
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createPanel } from "../ui/guiPanel";

export function loadPlayer(
  scene,
  group,
  settings,
  onReady
) {
  const loader = new GLTFLoader();

  loader.load(
    "gltf/player/Xbot.glb",
    function (gltf) {
      const model = gltf.scene;
      group.add(model);
      model.updateMatrixWorld(true);

      const skeleton = new THREE.SkeletonHelper(model);
      skeleton.setColors(new THREE.Color(0xe000ff), new THREE.Color(0x00e0ff));
      skeleton.visible = false;
      scene.add(skeleton);

      createPanel({ skeleton, settings });

      const mixer = new THREE.AnimationMixer(model);
      const animations = gltf.animations;
      console.log("Animazioni disponibili nel modello GLTF:");
      animations.forEach((clip, index) => {
        console.log(`${index}: ${clip.name}`);
      });

      const pickClip = (keywords, fallbackIndices = []) => {
        const matched = animations.find((clip) => {
          const name = clip.name.toLowerCase();
          return keywords.some((keyword) => name.includes(keyword));
        });
        if (matched) return matched;

        for (const index of fallbackIndices) {
          if (animations[index]) return animations[index];
        }
        return null;
      };

      const idleClip = pickClip(["idle"], [2, 0]);
      const walkClip = pickClip(["walk"], [6, 1]);
      const runClip = pickClip(["run", "jog", "sprint"], [3, 2]);

      if (!idleClip || !walkClip || !runClip) {
        const available = animations.map((clip) => clip.name).join(", ");
        console.error(
          `Animazioni mancanti (Idle/Walk/Run). Disponibili: ${available}`
        );
        return;
      }

      const actions = {
        Idle: mixer.clipAction(idleClip),
        Walk: mixer.clipAction(walkClip),
        Run: mixer.clipAction(runClip),
      };

      const modelBounds = new THREE.Box3().setFromObject(model);
      const groundOffset = Math.max(0, -modelBounds.min.y) + 0.02;

      for (const m in actions) {
        actions[m].enabled = true;
        actions[m].setEffectiveTimeScale(1);
        if (m !== "Idle") actions[m].setEffectiveWeight(0);
      }

      actions.Idle.play();
      onReady({ model, skeleton, mixer, actions, groundOffset });
    },
    undefined,
    function (error) {
      const details = error?.message || error;
      console.error("Errore caricamento GLTF player:", details);
    }
  );
}
