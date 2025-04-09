import { setupNewScene } from './sceneManager.js';
import { updateSurfaceMesh } from './meshUpdater.js';
import { updateLoggsOverlay } from './overlayManager.js';
import { sceneState, animationState, dataState, constants } from './state.js';
import { diffusion } from './diffusion.js';

let stop = false;
const DIFFUSION_RATE = 100; // micrometers squared per seconds
const deltaX = 1; // micrometers
const deltaT = 0.80 * (Math.pow(deltaX, 2)) / (4 * DIFFUSION_RATE); // seconds
const numberOfStepsPerSecond = Math.round(1 / deltaT); // steps per second

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
        nextConcentrationData, 
        sources, 
        sinks 
    } = dataState;

    diffusionWorker.postMessage({
        currentConcentrationData,
        nextConcentrationData,
        sources,
        sinks,
        constants,
        numberOfStepsPerSecond,
        DIFFUSION_RATE,
        deltaX,
        deltaT
    });
};

// Set up worker message handler
diffusionWorker.onmessage = function(e) {
    const { currentConcentrationData, nextConcentrationData } = e.data;
    
    // Update data state with worker results
    dataState.currentConcentrationData = currentConcentrationData;
    dataState.nextConcentrationData = nextConcentrationData;
    
    // Update scene and reset worker busy flag
    stop = updateSurfaceMesh();
    updateLoggsOverlay();
    animationState.currentTimeStep++;
    
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
    updateLoggsOverlay();

   

    //[dataState.currentConcentrationData, dataState.nextConcentrationData] = diffusion()  
    requestDiffusionCalculation();
    
};

/**
 * Animation loop
 */
const animate = () => {
 
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
    setupNewScene();
    animate();
});
