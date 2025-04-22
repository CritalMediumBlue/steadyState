// Import necessary modules and functions
import { scene,
    updateScene,
    setupNewScene,
    createMesh
} from './scene/sceneManager.js';
import {
     updateSimulation, 
     initSimulation,
     } from './simulation/simulationManager.js';
import { dataState, resetState, handleSteadyStateReached } from './state/stateManager.js';
import { diffParams, sceneConf } from './config.js';

/**
 * Run a simulation step and check for steady state.
 */
export const runSimulationStep = (dataState, diffParams) => {
    // Run the simulation step
    updateSimulation(dataState, diffParams, sceneConf);
    
    // Check if steady state has been reached
    if (dataState.init && dataState.steadyState) {
        handleSteadyStateReached(diffParams, sceneConf);
    }
};

/**
 * Animation loop to update the scene and handle simulation steps.
 */
const animate = () => {
    if (!dataState.init) {
        dataState.time0 = performance.now();
        dataState.init = true;
    }

    scene.animationFrameId = requestAnimationFrame(animate);

    // Run simulation step and check for steady state
    runSimulationStep(dataState, diffParams);
    updateScene(dataState, sceneConf,diffParams);
};

// Initialize the scene and start the animation loop when the page loads
window.addEventListener('load', () => {
    // Set up the scene
    setupNewScene(sceneConf,  diffParams);

    createMesh(diffParams.WIDTH, diffParams.HEIGHT);
    initSimulation(dataState);

    resetState(diffParams, sceneConf); // Use resetState from stateManager
    animate();
});
