// Import necessary modules and functions
import { setupNewScene } from './sceneManager.js';
import { updateSurfaceMesh } from './meshUpdater.js';
import { updateLoggsOverlay } from './overlayManager.js';
import { sceneState, animationState, dataState } from './state.js';
import { diffusion } from './diffusion.js';
import { initArrays } from './state.js';
import { DiffParams } from './config.js';

// Global variables and constants
export let stop = false; // Flag to stop the simulation
let runCount = 0; // Counter for the number of simulation runs
let steadyStateTimes = []; // Array to store times to reach steady state
let steadyStateSteps = []; // Array to store steps to reach steady state
let counter = 0; // Counter for method switching
let maxRuns = 500; // Maximum number of runs (default)
let autoRestart = true; // Flag to control automatic restarting

// Log calculated constants
console.log("numberOfStepsPerSecond", DiffParams.STEPS_PER_SECOND);
console.log("deltaT", DiffParams.DELTA_T);

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
    animationState.currentTimeStep++;
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
    stop = updateSurfaceMesh(sceneState.surfaceMesh, dataState.currentConcentrationData);

    // Update overlay with current run data
    updateLoggsOverlay({
        currentTimeStep: animationState.currentTimeStep,
        timeLapse: DiffParams.TIME_LAPSE,
        method: DiffParams.METHOD,
        runCount,
        maxRuns,
        steadyStateTimes,
        steadyStateSteps,
        autoRestart
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
    steadyStateSteps.push(animationState.currentTimeStep);

    console.log(`Run ${runCount + 1}: It took ${elapsedTime} milliseconds to reach steady state.`);

    runCount++;
    resetSimulation();
};

/**
 * Reset the simulation for a new run.
 */
const resetSimulation = () => {
    if (runCount >= maxRuns || !autoRestart) {
        finalizeSimulation();
        return;
    }

    animationState.currentTimeStep = 0; // Reset animation state
    initArrays(); // Reinitialize arrays with new random sources and sinks

    init = true;
    steadyState1 = false;
    stop = false;
    time0 = performance.now(); // Record start time for the new run
};

/**
 * Finalize the simulation after completing all runs.
 */
const finalizeSimulation = () => {
    console.log(`Completed ${runCount} runs.`);
    console.log(steadyStateTimes);
    console.log(steadyStateSteps);

    DiffParams.METHOD = DiffParams.METHOD === "FTCS" ? "ADI" : "FTCS";
    console.log("Switching method to", DiffParams.METHOD);

    runCount = 0;
    steadyState1 = false;
    steadyStateTimes = [];
    steadyStateSteps = [];
    counter++;

    console.log("Counter", counter);
    if (counter >= 5) {
        console.log("Stopping simulation after 5 runs.");
        stop = true;
    }
};

/**
 * Toggle automatic restarting.
 * @param {boolean} enabled - Whether automatic restarting is enabled.
 */
export const setAutoRestart = (enabled) => {
    autoRestart = enabled;
    console.log(`Automatic restarting ${enabled ? 'enabled' : 'disabled'}`);
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

    animationState.animationFrameId = requestAnimationFrame(animate);

    // Render the scene
    sceneState.renderer.render(sceneState.scene, sceneState.camera);

    if (!stop) {
        updateScene();
    } else {
        cancelAnimationFrame(animationState.animationFrameId);
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
    animate();
});
