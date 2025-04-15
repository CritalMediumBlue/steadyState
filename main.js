import { setupNewScene } from './sceneManager.js';
import { updateSurfaceMesh } from './meshUpdater.js';
import { updateLoggsOverlay, setOverlayData } from './overlayManager.js';
import { sceneState, animationState, dataState, constants } from './state.js';
import { diffusion } from './diffusion.js';
import { initArrays } from './state.js';

export let stop = false;
let runCount = 0;
let steadyStateTimes = [];
let steadyStateSteps = [];
let maxRuns = 200; // Default to infinite runs
let autoRestart = true; // Flag to control automatic restarting
const DIFFUSION_RATE = 100; // micrometers squared per seconds
const deltaX = 1; // micrometers
const deltaT = 1.0* (Math.pow(deltaX, 2)) / (4 * DIFFUSION_RATE); // seconds
const numberOfStepsPerSecond = Math.round(1 / deltaT); // steps per second

console.log("numberOfStepsPerSecond", numberOfStepsPerSecond);
console.log("deltaT", deltaT);

constants.DIFFUSION_RATE = DIFFUSION_RATE;
constants.deltaX = deltaX;
constants.deltaT = deltaT;
constants.numberOfStepsPerSecond = numberOfStepsPerSecond;

//constants.method = "FTCS"; 
constants.method = "ADI"; 
constants.parallelization = true;


// Create Web Worker for diffusion calculations
const diffusionWorker = new Worker('diffusionWorker.js', { type: 'module' });

// Flag to track if worker is currently processing
let isWorkerBusy = false;

/**
 * Request diffusion calculation from Web Worker
 */
const requestDiffusionCalculation = (concentration1) => {
    if (isWorkerBusy) return;

    isWorkerBusy = true;
    const { 
        
        sources, 
        sinks
         
    } = dataState;

    const {
        DIFFUSION_RATE,
        deltaX,
        deltaT,
    } = constants;

    diffusionWorker.postMessage({
        concentration1,
        sources,
        sinks,
        constants,
        DIFFUSION_RATE,
        deltaX,
        deltaT,
        method: constants.method,
    });
};

// Set up worker message handler
diffusionWorker.onmessage = function(e) {
    const { currentConcentrationData } = e.data;
    
     
        dataState.currentConcentrationData = currentConcentrationData;
     
      
    animationState.currentTimeStep++;
    steadyState1 = checkForSteadyState(dataState.lastConcentrationData, dataState.currentConcentrationData);
    
    isWorkerBusy = false;
};

// Error handling for worker
diffusionWorker.onerror = function(error) {
    console.error('Diffusion Worker Error:', error);
    isWorkerBusy = false;
};

/**
 * Update the scene for the current time step
 */
const updateScene = () => {
    // Update surface mesh
    stop = updateSurfaceMesh(sceneState.surfaceMesh, dataState.currentConcentrationData);

    
    // Update overlay with current run data
    setOverlayData(runCount, steadyStateTimes,steadyStateSteps, maxRuns, autoRestart);
    updateLoggsOverlay();

    if(!steadyState1 && !stop ) {
        if (constants.parallelization) {
            dataState.lastConcentrationData = dataState.currentConcentrationData
            requestDiffusionCalculation(dataState.currentConcentrationData); 
            
        } else {
            dataState.lastConcentrationData = dataState.currentConcentrationData;


            [dataState.currentConcentrationData] = diffusion(dataState.currentConcentrationData,constants.method);
            steadyState1 = checkForSteadyState(dataState.currentConcentrationData, dataState.lastConcentrationData);
        }
        
    } else if (init && steadyState1) {
        init = false;
        const time1 = performance.now();
        const elapsedTime = time1 - time0;
        steadyStateTimes.push(elapsedTime);
        steadyStateSteps.push(animationState.currentTimeStep);
        
        console.log(`Run ${runCount + 1}: It took ${elapsedTime} milliseconds to reach steady state.`);
        
        // Increment run counter
        runCount++;
        
        // Reset simulation for next run
        resetSimulation();
    }

    
};

/**
 * Reset the simulation for a new run
 */
const resetSimulation = () => {
    // Check if we've reached the maximum number of runs
    if (runCount >= maxRuns || !autoRestart) {
        console.log(`Completed ${runCount} runs. Stopping automatic simulation.`);
        // Don't restart, just stop
        stop = true;
        console.log(steadyStateTimes);
        console.log(steadyStateSteps);
        return;
    }
    
    // Reset animation state
    animationState.currentTimeStep = 0;
    
    // Reinitialize arrays with new random sources and sinks
    initArrays();
    
    // Reset flags
    init = true;
    steadyState1 = false;
    stop = false;
    
    // Record start time for new run
    time0 = performance.now();
    
    console.log(`Starting run ${runCount + 1}...`);
};

/**
 * Set the maximum number of runs
 * @param {number} max - Maximum number of runs to perform
 */
export const setMaxRuns = (max) => {
    maxRuns = max;
    console.log(`Maximum runs set to: ${max}`);
};

/**
 * Toggle automatic restarting
 * @param {boolean} enabled - Whether automatic restarting is enabled
 */
export const setAutoRestart = (enabled) => {
    autoRestart = enabled;
    console.log(`Automatic restarting ${enabled ? 'enabled' : 'disabled'}`);
};



const checkForSteadyState = (previous, next, steadyState) => {
    const threshold = 0.0005; // Define a threshold for steady state

    steadyState = false;
    let errorAccumulated = 0;
    for (let i = 0; i < previous.length; i++) {
        const diff = Math.pow((previous[i] - next[i]), 2);
        errorAccumulated += diff;
    }
    errorAccumulated ;
    steadyState = errorAccumulated < threshold;
    //console.log("errorAccumulated", errorAccumulated);
    return steadyState;
}

/**
 * Animation loop
 */
let init = false;
let steadyState1 = false;
let time0 = 0;  
const animate = () => {
    if (!init){
        time0 = performance.now();
        init = true;
    }
    

    animationState.animationFrameId = requestAnimationFrame(animate);
    // Render every frame
    sceneState.renderer.render(sceneState.scene, sceneState.camera);
    if (!stop) {
        updateScene();
    } else {
        cancelAnimationFrame(animationState.animationFrameId);
        console.log("Simulation stopped due to NaN values.");
    }
};
// Setup scene and start animation when the page loads
window.addEventListener('load', () => {
    console.log("Starting automatic simulation runs...");
    runCount = 0;
    steadyStateTimes = [];
    steadyStateSteps = [];
 
    setupNewScene();
    animate();
});
