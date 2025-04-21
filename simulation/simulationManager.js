// Web Worker for diffusion calculations

const MAX_WORKERS = navigator.hardwareConcurrency || 4;
console.log("Max Workers", MAX_WORKERS);
const diffusionWorker = new Worker('./simulation/diffusionWorker.js', { type: 'module' });
let isWorkerBusy = false; // Flag to track if the worker is busy
let globalDataState = null; // Store a reference to the dataState object

/**
 * Request diffusion calculation from the Web Worker.
 * @param {Array} concentration1 - Current concentration data.
 * @param {Object} diffParams - Diffusion parameters.
 * @param {Object} dataState - Current state data.
 * @param {Object} sceneConf - Scene configuration.
 */
export const requestDiffusionCalculation = (concentration1, diffParams, dataState, sceneConf) => {
    if (isWorkerBusy) return; // Skip if the worker is busy

    isWorkerBusy = true;
    globalDataState = dataState; // Store reference to dataState

    const { sources, sinks } = dataState;
    const { DELTA_X: deltaX, DELTA_T: deltaT, DIFFUSION_RATE } = diffParams;

    diffusionWorker.postMessage({
        concentration1,
        sources,
        sinks,
        diffParams, // Pass the entire diffParams object
        DIFFUSION_RATE,
        deltaX,
        deltaT,
        method: diffParams.METHOD,
        timeLapse: diffParams.TIME_LAPSE,
        sceneConf  // Pass the entire sceneConf object
    });
};

// Handle messages from the Web Worker
diffusionWorker.onmessage = function(e) {
    const { currentConcentrationData, steadyState } = e.data;

    if (globalDataState) {
        globalDataState.currentConcentrationData = currentConcentrationData;
        globalDataState.steadyState = steadyState;
        globalDataState.currentTimeStep++;
    }
    isWorkerBusy = false;
};

// Handle errors from the Web Worker
diffusionWorker.onerror = function(error) {
    console.error('Diffusion Worker Error:', error);
    isWorkerBusy = false;
};

/**
 * Update the scene for the current time step.
 * @param {Object} dataState - Current state data.
 * @param {Object} diffParams - Diffusion parameters.
 * @param {Object} sceneConf - Scene configuration.
 * @returns {boolean} The steady state flag.
 */
export const updateSimulation = (dataState, diffParams, sceneConf) => {
    // Update the surface mesh with the current concentration data
    if (!dataState.steadyState) {
        dataState.lastConcentrationData = dataState.currentConcentrationData;
        requestDiffusionCalculation(dataState.currentConcentrationData, diffParams, dataState, sceneConf);
    }
    
    return dataState.steadyState;  // Return steady state flag to inform the caller
};

/**
 * Initialize the simulation.
 * This is just a stub that will be called from main.js
 */
export const initSimulation = (dataState) => {
    console.log("Starting automatic simulation runs...");
    dataState.runCount = 0;
    dataState.steadyStateTimes = [];
    dataState.steadyStateSteps = [];
};
