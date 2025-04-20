import { solveADI, solveFTCS } from "./diffusionCore.js";
import { Grid, DiffParams } from './config.js';

export const dataState = {
    // Concentration data
    currentConcentrationData: null,
    lastConcentrationData: null,
    lastConcentrationData2: null,
    sources: null,
    sinks: null,
    
    // Simulation state
    currentTimeStep: 0,
    steadyStateSteps: [],
    steadyStateTimes: [],
    runCount: 0,
    maxRuns: 500,
    init: false,
    
    // Time calculation properties
    timeLapse: 1, // Default time lapse factor
    method: 'ADI', // Default simulation method
    
    // Additional simulation variables
    steadyState: false,
    time0: 0
};

export const initArrays = () => {
    const gridSize = Grid.WIDTH * Grid.HEIGHT;

    dataState.currentConcentrationData = new Float32Array(gridSize);
    dataState.lastConcentrationData = new Float32Array(gridSize);
    dataState.lastConcentrationData2 = new Float32Array(gridSize);
    dataState.currentConcentrationData.fill(11);
    
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
   
    const result = solveFTCS(
        sources,
        emptyArray,
        emptyArray,
        smoothFactor,
        DiffParams.DELTA_X,
        1,
        DiffParams.DELTA_T
        
    );
    dataState.sources = result.currentConcentrationData;

    // diffuse sinks
    const result2 = solveFTCS(
        sinks,
        emptyArray,
        emptyArray,
        smoothFactor,
        DiffParams.DELTA_X,
        1,
        DiffParams.DELTA_T
        
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
};
