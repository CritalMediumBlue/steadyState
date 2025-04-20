import { diffusionCore } from "./diffusionCore.js";
import { Grid, DiffParams } from './config.js';

export const sceneState = {
    scene: null,
    camera: null,
    renderer: null,
    surfaceMesh: null,
};

export const animationState = {
    animationFrameId: null,
    currentTimeStep: 0
    
};

export const dataState = {
    currentConcentrationData: null,
    lastConcentrationData: null,
    lastConcentrationData2: null,
    colors: null,
    sources: null,
    sinks: null,
    
};

export const constants = {
    GRID: Grid,
    DIFFUSION_RATE: DiffParams.DIFFUSION_RATE, // micrometers squared per seconds
    deltaX: DiffParams.DELTA_X, // micrometers
    deltaT: DiffParams.DELTA_T, // seconds
    numberOfStepsPerSecond: DiffParams.STEPS_PER_SECOND, // steps per second
    diffSourceAndSinkRate: null, // micrometers squared per seconds
    method: DiffParams.METHOD,
    parallelization: DiffParams.PARALLELIZATION,
    timeLapse: DiffParams.TIME_LAPSE
};

export const initArrays = () => {
    const gridSize = Grid.WIDTH * Grid.HEIGHT;

    dataState.currentConcentrationData = new Float32Array(gridSize);
    dataState.lastConcentrationData = new Float32Array(gridSize);
    dataState.lastConcentrationData2 = new Float32Array(gridSize);
    dataState.currentConcentrationData.fill(11);
    
    dataState.colors = new Float32Array(gridSize * 3);
    
    // Initialize sources and sinks
    const sources = new Float32Array(gridSize);
    const sinks = new Float32Array(gridSize);

    const numberOfSinksAndSources = 10; 
    const smoothFactor = 0.5; // Adjust this value to control the smoothness of the sources and sinks
    
    const sourcePositions = new Set();
    const sinkPositions = new Set();

    const boundaryMargin = 1;
    
    for (let i = 0; i < numberOfSinksAndSources; i++) {
        let pos, row, col;
        // Generate a valid source position
        do {
            row = Math.floor(Math.random() * (Grid.HEIGHT - 2 * boundaryMargin)) + boundaryMargin;
            col = Math.floor(Math.random() * (Grid.WIDTH - 2 * boundaryMargin)) + boundaryMargin;
            pos = row * Grid.WIDTH + col;
        } while(sourcePositions.has(pos));
        sourcePositions.add(pos);
        sources[pos] = 0.95; // has to be slightly less than the sinks
    
        // Generate a valid sink position
        do {
            row = Math.floor(Math.random() * (Grid.HEIGHT - 2 * boundaryMargin)) + boundaryMargin;
            col = Math.floor(Math.random() * (Grid.WIDTH - 2 * boundaryMargin)) + boundaryMargin;
            pos = row * Grid.WIDTH + col;
        } while(sinkPositions.has(pos));
        sinkPositions.add(pos);
        sinks[pos] = 1;
    }
    // assign the sources array
    dataState.sources = sources;
    dataState.sinks = sinks;
    
     // diffuse sources
    const emptyArray = new Float32Array(gridSize);
    emptyArray.fill(0);
   
    const result = diffusionCore(
        sources,
        emptyArray,
        emptyArray,
        constants,
        smoothFactor,
        constants.deltaX,
        constants.deltaT,
        "FTCS",
        1
    );
    dataState.sources = result.currentConcentrationData;

    // diffuse sinks
    const result2 = diffusionCore(
        sinks,
        emptyArray,
        emptyArray,
        constants,
        smoothFactor,
        constants.deltaX,
        constants.deltaT,
        "FTCS",
        1
    );
    dataState.sinks = result2.currentConcentrationData;

    //set boundaries of the sources and sinks to 0
    for (let i = 0; i < Grid.WIDTH; i++) {
        dataState.sources[i] = 0;
        dataState.sinks[i] = 0;
        dataState.sources[(Grid.HEIGHT - 1) * Grid.WIDTH + i] = 0;
        dataState.sinks[(Grid.HEIGHT - 1) * Grid.WIDTH + i] = 0;
    }
    for (let i = 0; i < Grid.HEIGHT; i++) {
        dataState.sources[i * Grid.WIDTH] = 0;
        dataState.sinks[i * Grid.WIDTH] = 0;
        dataState.sources[i * Grid.WIDTH + (Grid.WIDTH - 1)] = 0;
        dataState.sinks[i * Grid.WIDTH + (Grid.WIDTH - 1)] = 0;
    }
        

    console.log(dataState.sinks.reduce((acc, value) => acc + value, 0)); 
    console.log(dataState.sources.reduce((acc, value) => acc + value, 0));
};
