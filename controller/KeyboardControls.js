// controller/KeyboardControls.js

export function registerKeyboardListeners(controls) {
    function onKeyDown(event) {
        const key = controls.key;

        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
            case 'KeyZ':
                key[0] = -1;
                break;
            case 'ArrowDown':
            case 'KeyS':
                key[0] = 1;
                break;
            case 'ArrowLeft':
            case 'KeyA':
            case 'KeyQ':
                key[1] = -1;
                break;
            case 'ArrowRight':
            case 'KeyD':
                key[1] = 1;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                key[2] = 1;
                break;
        }
    }

    function onKeyUp(event) {
        const key = controls.key;

        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
            case 'KeyZ':
                key[0] = key[0] < 0 ? 0 : key[0];
                break;
            case 'ArrowDown':
            case 'KeyS':
                key[0] = key[0] > 0 ? 0 : key[0];
                break;
            case 'ArrowLeft':
            case 'KeyA':
            case 'KeyQ':
                key[1] = key[1] < 0 ? 0 : key[1];
                break;
            case 'ArrowRight':
            case 'KeyD':
                key[1] = key[1] > 0 ? 0 : key[1];
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                key[2] = 0;
                break;
        }
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
}
