import { diffusionCore } from './diffusionCore.js';

// Message handler for worker
self.onmessage = function(e) {
    const { 
        concentration, 
        sources, 
        sinks,
        constants,
        DIFFUSION_RATE,
        deltaX,
        deltaT,
         
    } = e.data;
    
    // Perform diffusion calculation
    const result = diffusionCore(
        concentration, 
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
