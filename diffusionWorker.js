import { diffusionCore } from './diffusionCore.js';

// Message handler for worker
self.onmessage = function(e) {
    const { 
        currentConcentrationData, 
        nextConcentrationData, 
        sources, 
        sinks,
        constants,
        DIFFUSION_RATE,
        deltaX,
        deltaT,
         
    } = e.data;
    
    // Perform diffusion calculation
    const result = diffusionCore(
        currentConcentrationData, 
        nextConcentrationData, 
        sources, 
        sinks, 
        constants,
        DIFFUSION_RATE,
        deltaX,
        deltaT,
        constants.method
    );
    
    // Send result back to main thread
    self.postMessage(result);
};
