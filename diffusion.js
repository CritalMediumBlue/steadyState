import { dataState, animationState } from './state.js';
import { diffusionCore } from './diffusionCore.js';
import { DiffParams } from './config.js';

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
        DELTA_X: deltaX,
        DELTA_T: deltaT
    } = DiffParams;

    const result = diffusionCore(
        concentration, 
        sources, 
        sinks, 
        DiffParams,
        DIFFUSION_RATE,
        deltaX,
        deltaT,
        method,
        timeLapse
    );

    animationState.currentTimeStep++;
    return [result.currentConcentrationData, result.steadyState];
};
