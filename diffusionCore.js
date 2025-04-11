/**
 * Core diffusion simulation function
 * @param {Float32Array} currentData - Current concentration data
 * @param {Float32Array} nextData - Next concentration data buffer
 * @param {Float32Array} sources - Source terms
 * @param {Float32Array} sinks - Sink terms
 * @param {Object} constants - Simulation constants
 * @param {number} numberOfSteps - Number of simulation steps 
 * @param {number} DIFFUSION_RATE - Diffusion rate
 * @param {number} deltaX - Spatial step size
 * @param {number} deltaT - Time step size
 * @returns {Object} Updated concentration data
 */
export function diffusionCore(
    currentData, 
    nextData, 
    sources, 
    sinks, 
    constants,
    DIFFUSION_RATE,
    deltaX,
    deltaT,
    method 
) {
    
    let chosenFunction;
        switch(method){
        case "FTCS":chosenFunction = FTCS;break;
        case "ADI":chosenFunction = ADI;break;  
    }

    return chosenFunction(currentData, nextData, sources, sinks, constants,DIFFUSION_RATE,deltaX,deltaT);
}

/**
 * Forward-Time Central-Space (FTCS) method for solving the diffusion equation
 * @param {Float32Array} currentData - Current concentration data
 * @param {Float32Array} nextData - Next concentration data buffer
 * @param {Float32Array} sources - Source terms
 * @param {Float32Array} sinks - Sink terms
 * @param {Object} constants - Simulation constants
 * @param {number} numberOfSteps - Number of simulation steps
 * @param {number} DIFFUSION_RATE - Diffusion rate
 * @param {number} deltaX - Spatial step size
 * @param {number} deltaT - Time step size
 * @returns {Object} Updated concentration data
 */

const FTCS = ( currentData, nextData, sources, sinks, constants,DIFFUSION_RATE,deltaX,deltaT) => {
    const { WIDTH, HEIGHT } = constants.GRID;
    const numberOfSteps = Math.round(1 / deltaT); // steps per second
    // Create copies of input arrays to avoid modifying originals if needed
    let current = new Float32Array(currentData);
    let next = new Float32Array(nextData);
    const DiffusionParam = DIFFUSION_RATE * deltaT / (deltaX ** 2);


    for (let step = 0; step < numberOfSteps; step++) {
        // Diffusion calculation with source/sink terms
        for (let y = 1; y < HEIGHT - 1; y++) {
            for (let x = 1; x < WIDTH - 1; x++) {
                const idx = y * WIDTH + x;

                // Diffusion term (5-point stencil)
                const diffusionTerm = DiffusionParam * (
                    current[(y - 1) * WIDTH + x] +
                    current[(y + 1) * WIDTH + x] +
                    current[y * WIDTH + (x - 1)] +
                    current[y * WIDTH + (x + 1)] -
                    4 * current[idx]
                );
               
                // Update concentration
                next[idx] = current[idx] + diffusionTerm + 0.8*sources[idx] - sinks[idx]*(current[idx])/(1+current[idx]);
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
            next[i * WIDTH] = next[i * WIDTH + 1];
            next[i * WIDTH + WIDTH - 1] = next[i * WIDTH + WIDTH - 2];
        }

        // Switch current and next concentration data
        [current, next] = [next, current];
    }

    return {
        currentConcentrationData: current,
        nextConcentrationData: next
    };
};


const ADI = (currentConcentrationData, nextConcentrationData,sources, sinks, constants, DIFFUSION_RATE, deltaX, deltaT) => {

    const { WIDTH, HEIGHT } = constants.GRID;
    const numberOfSteps = Math.round(1 / deltaT); // steps per second
    
    // Temporary arrays for the ADI method
    const a = new Float32Array(Math.max(WIDTH, HEIGHT)); // Lower diagonal
    const b = new Float32Array(Math.max(WIDTH, HEIGHT)); // Main diagonal
    const c = new Float32Array(Math.max(WIDTH, HEIGHT)); // Upper diagonal
    const d = new Float32Array(Math.max(WIDTH, HEIGHT)); // Right-hand side
    const x = new Float32Array(Math.max(WIDTH, HEIGHT)); // Solution vector
    
    // Intermediate array to store results after the first half-step
    const intermediateData = new Float32Array(WIDTH * HEIGHT);
    
   
    const speedUpFactor = 500;
  
    const timeStep = deltaT*speedUpFactor


    const alpha = DIFFUSION_RATE*timeStep/(2*deltaX*deltaX); // non-dimensional diffusion coefficient

    a.fill(-alpha);
    b.fill(1 + 2*alpha);
    c.fill(-alpha);
    
     
    // First half-step: implicit in x-direction, explicit in y-direction
    for (let j = 1; j < HEIGHT - 1; j++) {
        // Set up the tridiagonal system for this row
        for (let i = 1; i < WIDTH - 1; i++) {
           
            
            // Calculate the right-hand side using explicit method in y-direction
            const idx = j * WIDTH + i;
            const term_y = currentConcentrationData[idx]+alpha * (
                currentConcentrationData[(j-1) * WIDTH + i] - 
                2 * currentConcentrationData[idx] + 
                currentConcentrationData[(j+1) * WIDTH + i]
            );
            
            d[i] =  term_y + (speedUpFactor/2)*(sources[idx]  -(sinks[idx])) 
            
        }
        
        // Apply boundary conditions for the x-direction
        // Left boundary (reflective)
        b[1] = b[1] + a[1]; // Absorb the coefficient for the ghost point
        a[1] = 0;
        
        // Right boundary (reflective)
        b[WIDTH-2] = b[WIDTH-2] + c[WIDTH-2]; // Absorb the coefficient for the ghost point
        c[WIDTH-2] = 0;
        
        // Solve the tridiagonal system for this row
        thomasAlgorithm(a, b, c, d, x, WIDTH-1);
        
        // Store the results in the intermediate array
        for (let i = 1; i < WIDTH - 1; i++) {
            intermediateData[j * WIDTH + i] = x[i];
        }
    }
    
    // Apply boundary conditions to the intermediate data
    // Top and bottom boundaries (copy from adjacent interior points)
    for (let i = 0; i < WIDTH; i++) {
        intermediateData[i] = intermediateData[WIDTH + i]; // Top boundary
        intermediateData[(HEIGHT-1) * WIDTH + i] = intermediateData[(HEIGHT-2) * WIDTH + i]; // Bottom boundary
    }
    
    // Left and right boundaries (copy from adjacent interior points)
    for (let j = 0; j < HEIGHT; j++) {
        intermediateData[j * WIDTH] = intermediateData[j * WIDTH + 1]; // Left boundary
        intermediateData[j * WIDTH + WIDTH - 1] = intermediateData[j * WIDTH + WIDTH - 2]; // Right boundary
    }
    

    a.fill(-alpha);
    b.fill(1 + 2*alpha);
    c.fill(-alpha);
    
    // Second half-step: explicit in x-direction, implicit in y-direction
    for (let i = 1; i < WIDTH - 1; i++) {
        // Set up the tridiagonal system for this column
        for (let j = 1; j < HEIGHT - 1; j++) {
           
            
            // Calculate the right-hand side using explicit method in x-direction
            const idx = j * WIDTH + i;
            const term_x = intermediateData[idx] +alpha * (
                intermediateData[j * WIDTH + (i-1)] - 
                2 * intermediateData[idx] + 
                intermediateData[j * WIDTH + (i+1)]
            );
            
            d[j] =term_x + (speedUpFactor/2)*(sources[idx]  -(sinks[idx]))
        
        }
        
        // Apply boundary conditions for the y-direction
        // Top boundary (reflective)
        b[1] = b[1] + a[1]; // Absorb the coefficient for the ghost point
        a[1] = 0;
        
        // Bottom boundary (reflective)
        b[HEIGHT-2] = b[HEIGHT-2] + c[HEIGHT-2]; // Absorb the coefficient for the ghost point
        c[HEIGHT-2] = 0;
        
        // Solve the tridiagonal system for this column
        thomasAlgorithm(a, b, c, d, x, HEIGHT-1);
        
        // Store the results in the next concentration data array
        for (let j = 1; j < HEIGHT - 1; j++) {
            nextConcentrationData[j * WIDTH + i] = x[j];
        }
    }
    
    // Apply boundary conditions to the final data
    // Top and bottom boundaries (copy from adjacent interior points)
    for (let i = 0; i < WIDTH; i++) {
        nextConcentrationData[i] = nextConcentrationData[WIDTH + i]; // Top boundary
        nextConcentrationData[(HEIGHT-1) * WIDTH + i] = nextConcentrationData[(HEIGHT-2) * WIDTH + i]; // Bottom boundary
    }
    
    // Left and right boundaries (copy from adjacent interior points)
    for (let j = 0; j < HEIGHT; j++) {
        nextConcentrationData[j * WIDTH] = nextConcentrationData[j * WIDTH + 1]; // Left boundary
        nextConcentrationData[j * WIDTH + WIDTH - 1] = nextConcentrationData[j * WIDTH + WIDTH - 2]; // Right boundary
    }
    
   
    
    // Update the current concentration data with the new values
    [currentConcentrationData, nextConcentrationData] = [nextConcentrationData, currentConcentrationData];

    return {
        currentConcentrationData,
        nextConcentrationData
    };
}

const thomasAlgorithm = (a, b, c, d, x, n) => {
    // Create temporary arrays to avoid modifying the input
    const c_prime = new Float32Array(n);
    const d_prime = new Float32Array(n);
    
    // Forward sweep
    // Ensure we don't divide by zero
    const b0 = Math.abs(b[0]) < 1e-10 ? 1e-10 : b[0];
    c_prime[0] = c[0] / b0;  
    d_prime[0] = d[0] / b0;  
    
    for (let i = 1; i < n; i++) {
        // Ensure numerical stability by avoiding division by very small numbers
        const denominator = b[i] - a[i] * c_prime[i-1];
        const m = 1.0 / (Math.abs(denominator) < 1e-10 ? 1e-10 : denominator);
        c_prime[i] = c[i] * m;
        d_prime[i] = (d[i] - a[i] * d_prime[i-1]) * m;
    }
    
    // Back substitution
    x[n-1] = d_prime[n-1];
    
    for (let i = n - 2; i >= 0; i--) {
        x[i] = d_prime[i] - c_prime[i] * x[i+1];
    }
    
   
};