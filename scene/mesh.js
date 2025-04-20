


// Constants for height calculations
const BASE_HEIGHT_OFFSET = -11;
const HEIGHT_SCALE_FACTOR = 3;

/**
 * Calculates the height for a vertex based on concentration data
 * @param {number} concentration - The concentration value for this vertex
 * @param {number} x - Grid x-coordinate (for error reporting)
 * @param {number} y - Grid y-coordinate (for error reporting)
 * @returns {number} The calculated height value
 */
const calculateVertexHeight = (concentration, x, y) => {
    // Validate concentration value
    if (isNaN(concentration)) {
        console.warn(`NaN detected in concentration data at (${x},${y})`);
        return 0;
    }
    
    // Calculate height with offset and scaling
    return (concentration + BASE_HEIGHT_OFFSET) * HEIGHT_SCALE_FACTOR;
};

/**
 * Updates vertex colors based on concentration values
 * @param {number} concentration - The concentration value for this vertex
 * @param {number} vertexIndex - Index of the vertex in the buffer
 * @param {Float32Array} colorArray - The color buffer to update
 */
const updateVertexColors = (concentration, vertexIndex, colorArray) => {
    const color = calculateColor(concentration);
    colorArray[3 * vertexIndex] = color.r;
    colorArray[3 * vertexIndex + 1] = color.g;
    colorArray[3 * vertexIndex + 2] = color.b;
};

/**
 * Updates mesh geometry attributes after processing all vertices
 * @param {THREE.Mesh} mesh - The Three.js mesh to update
 */
const updateMeshAttributes = (mesh) => {
    mesh.geometry.attributes.position.needsUpdate = true;
    mesh.geometry.attributes.color.needsUpdate = true;
};

/**
 * Updates a surface mesh based on concentration data
 * @param {THREE.Mesh} mesh - The Three.js mesh to update
 * @param {Float32Array} concentrationData - Array of concentration values
 */
export const updateSurfaceMesh = (mesh, concentrationData, width, height) => {
    const positions = mesh.geometry.attributes.position.array;
    
    // Get direct reference to the color buffer
    const colorBuffer = mesh.geometry.attributes.color.array;
    
    // Process each vertex in the grid
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const vertexIndex = y * width + x;
            const currentConcentration = concentrationData[vertexIndex];
            
            // Update vertex height
            positions[3 * vertexIndex + 2] = calculateVertexHeight(
                currentConcentration,
                x,
                y
            );
            
            // Update vertex color directly in the mesh's color buffer
            updateVertexColors(currentConcentration, vertexIndex, colorBuffer);
        }
    }
    
    // Finalize mesh updates
    updateMeshAttributes(mesh);
    
};

/**
 * Calculate color based on concentration value
 * @param {number} concentration - Concentration value
 * @returns {Object} RGB color values
 */
 const calculateColor = (concentration) => {
    // Normalize concentration value
    const colorValue =  concentration / 10;
    
    // Calculate color components with phase shifts for RGB
    const phase = colorValue * 2 * Math.PI;
    const red = Math.sin(phase) * 0.5 + 0.5;
    const green = Math.sin(phase - 4 * Math.PI / 3) * 0.5 + 0.5;
    const blue = Math.sin(phase - 2 * Math.PI / 3) * 0.5 + 0.5;
    
    return {
        r: red,
        g: green,
        b: blue
    };
};
