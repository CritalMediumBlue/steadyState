export const thomasAlgorithm = (a, b, c, d, x, n) => {
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