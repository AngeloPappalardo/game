import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
export function createPanel(skeleton) {
  const settings = { show_skeleton: false, fixe_transition: true };
  const panel = new GUI({ width: 310 });
  panel.add(settings, 'show_skeleton').onChange(b => skeleton.visible = b);
  panel.add(settings, 'fixe_transition');
}

