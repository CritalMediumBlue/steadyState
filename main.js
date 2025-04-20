// Import necessary modules and functions
import { scene,
    updateScene,
} from './scene/sceneManager.js';
import {
     updateSimulation, 
     initSimulation 
     } from './simulation.js';
import { dataState} from './state.js';
import { SceneConf } from './config.js';


/**
 * Animation loop to update the scene and handle simulation steps.
 */
const animate = () => {
    if (!dataState.init) {
        dataState.time0 = performance.now();
        dataState.init = true;
    }

    scene.animationFrameId = requestAnimationFrame(animate);

    updateSimulation(dataState);
    updateScene(dataState,SceneConf);
   
};

// Initialize the scene and start the animation loop when the page loads
window.addEventListener('load', () => {
    initSimulation();
    animate();
});
