import { initScene } from './scene/initScene.js';
import { addLights } from './scene/lights.js';
import { addFloor } from './scene/floor.js';
import { loadModel } from './scene/loadModel.js';
import { setupInput } from './controls/inputControls.js';
import { setCharacterRefs } from './animation/characterUpdater.js';

async function main() {
  const { scene, camera, renderer, followGroup, clock, orbitControls, group } = initScene();
  addLights(scene, followGroup);
   const floor = addFloor(scene, renderer);
  setupInput();

    setCharacterRefs({
    cam: camera,
    grp: group,
    flr: floor,
    follow: followGroup,
    orbCtrl: orbitControls
  });

  await loadModel({ scene, renderer, camera, orbitControls, followGroup, clock });
}
main();
