import { GUI } from "three/addons/libs/lil-gui.module.min.js";

export function createPanel(skeleton, skyControls, updateSun) {
  const settings = {
    show_skeleton: false,
    fixe_transition: true,
  };

  const panel = new GUI({ width: 310 });
  panel.add(settings, "show_skeleton").onChange((b) => (skeleton.visible = b));
  panel.add(settings, "fixe_transition");

  if (skyControls && updateSun) {
    const skyFolder = panel.addFolder("Cielo Atmosferico");
    skyFolder
      .add(skyControls, "turbidity", 0.0, 20.0, 0.1)
      .onChange(() => updateSun());
    skyFolder
      .add(skyControls, "rayleigh", 0.0, 4, 0.01)
      .onChange(() => updateSun());
    skyFolder
      .add(skyControls, "mieCoefficient", 0.0, 0.1, 0.001)
      .onChange(() => updateSun());
    skyFolder
      .add(skyControls, "mieDirectionalG", 0.0, 1, 0.001)
      .onChange(() => updateSun());
    skyFolder
      .add(skyControls, "inclination", 0.0, 1.0, 0.001)
      .onChange(() => updateSun());
    skyFolder
      .add(skyControls, "azimuth", 0.0, 1.0, 0.001)
      .onChange(() => updateSun());
    skyFolder.add(skyControls, "exposure", 0.1, 2.0, 0.01).onChange((v) => {
      skyControls.renderer.toneMappingExposure = v;
      updateSun();
    });
    skyFolder.open();
  }
}
export function createPanel2(params, water, updateTerrain) {
  const panel = new GUI({ width: 310 });
  const terrainFolder = panel.addFolder("Terreno");
  terrainFolder
    .add(params, "noiseScale", 0.01, 0.5, 0.01)
    .onChange(updateTerrain);
  terrainFolder.add(params, "noiseHeight", 1, 30, 1).onChange(updateTerrain);
  terrainFolder.add(params, "seaLevel", -10, 5, 0.1).onChange((v) => {
    water.position.y = v;
  });
  terrainFolder.open();
}
