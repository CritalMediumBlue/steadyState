import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { updateSurfaceMesh } from './mesh.js';
import { updateLoggsOverlay } from './overlay.js';

export const scene = {
    scene: null,
    camera: null,
    renderer: null,
    surfaceMesh: null,
    animationFrameId: null
};

/**
 * Setup new scene and initialize simulation arrays
 */
export const setupNewScene = (Grid, SceneConf) => {
    const setup = setupScene(Grid, SceneConf);
    Object.assign(scene, setup);
    document.getElementById('scene-container').appendChild(scene.renderer.domElement);
};

export const updateScene = (dataState) => {
    
    const { currentConcentrationData, currentTimeStep, 
        steadyStateTimes, steadyStateSteps, runCount, maxRuns,
        timeLapse, method
     } = dataState;
    updateSurfaceMesh(
        scene.surfaceMesh,
        currentConcentrationData,
        scene.WIDTH,
        scene.HEIGHT
    );

    updateLoggsOverlay({
                currentConcentrationData: currentConcentrationData,
                currentTimeStep: currentTimeStep,
                runCount,
                maxRuns,
                steadyStateTimes,
                steadyStateSteps,
                timeLapse,
                method
            });

    scene.renderer.render(scene.scene, scene.camera);
}

const setupScene = (Grid, SceneConf) => {
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(SceneConf.FOG_COLOR, SceneConf.FOG_NEAR, SceneConf.FOG_FAR);

    const WIDTH = Grid.WIDTH;
    const HEIGHT = Grid.HEIGHT;

    // Create a camera
    const camera = new THREE.PerspectiveCamera(
        SceneConf.CAMERA_FOV, 
        window.innerWidth / window.innerHeight, 
        SceneConf.CAMERA_NEAR, 
        SceneConf.CAMERA_FAR
    );

    camera.position.set(
        SceneConf.CAMERA_POSITION.x, 
        SceneConf.CAMERA_POSITION.y, 
        SceneConf.CAMERA_POSITION.z
    );

    camera.lookAt(
        SceneConf.CAMERA_LOOKAT.x, 
        SceneConf.CAMERA_LOOKAT.y, 
        SceneConf.CAMERA_LOOKAT.z
    );

    // Create a renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(SceneConf.FOG_COLOR);

    // Create orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.maxDistance = SceneConf.CONTROLS_MAX_DISTANCE;
    controls.minDistance = SceneConf.CONTROLS_MIN_DISTANCE;

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
