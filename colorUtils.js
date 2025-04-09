/**
 * Calculate color based on concentration value
 * @param {number} concentration - Concentration value
 * @returns {Object} RGB color values
 */
export const calculateColor = (concentration) => {
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
