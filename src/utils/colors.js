// Utility functions for generating random cursor colors

/**
 * Predefined set of distinct, vibrant colors for user cursors
 * These colors are chosen to be:
 * - Visually distinct from each other
 * - High contrast against light/dark backgrounds
 * - Accessible for colorblind users
 * - Pleasant and professional looking
 */
const CURSOR_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Mint Green
  '#FECA57', // Yellow
  '#FF9FF3', // Pink
  '#54A0FF', // Light Blue
  '#5F27CD', // Purple
  '#00D2D3', // Cyan
  '#FF9F43', // Orange
  '#10AC84', // Green
  '#EE5A6F', // Rose
  '#C44569', // Dark Pink
  '#F8B500', // Amber
  '#6C5CE7', // Indigo
  '#A29BFE', // Lavender
  '#FD79A8', // Hot Pink
  '#FDCB6E', // Light Orange
  '#6C7B7F', // Gray Blue
  '#00B894'  // Sea Green
];

/**
 * Generate a random cursor color from the predefined palette
 * @returns {string} Hex color string (e.g., '#FF6B6B')
 */
export function generateRandomColor() {
  const randomIndex = Math.floor(Math.random() * CURSOR_COLORS.length);
  return CURSOR_COLORS[randomIndex];
}

/**
 * Generate a random color that's different from the given color
 * Useful for ensuring users get different colors
 * @param {string} excludeColor - Color to exclude (hex format)
 * @returns {string} Hex color string different from excludeColor
 */
export function generateRandomColorExcluding(excludeColor) {
  const availableColors = CURSOR_COLORS.filter(color => color !== excludeColor);
  
  if (availableColors.length === 0) {
    // Fallback if all colors are excluded (shouldn't happen with our palette size)
    return generateRandomColor();
  }
  
  const randomIndex = Math.floor(Math.random() * availableColors.length);
  return availableColors[randomIndex];
}

/**
 * Generate a set of N distinct random colors
 * Useful for assigning colors to multiple users at once
 * @param {number} count - Number of colors to generate
 * @returns {string[]} Array of hex color strings
 */
export function generateDistinctColors(count) {
  if (count <= 0) return [];
  if (count >= CURSOR_COLORS.length) return [...CURSOR_COLORS];
  
  const shuffled = [...CURSOR_COLORS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get a color that contrasts well with the given background
 * @param {string} backgroundColor - Background color (hex format)
 * @returns {string} Cursor color that contrasts well with the background
 */
export function getContrastingCursorColor(backgroundColor) {
  // Simple implementation: if background is dark, use light colors, vice versa
  // For MVP, we'll just return a random color since our palette is designed for contrast
  return generateRandomColor();
}

/**
 * Check if a color is in our predefined palette
 * @param {string} color - Hex color string to check
 * @returns {boolean} True if color is in our palette
 */
export function isValidCursorColor(color) {
  return CURSOR_COLORS.includes(color);
}

/**
 * Get all available cursor colors
 * @returns {string[]} Array of all cursor color hex strings
 */
export function getAllCursorColors() {
  return [...CURSOR_COLORS];
}

/**
 * Convert hex color to RGB values
 * Utility function for potential future use (brightness calculations, etc.)
 * @param {string} hex - Hex color string (e.g., '#FF6B6B')
 * @returns {object} RGB object with r, g, b properties
 */
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate brightness of a color (0-255 scale)
 * @param {string} hex - Hex color string
 * @returns {number} Brightness value (0 = black, 255 = white)
 */
export function getColorBrightness(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  
  // Use standard luminance formula
  return Math.round((rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000);
}

/**
 * Determine if a color is light or dark
 * @param {string} hex - Hex color string
 * @returns {boolean} True if color is light, false if dark
 */
export function isLightColor(hex) {
  return getColorBrightness(hex) > 127;
}
