import * as THREE from 'three';
import { calculateColor } from './colorUtils.js';
import { dataState, constants } from './state.js';

// Global flag to indicate if processing should stop due to errors
let shouldStopProcessing = false;

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
        shouldStopProcessing = true;
        return 0;
    }
    
    // Calculate height with offset and scaling
    return (concentration + BASE_HEIGHT_OFFSET) * HEIGHT_SCALE_FACTOR;
};

/**
 * Updates vertex colors based on concentration values
 * @param {number} concentration - The concentration value for this vertex
 * @param {number} vertexIndex - Index of the vertex in the buffer
 */
const updateVertexColors = (concentration, vertexIndex) => {
    const color = calculateColor(concentration);
    dataState.colors[3 * vertexIndex] = color.r;
    dataState.colors[3 * vertexIndex + 1] = color.g;
    dataState.colors[3 * vertexIndex + 2] = color.b;
};

/**
 * Updates mesh geometry attributes after processing all vertices
 * @param {THREE.Mesh} mesh - The Three.js mesh to update
 */
const updateMeshAttributes = (mesh) => {
    mesh.geometry.setAttribute('color', new THREE.BufferAttribute(dataState.colors, 3));
    mesh.geometry.attributes.position.needsUpdate = true;
    mesh.geometry.attributes.color.needsUpdate = true;
};

/**
 * Updates a surface mesh based on concentration data
 * @param {THREE.Mesh} mesh - The Three.js mesh to update
 * @param {Float32Array} concentrationData - Array of concentration values
 * @returns {boolean} True if processing should stop due to errors, false otherwise
 */
export const updateSurfaceMesh = (mesh, concentrationData) => {
    shouldStopProcessing = false; // Reset stop flag for each update
    const positions = mesh.geometry.attributes.position.array;
    
    // Process each vertex in the grid
    for (let y = 0; y < constants.GRID.HEIGHT; y++) {
        for (let x = 0; x < constants.GRID.WIDTH; x++) {
            const vertexIndex = y * constants.GRID.WIDTH + x;
            const currentConcentration = concentrationData[vertexIndex];
            
            // Update vertex height
            positions[3 * vertexIndex + 2] = calculateVertexHeight(
                currentConcentration,
                x,
                y
            );
            
            // Update vertex color
            updateVertexColors(currentConcentration, vertexIndex);
        }
    }
    
    // Finalize mesh updates
    updateMeshAttributes(mesh);
    
    return shouldStopProcessing;
};
