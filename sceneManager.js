import { setupScene } from './sceneSetup.js';
import { sceneState } from './state.js';
import { initArrays } from './state.js';

/**
 * Setup new scene and initialize simulation arrays
 */
export const setupNewScene = () => {
    const setup = setupScene();
    Object.assign(sceneState, setup);
    document.getElementById('scene-container').appendChild(sceneState.renderer.domElement);
    
    // Initialize simulation arrays
    initArrays();
};
