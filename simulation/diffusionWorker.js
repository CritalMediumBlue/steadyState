import { solveADI, solveFTCS } from './diffusionCore.js';

// Message handler for worker
self.onmessage = function(e) {
    const { 
        concentration1,
        sources, 
        sinks,
        diffusionRate,
        deltaX,
        deltaT,
        method, 
        timeLapse, 
        
    } = e.data;
    
    // Perform diffusion calculation
    const results = diffusionCore(
        concentration1, 
        sources, 
        sinks, 
        diffusionRate,
        deltaX,
        deltaT,
        method,
        timeLapse,
        
    );

   

    
    // Send result back to main thread
    self.postMessage({
        currentConcentrationData: results.currentConcentrationData,
        steadyState: results.steadyState,
        
    });
};


function diffusionCore(
    concentrationData, 
    sources, 
    sinks, 
    diffusionRate, 
    deltaX, 
    deltaT, 
    method,
    timeLapse,
    
) {
    // Select the appropriate solver based on the method parameter
    switch (method) {
        case "FTCS":
            return solveFTCS(concentrationData, sources, sinks, diffusionRate, deltaX, timeLapse, deltaT);
        case "ADI":
            return solveADI(concentrationData, sources, sinks, diffusionRate, deltaX, timeLapse);
        default:
            throw new Error(`Unknown diffusion method: ${method}. Supported methods are "FTCS" and "ADI".`);
    }
}
