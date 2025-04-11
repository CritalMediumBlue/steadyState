import { dataState, constants, animationState } from './state.js';
import { diffusionCore } from './diffusionCore.js';

/**
 * Perform diffusion simulation step
 * @param {string} [method='FTCS'] - Numerical method to use for diffusion
 * @returns {[Float32Array, Float32Array]} Updated concentration data
 */
export const diffusion = ( ) => {
    const { 
        currentConcentrationData, 
        nextConcentrationData, 
        sources, 
        sinks 
    } = dataState;

    const {
        DIFFUSION_RATE,
        deltaX,
        deltaT,
        method
    } = constants;

    const result = diffusionCore(
        currentConcentrationData, 
        nextConcentrationData, 
        sources, 
        sinks, 
        constants,
        DIFFUSION_RATE,
        deltaX,
        deltaT,
        method
    );

    // Update data state
    dataState.currentConcentrationData = result.currentConcentrationData;
    dataState.nextConcentrationData = result.nextConcentrationData;

    animationState.currentTimeStep++;
    return [result.nextConcentrationData, result.currentConcentrationData];
};
