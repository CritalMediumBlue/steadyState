import { animationState, constants} from './state.js';


/**
 * Update logs overlay with current time step
 */
export const updateLoggsOverlay = () => {
    const overlay = document.getElementById("text-overlay");
    const timeInMinutes = animationState.currentTimeStep* (1/60);
    const hours = Math.floor(timeInMinutes / 60);
    const minutes = Math.floor(timeInMinutes % 60);
    const seconds = Math.floor((timeInMinutes * 60) % 60);
    if (overlay) {
        overlay.innerText = `Step: ${animationState.currentTimeStep}
Time: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}
`
    }
};
