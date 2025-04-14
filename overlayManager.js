import { animationState, constants} from './state.js';

// External variables from main.js that we need to access
let runCount = 0;
let steadyStateTimes = [];
let maxRuns = Infinity;
let autoRestart = true;

/**
 * Set the external variables from main.js
 * @param {number} count - Current run count
 * @param {Array<number>} times - Array of steady state times
 * @param {number} [max=Infinity] - Maximum number of runs
 * @param {boolean} [auto=true] - Whether automatic restarting is enabled
 */
export const setOverlayData = (count, times, max = Infinity, auto = true) => {
    runCount = count;
    steadyStateTimes = times;
    maxRuns = max;
    autoRestart = auto;
};

/**
 * Update logs overlay with current time step and run information
 */
export const updateLoggsOverlay = () => {
    const overlay = document.getElementById("text-overlay");
    const timeInMinutes = animationState.currentTimeStep * (1/60);
    const hours = Math.floor(timeInMinutes / 60);
    const minutes = Math.floor(timeInMinutes % 60);
    const seconds = Math.floor((timeInMinutes * 60) % 60);
    
    if (overlay) {
        let overlayText = `Run: ${runCount + 1}${maxRuns !== Infinity ? ' / ' + maxRuns : ''}
Auto-Restart: ${autoRestart ? 'ON' : 'OFF'}
Step: ${animationState.currentTimeStep}
Time: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}
Method: ${constants.method}
Parallelization: ${constants.parallelization}`;

        // Add previous run times if available
        if (steadyStateTimes.length > 0) {
            overlayText += `\n\nPrevious Steady State Times (ms):`;
            // Show the last 5 runs or fewer if less than 5 runs have completed
            const startIdx = Math.max(0, steadyStateTimes.length - 5);
            for (let i = startIdx; i < steadyStateTimes.length; i++) {
                overlayText += `\nRun ${i + 1}: ${steadyStateTimes[i].toFixed(2)}`;
            }
            
            // Add average time if more than one run
            if (steadyStateTimes.length > 1) {
                const avgTime = steadyStateTimes.reduce((sum, time) => sum + time, 0) / steadyStateTimes.length;
                overlayText += `\n\nAverage Time: ${avgTime.toFixed(2)} ms`;
            }
        }
        
   
        
        overlay.innerText = overlayText;
    }
};
