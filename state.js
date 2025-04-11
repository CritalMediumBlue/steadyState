const GRID = { WIDTH: 100, HEIGHT: 60 };  //micrometers
import { diffusionCore } from "./diffusionCore.js";

export const sceneState = {
    scene: null,
    camera: null,
    renderer: null,
    surfaceMesh: null
};

export const animationState = {
    animationFrameId: null,
    currentTimeStep: 0
    
};

export const dataState = {
    currentConcentrationData: null,
    nextConcentrationData: null,
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
    const gridSize = constants.GRID.WIDTH * constants.GRID.HEIGHT;

    dataState.currentConcentrationData = new Float32Array(gridSize);
    dataState.nextConcentrationData = new Float32Array(gridSize);
    dataState.colors = new Float32Array(gridSize * 3);
    
    // Initialize sources and sinks
    const sources = new Float32Array(gridSize);
    const sinks = new Float32Array(gridSize);

    const numberOfSinksAndSources = 1; 
    
    const sourcePositions = new Set();
    const sinkPositions = new Set();

    const boundaryMargin = 5;
    
    for(let i = 0; i < numberOfSinksAndSources; i++) {
        let pos;
        pos = Math.floor(boundaryMargin * GRID.WIDTH + Math.random() * (gridSize - GRID.WIDTH * boundaryMargin));
        // Check vertical boundaries are already handled by pos range and then check horizontal boundaries:
        while(sourcePositions.has(pos) || 
              (pos % GRID.WIDTH) < boundaryMargin || 
              (pos % GRID.WIDTH) > GRID.WIDTH - boundaryMargin - 1) {
            pos = Math.floor(boundaryMargin * GRID.WIDTH + Math.random() * (gridSize - GRID.WIDTH * boundaryMargin));
        }
        sourcePositions.add(pos);
        sources[pos] = 1;
    
        pos = Math.floor(boundaryMargin * GRID.WIDTH + Math.random() * (gridSize - GRID.WIDTH * boundaryMargin));
        while(sinkPositions.has(pos) || 
              (pos % GRID.WIDTH) < boundaryMargin || 
              (pos % GRID.WIDTH) > GRID.WIDTH - boundaryMargin - 1) {
            pos = Math.floor(boundaryMargin * GRID.WIDTH + Math.random() * (gridSize - GRID.WIDTH * boundaryMargin));
        }
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
        emptyArray,
        constants,
        0,
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
        emptyArray,
        constants,
        0,
        constants.deltaX,
        constants.deltaT,
        "FTCS"
    );
    dataState.sinks = result2.currentConcentrationData;
};
