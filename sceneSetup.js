// Import necessary modules from Three.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CONFIG } from './config.js';
import { constants } from './state.js';

/**
 * Sets up the scene, camera, renderer, and controls.
 * @returns {Object} An object containing the scene, camera, renderer, controls, and surfaceMesh.
 */
export function setupScene() {
    const scene = initializeScene();
    const camera = initializeCamera();
    const renderer = initializeRenderer();
    const controls = initializeControls(camera, renderer);
    const surfaceMesh = initializeMesh(scene);

    // Add helper axes to the scene for orientation visualization
    const axesHelper = new THREE.AxesHelper(10);
    scene.add(axesHelper);

    return { scene, camera, renderer, controls, surfaceMesh };
}

/**
 * Initializes the scene with fog and returns it.
 * @returns {THREE.Scene} The created scene.
 */
function initializeScene() {
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(CONFIG.SCENE.FOG_COLOR, CONFIG.SCENE.FOG_NEAR, CONFIG.SCENE.FOG_FAR);
    return scene;
}

/**
 * Initializes the camera with perspective projection and positions it.
 * @returns {THREE.PerspectiveCamera} The created camera.
 */
function initializeCamera() {
    const camera = new THREE.PerspectiveCamera(
        CONFIG.SCENE.CAMERA_FOV,
        window.innerWidth / window.innerHeight,
        CONFIG.SCENE.CAMERA_NEAR,
        CONFIG.SCENE.CAMERA_FAR
    );
    camera.position.set(
        CONFIG.SCENE.CAMERA_POSITION.x,
        CONFIG.SCENE.CAMERA_POSITION.y,
        CONFIG.SCENE.CAMERA_POSITION.z
    );
    camera.lookAt(
        CONFIG.SCENE.CAMERA_LOOKAT.x,
        CONFIG.SCENE.CAMERA_LOOKAT.y,
        CONFIG.SCENE.CAMERA_LOOKAT.z
    );
    return camera;
}

/**
 * Initializes the WebGL renderer and sets its size.
 * @returns {THREE.WebGLRenderer} The created renderer.
 */
function initializeRenderer() {
    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    return renderer;
}

/**
 * Initializes the OrbitControls for the camera and configures its behavior.
 * @param {THREE.Camera} camera - The camera to control.
 * @param {THREE.WebGLRenderer} renderer - The renderer to control.
 * @returns {OrbitControls} The created controls.
 */
function initializeControls(camera, renderer) {
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false; // Disable damping for immediate response
    controls.autoRotate = false; // Disable automatic rotation
    controls.screenSpacePanning = true; // Allow panning in screen space
    controls.maxDistance = CONFIG.SCENE.CONTROLS_MAX_DISTANCE; // Set maximum zoom-out distance
    controls.minDistance = CONFIG.SCENE.CONTROLS_MIN_DISTANCE; // Set minimum zoom-in distance
    controls.target.set(
        CONFIG.SCENE.CAMERA_LOOKAT.x,
        CONFIG.SCENE.CAMERA_LOOKAT.y,
        CONFIG.SCENE.CAMERA_LOOKAT.z
    );
    return controls;
}

/**
 * Creates and adds a surface mesh to the scene.
 * The mesh is a wireframe plane geometry aligned with the grid dimensions.
 * @param {THREE.Scene} scene - The scene to add the mesh to.
 * @returns {THREE.Mesh} The created surface mesh.
 */
function initializeMesh(scene) {
    const WIDTH = constants.GRID.WIDTH;
    const HEIGHT = constants.GRID.HEIGHT;

    // Create a plane geometry with segments matching the grid dimensions
    const planeGeometry = new THREE.PlaneGeometry(WIDTH - 1, HEIGHT - 1, WIDTH - 1, HEIGHT - 1);
    planeGeometry.rotateZ(-Math.PI); // Rotate to align with the intended orientation
    planeGeometry.rotateY(-Math.PI);

    // Create a basic material with wireframe and vertex colors enabled
    const material = new THREE.MeshBasicMaterial({
        wireframe: true,
        vertexColors: true
    });

    // Create the mesh and position it at the origin
    const surfaceMesh = new THREE.Mesh(planeGeometry, material);
    surfaceMesh.position.set(0, 0, 0);
    scene.add(surfaceMesh);

    return surfaceMesh;
}

