import { THREE, OrbitControls } from './threeImports.js';
import { updateSurfaceMesh, createConcentrationMesh } from './sceneComponents/concentrationMesh.js';
import { updateLoggsOverlay, initializeGUIControls } from './sceneComponents/GUIoverlay.js';
export const scene = {
    scene: null,
    camera: null,
    renderer: null,
    surfaceMesh: null,
    animationFrameId: null
};

/**
 * Creates and returns a concentration mesh with specified dimensions
 * @param {number} width - Width of the mesh
 * @param {number} height - Height of the mesh
 * @returns {THREE.Mesh} The created concentration mesh
 */
export const createMesh = (width, height) => {
    const surfaceMesh = createConcentrationMesh(width, height, THREE);
    scene.scene.add(surfaceMesh);
    scene.surfaceMesh = surfaceMesh;
};

/**
 * Setup new scene and initialize simulation arrays
 */
export const setupNewScene = (sceneConf, diffParams) => {
    const setup = setupScene(sceneConf);
    
    
    Object.assign(scene, setup);
    document.getElementById('scene-container').appendChild(scene.renderer.domElement);
    initializeGUIControls({
        initialValues: {
            method: diffParams.METHOD,
        },
        onMethodChange: (method) => {
            diffParams.METHOD = method;
            // Any other updates needed when method changes
        }
    });
};

export const updateScene = (dataState, sceneConf, diffParams) => {

  

  
    
    const { currentConcentrationData, currentTimeStep, 
        steadyStateTimes, steadyStateSteps, runCount, maxRuns,
        timeLapse
     } = dataState;
    updateSurfaceMesh(
        scene.surfaceMesh,
        currentConcentrationData,
        diffParams.WIDTH,
        diffParams.HEIGHT
    );

    const method = diffParams.METHOD;

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

const setupScene = ( sceneConf) => {
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(sceneConf.FOG_COLOR, sceneConf.FOG_NEAR, sceneConf.FOG_FAR);

    // Create a camera
    const camera = new THREE.PerspectiveCamera(
        sceneConf.CAMERA_FOV, 
        window.innerWidth / window.innerHeight, 
        sceneConf.CAMERA_NEAR, 
        sceneConf.CAMERA_FAR
    );

    camera.position.set(
        sceneConf.CAMERA_POSITION.x, 
        sceneConf.CAMERA_POSITION.y, 
        sceneConf.CAMERA_POSITION.z
    );

    camera.lookAt(
        sceneConf.CAMERA_LOOKAT.x, 
        sceneConf.CAMERA_LOOKAT.y, 
        sceneConf.CAMERA_LOOKAT.z
    );

    // Create a renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(sceneConf.FOG_COLOR);

    // Create orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.maxDistance = sceneConf.CONTROLS_MAX_DISTANCE;
    controls.minDistance = sceneConf.CONTROLS_MIN_DISTANCE;

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    return { scene, camera, renderer };
};
