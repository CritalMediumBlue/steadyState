const GRID = { WIDTH: 100, HEIGHT: 60 };  //micrometers
import { diffusionCore } from "./diffusionCore.js";

export const sceneState = {
    scene: null,
    camera: null,
    renderer: null,
    surfaceMesh: null,
    surfaceMesh2: null,
};

export const animationState = {
    animationFrameId: null,
    currentTimeStep: 0
    
};

export const dataState = {
    currentConcentrationData: null,
    lastConcentrationData: null,
    currentConcentrationData2: null,
    lastConcentrationData2: null,
    colors: null,
    sources: null,
    sinks: null,
    
};

export const constants = {
    GRID,
    DIFFUSION_RATE: null, // micrometers squared per seconds
    deltaX: null, // micrometers
    deltaT: null, // seconds
    numberOfStepsPerSecond: null, // steps per second
    diffSourceAndSinkRate:null, // micrometers squared per seconds
    method: null
};

export const initArrays = () => {
    const gridSize = GRID.WIDTH * GRID.HEIGHT;

    dataState.currentConcentrationData = new Float32Array(gridSize);
    dataState.lastConcentrationData = new Float32Array(gridSize);
    dataState.currentConcentrationData2 = new Float32Array(gridSize);
    dataState.lastConcentrationData2 = new Float32Array(gridSize);
    dataState.currentConcentrationData.fill(12.5);
    dataState.currentConcentrationData2.fill(12.5);
    
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
            row = Math.floor(Math.random() * (GRID.HEIGHT - 2 * boundaryMargin)) + boundaryMargin;
            col = Math.floor(Math.random() * (GRID.WIDTH - 2 * boundaryMargin)) + boundaryMargin;
            pos = row * GRID.WIDTH + col;
        } while(sourcePositions.has(pos));
        sourcePositions.add(pos);
        sources[pos] = 0.95; // has to be slightly less than the sinks
    
        // Generate a valid sink position
        do {
            row = Math.floor(Math.random() * (GRID.HEIGHT - 2 * boundaryMargin)) + boundaryMargin;
            col = Math.floor(Math.random() * (GRID.WIDTH - 2 * boundaryMargin)) + boundaryMargin;
            pos = row * GRID.WIDTH + col;
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
        "FTCS" 
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
        "FTCS"
    );
    dataState.sinks = result2.currentConcentrationData;

    //set boundaries of the sources and sinks to 0
    for (let i = 0; i < GRID.WIDTH; i++) {
        dataState.sources[i] = 0;
        dataState.sinks[i] = 0;
        dataState.sources[(GRID.HEIGHT - 1) * GRID.WIDTH + i] = 0;
        dataState.sinks[(GRID.HEIGHT - 1) * GRID.WIDTH + i] = 0;
    }
    for (let i = 0; i < GRID.HEIGHT; i++) {
        dataState.sources[i * GRID.WIDTH] = 0;
        dataState.sinks[i * GRID.WIDTH] = 0;
        dataState.sources[i * GRID.WIDTH + (GRID.WIDTH - 1)] = 0;
        dataState.sinks[i * GRID.WIDTH + (GRID.WIDTH - 1)] = 0;
    }
        

    console.log(dataState.sinks.reduce((acc, value) => acc + value, 0)); 
    console.log(dataState.sources.reduce((acc, value) => acc + value, 0));
};
