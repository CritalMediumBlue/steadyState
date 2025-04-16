import * as THREE from 'three';
import { calculateColor } from './colorUtils.js';
import { sceneState, dataState, constants } from './state.js';

let stop = false;

/**
 * Update surface mesh based on concentration data
 */
export const updateSurfaceMesh = (mesh,concentrationData) => {
    const positions = mesh.geometry.attributes.position.array;
    
    for (let y = 0; y < constants.GRID.HEIGHT; y++) {
        for (let x = 0; x < constants.GRID.WIDTH; x++) {
            const idx = y * constants.GRID.WIDTH + x;
            
            // Get concentration with NaN safety
            let concentration = concentrationData[idx];
            if (isNaN(concentration)) {
                console.warn(`NaN detected in currentConcentrationData at (${x},${y})`);
                concentration = concentrationData[idx] = 0.0;
                stop = true;
            }
            const height = concentration-11;

            
            // Set height (z-coordinate) based on concentration
            positions[3 * idx + 2] = isNaN(height) ? 0 : height*3;
            
            // Calculate and set color
            const color = calculateColor(concentration);
            dataState.colors[3 * idx] = color.r;
            dataState.colors[3 * idx + 1] = color.g;
            dataState.colors[3 * idx + 2] = color.b;
        }
    }
    
    // Update mesh attributes
    mesh.geometry.setAttribute('color', new THREE.BufferAttribute(dataState.colors, 3));
    mesh.geometry.attributes.position.needsUpdate = true;
    mesh.geometry.attributes.color.needsUpdate = true;

    return stop;
};
