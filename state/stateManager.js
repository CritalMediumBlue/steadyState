// filepath: /home/home/Schreibtisch/steadyState/state/stateManager.js
import { dataState } from './state.js';

/**
 * Initialize arrays for concentration data, sources, and sinks
 */
export const initArrays = (diffParams, sceneConf) => {
    const gridSize = diffParams.WIDTH * diffParams.HEIGHT;
    dataState.method = diffParams.METHOD;

    dataState.currentConcentrationData = new Float32Array(gridSize);
    dataState.lastConcentrationData = new Float32Array(gridSize);
    dataState.currentConcentrationData.fill(11);
    
    // Initialize sources and sinks
    const sources = new Float32Array(gridSize);
    const sinks = new Float32Array(gridSize);

    const numberOfSinksAndSources = 10; 
    
    const sourcePositions = new Set();
    const sinkPositions = new Set();

    const boundaryMargin = 3;
    
    for (let i = 0; i < numberOfSinksAndSources; i++) {
        let pos, row, col;
        // Generate a valid source position
        do {
            row = Math.floor(Math.random() * (diffParams.HEIGHT - 2 * boundaryMargin)) + boundaryMargin;
            col = Math.floor(Math.random() * (diffParams.WIDTH - 2 * boundaryMargin)) + boundaryMargin;
            pos = row * diffParams.WIDTH + col;
        } while(sourcePositions.has(pos));
        sourcePositions.add(pos);
        const sourceValue = 0.95;
        //add the source value around the position
        const posLeft = pos - 1;
        const posRight = pos + 1;
        const posUp = pos - diffParams.WIDTH;
        const posDown = pos + diffParams.WIDTH;
        sources[pos] = sourceValue*0.6; 
        sources[posLeft] = sourceValue*0.1;
        sources[posRight] = sourceValue*0.1;
        sources[posUp] = sourceValue*0.1;
        sources[posDown] = sourceValue*0.1;

    
        // Generate a valid sink position
        do {
            row = Math.floor(Math.random() * (diffParams.HEIGHT - 2 * boundaryMargin)) + boundaryMargin;
            col = Math.floor(Math.random() * (diffParams.WIDTH - 2 * boundaryMargin)) + boundaryMargin;
            pos = row * diffParams.WIDTH + col;
        } while(sinkPositions.has(pos));
        sinkPositions.add(pos);
        const sinkValue = 1.0;
        //add the sink value around the position
        const posLeft2 = pos - 1;
        const posRight2 = pos + 1;
        const posUp2 = pos - diffParams.WIDTH;
        const posDown2 = pos + diffParams.WIDTH;
        sinks[pos] = sinkValue*0.6;
        sinks[posLeft2] = sinkValue*0.1;
        sinks[posRight2] = sinkValue*0.1;
        sinks[posUp2] = sinkValue*0.1;
        sinks[posDown2] = sinkValue*0.1;
    }
    // assign the sources array
    dataState.sources = sources;
    dataState.sinks = sinks;
    

    //set boundaries of the sources and sinks to 0
    for (let i = 0; i < diffParams.WIDTH; i++) {
        dataState.sources[i] = 0;
        dataState.sinks[i] = 0;
        dataState.sources[(diffParams.HEIGHT - 1) * diffParams.WIDTH + i] = 0;
        dataState.sinks[(diffParams.HEIGHT - 1) * diffParams.WIDTH + i] = 0;
    }
    for (let i = 0; i < diffParams.HEIGHT; i++) {
        dataState.sources[i * diffParams.WIDTH] = 0;
        dataState.sinks[i * diffParams.WIDTH] = 0;
        dataState.sources[i * diffParams.WIDTH + (diffParams.WIDTH - 1)] = 0;
        dataState.sinks[i * diffParams.WIDTH + (diffParams.WIDTH - 1)] = 0;
    }
};

/**
 * Reset the simulation state
 */
export const resetState = (diffParams, sceneConf) => {
    dataState.currentTimeStep = 0;
    initArrays(diffParams, sceneConf);
    dataState.init = true;
    dataState.steadyState = false;
    dataState.time0 = performance.now();
};

/**
 * Handle steady state reached
 */
export const handleSteadyStateReached = (diffParams, sceneConf) => {
    dataState.init = false;
    const time1 = performance.now();
    const elapsedTime = time1 - dataState.time0;
    dataState.steadyStateTimes.push(elapsedTime);
    dataState.steadyStateSteps.push(dataState.currentTimeStep);

    console.log(`Run ${dataState.runCount + 1}: It took ${elapsedTime} milliseconds to reach steady state.`);

    dataState.runCount++;
    resetState(diffParams, sceneConf);
};

// Re-export dataState for convenience
export { dataState };