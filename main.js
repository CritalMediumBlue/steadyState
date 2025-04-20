// Import necessary modules and functions
import { setupNewScene, sceneState } from './sceneManager.js';
import { updateSurfaceMesh } from './meshUpdater.js';
import { updateLoggsOverlay } from './overlayManager.js';
import { dataState, initArrays } from './state.js';
import { DiffParams, Grid } from './config.js';

// Global variables and constants
export let stop = false; // Flag to stop the simulation
let runCount = 0; // Counter for the number of simulation runs
let steadyStateTimes = []; // Array to store times to reach steady state
let steadyStateSteps = []; // Array to store steps to reach steady state
let maxRuns = 500; // Maximum number of runs (default)

// Log calculated constants
console.log("numberOfStepsPerSecond", DiffParams.STEPS_PER_SECOND);
console.log("deltaT", DiffParams.DELTA_T);
const MAX_WORKERS = navigator.hardwareConcurrency || 4;
console.log("Max Workers", MAX_WORKERS);
// Web Worker for diffusion calculations
const diffusionWorker = new Worker('diffusionWorker.js', { type: 'module' });
let isWorkerBusy = false; // Flag to track if the worker is busy

/**
 * Request diffusion calculation from the Web Worker.
 * @param {Array} concentration1 - Current concentration data.
 */
const requestDiffusionCalculation = (concentration1) => {
    if (isWorkerBusy) return; // Skip if the worker is busy

    isWorkerBusy = true;
    const { sources, sinks } = dataState;
    const { DELTA_X: deltaX, DELTA_T: deltaT, DIFFUSION_RATE } = DiffParams;

    diffusionWorker.postMessage({
        concentration1,
        sources,
        sinks,
        DiffParams,
        DIFFUSION_RATE,
        deltaX,
        deltaT,
        method: DiffParams.METHOD,
        timeLapse: DiffParams.TIME_LAPSE,
    });
};

// Handle messages from the Web Worker
diffusionWorker.onmessage = function(e) {
    const { currentConcentrationData, steadyState } = e.data;

    dataState.currentConcentrationData = currentConcentrationData;
    steadyState1 = steadyState;
    dataState.currentTimeStep++;
    isWorkerBusy = false;
};

// Handle errors from the Web Worker
diffusionWorker.onerror = function(error) {
    console.error('Diffusion Worker Error:', error);
    isWorkerBusy = false;
};

/**
 * Update the scene for the current time step.
 */
const updateScene = () => {
    // Update the surface mesh with the current concentration data
    updateSurfaceMesh(sceneState.surfaceMesh, dataState.currentConcentrationData, Grid.WIDTH, Grid.HEIGHT);

    // Update overlay with current run data
    updateLoggsOverlay({
        currentTimeStep: dataState.currentTimeStep,
        timeLapse: DiffParams.TIME_LAPSE,
        method: DiffParams.METHOD,
        runCount,
        maxRuns,
        steadyStateTimes,
        steadyStateSteps,
    });

    if (!steadyState1 && !stop) {
        dataState.lastConcentrationData = dataState.currentConcentrationData;
        requestDiffusionCalculation(dataState.currentConcentrationData);
         
    } else if (init && steadyState1) {
        handleSteadyState();
    }
};

/**
 * Handle actions when steady state is reached.
 */
const handleSteadyState = () => {
    init = false;
    const time1 = performance.now();
    const elapsedTime = time1 - time0;
    steadyStateTimes.push(elapsedTime);
    steadyStateSteps.push(dataState.currentTimeStep);

    console.log(`Run ${runCount + 1}: It took ${elapsedTime} milliseconds to reach steady state.`);

    runCount++;
    resetSimulation();
};

/**
 * Reset the simulation for a new run.
 */
const resetSimulation = () => {
  

    dataState.currentTimeStep = 0; // Reset animation state
    initArrays(); // Reinitialize arrays with new random sources and sinks

    init = true;
    steadyState1 = false;
    stop = false;
    time0 = performance.now(); // Record start time for the new run
};





// Animation loop variables
let init = false;
let steadyState1 = false;
let time0 = 0; // Start time for the current run

/**
 * Animation loop to update the scene and handle simulation steps.
 */
const animate = () => {
    if (!init) {
        time0 = performance.now();
        init = true;
    }

    sceneState.animationFrameId = requestAnimationFrame(animate);

    // Render the scene
    sceneState.renderer.render(sceneState.scene, sceneState.camera);

    if (!stop) {
        updateScene();
    } else {
        cancelAnimationFrame(sceneState.animationFrameId);
        console.log("Simulation stopped due to NaN values.");
    }
};

// Initialize the scene and start the animation loop when the page loads
window.addEventListener('load', () => {
    console.log("Starting automatic simulation runs...");
    runCount = 0;
    steadyStateTimes = [];
    steadyStateSteps = [];

    setupNewScene();
    initArrays(); 
    animate();
});
