import { diffusionCore } from './diffusionCore.js';

// Message handler for worker
self.onmessage = function(e) {
    const { 
        concentration1,
        concentration2, 
        sources, 
        sinks,
        constants,
        DIFFUSION_RATE,
        deltaX,
        deltaT,
         
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
        constants.method
    );

    const result2 = diffusionCore(
        concentration2, 
        sources, 
        sinks, 
        constants,
        DIFFUSION_RATE,
        deltaX,
        deltaT,
        constants.method
    );

    
    // Send result back to main thread
    self.postMessage({
        currentConcentrationData: result1.currentConcentrationData,
        currentConcentrationData2: result2.currentConcentrationData,
    });
};
