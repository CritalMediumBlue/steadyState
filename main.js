import { setupScene } from './sceneSetup.js';
import * as THREE from 'three';

// Constants
const GRID = { WIDTH: 100, HEIGHT: 60 };
const SIMULATION = { DIFFUSION_RATE: 0.01 }; 

// Split state into focused objects
const sceneState = {
    scene: null,
    camera: null,
    renderer: null,
    surfaceMesh: null
};

const animationState = {
    animationFrameId: null,
    currentTimeStep: 1,
};

const dataState = {
    currentConcentrationData: null,
    nextConcentrationData: null,
    colors: null,
    sources: null,
    sinks: null
};

const initArrays = () => {
    const gridSize = GRID.WIDTH * GRID.HEIGHT;

    dataState.currentConcentrationData = new Float32Array(gridSize);
    dataState.nextConcentrationData = new Float32Array(gridSize);
    dataState.colors = new Float32Array(gridSize * 3);
    
    // Initialize sources and sinks
    dataState.sources = new Float32Array(gridSize);
    dataState.sinks = new Float32Array(gridSize);
    
    // Create initial concentration distribution (e.g., a central peak)
    for (let y = 0; y < GRID.HEIGHT; y++) {
        for (let x = 0; x < GRID.WIDTH; x++) {
            const idx = y * GRID.WIDTH + x;
            
            // Create a Gaussian-like concentration peak in the center
            const centerX = GRID.WIDTH / 2;
            const centerY = GRID.HEIGHT / 2;
            const distanceSquared = Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2);
            
            // Concentration peak with exponential decay
            dataState.currentConcentrationData[idx] = 10 * Math.exp(-distanceSquared / (2 * Math.pow(10, 2)));
            
            // Optional: Add some random sources/sinks
            dataState.sources[idx] = Math.random() < 0.01 ? 0.1 : 0;
            dataState.sinks[idx] = Math.random() < 0.01 ? 0.05 : 0;
        }
    }
};

const setupNewScene = () => {
    const setup = setupScene();
    Object.assign(sceneState, setup);
    document.getElementById('scene-container').appendChild(sceneState.renderer.domElement);
    
    // Initialize simulation arrays
    initArrays();
};

/**
 * Calculate color based on concentration value
 * @param {number} concentration - Concentration value
 * @returns {Object} RGB color values
 */
const calculateColor = (concentration) => {
    // Normalize concentration value
    const colorValue = Math.min(1, concentration / 10);
    
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

/**
 * Update surface mesh based on concentration data
 */
const updateSurfaceMesh = () => {
    const positions = sceneState.surfaceMesh.geometry.attributes.position.array;
    
    for (let y = 0; y < GRID.HEIGHT; y++) {
        for (let x = 0; x < GRID.WIDTH; x++) {
            const idx = y * GRID.WIDTH + x;
            
            // Get concentration with NaN safety
            let concentration = dataState.currentConcentrationData[idx];
            if (isNaN(concentration)) {
                console.warn(`NaN detected in currentConcentrationData at (${x},${y})`);
                concentration = dataState.currentConcentrationData[idx] = 0.0;
            }
            
            // Set height (z-coordinate) based on concentration
            const height = concentration;
            positions[3 * idx + 2] = isNaN(height) ? 0 : height;
            
            // Calculate and set color
            const color = calculateColor(concentration);
            dataState.colors[3 * idx] = color.r;
            dataState.colors[3 * idx + 1] = color.g;
            dataState.colors[3 * idx + 2] = color.b;
        }
    }
    
    // Update mesh attributes
    sceneState.surfaceMesh.geometry.setAttribute('color', new THREE.BufferAttribute(dataState.colors, 3));
    sceneState.surfaceMesh.geometry.attributes.position.needsUpdate = true;
    sceneState.surfaceMesh.geometry.attributes.color.needsUpdate = true;
};

/**
 * Perform diffusion simulation step
 * @returns {[Float32Array, Float32Array]} Updated concentration data
 */
const diffusion = () => {
    const { currentConcentrationData, nextConcentrationData, sources, sinks } = dataState;
    const { WIDTH, HEIGHT } = GRID;
    const DIFFUSION_RATE = SIMULATION.DIFFUSION_RATE;

    // Create a copy of current concentration data
    for (let i = 0; i < currentConcentrationData.length; i++) {
        nextConcentrationData[i] = currentConcentrationData[i];
    }

    // Diffusion calculation with source/sink terms
    for (let y = 1; y < HEIGHT - 1; y++) {
        for (let x = 1; x < WIDTH - 1; x++) {
            const idx = y * WIDTH + x;

            // Diffusion term (5-point stencil)
            const diffusionTerm = DIFFUSION_RATE * (
                currentConcentrationData[(y - 1) * WIDTH + x] +
                currentConcentrationData[(y + 1) * WIDTH + x] +
                currentConcentrationData[y * WIDTH + (x - 1)] +
                currentConcentrationData[y * WIDTH + (x + 1)] -
                4 * currentConcentrationData[idx]
            );

            // Source and sink terms
            const sourceTerm = sources[idx] * 0.1;
            const sinkTerm = sinks[idx] * currentConcentrationData[idx];

            // Update concentration
            nextConcentrationData[idx] = currentConcentrationData[idx] + diffusionTerm + sourceTerm - sinkTerm;
        }
    }

    // Reflective boundary conditions
    for (let i = 0; i < WIDTH; i++) {
        // Top and bottom boundaries
        nextConcentrationData[i] = nextConcentrationData[WIDTH + i];
        nextConcentrationData[(HEIGHT - 1) * WIDTH + i] = nextConcentrationData[(HEIGHT - 2) * WIDTH + i];
    }

    for (let i = 0; i < HEIGHT; i++) {
        // Left and right boundaries
        nextConcentrationData[i * WIDTH] = nextConcentrationData[i * WIDTH + 1];
        nextConcentrationData[i * WIDTH + WIDTH - 1] = nextConcentrationData[i * WIDTH + WIDTH - 2];
    }

    return [nextConcentrationData, currentConcentrationData];
};

/**
 * Update the scene for the current time step
 */
const updateScene = () => {
    [dataState.currentConcentrationData, dataState.nextConcentrationData] = diffusion();
    
    // Update surface mesh
    updateSurfaceMesh();

    animationState.currentTimeStep++;
};

/**
 * Animation loop
 */
const animate = () => {
    animationState.animationFrameId = requestAnimationFrame(animate);
  
    updateScene();
    
    // Render every frame
    sceneState.renderer.render(sceneState.scene, sceneState.camera);
};

// Setup scene and start animation when the page loads
window.addEventListener('load', () => {
    setupNewScene();
    animate();
});
