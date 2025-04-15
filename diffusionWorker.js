import { diffusionCore } from './diffusionCore.js';

// Message handler for worker
self.onmessage = function(e) {
    const { 
        concentration1,
        sources, 
        sinks,
        constants,
        DIFFUSION_RATE,
        deltaX,
        deltaT,
        method,         
    } = e.data;
    
    // Perform diffusion calculation
    const result1 = diffusionCore(
        concentration1, 
        sources, 
        sinks, 
        constants,
        DIFFUSION_RATE,
        deltaX,
        deltaT,
        method
    );

   

    
    // Send result back to main thread
    self.postMessage({
        currentConcentrationData: result1.currentConcentrationData,
        
    });
};
