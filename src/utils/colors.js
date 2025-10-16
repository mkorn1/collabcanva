// Color generation utilities for user cursors and UI elements

/**
 * Generates a random, vibrant color suitable for cursor identification
 * Avoids colors that are too light, too dark, or too similar to common UI colors
 * @returns {string} Hex color string in format #RRGGBB
 */
export function generateRandomColor() {
  // Predefined vibrant colors that work well for cursors
  const vibrantColors = [
    '#FF6B6B', // Coral Red
    '#4ECDC4', // Turquoise
    '#45B7D1', // Sky Blue
    '#96CEB4', // Mint Green
    '#FFEAA7', // Warm Yellow
    '#DDA0DD', // Plum
    '#98D8C8', // Seafoam
    '#F7DC6F', // Light Gold
    '#BB8FCE', // Lavender
    '#85C1E9', // Light Blue
    '#F8C471', // Peach
    '#82E0AA', // Light Green
    '#F1948A', // Salmon
    '#85DCBA', // Aqua
    '#D7DBDD', // Light Gray
    '#FAD5A5', // Cream
    '#ABEBC6', // Pale Green
    '#D2B4DE', // Light Purple
    '#AED6F1', // Powder Blue
    '#F9E79F'  // Pale Yellow
  ];

  // For more randomness, sometimes generate a completely random color
  if (Math.random() < 0.3) {
    return generateTrulyRandomColor();
  }

  // Otherwise, pick from our curated list
  const randomIndex = Math.floor(Math.random() * vibrantColors.length);
  return vibrantColors[randomIndex];
}

/**
 * Generates a completely random color with constraints to ensure visibility
 * @returns {string} Hex color string in format #RRGGBB
 */
function generateTrulyRandomColor() {
  // Generate RGB values with constraints:
  // - Avoid very dark colors (below 50)
  // - Avoid very light colors (above 230)
  // - Ensure at least one channel is reasonably bright
  
  let r, g, b;
  let attempts = 0;
  const maxAttempts = 10;
  
  do {
    r = Math.floor(Math.random() * 180) + 50; // 50-229
    g = Math.floor(Math.random() * 180) + 50; // 50-229
    b = Math.floor(Math.random() * 180) + 50; // 50-229
    attempts++;
  } while (attempts < maxAttempts && !isColorSuitableForCursor(r, g, b));
  
  // Convert to hex
  const toHex = (value) => value.toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Checks if a color is suitable for cursor use
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {boolean} True if color is suitable
 */
function isColorSuitableForCursor(r, g, b) {
  // Calculate perceived brightness using luminance formula
  const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
  
  // Avoid colors that are too dark (< 60) or too light (> 200)
  if (brightness < 60 || brightness > 200) {
    return false;
  }
  
  // Avoid colors that are too close to white, black, or gray
  const isGrayish = Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && Math.abs(r - b) < 30;
  if (isGrayish && (brightness < 80 || brightness > 170)) {
    return false;
  }
  
  return true;
}

/**
 * Generates a set of distinct colors for multiple users
 * Ensures colors are sufficiently different from each other
 * @param {number} count - Number of colors to generate
 * @returns {string[]} Array of hex color strings
 */
export function generateDistinctColors(count) {
  const colors = [];
  const maxAttempts = 50;
  
  for (let i = 0; i < count; i++) {
    let newColor;
    let attempts = 0;
    
    do {
      newColor = generateRandomColor();
      attempts++;
    } while (attempts < maxAttempts && !isColorDistinct(newColor, colors));
    
    colors.push(newColor);
  }
  
  return colors;
}

/**
 * Checks if a color is sufficiently distinct from existing colors
 * @param {string} color - Hex color to check
 * @param {string[]} existingColors - Array of existing hex colors
 * @returns {boolean} True if color is distinct enough
 */
function isColorDistinct(color, existingColors) {
  if (existingColors.length === 0) return true;
  
  const [r1, g1, b1] = hexToRgb(color);
  
  for (const existingColor of existingColors) {
    const [r2, g2, b2] = hexToRgb(existingColor);
    
    // Calculate color distance using Euclidean distance in RGB space
    const distance = Math.sqrt(
      Math.pow(r1 - r2, 2) + 
      Math.pow(g1 - g2, 2) + 
      Math.pow(b1 - b2, 2)
    );
    
    // If distance is too small, colors are too similar
    if (distance < 100) {
      return false;
    }
  }
  
  return true;
}

/**
 * Converts a hex color to RGB values
 * @param {string} hex - Hex color string (#RRGGBB)
 * @returns {number[]} Array of [r, g, b] values
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

/**
 * Converts RGB values to a hex color string
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {string} Hex color string (#RRGGBB)
 */
export function rgbToHex(r, g, b) {
  const toHex = (value) => {
    const clamped = Math.max(0, Math.min(255, Math.round(value)));
    return clamped.toString(16).padStart(2, '0').toUpperCase();
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Gets a color that contrasts well with the given background color
 * Useful for text labels on colored backgrounds
 * @param {string} backgroundColor - Hex color of the background
 * @returns {string} Either '#FFFFFF' or '#000000' for best contrast
 */
export function getContrastColor(backgroundColor) {
  const [r, g, b] = hexToRgb(backgroundColor);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black text for light backgrounds, white text for dark backgrounds
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Adjusts the brightness of a color
 * @param {string} hexColor - Hex color string
 * @param {number} factor - Brightness factor (0.5 = darker, 1.5 = brighter)
 * @returns {string} Adjusted hex color string
 */
export function adjustBrightness(hexColor, factor) {
  const [r, g, b] = hexToRgb(hexColor);
  
  const adjustedR = Math.min(255, Math.max(0, r * factor));
  const adjustedG = Math.min(255, Math.max(0, g * factor));
  const adjustedB = Math.min(255, Math.max(0, b * factor));
  
  return rgbToHex(adjustedR, adjustedG, adjustedB);
}