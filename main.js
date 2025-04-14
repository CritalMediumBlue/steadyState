import { setupNewScene } from './sceneManager.js';
import { updateSurfaceMesh } from './meshUpdater.js';
import { updateLoggsOverlay, setOverlayData } from './overlayManager.js';
import { sceneState, animationState, dataState, constants } from './state.js';
import { diffusion } from './diffusion.js';
import { initArrays } from './state.js';

export let stop = false;
let runCount = 0;
let steadyStateTimes = [];
let maxRuns = Infinity; // Default to infinite runs
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
const requestDiffusionCalculation = () => {
    if (isWorkerBusy) return;

    isWorkerBusy = true;
    const { 
        currentConcentrationData, 
        sources, 
        sinks
         
    } = dataState;

    const {
        DIFFUSION_RATE,
        deltaX,
        deltaT,
    } = constants;

    diffusionWorker.postMessage({
        currentConcentrationData,
        sources,
        sinks,
        constants,
        DIFFUSION_RATE,
        deltaX,
        deltaT,
    });
};

// Set up worker message handler
diffusionWorker.onmessage = function(e) {
    const { currentConcentrationData } = e.data;
    
    // Update data state with worker results
    dataState.currentConcentrationData = currentConcentrationData;
    
    animationState.currentTimeStep++;
    steadyState = checkForSteadyState();
    
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
    stop = updateSurfaceMesh();
    
    // Update overlay with current run data
    setOverlayData(runCount, steadyStateTimes, maxRuns, autoRestart);
    updateLoggsOverlay();

    if(!steadyState && !stop) {
        if (constants.parallelization) {
            requestDiffusionCalculation();  //uncomment this line to use the worker instead of the main thread
            
        } else {
            [dataState.currentConcentrationData] = diffusion();
            //steadyState = checkForSteadyState();
        }
        
    } else if (init && steadyState) {
        init = false;
        const time1 = performance.now();
        const elapsedTime = time1 - time0;
        steadyStateTimes.push(elapsedTime);
        
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
        return;
    }
    
    // Reset animation state
    animationState.currentTimeStep = 0;
    
    // Reinitialize arrays with new random sources and sinks
    initArrays();
    
    // Reset flags
    init = true;
    steadyState = false;
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



const checkForSteadyState = () => { 
    const { currentConcentrationData, nextConcentrationData } = dataState;
    const threshold = 0.000004; // Define a threshold for steady state
    steadyState = false;
    let errorAccumulated = 0;
    for (let i = 0; i < currentConcentrationData.length; i++) {
        const diff = Math.abs(currentConcentrationData[i] - nextConcentrationData[i]);
        errorAccumulated += diff;
    }
    errorAccumulated /= currentConcentrationData.length;
    steadyState = errorAccumulated < threshold;
    return steadyState;
}

/**
 * Animation loop
 */
let init = false;
let steadyState = false;
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
    
    // Add keyboard controls for the simulation
    document.addEventListener('keydown', (event) => {
        switch(event.key) {
            case 'r': // Reset and restart simulation
                console.log("Manual restart triggered");
                runCount = 0;
                steadyStateTimes = [];
                setupNewScene();
                init = false; // Force reinitialization
                animate();
                break;
            case 's': // Toggle automatic restarting
                autoRestart = !autoRestart;
                console.log(`Automatic restarting ${autoRestart ? 'enabled' : 'disabled'}`);
                // Update overlay immediately to show the change
                setOverlayData(runCount, steadyStateTimes, maxRuns, autoRestart);
                updateLoggsOverlay();
                break;
            case '1': case '2': case '3': case '4': case '5':
            case '6': case '7': case '8': case '9':
                // Set max runs (1-9)
                maxRuns = parseInt(event.key);
                console.log(`Maximum runs set to: ${maxRuns}`);
                // Update overlay immediately to show the change
                setOverlayData(runCount, steadyStateTimes, maxRuns, autoRestart);
                updateLoggsOverlay();
                break;
            case '0':
                // Infinite runs
                maxRuns = Infinity;
                console.log("Maximum runs set to: Infinite");
                // Update overlay immediately to show the change
                setOverlayData(runCount, steadyStateTimes, maxRuns, autoRestart);
                updateLoggsOverlay();
                break;
        }
    });
    
    setupNewScene();
    animate();
});
