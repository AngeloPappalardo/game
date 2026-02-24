import { addFloor } from "./scene/floor.js";
import { addSky, updateSky } from "./scene/sky.js";
import { updateCharacter } from "./controller/CharacterController.js";
import { registerKeyboardListeners } from "./controller/KeyboardControls.js";

// Smoke file: mantiene solo import reali del progetto.
console.log("Smoke imports OK", {
  addFloor: typeof addFloor === "function",
  addSky: typeof addSky === "function",
  updateSky: typeof updateSky === "function",
  updateCharacter: typeof updateCharacter === "function",
  registerKeyboardListeners: typeof registerKeyboardListeners === "function",
});
