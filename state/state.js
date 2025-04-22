export const dataState = {
    // Concentration data
    currentConcentrationData: null,
    lastConcentrationData: null,
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
