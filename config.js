import { CFLCondition } from './utils.js';

// Scene configuration
export const Scene = {
    FOG_COLOR: 0x000000,
    FOG_NEAR:   10,
    FOG_FAR:    150,

    CAMERA_FOV:   75,
    CAMERA_NEAR:  0.1,
    CAMERA_FAR:    1000,

    CAMERA_POSITION: {
        x: 0,
        y: -50,
        z: 60
    },

    CAMERA_LOOKAT: {
        x: 0,
        y:  0,
        z:  0
    },

    CONTROLS_MAX_DISTANCE: 500,
    CONTROLS_MIN_DISTANCE: 10
};

// Grid dimensions
export const Grid = {
    WIDTH: 100,
    HEIGHT: 60
};

// Diffusion parameters
export const DiffParams = {
    DIFFUSION_RATE: 100, // micrometers squared per second
    DELTA_X: 1, // micrometers
    TIME_LAPSE: 5, // seconds
    
    // Calculated constants
    DELTA_T: null, // Will be set below using CFLCondition
    STEPS_PER_SECOND: null, // Will be calculated
    
    // Simulation parameters
    METHOD: "ADI", // Default method
    PARALLELIZATION: true, // Enable parallelization
    
    // Reaction parameters
    SCALE_SINKS_AND_SOURCES: 200,
    HALF_SATURATION_CONSTANT: 0.5
};

// Calculate derived constants
DiffParams.DELTA_T = CFLCondition(
    DiffParams.DELTA_X,
    DiffParams.DIFFUSION_RATE,
    2
);
DiffParams.STEPS_PER_SECOND = Math.round(1 / DiffParams.DELTA_T);

// For backward compatibility (fix typo)
export const DELTA_T = DiffParams.DELTA_T;
