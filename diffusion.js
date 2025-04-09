
import { dataState, constants,animationState } from './state.js';
/**
 * Perform diffusion simulation step
 * @returns {[Float32Array, Float32Array]} Updated concentration data
 */
export const diffusion = (
   
) => {
    const { WIDTH, HEIGHT } = constants.GRID;
    const {DIFFUSION_RATE, deltaX, deltaT} = constants;
     let { 
            currentConcentrationData, 
            nextConcentrationData, 
            sources, 
            sinks 
        } = dataState;

    for (let i = 0; i < constants.numberOfStepsPerSecond; i++) {
        // Diffusion calculation with source/sink terms
        for (let y = 1; y < HEIGHT - 1; y++) {
            for (let x = 1; x < WIDTH - 1; x++) {
                const idx = y * WIDTH + x;

                const DiffusionParam = DIFFUSION_RATE * deltaT / (deltaX ** 2);

                // Diffusion term (5-point stencil)
                const diffusionTerm = DiffusionParam * (
                    currentConcentrationData[(y - 1) * WIDTH + x] +
                    currentConcentrationData[(y + 1) * WIDTH + x] +
                    currentConcentrationData[y * WIDTH + (x - 1)] +
                    currentConcentrationData[y * WIDTH + (x + 1)] -
                    4 * currentConcentrationData[idx]
                );

                // Source and sink terms
                const sourceTerm = sources[idx] * 0.1;
                const sinkTerm = sinks[idx] * currentConcentrationData[idx];

                // Update concentration
                nextConcentrationData[idx] = currentConcentrationData[idx] + diffusionTerm + sourceTerm - sinkTerm;
            }
        }

        // Reflective and absorbant boundary conditions
        for (let i = 0; i < WIDTH; i++) {
            // Top and bottom boundaries
            nextConcentrationData[i] = nextConcentrationData[WIDTH + i];
            nextConcentrationData[(HEIGHT - 1) * WIDTH + i] = nextConcentrationData[(HEIGHT - 2) * WIDTH + i];
        }

        for (let i = 0; i < HEIGHT; i++) {
            // Left and right boundaries
            nextConcentrationData[i * WIDTH] = nextConcentrationData[i * WIDTH + 1];
            nextConcentrationData[i * WIDTH + WIDTH - 1] = nextConcentrationData[i * WIDTH + WIDTH - 2];
        }

        // switch current and next concentration data using destructuring
        [currentConcentrationData, nextConcentrationData] = [nextConcentrationData, currentConcentrationData];
    }
    animationState.currentTimeStep++;
    return [nextConcentrationData, currentConcentrationData];
};