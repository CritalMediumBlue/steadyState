// Import necessary modules and functions
import { setupNewScene, scene,
    updateScene,
} from './scene/sceneManager.js';
import {
     updateSimulation, 
     initSimulation 
     } from './simulation.js';
import { dataState} from './state.js';


/**
 * Animation loop to update the scene and handle simulation steps.
 */
const animate = () => {
    if (!dataState.init) {
        dataState.time0 = performance.now();
        dataState.init = true;
    }

    scene.animationFrameId = requestAnimationFrame(animate);

    updateSimulation();
    updateScene(dataState);
   
};

// Initialize the scene and start the animation loop when the page loads
window.addEventListener('load', () => {
    setupNewScene();
    initSimulation();
    animate();
});
