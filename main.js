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
import { dataState, initArrays } from './state.js';
import { diffParams, sceneConf } from './config.js';

/**
 * Handle actions when steady state is reached.
 */
const handleSteadyState = (dataState) => {
    dataState.init = false;
    const time1 = performance.now();
    const elapsedTime = time1 - dataState.time0;
    dataState.steadyStateTimes.push(elapsedTime);
    dataState.steadyStateSteps.push(dataState.currentTimeStep);

    console.log(`Run ${dataState.runCount + 1}: It took ${elapsedTime} milliseconds to reach steady state.`);

    dataState.runCount++;
    resetSimulation(dataState);
};

/**
 * Reset the simulation for a new run.
 */
const resetSimulation = (dataState) => {
    dataState.currentTimeStep = 0; // Reset animation state
    initArrays(diffParams, sceneConf); // Reinitialize arrays with new random sources and sinks

    dataState.init = true;
    dataState.steadyState = false;
    dataState.time0 = performance.now(); // Record start time for the new run
};

/**
 * Run a simulation step and check for steady state.
 */
export const runSimulationStep = (dataState, diffParams) => {
    // Run the simulation step
    updateSimulation(dataState, diffParams, sceneConf);
    
    // Check if steady state has been reached
    if (dataState.init && dataState.steadyState) {
        handleSteadyState(dataState);
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

    resetSimulation(dataState); // Explicitly call resetSimulation after initialization
    animate();
});
