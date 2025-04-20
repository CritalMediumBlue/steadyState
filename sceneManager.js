import * as THREE from 'three';
import { Scene, Grid } from './config.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const sceneState = {
    scene: null,
    camera: null,
    renderer: null,
    surfaceMesh: null,
    animationFrameId: null
};

/**
 * Setup new scene and initialize simulation arrays
 */
export const setupNewScene = () => {
    const setup = setupScene();
    Object.assign(sceneState, setup);
    document.getElementById('scene-container').appendChild(sceneState.renderer.domElement);
};



const setupScene = () => {
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(Scene.FOG_COLOR, Scene.FOG_NEAR, Scene.FOG_FAR);

    const WIDTH = Grid.WIDTH;
    const HEIGHT = Grid.HEIGHT;

    // Create a camera
    const camera = new THREE.PerspectiveCamera(
        Scene.CAMERA_FOV, 
        window.innerWidth / window.innerHeight, 
        Scene.CAMERA_NEAR, 
        Scene.CAMERA_FAR
    );

    camera.position.set(
        Scene.CAMERA_POSITION.x, 
        Scene.CAMERA_POSITION.y, 
        Scene.CAMERA_POSITION.z
    );

    camera.lookAt(
        Scene.CAMERA_LOOKAT.x, 
        Scene.CAMERA_LOOKAT.y, 
        Scene.CAMERA_LOOKAT.z
    );

    // Create a renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(Scene.FOG_COLOR);

    // Create orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.maxDistance = Scene.CONTROLS_MAX_DISTANCE;
    controls.minDistance = Scene.CONTROLS_MIN_DISTANCE;

    // Create a surface mesh
    const geometry = new THREE.PlaneGeometry(WIDTH, HEIGHT, WIDTH - 1, HEIGHT - 1);
    
    // Initialize color buffer with default color (white)
    const vertexCount = geometry.attributes.position.count;
    const colorBuffer = new Float32Array(vertexCount * 3);
    for (let i = 0; i < vertexCount; i++) {
        colorBuffer[i * 3] = 1.0;     // R
        colorBuffer[i * 3 + 1] = 1.0; // G
        colorBuffer[i * 3 + 2] = 1.0; // B
    }
    
    // Add color attribute to geometry
    geometry.setAttribute('color', new THREE.BufferAttribute(colorBuffer, 3));
    
    const material = new THREE.MeshBasicMaterial({ 
        vertexColors: true,
        wireframe: true
    });
    
    const surfaceMesh = new THREE.Mesh(geometry, material);
    scene.add(surfaceMesh);

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    return { scene, camera, renderer, surfaceMesh, WIDTH, HEIGHT };
};
