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
 */
export const requestDiffusionCalculation = (concentration1,
    sources,
    sinks,
     deltaX,
     deltaT,
     timeLapse,
     diffusionRate,
     method,
     dataState) => {
    if (isWorkerBusy) return; // Skip if the worker is busy

    isWorkerBusy = true;
    globalDataState = dataState; // Store reference to dataState


    
   
    diffusionWorker.postMessage({
        concentration1,
        sources,
        sinks,
        DIFFUSION_RATE: diffusionRate, // Keep the same property name expected by the worker
        diffusionRate,
        deltaX,
        deltaT,
        method: method,
        timeLapse: timeLapse,
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
 * @returns {boolean} The steady state flag.
 */
export const updateSimulation = (dataState, diffParams) => {
    // Update the surface mesh with the current concentration data
    if (!dataState.steadyState) {
        dataState.lastConcentrationData = dataState.currentConcentrationData;
         // Extract diffusion parameters
         const concentration = dataState.currentConcentrationData;
        const  deltaX  = diffParams.DELTA_X;
        const  deltaT  = diffParams.DELTA_T;
        const  timeLapse = diffParams.TIME_LAPSE;
        const  diffusionRate = diffParams.DIFFUSION_RATE;
        const  method = diffParams.METHOD; 
        const  sources = dataState.sources
        const  sinks  = dataState.sinks

        requestDiffusionCalculation(concentration,
            sources,
            sinks,
            deltaX,
            deltaT,
            timeLapse,
            diffusionRate,
            method,
             dataState);
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
