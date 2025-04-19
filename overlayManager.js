// Import necessary modules and shared state
import { animationState, constants } from './state.js';

// External variables shared with main.js
// These variables store the state of the simulation and are updated dynamically
let runCount = 0; // Tracks the current simulation run count
let steadyStateTimes = []; // Stores the times (in ms) to reach steady state for each run
let steadyStateSteps = []; // Stores the number of steps to reach steady state for each run
let maxRuns = Infinity; // Maximum number of simulation runs (default: unlimited)
let autoRestart = true; // Flag to enable or disable automatic restarting of simulations

/**
 * Updates the external variables shared with main.js.
 * This function allows main.js to provide updated data for the overlay.
 *
 * @param {number} count - Current run count.
 * @param {Array<number>} times - Array of steady state times (in ms).
 * @param {Array<number>} steps - Array of steady state steps.
 * @param {number} [max=Infinity] - Maximum number of runs (default: unlimited).
 * @param {boolean} [auto=true] - Whether automatic restarting is enabled (default: true).
 */
export const setOverlayData = (count, times, steps, max = Infinity, auto = true) => {
    runCount = count;
    steadyStateTimes = times;
    steadyStateSteps = steps;
    maxRuns = max;
    autoRestart = auto;
};

/**
 * Updates the logs overlay with the current simulation state.
 * This function dynamically updates the overlay element with information
 * about the current run, time step, and statistics from previous runs.
 */
export const updateLoggsOverlay = () => {
    const overlay = document.getElementById("text-overlay");

    if (!overlay) return; // Exit if the overlay element is not found

    // Calculate elapsed time in hours, minutes, and seconds
    const timeInMinutes = animationState.currentTimeStep * (1 / 60)* constants.timeLapse;
    const hours = Math.floor(timeInMinutes / 60);
    const minutes = Math.floor(timeInMinutes % 60);
    const seconds = Math.floor((timeInMinutes * 60) % 60);

    // Build the overlay text with current run information
    let overlayText = `Run: ${runCount + 1}${' / ' + maxRuns}
` +
                      `Step: ${animationState.currentTimeStep}
` +
                      `Time: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}
` +
                      `Method: ${constants.method}
` +
                      `Parallelization: ${constants.parallelization}`;

    // Add information about previous steady state times if available
    if (steadyStateTimes.length > 0) {
        overlayText += `\n\nPrevious Steady State Times (ms):`;

        // Show the last 5 runs or fewer if less than 5 runs have completed
        const startIdx = Math.max(0, steadyStateTimes.length - 5);
        for (let i = startIdx; i < steadyStateTimes.length; i++) {
            overlayText += `\nRun ${i + 1}: ${steadyStateTimes[i].toFixed(1)}ms, ${steadyStateSteps[i]} steps`;
        }

        // Add average time and steps if more than one run has completed
        if (steadyStateTimes.length > 2) {
            const avgTime = steadyStateTimes.reduce((sum, time) => sum + time, 0) / steadyStateTimes.length;
            const avgSteps = steadyStateSteps.reduce((sum, step) => sum + step, 0) / steadyStateSteps.length;
            const standardDeviationTime = Math.sqrt(steadyStateTimes.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / steadyStateTimes.length);
            const standardDeviationSteps = Math.sqrt(steadyStateSteps.reduce((sum, step) => sum + Math.pow(step - avgSteps, 2), 0) / steadyStateSteps.length);

            overlayText += `\n\nStatistics:`;
            overlayText += `\nAverage time: ${avgTime.toFixed(2)}ms ± ${standardDeviationTime.toFixed(2)}ms`;
            overlayText += `\nAverage steps: ${avgSteps.toFixed(2)} ± ${standardDeviationSteps.toFixed(2)}`;
        }
    }

    // Update the overlay element with the constructed text
    overlay.innerText = overlayText;
};
