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
    method: null,
    
    // Additional simulation variables
    steadyState: false,
    time0: 0
};

export const initArrays = (DiffParams, SceneConf) => {
    const gridSize = SceneConf.WIDTH * SceneConf.HEIGHT;
    dataState.method = DiffParams.METHOD;

    dataState.currentConcentrationData = new Float32Array(gridSize);
    dataState.lastConcentrationData = new Float32Array(gridSize);
    dataState.lastConcentrationData2 = new Float32Array(gridSize);
    dataState.currentConcentrationData.fill(11);
    
    // Initialize sources and sinks
    const sources = new Float32Array(gridSize);
    const sinks = new Float32Array(gridSize);

    const numberOfSinksAndSources = 10; 
    
    const sourcePositions = new Set();
    const sinkPositions = new Set();

    const boundaryMargin = 1;
    
    for (let i = 0; i < numberOfSinksAndSources; i++) {
        let pos, row, col;
        // Generate a valid source position
        do {
            row = Math.floor(Math.random() * (SceneConf.HEIGHT - 2 * boundaryMargin)) + boundaryMargin;
            col = Math.floor(Math.random() * (SceneConf.WIDTH - 2 * boundaryMargin)) + boundaryMargin;
            pos = row * SceneConf.WIDTH + col;
        } while(sourcePositions.has(pos));
        sourcePositions.add(pos);
        const sourceValue = 0.95;
        //add the source value around the position
        const posLeft = pos - 1;
        const posRight = pos + 1;
        const posUp = pos - SceneConf.WIDTH;
        const posDown = pos + SceneConf.WIDTH;
        sources[pos] = sourceValue*0.6; 
        sources[posLeft] = sourceValue*0.1;
        sources[posRight] = sourceValue*0.1;
        sources[posUp] = sourceValue*0.1;
        sources[posDown] = sourceValue*0.1;

    
        // Generate a valid sink position
        do {
            row = Math.floor(Math.random() * (SceneConf.HEIGHT - 2 * boundaryMargin)) + boundaryMargin;
            col = Math.floor(Math.random() * (SceneConf.WIDTH - 2 * boundaryMargin)) + boundaryMargin;
            pos = row * SceneConf.WIDTH + col;
        } while(sinkPositions.has(pos));
        sinkPositions.add(pos);
        const sinkValue = 1.0;
        //add the sink value around the position
        const posLeft2 = pos - 1;
        const posRight2 = pos + 1;
        const posUp2 = pos - SceneConf.WIDTH;
        const posDown2 = pos + SceneConf.WIDTH;
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
    for (let i = 0; i < SceneConf.WIDTH; i++) {
        dataState.sources[i] = 0;
        dataState.sinks[i] = 0;
        dataState.sources[(SceneConf.HEIGHT - 1) * SceneConf.WIDTH + i] = 0;
        dataState.sinks[(SceneConf.HEIGHT - 1) * SceneConf.WIDTH + i] = 0;
    }
    for (let i = 0; i < SceneConf.HEIGHT; i++) {
        dataState.sources[i * SceneConf.WIDTH] = 0;
        dataState.sinks[i * SceneConf.WIDTH] = 0;
        dataState.sources[i * SceneConf.WIDTH + (SceneConf.WIDTH - 1)] = 0;
        dataState.sinks[i * SceneConf.WIDTH + (SceneConf.WIDTH - 1)] = 0;
    }
};
