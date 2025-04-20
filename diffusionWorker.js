import { diffusionCore } from './diffusionCore.js';

// Message handler for worker
self.onmessage = function(e) {
    const { 
        concentration1,
        sources, 
        sinks,
        DiffParams,
        DIFFUSION_RATE,
        deltaX,
        deltaT,
        method, 
        timeLapse        
    } = e.data;
    
    // Perform diffusion calculation
    const result1 = diffusionCore(
        concentration1, 
        sources, 
        sinks, 
        DiffParams,
        DIFFUSION_RATE,
        deltaX,
        deltaT,
        method,
        timeLapse
    );

   

    
    // Send result back to main thread
    self.postMessage({
        currentConcentrationData: result1.currentConcentrationData,
        steadyState: result1.steadyState,
        
    });
};
