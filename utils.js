/**
 * utils.js
 * 
 * Utility functions for numerical computations and algorithms.
 */

/**
 * Solves a tridiagonal system of linear equations using the Thomas algorithm.
 * 
 * The Thomas algorithm (also known as the tridiagonal matrix algorithm) is an
 * efficient form of Gaussian elimination specialized for tridiagonal systems.
 * It solves systems of the form:
 * 
 * b₀x₀ + c₀x₁             = d₀
 * a₁x₀ + b₁x₁ + c₁x₂      = d₁
 * a₂x₁ + b₂x₂ + c₂x₃      = d₂
 * ...
 * aₙ₋₁xₙ₋₂ + bₙ₋₁xₙ₋₁     = dₙ₋₁
 * 
 * The algorithm has two phases:
 * 1. Forward elimination: Transforms the system into an upper triangular form
 * 2. Back substitution: Solves the transformed system from bottom to top
 * 
 * Time complexity: O(n) where n is the system size
 * Space complexity: O(n) for the temporary arrays
 * 
 * @param {Float32Array} lowerDiagonal - The lower diagonal elements (a)
 * @param {Float32Array} mainDiagonal - The main diagonal elements (b)
 * @param {Float32Array} upperDiagonal - The upper diagonal elements (c)
 * @param {Float32Array} rightHandSide - The right-hand side vector (d)
 * @param {Float32Array} solution - The solution vector (x) to be filled
 * @param {number} systemSize - The size of the system (n)
 * @returns {void} - The solution is written to the solution parameter
 */
export function thomasAlgorithm(
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


/**
 * Calculates the maximum allowable time step (Δt) for stability
 * using the CFL (Courant–Friedrichs–Lewy) condition for
 * explicit diffusion schemes.
 *
 *
 * @param {number} deltaX - Spatial grid spacing (Δx) [micrometers].
 * @param {number} diffusionRate - Diffusion coefficient (D) [micrometers^2/s].
 * @param {number} dimensions - Number of spatial dimensions.
 * @returns {number} The maximum stable time step (Δt) that satisfies
 *                   the CFL stability criterion. [seconds].
 */
export function CFLCondition(deltaX, diffusionRate, dimensions) {
    const maxDelT = deltaX * deltaX / (2 * diffusionRate * dimensions);
    
    // Return the maximum allowed time step
    return maxDelT;
}

