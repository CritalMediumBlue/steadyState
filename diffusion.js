import { dataState, constants, animationState } from './state.js';
import { diffusionCore } from './diffusionCore.js';

/**
 * Perform diffusion simulation step
 * @param {string} [method='FTCS'] - Numerical method to use for diffusion
 * @returns {[Float32Array, Float32Array]} Updated concentration data
 */
export const diffusion = (concentration,method,timeLapse) => {
    const { 
        sources, 
        sinks 
    } = dataState;

    const {
        DIFFUSION_RATE,
        deltaX,
        deltaT,
        
    } = constants;

    const result = diffusionCore(
        concentration, 
        sources, 
        sinks, 
        constants,
        DIFFUSION_RATE,
        deltaX,
        deltaT,
        method,
        timeLapse
    );

    animationState.currentTimeStep++;
    return [result.currentConcentrationData, result.steadyState];
};
