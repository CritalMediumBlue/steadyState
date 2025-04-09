/**
 * Core diffusion simulation function
 * @param {Float32Array} currentData - Current concentration data
 * @param {Float32Array} nextData - Next concentration data buffer
 * @param {Float32Array} sources - Source terms
 * @param {Float32Array} sinks - Sink terms
 * @param {Object} constants - Simulation constants
 * @param {number} numberOfStepsPerSecond - Number of simulation steps per second
 * @param {number} DIFFUSION_RATE - Diffusion rate
 * @param {number} deltaX - Spatial step size
 * @param {number} deltaT - Time step size
 * @returns {Object} Updated concentration data
 */
export function diffusionCore(
    currentData, 
    nextData, 
    sources, 
    sinks, 
    constants,
    numberOfStepsPerSecond,
    DIFFUSION_RATE,
    deltaX,
    deltaT
) {
    const { WIDTH, HEIGHT } = constants.GRID;

    // Create copies of input arrays to avoid modifying originals if needed
    let current = new Float32Array(currentData);
    let next = new Float32Array(nextData);

    for (let i = 0; i < numberOfStepsPerSecond; i++) {
        // Diffusion calculation with source/sink terms
        for (let y = 1; y < HEIGHT - 1; y++) {
            for (let x = 1; x < WIDTH - 1; x++) {
                const idx = y * WIDTH + x;

                const DiffusionParam = DIFFUSION_RATE * deltaT / (deltaX ** 2);

                // Diffusion term (5-point stencil)
                const diffusionTerm = DiffusionParam * (
                    current[(y - 1) * WIDTH + x] +
                    current[(y + 1) * WIDTH + x] +
                    current[y * WIDTH + (x - 1)] +
                    current[y * WIDTH + (x + 1)] -
                    4 * current[idx]
                );

                // Source and sink terms
                const sourceTerm = sources[idx] * 0.1;
                const sinkTerm = sinks[idx] * current[idx];

                // Update concentration
                next[idx] = current[idx] + diffusionTerm + sourceTerm - sinkTerm;
            }
        }

        // Reflective and absorbant boundary conditions
        for (let i = 0; i < WIDTH; i++) {
            // Top and bottom boundaries
            next[i] = next[WIDTH + i];
            next[(HEIGHT - 1) * WIDTH + i] = next[(HEIGHT - 2) * WIDTH + i];
        }

        for (let i = 0; i < HEIGHT; i++) {
            // Left and right boundaries
            next[i * WIDTH] = next[i * WIDTH + 1];
            next[i * WIDTH + WIDTH - 1] = next[i * WIDTH + WIDTH - 2];
        }

        // Switch current and next concentration data
        [current, next] = [next, current];
    }

    return {
        currentConcentrationData: current,
        nextConcentrationData: next
    };
}
