import { solveADI, solveFTCS } from './diffusionCore.js';

// Message handler for worker
self.onmessage = function(e) {
    const { 
        concentration1,
        sources, 
        sinks,
        DIFFUSION_RATE,
        deltaX,
        deltaT,
        method, 
        timeLapse        
    } = e.data;
    
    try {
        // Directly call the appropriate solver
        const results = method === "FTCS" 
            ? solveFTCS(concentration1, sources, sinks, DIFFUSION_RATE, deltaX, timeLapse, deltaT)
            : solveADI(concentration1, sources, sinks, DIFFUSION_RATE, deltaX, timeLapse);

        // Send result back to main thread
        self.postMessage({
            currentConcentrationData: results.currentConcentrationData,
            steadyState: results.steadyState,
        });
    } catch (error) {
        // Send error back to main thread
        self.postMessage({ error: error.message });
    }
};


