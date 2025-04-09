import * as THREE from 'three';
import { calculateColor } from './colorUtils.js';
import { sceneState, dataState, constants } from './state.js';

let stop = false;

/**
 * Update surface mesh based on concentration data
 */
export const updateSurfaceMesh = () => {
    const positions = sceneState.surfaceMesh.geometry.attributes.position.array;
    
    for (let y = 0; y < constants.GRID.HEIGHT; y++) {
        for (let x = 0; x < constants.GRID.WIDTH; x++) {
            const idx = y * constants.GRID.WIDTH + x;
            
            // Get concentration with NaN safety
            let concentration = dataState.currentConcentrationData[idx];
            if (isNaN(concentration)) {
                console.warn(`NaN detected in currentConcentrationData at (${x},${y})`);
                concentration = dataState.currentConcentrationData[idx] = 0.0;
                stop = true;
            }
            
            // Set height (z-coordinate) based on concentration
            const height = concentration;
            positions[3 * idx + 2] = isNaN(height) ? 0 : height;
            
            // Calculate and set color
            const color = calculateColor(concentration*0.5);
            dataState.colors[3 * idx] = color.r;
            dataState.colors[3 * idx + 1] = color.g;
            dataState.colors[3 * idx + 2] = color.b;
        }
    }
    
    // Update mesh attributes
    sceneState.surfaceMesh.geometry.setAttribute('color', new THREE.BufferAttribute(dataState.colors, 3));
    sceneState.surfaceMesh.geometry.attributes.position.needsUpdate = true;
    sceneState.surfaceMesh.geometry.attributes.color.needsUpdate = true;

    return stop;
};
