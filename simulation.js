// Import necessary modules and functions
import { dataState, initArrays } from './state.js';
import { DiffParams, Grid } from './config.js';


// Web Worker for diffusion calculations

const MAX_WORKERS = navigator.hardwareConcurrency || 4;
console.log("Max Workers", MAX_WORKERS);
const diffusionWorker = new Worker('diffusionWorker.js', { type: 'module' });
let isWorkerBusy = false; // Flag to track if the worker is busy

/**
 * Request diffusion calculation from the Web Worker.
 * @param {Array} concentration1 - Current concentration data.
 */
export const requestDiffusionCalculation = (concentration1) => {
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
    dataState.steadyState = steadyState;
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
export const updateSimulation = () => {
    // Update the surface mesh with the current concentration data



    if (!dataState.steadyState) {
        dataState.lastConcentrationData = dataState.currentConcentrationData;
        requestDiffusionCalculation(dataState.currentConcentrationData);
         
    } else if (dataState.init && dataState.steadyState) {
        handleSteadyState();
    }
};

/**
 * Handle actions when steady state is reached.
 */
export const handleSteadyState = () => {
    dataState.init = false;
    const time1 = performance.now();
    const elapsedTime = time1 - dataState.time0;
    dataState.steadyStateTimes.push(elapsedTime);
    dataState.steadyStateSteps.push(dataState.currentTimeStep);

    console.log(`Run ${dataState.runCount + 1}: It took ${elapsedTime} milliseconds to reach steady state.`);

    dataState.runCount++;
    resetSimulation();
};

/**
 * Reset the simulation for a new run.
 */
export const resetSimulation = () => {
    dataState.currentTimeStep = 0; // Reset animation state
    initArrays(); // Reinitialize arrays with new random sources and sinks

    dataState.init = true;
    dataState.steadyState = false;
    dataState.time0 = performance.now(); // Record start time for the new run
};

/**
 * Initialize the simulation.
 */
export const initSimulation = () => {
    console.log("Starting automatic simulation runs...");
    dataState.runCount = 0;
    dataState.steadyStateTimes = [];
    dataState.steadyStateSteps = [];
    
    initArrays();
    dataState.time0 = performance.now();
    dataState.init = true;
};
