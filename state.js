
const GRID = { WIDTH: 200, HEIGHT: 200 };  //micrometers

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
    DIFFUSION_RATE: 100, // micrometers squared per seconds
    deltaX: 1, // micrometers
    deltaT: 0.82 * (Math.pow(1, 2)) / (4 * 100), // seconds
    numberOfStepsPerSecond: Math.round(1 / (0.82 * (Math.pow(1, 2)) / (4 * 100)))
};

export const initArrays = () => {
    const gridSize = constants.GRID.WIDTH * constants.GRID.HEIGHT;

    dataState.currentConcentrationData = new Float32Array(gridSize);
    dataState.nextConcentrationData = new Float32Array(gridSize);
    dataState.colors = new Float32Array(gridSize * 3);
    
    // Initialize sources and sinks
    dataState.sources = new Float32Array(gridSize);
    dataState.sinks = new Float32Array(gridSize);
    
    // Create initial concentration distribution (e.g., a central peak)
    for (let y = 0; y < constants.GRID.HEIGHT; y++) {
        for (let x = 0; x < constants.GRID.WIDTH; x++) {
            const idx = y * constants.GRID.WIDTH + x;
            
            // Concentration peak with exponential decay
            dataState.currentConcentrationData[idx] = 1;
            
            // Optional: Add some random sources/sinks
            dataState.sources[idx] = Math.random() < 0.001 ? 8: 0;
            dataState.sinks[idx] = Math.random() < 0.001 ? 1: 0;
        }
    }
};
