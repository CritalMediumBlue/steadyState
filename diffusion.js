import { dataState, constants, animationState } from './state.js';
import { diffusionCore } from './diffusionCore.js';

/**
 * Perform diffusion simulation step
 * @returns {[Float32Array, Float32Array]} Updated concentration data
 */
export const diffusion = () => {
    const { 
        currentConcentrationData, 
        nextConcentrationData, 
        sources, 
        sinks 
    } = dataState;

    const result = diffusionCore(
        currentConcentrationData, 
        nextConcentrationData, 
        sources, 
        sinks, 
        constants,
        constants.numberOfStepsPerSecond,
        constants.DIFFUSION_RATE,
        constants.deltaX,
        constants.deltaT,
    );

    // Update data state
    dataState.currentConcentrationData = result.currentConcentrationData;
    dataState.nextConcentrationData = result.nextConcentrationData;

    animationState.currentTimeStep++;
    return [result.nextConcentrationData, result.currentConcentrationData];
};
