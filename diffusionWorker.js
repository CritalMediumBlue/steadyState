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
        method1,
        method2
         
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
        method1
    );

    const result2 = diffusionCore(
        concentration2, 
        sources, 
        sinks, 
        constants,
        DIFFUSION_RATE,
        deltaX,
        deltaT,
        method2
    );

    
    // Send result back to main thread
    self.postMessage({
        currentConcentrationData: result1.currentConcentrationData,
        currentConcentrationData2: result2.currentConcentrationData,
    });
};
