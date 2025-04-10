const GRID = { WIDTH: null, HEIGHT: null };  //micrometers

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
    sinks: null
};

export const constants = {
    GRID,
    DIFFUSION_RATE: null, // micrometers squared per seconds
    deltaX: null, // micrometers
    deltaT: null, // seconds
    numberOfStepsPerSecond: null, // steps per second
};

export const initArrays = () => {
    const gridSize = constants.GRID.WIDTH * constants.GRID.HEIGHT;

    dataState.currentConcentrationData = new Float32Array(gridSize);
    dataState.nextConcentrationData = new Float32Array(gridSize);
    dataState.colors = new Float32Array(gridSize * 3);
    
    // Initialize sources and sinks
    dataState.sources = new Float32Array(gridSize);
    dataState.sinks = new Float32Array(gridSize);

    const numberOfSinksAndSources = 5; 
    
    const sourcePositions = new Set();
    const sinkPositions = new Set();

    for(let i = 0; i < numberOfSinksAndSources; i++) {
        let pos;
        pos = Math.floor(GRID.WIDTH+Math.random() * (gridSize-GRID.WIDTH));
        while(sourcePositions.has(pos)) {
            pos = Math.floor(Math.random() * gridSize);
        }
        sourcePositions.add(pos);
        dataState.sources[pos] = 10000/constants.numberOfStepsPerSecond; 
        pos = Math.floor(Math.random() * gridSize);
        while(sinkPositions.has(pos)) {
            pos = Math.floor(Math.random() * gridSize);
        }
        sinkPositions.add(pos);
        dataState.sinks[pos] = 1000/constants.numberOfStepsPerSecond; 
    }

 
};
