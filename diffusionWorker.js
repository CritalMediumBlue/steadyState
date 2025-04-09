// Diffusion Worker for parallel computation of concentration data

// Diffusion calculation function
function diffusion(
    currentConcentrationData, 
    nextConcentrationData, 
    sources, 
    sinks, 
    constants,
    numberOfStepsPerSecond,
    DIFFUSION_RATE,
    deltaX,
    deltaT
) {
    const { WIDTH, HEIGHT } = constants.GRID;

    // Create copies of input arrays to avoid modifying originals
    let currentData = new Float32Array(currentConcentrationData);
    let nextData = new Float32Array(nextConcentrationData);

    for (let i = 0; i < numberOfStepsPerSecond; i++) {
        // Diffusion calculation with source/sink terms
        for (let y = 1; y < HEIGHT - 1; y++) {
            for (let x = 1; x < WIDTH - 1; x++) {
                const idx = y * WIDTH + x;

                const DiffusionParam = DIFFUSION_RATE * deltaT / (deltaX ** 2);

                // Diffusion term (5-point stencil)
                const diffusionTerm = DiffusionParam * (
                    currentData[(y - 1) * WIDTH + x] +
                    currentData[(y + 1) * WIDTH + x] +
                    currentData[y * WIDTH + (x - 1)] +
                    currentData[y * WIDTH + (x + 1)] -
                    4 * currentData[idx]
                );

                // Source and sink terms
                const sourceTerm = sources[idx] * 0.1;
                const sinkTerm = sinks[idx] * currentData[idx];

                // Update concentration
                nextData[idx] = currentData[idx] + diffusionTerm + sourceTerm - sinkTerm;
            }
        }

        // Reflective and absorbant boundary conditions
        for (let i = 0; i < WIDTH; i++) {
            // Top and bottom boundaries
            nextData[i] = nextData[WIDTH + i];
            nextData[(HEIGHT - 1) * WIDTH + i] = nextData[(HEIGHT - 2) * WIDTH + i];
        }

        for (let i = 0; i < HEIGHT; i++) {
            // Left and right boundaries
            nextData[i * WIDTH] = nextData[i * WIDTH + 1];
            nextData[i * WIDTH + WIDTH - 1] = nextData[i * WIDTH + WIDTH - 2];
        }

        // Switch current and next concentration data
        [currentData, nextData] = [nextData, currentData];
    }

    return {
        currentConcentrationData: currentData,
        nextConcentrationData: nextData
    };
}

// Message handler for worker
self.onmessage = function(e) {
    const { 
        currentConcentrationData, 
        nextConcentrationData, 
        sources, 
        sinks,
        constants,
        numberOfStepsPerSecond,
        DIFFUSION_RATE,
        deltaX,
        deltaT
    } = e.data;
    
    // Perform diffusion calculation
    const result = diffusion(
        currentConcentrationData, 
        nextConcentrationData, 
        sources, 
        sinks, 
        constants,
        numberOfStepsPerSecond,
        DIFFUSION_RATE,
        deltaX,
        deltaT
    );
    
    // Send result back to main thread
    self.postMessage(result);
};
