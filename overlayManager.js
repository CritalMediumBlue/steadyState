/**
 * Updates the logs overlay with the current simulation state.
 * This function dynamically updates the overlay element with information
 * about the current run, time step, and statistics from previous runs.
 *
 * @param {Object} params - Parameters for updating the overlay
 * @param {number} params.currentTimeStep - Current time step of the simulation
 * @param {number} params.timeLapse - Time lapse factor
 * @param {string} params.method - Simulation method
 * @param {number} params.runCount - Current run count
 * @param {number} params.maxRuns - Maximum number of runs
 * @param {Array<number>} params.steadyStateTimes - Array of steady state times
 * @param {Array<number>} params.steadyStateSteps - Array of steady state steps
 * @param {boolean} params.autoRestart - Whether automatic restarting is enabled
 */
export const updateLoggsOverlay = ({
    currentTimeStep, 
    timeLapse, 
    method, 
    runCount,
    maxRuns,
    steadyStateTimes,
    steadyStateSteps,
    autoRestart
}) => {
    const overlay = document.getElementById("text-overlay");

    if (!overlay) return; // Exit if the overlay element is not found

    // Calculate elapsed time in hours, minutes, and seconds
    const timeInMinutes = currentTimeStep * (1 / 60) * timeLapse;
    const hours = Math.floor(timeInMinutes / 60);
    const minutes = Math.floor(timeInMinutes % 60);
    const seconds = Math.floor((timeInMinutes * 60) % 60);

    // Build the overlay text with current run information
    let overlayText = `Run: ${runCount + 1}${' / ' + maxRuns}
` +
                      `Step: ${currentTimeStep}
` +
                      `Time: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}
` +
                      `Method: ${method}
` 

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
