/**
 * diffusionCore.js
 * 
 * This module provides numerical solvers for the diffusion equation using two methods:
 * 1. FTCS (Forward Time Centered Space) - An explicit method
 * 2. ADI (Alternating Direction Implicit) - An implicit method with higher stability
 * 
 * The diffusion equation models how substances spread through a medium over time:
 * ∂C/∂t = D * ∇²C + S - R
 * where:
 * - C is concentration
 * - D is diffusion coefficient
 * - S is source term
 * - R is sink/reaction term
 */


// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Applies reflective boundary conditions to the concentration data.
 * This ensures no-flux boundaries (zero gradient) at the edges of the domain.
 * 
 * @param {Float32Array} data - Concentration data to apply boundary conditions to
 * @param {number} width - Width of the grid
 * @param {number} height - Height of the grid
 * @returns {void} - Modifies the data array in-place
 */
function applyReflectiveBoundaryConditions(data, width, height) {
    // Top and bottom boundaries
    for (let i = 0; i < width; i++) {
        data[i] = data[width + i]; // Top boundary copies from first interior row
        data[(height - 1) * width + i] = data[(height - 2) * width + i]; // Bottom boundary copies from last interior row
    }

    // Left and right boundaries
    for (let j = 0; j < height; j++) {
        const rowStart = j * width;
        data[rowStart] = data[rowStart + 1]; // Left boundary copies from first interior column
        data[rowStart + width - 1] = data[rowStart + width - 2]; // Right boundary copies from last interior column
    }
}

/**
 * Ensures concentration values don't go negative, which would be physically impossible.
 * 
 * @param {Float32Array} data - Concentration data to check and correct
 * @returns {void} - Modifies the data array in-place
 */
function enforceNonNegativeConcentration(data) {
    for (let i = 0; i < data.length; i++) {
        if (data[i] < 0) {
            console.warn("Concentration went negative: " + data[i]);
            data[i] = 0; // Ensure concentration doesn't go negative
        }
    }
}

/**
 * Calculates the Michaelis-Menten kinetics term for a given concentration.
 * This models how reaction rates depend on concentration, approaching a maximum rate
 * as concentration increases.
 * 
 * @param {number} concentration - Current concentration value
 * @param {number} halfSaturationConstant - Half saturation constant for Michaelis-Menten kinetics
 * @returns {number} - Michaelis-Menten term (between 0 and 1)
 */
function calculateMichaelisMentenTerm(concentration, halfSaturationConstant) {
    return concentration / (halfSaturationConstant + concentration);
}

// ============================================================================
// MAIN DIFFUSION METHODS
// ============================================================================

/**
 * Forward-Time Central-Space (FTCS) method for solving the diffusion equation.
 * This is an explicit method that is simple to implement but has stability constraints.
 * 
 * @param {Float32Array} concentrationData - Current concentration data
 * @param {Float32Array} sources - Source terms (adding concentration)
 * @param {Float32Array} sinks - Sink terms (removing concentration)
 * @param {number} diffusionRate - Diffusion coefficient (D)
 * @param {number} deltaX - Spatial step size
 * @param {number} timeLapse - Time lapse for the simulation in seconds
 * @param {number} deltaT - Time step size
 * @returns {Object} Object containing the updated concentration data and steady state status
 * @returns {Float32Array} currentConcentrationData - The updated concentration values
 * @returns {boolean} steadyState - Whether the system has reached steady state
 */
export function solveFTCS(concentrationData, sources, sinks, diffusionRate, deltaX, timeLapse, deltaT ) {
    const WIDTH = 100
    const HEIGHT = 60
    const scaleSAndS = 200
    const halfSaturationConstant = 0.5;
    const totalNumberOfSteps = Math.round(timeLapse / deltaT);
    const scaleSinksAndSources = scaleSAndS * timeLapse;
    
    
    // Create copies of input arrays to avoid modifying originals
    let current = new Float32Array(concentrationData);
    let next = new Float32Array(concentrationData);
    const originalData = new Float32Array(concentrationData);
    
    // Pre-calculate the diffusion parameter for efficiency
    // This represents (D*Δt)/(Δx²) in the finite difference approximation
    const diffusionParameter = diffusionRate * deltaT / (deltaX * deltaX);
    
    // Main time-stepping loop
    for (let step = 0; step < totalNumberOfSteps; step++) {
        // Interior points calculation (excluding boundaries)
        for (let y = 1; y < HEIGHT - 1; y++) {
            const rowStart = y * WIDTH;
            for (let x = 1; x < WIDTH - 1; x++) {
                const idx = rowStart + x;
                
                // Calculate Michaelis-Menten kinetics for sink term
                const michaelisMentenTerm = calculateMichaelisMentenTerm(current[idx], halfSaturationConstant);
                
                // Calculate diffusion using 5-point stencil (central differences in space)
                // This approximates the Laplacian (∇²C)
                const diffusionTerm = diffusionParameter * (
                    current[(y - 1) * WIDTH + x] +  // North neighbor
                    current[(y + 1) * WIDTH + x] +  // South neighbor
                    current[rowStart + (x - 1)] +   // West neighbor
                    current[rowStart + (x + 1)] -   // East neighbor
                    4 * current[idx]                // Center point (multiplied by 4)
                );
                
                // Update concentration: C_new = C_old + diffusion + (sources - sinks)
                next[idx] = current[idx] + 
                           diffusionTerm + 
                           (sources[idx] - sinks[idx] * michaelisMentenTerm) * 
                           scaleSinksAndSources / totalNumberOfSteps;
            }
        }
        
        // Apply boundary conditions and ensure non-negative concentrations
        applyReflectiveBoundaryConditions(next, WIDTH, HEIGHT);
        enforceNonNegativeConcentration(next);
        
        // Update current data for next time step
        [current, next] = [next, current];
    }

    // Check for steady state
    const steadyState = checkForSteadyState(current, originalData);
    
    return {
        currentConcentrationData: current,
        steadyState: steadyState
    };
}

/**
 * Alternating Direction Implicit (ADI) method for solving the diffusion equation.
 * This is an implicit method that offers better stability than FTCS, allowing larger time steps.
 * 
 * @param {Float32Array} concentrationData - Current concentration data
 * @param {Float32Array} sources - Source terms (adding concentration)
 * @param {Float32Array} sinks - Sink terms (removing concentration)
 * @param {number} diffusionRate - Diffusion coefficient (D)
 * @param {number} deltaX - Spatial step size
 * @param {number} timeLapse - Time lapse for the simulation in seconds
 * @returns {Object} Object containing the updated concentration data and steady state status
 * @returns {Float32Array} currentConcentrationData - The updated concentration values
 * @returns {boolean} steadyState - Whether the system has reached steady state
 */
export function solveADI(concentrationData, sources, sinks, diffusionRate, deltaX, timeLapse) {
    const WIDTH = 100
    const HEIGHT = 60
    const scaleSAndS = 200
    const halfSaturationConstant = 0.5;
    
    // ADI uses a fixed time step for stability and accuracy
    const timeStep = 1; // one second is the maximum time step
    const totalNumberOfSteps = Math.round(timeLapse / timeStep);
    const scaleSinksAndSources = scaleSAndS;
    
    // Create a copy of the input concentration data
    let currentData = new Float32Array(concentrationData);
    let nextData = new Float32Array(concentrationData.length);

    //copy the original data. this is used to check for steady state
    const originalData = new Float32Array(concentrationData);

    
    // Calculate the diffusion coefficient for the tridiagonal system
    // The factor of 2 in the denominator comes from the ADI formulation
    const alpha = diffusionRate * timeStep / (2 * deltaX * deltaX);
    
    // Initialize arrays for the tridiagonal system
    const maxDimension = Math.max(WIDTH, HEIGHT);
    const lowerDiagonal = new Float32Array(maxDimension); // a - below main diagonal
    const mainDiagonal = new Float32Array(maxDimension);  // b - main diagonal
    const upperDiagonal = new Float32Array(maxDimension); // c - above main diagonal
    const rightHandSide = new Float32Array(maxDimension); // d - right-hand side
    const solution = new Float32Array(maxDimension);      // x - solution vector
    
    // Intermediate data after the first half-step
    const intermediateData = new Float32Array(WIDTH * HEIGHT);
    
    // Main time-stepping loop
    for (let step = 0; step < totalNumberOfSteps; step++) {
        // Initialize arrays for each time step
        rightHandSide.fill(0);
        solution.fill(0);
        intermediateData.fill(0);
        
        // ====================================================================
        // FIRST HALF-STEP: Implicit in x-direction, explicit in y-direction
        // ====================================================================
        
        // Set up coefficients for the tridiagonal system
        lowerDiagonal.fill(-alpha);
        mainDiagonal.fill(1 + 2 * alpha);
        upperDiagonal.fill(-alpha);
        
        // Apply boundary conditions for the x-direction
        // Left boundary (reflective)
        mainDiagonal[1] += lowerDiagonal[1]; // Absorb coefficient for ghost point
        lowerDiagonal[1] = 0;
        
        // Right boundary (reflective)
        mainDiagonal[WIDTH - 2] += upperDiagonal[WIDTH - 2]; // Absorb coefficient for ghost point
        upperDiagonal[WIDTH - 2] = 0;
        
        // Process each row (y-direction)
        for (let j = 1; j < HEIGHT - 1; j++) {
            // Set up the right-hand side for this row
            for (let i = 1; i < WIDTH - 1; i++) {
                const idx = j * WIDTH + i;
                const michaelisMentenTerm = calculateMichaelisMentenTerm(currentData[idx], halfSaturationConstant);
                
                // Calculate explicit term in y-direction
                const explicitYTerm = currentData[idx] + alpha * (
                    currentData[(j - 1) * WIDTH + i] -  // North neighbor
                    2 * currentData[idx] +              // Center point
                    currentData[(j + 1) * WIDTH + i]    // South neighbor
                );
                
                // Add source/sink contributions (half for this step)
                const sourceSinkTerm = (timeStep * scaleSinksAndSources * 
                                      (sources[idx] - sinks[idx] * michaelisMentenTerm)) / 2;
                
                rightHandSide[i] = explicitYTerm + sourceSinkTerm;
            }
            
            // Solve the tridiagonal system for this row
            thomasAlgorithm(lowerDiagonal, mainDiagonal, upperDiagonal, rightHandSide, solution, WIDTH - 1);
            
            // Store results in intermediate array
            for (let i = 1; i < WIDTH - 1; i++) {
                intermediateData[j * WIDTH + i] = solution[i];
            }
        }
        
        // Apply boundary conditions to intermediate data
        applyReflectiveBoundaryConditions(intermediateData, WIDTH, HEIGHT);
        enforceNonNegativeConcentration(intermediateData);
        
        // ====================================================================
        // SECOND HALF-STEP: Explicit in x-direction, implicit in y-direction
        // ====================================================================
        
        // Reset tridiagonal system coefficients
        lowerDiagonal.fill(-alpha);
        mainDiagonal.fill(1 + 2 * alpha);
        upperDiagonal.fill(-alpha);
        
        // Apply boundary conditions for the y-direction
        // Top boundary (reflective)
        mainDiagonal[1] += lowerDiagonal[1]; // Absorb coefficient for ghost point
        lowerDiagonal[1] = 0;
        
        // Bottom boundary (reflective)
        mainDiagonal[HEIGHT - 2] += upperDiagonal[HEIGHT - 2]; // Absorb coefficient for ghost point
        upperDiagonal[HEIGHT - 2] = 0;
        
        // Process each column (x-direction)
        for (let i = 1; i < WIDTH - 1; i++) {
            // Set up the right-hand side for this column
            for (let j = 1; j < HEIGHT - 1; j++) {
                const idx = j * WIDTH + i;
                const michaelisMentenTerm = calculateMichaelisMentenTerm(intermediateData[idx], halfSaturationConstant);
                
                // Calculate explicit term in x-direction
                const explicitXTerm = intermediateData[idx] + alpha * (
                    intermediateData[j * WIDTH + (i - 1)] -  // West neighbor
                    2 * intermediateData[idx] +              // Center point
                    intermediateData[j * WIDTH + (i + 1)]    // East neighbor
                );
                
                // Add source/sink contributions (half for this step)
                const sourceSinkTerm = (timeStep * scaleSinksAndSources * 
                                      (sources[idx] - sinks[idx] * michaelisMentenTerm)) / 2;
                
                rightHandSide[j] = explicitXTerm + sourceSinkTerm;
            }
            
            // Solve the tridiagonal system for this column
            thomasAlgorithm(lowerDiagonal, mainDiagonal, upperDiagonal, rightHandSide, solution, HEIGHT - 1);
            
            // Store results in next data array
            for (let j = 1; j < HEIGHT - 1; j++) {
                nextData[j * WIDTH + i] = solution[j];
            }
        }
        
        // Apply boundary conditions to final data
        applyReflectiveBoundaryConditions(nextData, WIDTH, HEIGHT);
        enforceNonNegativeConcentration(nextData);
        
        // Update current data for next time step
        [currentData, nextData] = [nextData, currentData];
    }

    const steadyState = checkForSteadyState(currentData, originalData);
    
    return {
        currentConcentrationData: currentData,
        steadyState: steadyState
    };
}

/**
 * Check if the system has reached a steady state by comparing current concentration
 * with the initial concentration data.
 * @param {Float32Array} previous - Current concentration data
 * @param {Float32Array} next - Initial concentration data
 * @returns {boolean} - True if steady state is reached (minimal changes), false otherwise
 */
const checkForSteadyState = (previous, next) => {
    const threshold = 0.001; // Threshold for steady state
    let steadyState = true;
    const length = previous.length;

    for (let i = 0; i < length; i++) {
        const diff = Math.abs(previous[i] - next[i]);
        if (diff > threshold) {
            steadyState = false;
            break;
        }
    }

    return  steadyState;
};

function thomasAlgorithm(
    lowerDiagonal,
    mainDiagonal,
    upperDiagonal,
    rightHandSide,
    solution,
    systemSize
) {
    // Create temporary arrays to avoid modifying the input arrays
    // These arrays store the modified coefficients during forward elimination
    const modifiedUpperDiagonal = new Float32Array(systemSize);
    const modifiedRightHandSide = new Float32Array(systemSize);
    
    // ====================================================================
    // PHASE 1: Forward Elimination
    // ====================================================================
    // This phase eliminates the lower diagonal elements and modifies the
    // upper diagonal and right-hand side accordingly
    
    // Process the first row
    // For numerical stability, ensure we don't divide by zero or very small numbers
    const firstPivot = Math.abs(mainDiagonal[0]) < 1e-10 ? 1e-10 : mainDiagonal[0];
    modifiedUpperDiagonal[0] = upperDiagonal[0] / firstPivot;
    modifiedRightHandSide[0] = rightHandSide[0] / firstPivot;
    
    // Process rows 1 to n-1
    for (let i = 1; i < systemSize; i++) {
        // Calculate the denominator: b'ᵢ = bᵢ - aᵢ * c'ᵢ₋₁
        // This represents the pivot element after elimination
        const denominator = mainDiagonal[i] - lowerDiagonal[i] * modifiedUpperDiagonal[i-1];
        
        // Ensure numerical stability by avoiding division by very small numbers
        // If the denominator is close to zero, use a small value instead
        const pivotInverse = 1.0 / (Math.abs(denominator) < 1e-10 ? 1e-10 : denominator);
        
        // Calculate the modified upper diagonal: c'ᵢ = cᵢ / b'ᵢ
        modifiedUpperDiagonal[i] = upperDiagonal[i] * pivotInverse;
        
        // Calculate the modified right-hand side: d'ᵢ = (dᵢ - aᵢ * d'ᵢ₋₁) / b'ᵢ
        modifiedRightHandSide[i] = (rightHandSide[i] - lowerDiagonal[i] * modifiedRightHandSide[i-1]) * pivotInverse;
    }
    
    // ====================================================================
    // PHASE 2: Back Substitution
    // ====================================================================
    // This phase solves the transformed system from bottom to top
    
    // The last element of the solution is directly given by the modified right-hand side
    solution[systemSize-1] = modifiedRightHandSide[systemSize-1];
    
    // Solve for the remaining elements from the second-to-last to the first
    for (let i = systemSize - 2; i >= 0; i--) {
        // Calculate xᵢ = d'ᵢ - c'ᵢ * xᵢ₊₁
        solution[i] = modifiedRightHandSide[i] - modifiedUpperDiagonal[i] * solution[i+1];
    }
}


