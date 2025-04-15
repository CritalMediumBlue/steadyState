/**
 * Core diffusion simulation function
 * @param {Float32Array} currentData - Current concentration data
 * @param {Float32Array} sources - Source terms
 * @param {Float32Array} sinks - Sink terms
 * @param {Object} constants - Simulation constants
 * @param {number} numberOfSteps - Number of simulation steps 
 * @param {number} DIFFUSION_RATE - Diffusion rate
 * @param {number} deltaX - Spatial step size
 * @param {number} deltaT - Time step size
 * @returns {Object} Updated concentration data
 */

import {thomasAlgorithm} from "./utils.js";

export function diffusionCore(currentData, sources, sinks, constants,DIFFUSION_RATE,deltaX,deltaT,method ) {
    
    let chosenFunction;
        switch(method){
        case "FTCS":chosenFunction = FTCS;break;
        case "ADI":chosenFunction = ADI;break;  
    }

    return chosenFunction(currentData, sources, sinks, constants,DIFFUSION_RATE,deltaX,deltaT);
}

/**
 * Forward-Time Central-Space (FTCS) method for solving the diffusion equation
 * @param {Float32Array} currentData - Current concentration data
 * @param {Float32Array} sources - Source terms
 * @param {Float32Array} sinks - Sink terms
 * @param {Object} constants - Simulation constants
 * @param {number} numberOfSteps - Number of simulation steps
 * @param {number} DIFFUSION_RATE - Diffusion rate
 * @param {number} deltaX - Spatial step size
 * @param {number} deltaT - Time step size
 * @returns {Object} Updated concentration data
 */
const scaleSinksAndSources = 300
const FTCS = ( currentData, sources, sinks, constants,DIFFUSION_RATE,deltaX,deltaT) => {
    const { WIDTH, HEIGHT } = constants.GRID;
    const numberOfStepsPerSecond = Math.round(1 / deltaT); // steps per second

    // Create copies of input arrays to avoid modifying originals if needed
    let current = new Float32Array(currentData);
    let next = new Float32Array(currentData);
    const DiffusionParam = DIFFUSION_RATE * deltaT / (deltaX ** 2); 

    for (let step = 0; step < numberOfStepsPerSecond; step++) {
        // Diffusion calculation with source/sink terms
        for (let y = 1; y < HEIGHT - 1; y++) {
            const rowStart = y * WIDTH;
            for (let x = 1; x < WIDTH - 1; x++) {
                const idx = rowStart + x;

                const michaelisMenten = current[idx] / (0.5+ current[idx]);

                // Diffusion term (5-point stencil)
                const diffusionTerm = DiffusionParam * (
                    current[(y - 1) * WIDTH + x] +
                    current[(y + 1) * WIDTH + x] +
                    current[rowStart + (x - 1)] +
                    current[rowStart + (x + 1)] -
                    4 * current[idx]
                );
               
                // Update concentration
                next[idx] = current[idx] + diffusionTerm + (sources[idx] - sinks[idx]*michaelisMenten) * scaleSinksAndSources/numberOfStepsPerSecond;
                
                if (next[idx] < 0) {
                    console.warn("Concentration went negative " + next[idx]);
                    next[idx] = 0; // Ensure concentration doesn't go negative
                }
            }
        }

        // Reflective boundary conditions
        for (let i = 0; i < WIDTH; i++) {
            // Top and bottom boundaries
            
            next[i] = next[WIDTH + i];
            next[(HEIGHT - 1) * WIDTH + i] = next[(HEIGHT - 2) * WIDTH + i];
        }

        for (let i = 0; i < HEIGHT; i++) {
            // Left and right boundaries
            const leftIdx = i * WIDTH;
            next[leftIdx] = next[leftIdx + 1];
            next[leftIdx + WIDTH - 1] = next[leftIdx+ WIDTH - 2];
        }

        // Switch current and next concentration data
        current=next;
    }

    return {
        currentConcentrationData: current,
    };
};


const ADI = (currentConcentrationData, sources, sinks, constants, DIFFUSION_RATE, deltaX) => {

    const { WIDTH, HEIGHT } = constants.GRID;

    // Create a new array for the next concentration data
    const nextConcentrationData = new Float32Array(currentConcentrationData.length);
    
    // Define the simulation time step used by the ADI method
    const timeStep = 1
    const numberOfStepsPerSecond = Math.round(1 / timeStep); // 

    const alpha = DIFFUSION_RATE * timeStep / (2 * deltaX * deltaX); // non-dimensional diffusion coefficient
   // Reinitialize temporary arrays for the ADI method for the current time step
   const a = new Float32Array(Math.max(WIDTH, HEIGHT)); // Lower diagonal
   const b = new Float32Array(Math.max(WIDTH, HEIGHT)); // Main diagonal
   const c = new Float32Array(Math.max(WIDTH, HEIGHT)); // Upper diagonal
   const d = new Float32Array(Math.max(WIDTH, HEIGHT)); // Right-hand side
   const x = new Float32Array(Math.max(WIDTH, HEIGHT)); // Solution vector
   const intermediateData = new Float32Array(WIDTH * HEIGHT);



    // Repeat the ADI method until one second is simulated
    for (let step = 0; step < numberOfStepsPerSecond; step++) {

     
    
        // Set up coefficients for the tridiagonal system
        a.fill(-alpha);
        b.fill(1 + 2 * alpha);
        c.fill(-alpha);
        d.fill(0);
        x.fill(0);
        intermediateData.fill(0);

        

        // Apply boundary conditions for the x-direction
        // Left boundary (reflective)
        b[1] = b[1] + a[1]; // Absorb the coefficient for the ghost point
        a[1] = 0;
            
        // Right boundary (reflective)
        b[WIDTH - 2] = b[WIDTH - 2] + c[WIDTH - 2]; // Absorb the coefficient for the ghost point
        c[WIDTH - 2] = 0;
    
        // First half-step: implicit in x-direction, explicit in y-direction
        for (let j = 1; j < HEIGHT - 1; j++) {
            // Set up the tridiagonal system for this row
            for (let i = 1; i < WIDTH - 1; i++) {
                const idx = j * WIDTH + i;
                const michaelisMenten = currentConcentrationData[idx] / (0.5 + currentConcentrationData[idx]);
                // Calculate the right-hand side using explicit method in y-direction
                const term_y = currentConcentrationData[idx] + alpha * (
                    currentConcentrationData[(j - 1) * WIDTH + i] -
                    2 * currentConcentrationData[idx] +
                    currentConcentrationData[(j + 1) * WIDTH + i]
                ) + (timeStep * scaleSinksAndSources * (sources[idx] - sinks[idx] * michaelisMenten)) / 2;
    
                d[i] = term_y;
            }
            
            
    
            // Solve the tridiagonal system for this row
            thomasAlgorithm(a, b, c, d, x, WIDTH - 1);
    
            // Store the results in the intermediate array
            for (let i = 1; i < WIDTH - 1; i++) {
                if (x[i] < 0) {
                    console.warn("Concentration went negative " + x[i]);
                    x[i] = 0; // Ensure concentration doesn't go negative
                }
                intermediateData[j * WIDTH + i] = x[i];
            }
        }
    
        // Apply boundary conditions to the intermediate data
        // Top and bottom boundaries (copy from adjacent interior points)
        for (let i = 0; i < WIDTH; i++) {
            intermediateData[i] = intermediateData[WIDTH + i]; // Top boundary
            intermediateData[(HEIGHT - 1) * WIDTH + i] = intermediateData[(HEIGHT - 2) * WIDTH + i]; // Bottom boundary
        }
    
        // Left and right boundaries (copy from adjacent interior points)
        for (let j = 0; j < HEIGHT; j++) {
            intermediateData[j * WIDTH] = intermediateData[j * WIDTH + 1]; // Left boundary
            intermediateData[j * WIDTH + WIDTH - 1] = intermediateData[j * WIDTH + WIDTH - 2]; // Right boundary
        }

            // Apply boundary conditions for the y-direction
            // Top boundary (reflective)
            b[1] = b[1] + a[1]; // Absorb the coefficient for the ghost point
            a[1] = 0;
            // Bottom boundary (reflective)
            b[HEIGHT - 2] = b[HEIGHT - 2] + c[HEIGHT - 2]; // Absorb the coefficient for the ghost point
            c[HEIGHT - 2] = 0;
    
        // Second half-step: explicit in x-direction, implicit in y-direction
        for (let i = 1; i < WIDTH - 1; i++) {
            // Set up the tridiagonal system for this column
            for (let j = 1; j < HEIGHT - 1; j++) {
                const idx = j * WIDTH + i;
                const michaelisMenten = intermediateData[idx] / (0.5 + intermediateData[idx]);
                // Calculate the right-hand side using explicit method in x-direction
                const term_x = intermediateData[idx] + alpha * (
                    intermediateData[j * WIDTH + (i - 1)] -
                    2 * intermediateData[idx] +
                    intermediateData[j * WIDTH + (i + 1)]
                ) + (timeStep * scaleSinksAndSources * (sources[idx] - sinks[idx] * michaelisMenten)) / 2;
    
                d[j] = term_x;
            }
    
    
            // Solve the tridiagonal system for this column
            thomasAlgorithm(a, b, c, d, x, HEIGHT - 1);
    
            // Store the results in the next concentration data array
            for (let j = 1; j < HEIGHT - 1; j++) {
                if (x[j] < 0) {
                    console.warn("Concentration went negative " + x[j]);
                    x[j] = 0; // Ensure concentration doesn't go negative
                }
                nextConcentrationData[j * WIDTH + i] = x[j];
            }

            
        }
    
        // Apply boundary conditions to the final data
        // Top and bottom boundaries (copy from adjacent interior points)
        for (let i = 0; i < WIDTH; i++) {
            nextConcentrationData[i] = nextConcentrationData[WIDTH + i]; // Top boundary
            nextConcentrationData[(HEIGHT - 1) * WIDTH + i] = nextConcentrationData[(HEIGHT - 2) * WIDTH + i]; // Bottom boundary
        }
    
        // Left and right boundaries (copy from adjacent interior points)
        for (let j = 0; j < HEIGHT; j++) {
            nextConcentrationData[j * WIDTH] = nextConcentrationData[j * WIDTH + 1]; // Left boundary
            nextConcentrationData[j * WIDTH + WIDTH - 1] = nextConcentrationData[j * WIDTH + WIDTH - 2]; // Right boundary
        }
    
        // Update the current concentration data with the new values for the next time step
        currentConcentrationData = nextConcentrationData;
    }
    
    return {
        currentConcentrationData: currentConcentrationData

    };
}

/* 
const runFTCS_GPU=(currentData2D, sources2D, sinks2D, constants, DIFFUSION_RATE, deltaX, deltaT) =>{
    const { WIDTH, HEIGHT } = constants.GRID;
    const numberOfSteps = Math.round(1 / deltaT);
    const DiffusionParam = DIFFUSION_RATE * deltaT / (deltaX ** 2);

    // Convert flat arrays to 2D arrays if needed or adapt the kernel accordingly.
    // For this example we assume currentData2D, sources2D, sinks2D are 2D arrays.
    let current = currentData2D;

    for (let step = 0; step < numberOfSteps; step++) {
        current = ftcsKernel(current, sources2D, sinks2D, DiffusionParam, scaleSinksAndSources, WIDTH, HEIGHT, numberOfSteps).toArray();

        // Implement reflective boundary conditions if not handled in kernel.
        // For instance: copy rows/cols of adjacent interior points to boundaries.
        // ...
    }

    return {
        currentConcentrationData: current,
    };
}

const gpu = new GPU();

// Create a GPU kernel for one simulation step
const ftcsKernel = gpu.createKernel(function(current, sources, sinks, DiffusionParam, scaleSinksAndSources, WIDTH, HEIGHT, numberOfSteps) {
    const x = this.thread.x;
    const y = this.thread.y;
    
    // Only compute interior points; boundary points will be handled after the kernel
    if(x === 0 || y === 0 || x === WIDTH - 1 || y === HEIGHT - 1) {
        return current[y][x]; // Return input value at the boundaries
    }
    
    const currentVal = current[y][x];
    const michaelisMenten = currentVal / (0.5 + currentVal);
    
    // 5-point stencil (neighbors)
    const diffusionTerm = DiffusionParam * (
        current[y - 1][x] + 
        current[y + 1][x] + 
        current[y][x - 1] + 
        current[y][x + 1] - 
        4 * currentVal
    );
    
    // Note: for simplicity, applying the source/sink directly here. In a full step you'd average over steps.
    let result = currentVal + diffusionTerm + (sources[y][x] - sinks[y][x] * michaelisMenten) * scaleSinksAndSources / numberOfSteps;
    
    // Ensure non-negative concentration
    return result < 0 ? 0 : result;
})  */