/**
 * Smart Defaults Service
 * Provides intelligent defaults for colors, sizes, and positioning
 * Based on current canvas state and user patterns
 */

/**
 * Color palette with semantic names and hex values
 */
export const COLOR_PALETTE = {
  // Primary colors
  red: '#e74c3c',
  blue: '#3498db', 
  green: '#2ecc71',
  yellow: '#f1c40f',
  orange: '#f39c12',
  purple: '#9b59b6',
  pink: '#e91e63',
  
  // Neutral colors
  black: '#2c3e50',
  white: '#ecf0f1',
  gray: '#95a5a6',
  darkGray: '#7f8c8d',
  lightGray: '#bdc3c7',
  
  // Additional colors
  teal: '#1abc9c',
  indigo: '#3f51b5',
  brown: '#8d6e63',
  lime: '#cddc39',
  cyan: '#00bcd4',
  amber: '#ffc107'
};

/**
 * Size presets for different shape types
 */
export const SIZE_PRESETS = {
  tiny: { rectangle: { width: 30, height: 20 }, circle: { width: 25, height: 25 }, text: { width: 80, height: 20 } },
  small: { rectangle: { width: 50, height: 30 }, circle: { width: 40, height: 40 }, text: { width: 120, height: 25 } },
  medium: { rectangle: { width: 100, height: 60 }, circle: { width: 80, height: 80 }, text: { width: 200, height: 40 } },
  large: { rectangle: { width: 200, height: 120 }, circle: { width: 160, height: 160 }, text: { width: 300, height: 60 } },
  huge: { rectangle: { width: 300, height: 200 }, circle: { width: 240, height: 240 }, text: { width: 400, height: 80 } }
};

/**
 * Generates random sizes for different shape types
 * @param {string} shapeType - Type of shape
 * @param {Object} options - Random size options
 * @returns {Object} - Random size object
 */
export function generateRandomSize(shapeType = 'rectangle', options = {}) {
  const {
    minWidth = 20,
    maxWidth = 300,
    minHeight = 15,
    maxHeight = 200,
    maintainAspectRatio = false,
    aspectRatio = 1.6 // Default rectangle aspect ratio
  } = options;

  console.log('🎲 Generating random size for:', { shapeType, options });

  let width, height;

  if (shapeType === 'circle' || shapeType === 'square') {
    // For circles and squares, width and height should be equal
    const size = Math.floor(Math.random() * (maxWidth - minWidth + 1)) + minWidth;
    width = size;
    height = size;
  } else if (shapeType === 'text') {
    // For text, generate reasonable text dimensions
    width = Math.floor(Math.random() * (400 - 80 + 1)) + 80;
    height = Math.floor(Math.random() * (100 - 20 + 1)) + 20;
  } else {
    // For rectangles and other shapes
    if (maintainAspectRatio) {
      width = Math.floor(Math.random() * (maxWidth - minWidth + 1)) + minWidth;
      height = Math.floor(width / aspectRatio);
      // Ensure height is within bounds
      height = Math.max(minHeight, Math.min(maxHeight, height));
    } else {
      width = Math.floor(Math.random() * (maxWidth - minWidth + 1)) + minWidth;
      height = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    }
  }

  // Ensure minimum sizes are respected
  width = Math.max(10, width);
  height = Math.max(10, height);

  const randomSize = { width, height };
  console.log('🎲 Generated random size:', randomSize);
  
  return randomSize;
}

/**
 * Analyzes canvas state to determine smart defaults
 * @param {Object} canvasState - Current canvas state
 * @param {string} shapeType - Type of shape being created
 * @param {Object} userIntent - User's intent (position hints, size hints, etc.)
 * @returns {Object} - Smart defaults object
 */
export function generateSmartDefaults(canvasState, shapeType = 'rectangle', userIntent = {}) {
  const { objects = [], dimensions = { width: 1920, height: 1080 } } = canvasState;
  
  return {
    color: getSmartColor(objects, userIntent),
    size: getSmartSize(objects, shapeType, userIntent),
    position: getSmartPosition(objects, dimensions, shapeType, userIntent),
    spacing: getSmartSpacing(objects, userIntent)
  };
}

/**
 * Determines smart color based on canvas analysis
 * @param {Array} objects - Current canvas objects
 * @param {Object} userIntent - User's intent
 * @returns {string} - Smart color hex value
 */
function getSmartColor(objects, userIntent) {
  // If user specified a color, use it
  if (userIntent.color) {
    return normalizeColorName(userIntent.color);
  }
  
  // Analyze existing colors on canvas
  const colorAnalysis = analyzeCanvasColors(objects);
  
  // If canvas is empty, use a nice default
  if (objects.length === 0) {
    return COLOR_PALETTE.blue; // Nice default blue
  }
  
  // If canvas has mostly neutral colors, add a vibrant color
  if (colorAnalysis.neutralRatio > 0.7) {
    return getComplementaryColor(colorAnalysis.dominantColor);
  }
  
  // If canvas has vibrant colors, add a complementary color
  if (colorAnalysis.vibrantRatio > 0.6) {
    return getComplementaryColor(colorAnalysis.dominantColor);
  }
  
  // Otherwise, use a color that contrasts well with existing colors
  return getContrastingColor(colorAnalysis.colors);
}

/**
 * Determines smart size based on canvas analysis
 * @param {Array} objects - Current canvas objects
 * @param {string} shapeType - Type of shape
 * @param {Object} userIntent - User's intent
 * @returns {Object} - Smart size object
 */
function getSmartSize(objects, shapeType, userIntent) {
  console.log('🔍 getSmartSize called:', { objects: objects.length, shapeType, userIntent });
  
  // If user specified size, use it
  if (userIntent.size) {
    // Handle random size requests
    if (userIntent.size === 'random') {
      console.log('🎲 Using random size generation');
      return generateRandomSize(shapeType);
    }
    
    const preset = SIZE_PRESETS[userIntent.size];
    if (preset && preset[shapeType]) {
      console.log('📏 Using user-specified size preset:', preset[shapeType]);
      return preset[shapeType];
    }
  }
  
  // Analyze existing sizes on canvas
  const sizeAnalysis = analyzeCanvasSizes(objects);
  console.log('📊 Size analysis:', sizeAnalysis);
  
  // If canvas is empty, use medium size
  if (objects.length === 0) {
    const defaultSize = SIZE_PRESETS.medium[shapeType];
    console.log('📏 Using default medium size for empty canvas:', defaultSize);
    return defaultSize;
  }
  
  // If canvas has mostly small objects, create a medium-sized one
  if (sizeAnalysis.smallRatio > 0.6) {
    const mediumSize = SIZE_PRESETS.medium[shapeType];
    console.log('📏 Using medium size for small-heavy canvas:', mediumSize);
    return mediumSize;
  }
  
  // If canvas has mostly large objects, create a medium-sized one
  if (sizeAnalysis.largeRatio > 0.6) {
    const mediumSize = SIZE_PRESETS.medium[shapeType];
    console.log('📏 Using medium size for large-heavy canvas:', mediumSize);
    return mediumSize;
  }
  
  // If canvas has mixed sizes, use the average size
  const averageSize = {
    width: Math.max(50, Math.min(300, sizeAnalysis.averageWidth)),
    height: Math.max(30, Math.min(200, sizeAnalysis.averageHeight))
  };
  
  // Safety check: if we still get NaN values, fall back to medium preset
  if (isNaN(averageSize.width) || isNaN(averageSize.height)) {
    console.log('📏 Average size resulted in NaN, falling back to medium preset');
    return SIZE_PRESETS.medium[shapeType];
  }
  
  console.log('📏 Using average size for mixed canvas:', averageSize);
  return averageSize;
}

/**
 * Determines smart position based on canvas analysis
 * @param {Array} objects - Current canvas objects
 * @param {Object} dimensions - Canvas dimensions
 * @param {string} shapeType - Type of shape
 * @param {Object} userIntent - User's intent
 * @returns {Object} - Smart position object
 */
function getSmartPosition(objects, dimensions, shapeType, userIntent) {
  console.log('📍 getSmartPosition called:', { objects: objects.length, dimensions, shapeType, userIntent });
  
  // If user specified position, use it
  if (userIntent.position) {
    const resolvedPosition = resolvePositionHint(userIntent.position, dimensions);
    console.log('📍 Using user-specified position:', resolvedPosition);
    return resolvedPosition;
  }
  
  // If canvas is empty, place in center
  if (objects.length === 0) {
    const centerPosition = {
      x: dimensions.width / 2 - 50, // Offset for shape size
      y: dimensions.height / 2 - 30
    };
    console.log('📍 Using center position for empty canvas:', centerPosition);
    return centerPosition;
  }
  
  // Get smart size for the shape type
  const smartSize = getSmartSize(objects, shapeType, userIntent);
  console.log('📍 Smart size for position calculation:', smartSize);
  
  // Safety check: if smart size has NaN values, use default size
  if (isNaN(smartSize.width) || isNaN(smartSize.height)) {
    console.log('📍 Smart size has NaN values, using default size for position calculation');
    const defaultSize = SIZE_PRESETS.medium[shapeType];
    const fallbackPosition = {
      x: dimensions.width / 2 - defaultSize.width / 2,
      y: dimensions.height / 2 - defaultSize.height / 2
    };
    console.log('📍 Using fallback position:', fallbackPosition);
    return fallbackPosition;
  }
  
  // Find empty space on canvas
  const emptySpace = findEmptySpace(objects, dimensions, smartSize);
  if (emptySpace) {
    console.log('📍 Found empty space:', emptySpace);
    return emptySpace;
  }
  
  // If no empty space, place near existing objects
  const nearbyPosition = findNearbyPosition(objects, dimensions, smartSize);
  console.log('📍 Using nearby position:', nearbyPosition);
  return nearbyPosition;
}

/**
 * Determines smart spacing for arrangements
 * @param {Array} objects - Current canvas objects
 * @param {Object} userIntent - User's intent
 * @returns {number} - Smart spacing value
 */
function getSmartSpacing(objects, userIntent) {
  // If user specified spacing, use it
  if (userIntent.spacing !== undefined) {
    return userIntent.spacing;
  }
  
  // Analyze existing spacing patterns
  const spacingAnalysis = analyzeCanvasSpacing(objects);
  
  // Use average spacing if available, otherwise default
  return spacingAnalysis.averageSpacing || 20;
}

/**
 * Analyzes colors used on the canvas
 * @param {Array} objects - Canvas objects
 * @returns {Object} - Color analysis
 */
function analyzeCanvasColors(objects) {
  const colors = objects.map(obj => obj.fill).filter(Boolean);
  const colorCounts = {};
  
  colors.forEach(color => {
    const normalized = normalizeColorName(color);
    colorCounts[normalized] = (colorCounts[normalized] || 0) + 1;
  });
  
  const totalColors = colors.length;
  const dominantColor = Object.keys(colorCounts).reduce((a, b) => 
    colorCounts[a] > colorCounts[b] ? a : b, Object.keys(colorCounts)[0]);
  
  const vibrantColors = Object.keys(colorCounts).filter(color => 
    isVibrantColor(color));
  const neutralColors = Object.keys(colorCounts).filter(color => 
    isNeutralColor(color));
  
  return {
    colors: Object.keys(colorCounts),
    dominantColor: dominantColor || COLOR_PALETTE.blue,
    vibrantRatio: vibrantColors.length / totalColors || 0,
    neutralRatio: neutralColors.length / totalColors || 0,
    colorCounts
  };
}

/**
 * Analyzes sizes used on the canvas
 * @param {Array} objects - Canvas objects
 * @returns {Object} - Size analysis
 */
function analyzeCanvasSizes(objects) {
  if (objects.length === 0) {
    return { averageWidth: 100, averageHeight: 60, smallRatio: 0, largeRatio: 0 };
  }
  
  // Filter out objects with invalid dimensions
  const validObjects = objects.filter(obj => 
    typeof obj.width === 'number' && 
    typeof obj.height === 'number' && 
    !isNaN(obj.width) && 
    !isNaN(obj.height) && 
    obj.width > 0 && 
    obj.height > 0
  );
  
  console.log('📊 Valid objects for size analysis:', validObjects.length, 'out of', objects.length);
  
  // If no valid objects, return defaults
  if (validObjects.length === 0) {
    console.log('📊 No valid objects found, using defaults');
    return { averageWidth: 100, averageHeight: 60, smallRatio: 0, largeRatio: 0 };
  }
  
  const sizes = validObjects.map(obj => ({ width: obj.width, height: obj.height }));
  const totalWidth = sizes.reduce((sum, size) => sum + size.width, 0);
  const totalHeight = sizes.reduce((sum, size) => sum + size.height, 0);
  
  const averageWidth = totalWidth / validObjects.length;
  const averageHeight = totalHeight / validObjects.length;
  
  const smallObjects = validObjects.filter(obj => 
    obj.width < 60 && obj.height < 40);
  const largeObjects = validObjects.filter(obj => 
    obj.width > 150 && obj.height > 100);
  
  const result = {
    averageWidth,
    averageHeight,
    smallRatio: smallObjects.length / validObjects.length,
    largeRatio: largeObjects.length / validObjects.length
  };
  
  console.log('📊 Size analysis result:', result);
  return result;
}

/**
 * Analyzes spacing patterns on the canvas
 * @param {Array} objects - Canvas objects
 * @returns {Object} - Spacing analysis
 */
function analyzeCanvasSpacing(objects) {
  if (objects.length < 2) {
    return { averageSpacing: 20 };
  }
  
  const spacings = [];
  
  // Calculate distances between nearby objects
  for (let i = 0; i < objects.length; i++) {
    for (let j = i + 1; j < objects.length; j++) {
      const obj1 = objects[i];
      const obj2 = objects[j];
      
      const distance = Math.sqrt(
        Math.pow(obj1.x - obj2.x, 2) + Math.pow(obj1.y - obj2.y, 2)
      );
      
      // Only consider objects that are reasonably close
      if (distance < 200) {
        spacings.push(distance);
      }
    }
  }
  
  const averageSpacing = spacings.length > 0 ? 
    spacings.reduce((sum, spacing) => sum + spacing, 0) / spacings.length : 20;
  
  return { averageSpacing: Math.round(averageSpacing) };
}

/**
 * Finds empty space on the canvas using multiple strategies
 * @param {Array} objects - Canvas objects
 * @param {Object} dimensions - Canvas dimensions
 * @param {Object} shapeSize - Size of the shape to place
 * @returns {Object|null} - Empty space position or null
 */
function findEmptySpace(objects, dimensions, shapeSize = { width: 100, height: 60 }) {
  // Strategy 1: Grid-based search (current implementation)
  const gridResult = findEmptySpaceGrid(objects, dimensions, shapeSize);
  if (gridResult) return gridResult;
  
  // Strategy 2: Quadrant-based search
  const quadrantResult = findEmptySpaceQuadrant(objects, dimensions, shapeSize);
  if (quadrantResult) return quadrantResult;
  
  // Strategy 3: Edge-based search
  const edgeResult = findEmptySpaceEdge(objects, dimensions, shapeSize);
  if (edgeResult) return edgeResult;
  
  // Strategy 4: Gap-based search (find gaps between objects)
  const gapResult = findEmptySpaceGap(objects, dimensions, shapeSize);
  if (gapResult) return gapResult;
  
  return null;
}

/**
 * Grid-based empty space detection
 * @param {Array} objects - Canvas objects
 * @param {Object} dimensions - Canvas dimensions
 * @param {Object} shapeSize - Size of the shape to place
 * @returns {Object|null} - Empty space position or null
 */
function findEmptySpaceGrid(objects, dimensions, shapeSize) {
  const gridSize = 25; // Smaller grid for better precision
  const margin = 20; // Margin from edges
  
  for (let x = margin; x < dimensions.width - shapeSize.width - margin; x += gridSize) {
    for (let y = margin; y < dimensions.height - shapeSize.height - margin; y += gridSize) {
      if (!isSpaceOccupied(objects, x, y, shapeSize)) {
        return { x, y };
      }
    }
  }
  
  return null;
}

/**
 * Quadrant-based empty space detection
 * @param {Array} objects - Canvas objects
 * @param {Object} dimensions - Canvas dimensions
 * @param {Object} shapeSize - Size of the shape to place
 * @returns {Object|null} - Empty space position or null
 */
function findEmptySpaceQuadrant(objects, dimensions, shapeSize) {
  const quadrants = [
    // Top-left
    { x: 50, y: 50, width: dimensions.width / 2 - 50, height: dimensions.height / 2 - 50 },
    // Top-right
    { x: dimensions.width / 2, y: 50, width: dimensions.width / 2 - 50, height: dimensions.height / 2 - 50 },
    // Bottom-left
    { x: 50, y: dimensions.height / 2, width: dimensions.width / 2 - 50, height: dimensions.height / 2 - 50 },
    // Bottom-right
    { x: dimensions.width / 2, y: dimensions.height / 2, width: dimensions.width / 2 - 50, height: dimensions.height / 2 - 50 }
  ];
  
  // Find the quadrant with the least objects
  let bestQuadrant = null;
  let minObjectCount = Infinity;
  
  for (const quadrant of quadrants) {
    const objectsInQuadrant = objects.filter(obj => 
      obj.x >= quadrant.x && obj.x < quadrant.x + quadrant.width &&
      obj.y >= quadrant.y && obj.y < quadrant.y + quadrant.height
    );
    
    if (objectsInQuadrant.length < minObjectCount) {
      minObjectCount = objectsInQuadrant.length;
      bestQuadrant = quadrant;
    }
  }
  
  if (bestQuadrant) {
    // Try to find space in the best quadrant
    const gridSize = 30;
    for (let x = bestQuadrant.x; x < bestQuadrant.x + bestQuadrant.width - shapeSize.width; x += gridSize) {
      for (let y = bestQuadrant.y; y < bestQuadrant.y + bestQuadrant.height - shapeSize.height; y += gridSize) {
        if (!isSpaceOccupied(objects, x, y, shapeSize)) {
          return { x, y };
        }
      }
    }
  }
  
  return null;
}

/**
 * Edge-based empty space detection
 * @param {Array} objects - Canvas objects
 * @param {Object} dimensions - Canvas dimensions
 * @param {Object} shapeSize - Size of the shape to place
 * @returns {Object|null} - Empty space position or null
 */
function findEmptySpaceEdge(objects, dimensions, shapeSize) {
  const margin = 20;
  const edgePositions = [
    // Top edge
    { x: dimensions.width / 2 - shapeSize.width / 2, y: margin },
    // Bottom edge
    { x: dimensions.width / 2 - shapeSize.width / 2, y: dimensions.height - shapeSize.height - margin },
    // Left edge
    { x: margin, y: dimensions.height / 2 - shapeSize.height / 2 },
    // Right edge
    { x: dimensions.width - shapeSize.width - margin, y: dimensions.height / 2 - shapeSize.height / 2 }
  ];
  
  for (const pos of edgePositions) {
    if (!isSpaceOccupied(objects, pos.x, pos.y, shapeSize)) {
      return pos;
    }
  }
  
  return null;
}

/**
 * Gap-based empty space detection (finds gaps between objects)
 * @param {Array} objects - Canvas objects
 * @param {Object} dimensions - Canvas dimensions
 * @param {Object} shapeSize - Size of the shape to place
 * @returns {Object|null} - Empty space position or null
 */
function findEmptySpaceGap(objects, dimensions, shapeSize) {
  if (objects.length < 2) return null;
  
  // Sort objects by x position
  const sortedObjects = [...objects].sort((a, b) => a.x - b.x);
  
  // Check gaps between objects horizontally
  for (let i = 0; i < sortedObjects.length - 1; i++) {
    const leftObj = sortedObjects[i];
    const rightObj = sortedObjects[i + 1];
    
    const gapWidth = rightObj.x - (leftObj.x + leftObj.width);
    if (gapWidth >= shapeSize.width + 40) { // 40px minimum spacing
      const gapX = leftObj.x + leftObj.width + 20; // 20px spacing
      const gapY = Math.min(leftObj.y, rightObj.y);
      
      if (!isSpaceOccupied(objects, gapX, gapY, shapeSize)) {
        return { x: gapX, y: gapY };
      }
    }
  }
  
  // Sort objects by y position
  const sortedByY = [...objects].sort((a, b) => a.y - b.y);
  
  // Check gaps between objects vertically
  for (let i = 0; i < sortedByY.length - 1; i++) {
    const topObj = sortedByY[i];
    const bottomObj = sortedByY[i + 1];
    
    const gapHeight = bottomObj.y - (topObj.y + topObj.height);
    if (gapHeight >= shapeSize.height + 40) { // 40px minimum spacing
      const gapX = Math.min(topObj.x, bottomObj.x);
      const gapY = topObj.y + topObj.height + 20; // 20px spacing
      
      if (!isSpaceOccupied(objects, gapX, gapY, shapeSize)) {
        return { x: gapX, y: gapY };
      }
    }
  }
  
  return null;
}

/**
 * Checks if a space is occupied by any existing objects
 * @param {Array} objects - Canvas objects
 * @param {number} x - X position to check
 * @param {number} y - Y position to check
 * @param {Object} shapeSize - Size of the shape to place
 * @returns {boolean} - Whether the space is occupied
 */
function isSpaceOccupied(objects, x, y, shapeSize) {
  return objects.some(obj => 
    obj.x < x + shapeSize.width && obj.x + obj.width > x &&
    obj.y < y + shapeSize.height && obj.y + obj.height > y
  );
}

/**
 * Finds a position near existing objects using multiple strategies
 * @param {Array} objects - Canvas objects
 * @param {Object} dimensions - Canvas dimensions
 * @param {Object} shapeSize - Size of the shape to place
 * @returns {Object} - Nearby position
 */
function findNearbyPosition(objects, dimensions, shapeSize = { width: 100, height: 60 }) {
  if (objects.length === 0) {
    return { x: dimensions.width / 2 - shapeSize.width / 2, y: dimensions.height / 2 - shapeSize.height / 2 };
  }
  
  // Strategy 1: Extend existing layout (right side)
  const rightSideResult = findNearbyRightSide(objects, dimensions, shapeSize);
  if (rightSideResult) return rightSideResult;
  
  // Strategy 2: Extend existing layout (bottom side)
  const bottomSideResult = findNearbyBottomSide(objects, dimensions, shapeSize);
  if (bottomSideResult) return bottomSideResult;
  
  // Strategy 3: Cluster around existing objects
  const clusterResult = findNearbyCluster(objects, dimensions, shapeSize);
  if (clusterResult) return clusterResult;
  
  // Strategy 4: Mirror existing layout
  const mirrorResult = findNearbyMirror(objects, dimensions, shapeSize);
  if (mirrorResult) return mirrorResult;
  
  // Fallback: Place to the right of the rightmost object
  return findNearbyRightSide(objects, dimensions, shapeSize) || 
         { x: dimensions.width - shapeSize.width - 50, y: 50 };
}

/**
 * Finds position to the right of existing objects
 * @param {Array} objects - Canvas objects
 * @param {Object} dimensions - Canvas dimensions
 * @param {Object} shapeSize - Size of the shape to place
 * @returns {Object|null} - Position to the right or null
 */
function findNearbyRightSide(objects, dimensions, shapeSize) {
  const rightmostObject = objects.reduce((rightmost, obj) => 
    obj.x + obj.width > rightmost.x + rightmost.width ? obj : rightmost);
  
  const rightX = rightmostObject.x + rightmostObject.width + 20; // 20px spacing
  
  if (rightX + shapeSize.width <= dimensions.width - 20) {
    return { x: rightX, y: rightmostObject.y };
  }
  
  return null;
}

/**
 * Finds position below existing objects
 * @param {Array} objects - Canvas objects
 * @param {Object} dimensions - Canvas dimensions
 * @param {Object} shapeSize - Size of the shape to place
 * @returns {Object|null} - Position below or null
 */
function findNearbyBottomSide(objects, dimensions, shapeSize) {
  const bottommostObject = objects.reduce((bottommost, obj) => 
    obj.y + obj.height > bottommost.y + bottommost.height ? obj : bottommost);
  
  const bottomY = bottommostObject.y + bottommostObject.height + 20; // 20px spacing
  
  if (bottomY + shapeSize.height <= dimensions.height - 20) {
    return { x: bottommostObject.x, y: bottomY };
  }
  
  return null;
}

/**
 * Finds position that clusters with existing objects
 * @param {Array} objects - Canvas objects
 * @param {Object} dimensions - Canvas dimensions
 * @param {Object} shapeSize - Size of the shape to place
 * @returns {Object|null} - Cluster position or null
 */
function findNearbyCluster(objects, dimensions, shapeSize) {
  // Find the center of mass of existing objects
  const centerX = objects.reduce((sum, obj) => sum + obj.x + obj.width / 2, 0) / objects.length;
  const centerY = objects.reduce((sum, obj) => sum + obj.y + obj.height / 2, 0) / objects.length;
  
  // Try positions around the center of mass
  const offsets = [
    { x: 0, y: 0 },           // Center
    { x: 120, y: 0 },         // Right
    { x: -120, y: 0 },        // Left
    { x: 0, y: 80 },          // Below
    { x: 0, y: -80 },         // Above
    { x: 120, y: 80 },        // Bottom-right
    { x: -120, y: 80 },       // Bottom-left
    { x: 120, y: -80 },       // Top-right
    { x: -120, y: -80 }        // Top-left
  ];
  
  for (const offset of offsets) {
    const x = centerX + offset.x - shapeSize.width / 2;
    const y = centerY + offset.y - shapeSize.height / 2;
    
    // Check if position is within canvas bounds
    if (x >= 20 && x <= dimensions.width - shapeSize.width - 20 &&
        y >= 20 && y <= dimensions.height - shapeSize.height - 20) {
      
      // Check if position doesn't overlap with existing objects
      if (!isSpaceOccupied(objects, x, y, shapeSize)) {
        return { x, y };
      }
    }
  }
  
  return null;
}

/**
 * Finds position that mirrors existing layout
 * @param {Array} objects - Canvas objects
 * @param {Object} dimensions - Canvas dimensions
 * @param {Object} shapeSize - Size of the shape to place
 * @returns {Object|null} - Mirror position or null
 */
function findNearbyMirror(objects, dimensions, shapeSize) {
  if (objects.length === 0) return null;
  
  // Find the most recent object (assuming it's the last in the array)
  const lastObject = objects[objects.length - 1];
  
  // Try to mirror the last object's position
  const mirrorX = dimensions.width - lastObject.x - lastObject.width;
  const mirrorY = lastObject.y;
  
  // Check if mirror position is valid
  if (mirrorX >= 20 && mirrorX <= dimensions.width - shapeSize.width - 20 &&
      mirrorY >= 20 && mirrorY <= dimensions.height - shapeSize.height - 20) {
    
    if (!isSpaceOccupied(objects, mirrorX, mirrorY, shapeSize)) {
      return { x: mirrorX, y: mirrorY };
    }
  }
  
  return null;
}

/**
 * Resolves position hints to actual coordinates
 * @param {string} positionHint - Position hint (e.g., "center", "top-left")
 * @param {Object} dimensions - Canvas dimensions
 * @returns {Object} - Resolved position
 */
function resolvePositionHint(positionHint, dimensions) {
  const hint = positionHint.toLowerCase();
  
  switch (hint) {
    case 'center':
      return { x: dimensions.width / 2 - 50, y: dimensions.height / 2 - 30 };
    case 'top-left':
      return { x: 50, y: 50 };
    case 'top-right':
      return { x: dimensions.width - 150, y: 50 };
    case 'bottom-left':
      return { x: 50, y: dimensions.height - 100 };
    case 'bottom-right':
      return { x: dimensions.width - 150, y: dimensions.height - 100 };
    case 'top':
      return { x: dimensions.width / 2 - 50, y: 50 };
    case 'bottom':
      return { x: dimensions.width / 2 - 50, y: dimensions.height - 100 };
    case 'left':
      return { x: 50, y: dimensions.height / 2 - 30 };
    case 'right':
      return { x: dimensions.width - 150, y: dimensions.height / 2 - 30 };
    default:
      return { x: dimensions.width / 2 - 50, y: dimensions.height / 2 - 30 };
  }
}

/**
 * Gets a complementary color
 * @param {string} color - Base color
 * @returns {string} - Complementary color
 */
function getComplementaryColor(color) {
  const complementaryMap = {
    [COLOR_PALETTE.red]: COLOR_PALETTE.green,
    [COLOR_PALETTE.blue]: COLOR_PALETTE.orange,
    [COLOR_PALETTE.green]: COLOR_PALETTE.red,
    [COLOR_PALETTE.yellow]: COLOR_PALETTE.purple,
    [COLOR_PALETTE.orange]: COLOR_PALETTE.blue,
    [COLOR_PALETTE.purple]: COLOR_PALETTE.yellow,
    [COLOR_PALETTE.pink]: COLOR_PALETTE.teal
  };
  
  return complementaryMap[color] || COLOR_PALETTE.blue;
}

/**
 * Gets a contrasting color
 * @param {Array} existingColors - Existing colors on canvas
 * @returns {string} - Contrasting color
 */
function getContrastingColor(existingColors) {
  const availableColors = Object.values(COLOR_PALETTE);
  const unusedColors = availableColors.filter(color => 
    !existingColors.includes(color));
  
  if (unusedColors.length > 0) {
    return unusedColors[0];
  }
  
  return COLOR_PALETTE.blue;
}

/**
 * Normalizes color names to hex values
 * @param {string} color - Color name or hex value
 * @returns {string} - Normalized hex color
 */
function normalizeColorName(color) {
  if (!color) return COLOR_PALETTE.blue;
  
  const lowerColor = color.toLowerCase().trim();
  
  // If it's already a hex color, return as is
  if (lowerColor.startsWith('#')) {
    return lowerColor;
  }
  
  // Map color names to hex values
  return COLOR_PALETTE[lowerColor] || COLOR_PALETTE.blue;
}

/**
 * Checks if a color is vibrant
 * @param {string} color - Color hex value
 * @returns {boolean} - Whether color is vibrant
 */
function isVibrantColor(color) {
  const vibrantColors = [
    COLOR_PALETTE.red, COLOR_PALETTE.blue, COLOR_PALETTE.green,
    COLOR_PALETTE.yellow, COLOR_PALETTE.orange, COLOR_PALETTE.purple,
    COLOR_PALETTE.pink, COLOR_PALETTE.teal, COLOR_PALETTE.indigo
  ];
  
  return vibrantColors.includes(color);
}

/**
 * Checks if a color is neutral
 * @param {string} color - Color hex value
 * @returns {boolean} - Whether color is neutral
 */
function isNeutralColor(color) {
  const neutralColors = [
    COLOR_PALETTE.black, COLOR_PALETTE.white, COLOR_PALETTE.gray,
    COLOR_PALETTE.darkGray, COLOR_PALETTE.lightGray, COLOR_PALETTE.brown
  ];
  
  return neutralColors.includes(color);
}

/**
 * Extracts user intent from natural language command with enhanced pattern matching
 * @param {string} command - User's natural language command
 * @returns {Object} - Extracted user intent with confidence scores
 */
export function extractUserIntent(command) {
  const lowerCommand = command.toLowerCase().trim();
  
  return {
    color: extractColorIntent(lowerCommand),
    size: extractSizeIntent(lowerCommand),
    position: extractPositionIntent(lowerCommand),
    spacing: extractSpacingIntent(lowerCommand),
    shape: extractShapeIntent(lowerCommand),
    action: extractActionIntent(lowerCommand),
    quantity: extractQuantityIntent(lowerCommand),
    style: extractStyleIntent(lowerCommand),
    confidence: calculateIntentConfidence(lowerCommand)
  };
}

/**
 * Extracts color intent from command with enhanced pattern matching
 * @param {string} command - Lowercase command
 * @returns {string|null} - Color intent
 */
function extractColorIntent(command) {
  // Direct color name matching
  const colorKeywords = Object.keys(COLOR_PALETTE);
  
  for (const color of colorKeywords) {
    if (command.includes(color)) {
      return color;
    }
  }
  
  // Enhanced color pattern matching
  const colorPatterns = [
    // "red circle", "blue rectangle", etc.
    { pattern: /(red|blue|green|yellow|orange|purple|pink|black|white|gray|grey)\s+(circle|rectangle|square|text|box)/, color: '$1' },
    // "make it red", "change to blue", etc.
    { pattern: /(make|change|set|color)\s+(it\s+)?(red|blue|green|yellow|orange|purple|pink|black|white|gray|grey)/, color: '$3' },
    // "in red", "with blue", etc.
    { pattern: /(in|with|using)\s+(red|blue|green|yellow|orange|purple|pink|black|white|gray|grey)/, color: '$2' },
    // "a red one", "the blue one", etc.
    { pattern: /(a|the)\s+(red|blue|green|yellow|orange|purple|pink|black|white|gray|grey)\s+(one|shape|object)/, color: '$2' }
  ];
  
  for (const pattern of colorPatterns) {
    const match = command.match(pattern.pattern);
    if (match) {
      const color = match[1] || match[2] || match[3];
      if (colorKeywords.includes(color)) {
        return color;
      }
    }
  }
  
  // Hex color pattern matching
  const hexPattern = /#[0-9a-fA-F]{3,6}/;
  const hexMatch = command.match(hexPattern);
  if (hexMatch) {
    return hexMatch[0];
  }
  
  // Color synonym matching
  const colorSynonyms = {
    'crimson': 'red',
    'scarlet': 'red',
    'navy': 'blue',
    'azure': 'blue',
    'emerald': 'green',
    'lime': 'green',
    'gold': 'yellow',
    'amber': 'yellow',
    'coral': 'orange',
    'violet': 'purple',
    'magenta': 'pink',
    'charcoal': 'black',
    'silver': 'gray',
    'slate': 'gray'
  };
  
  for (const [synonym, color] of Object.entries(colorSynonyms)) {
    if (command.includes(synonym)) {
      return color;
    }
  }
  
  return null;
}

/**
 * Extracts size intent from command with enhanced pattern matching
 * @param {string} command - Lowercase command
 * @returns {string|null} - Size intent
 */
function extractSizeIntent(command) {
  // Check for random size requests first
  const randomPatterns = [
    /random\s+(size|sizes)/,
    /randomly\s+(resize|size)/,
    /random\s+(width|height)/,
    /random\s+(dimensions?)/,
    /make\s+(them|it)\s+random\s+(size|sizes)/,
    /resize\s+(to\s+)?random/,
    /random\s+(resize|sizing)/
  ];
  
  for (const pattern of randomPatterns) {
    if (pattern.test(command)) {
      console.log('🎲 Detected random size request');
      return 'random';
    }
  }
  
  // Direct size keyword matching
  const sizeKeywords = Object.keys(SIZE_PRESETS);
  
  for (const size of sizeKeywords) {
    if (command.includes(size)) {
      return size;
    }
  }
  
  // Enhanced size pattern matching
  const sizePatterns = [
    // "small circle", "large rectangle", etc.
    { pattern: /(tiny|small|medium|large|huge|big|little|mini|massive)\s+(circle|rectangle|square|text|box|shape)/, size: '$1' },
    // "make it small", "resize to large", etc.
    { pattern: /(make|resize|change|set)\s+(it\s+)?(tiny|small|medium|large|huge|big|little|mini|massive)/, size: '$3' },
    // "a small one", "the large one", etc.
    { pattern: /(a|the)\s+(tiny|small|medium|large|huge|big|little|mini|massive)\s+(one|shape|object)/, size: '$2' }
  ];
  
  for (const pattern of sizePatterns) {
    const match = command.match(pattern.pattern);
    if (match) {
      const size = match[1] || match[2] || match[3];
      const normalizedSize = normalizeSizeKeyword(size);
      if (normalizedSize && sizeKeywords.includes(normalizedSize)) {
        return normalizedSize;
      }
    }
  }
  
  // Size synonym matching
  const sizeSynonyms = {
    'big': 'large',
    'little': 'small',
    'mini': 'tiny',
    'massive': 'huge',
    'giant': 'huge',
    'enormous': 'huge',
    'micro': 'tiny',
    'miniature': 'tiny'
  };
  
  for (const [synonym, size] of Object.entries(sizeSynonyms)) {
    if (command.includes(synonym)) {
      return size;
    }
  }
  
  // Numeric size patterns
  const numericPatterns = [
    // "100px wide", "50px tall", etc.
    { pattern: /(\d+)\s*px\s+(wide|tall|high|width|height)/, value: '$1' },
    // "width of 100", "height 50", etc.
    { pattern: /(width|height|wide|tall|high)\s+(of\s+)?(\d+)/, value: '$3' }
  ];
  
  for (const pattern of numericPatterns) {
    const match = command.match(pattern.pattern);
    if (match) {
      const value = parseInt(match[1] || match[3]);
      if (value < 50) return 'tiny';
      if (value < 100) return 'small';
      if (value < 200) return 'medium';
      if (value < 300) return 'large';
      return 'huge';
    }
  }
  
  return null;
}

/**
 * Normalizes size keywords to standard size categories
 * @param {string} sizeKeyword - Size keyword to normalize
 * @returns {string|null} - Normalized size keyword
 */
function normalizeSizeKeyword(sizeKeyword) {
  const sizeMap = {
    'tiny': 'tiny',
    'small': 'small',
    'medium': 'medium',
    'large': 'large',
    'huge': 'huge',
    'big': 'large',
    'little': 'small',
    'mini': 'tiny',
    'massive': 'huge'
  };
  
  return sizeMap[sizeKeyword] || null;
}

/**
 * Extracts position intent from command with enhanced pattern matching
 * @param {string} command - Lowercase command
 * @returns {string|null} - Position intent
 */
function extractPositionIntent(command) {
  // Direct position keyword matching
  const positionKeywords = [
    'center', 'top-left', 'top-right', 'bottom-left', 'bottom-right',
    'top', 'bottom', 'left', 'right', 'middle'
  ];
  
  for (const position of positionKeywords) {
    if (command.includes(position)) {
      return position;
    }
  }
  
  // Enhanced position pattern matching
  const positionPatterns = [
    // "at the center", "in the top-left", etc.
    { pattern: /(at|in|on)\s+(the\s+)?(center|top-left|top-right|bottom-left|bottom-right|top|bottom|left|right|middle)/, position: '$3' },
    // "place it center", "put it top-left", etc.
    { pattern: /(place|put|position|move)\s+(it\s+)?(center|top-left|top-right|bottom-left|bottom-right|top|bottom|left|right|middle)/, position: '$3' },
    // "to the center", "towards the top", etc.
    { pattern: /(to|towards|near)\s+(the\s+)?(center|top-left|top-right|bottom-left|bottom-right|top|bottom|left|right|middle)/, position: '$3' }
  ];
  
  for (const pattern of positionPatterns) {
    const match = command.match(pattern.pattern);
    if (match) {
      const position = match[1] || match[2] || match[3];
      if (positionKeywords.includes(position)) {
        return position;
      }
    }
  }
  
  // Relative position patterns
  const relativePatterns = [
    // "next to", "beside", "near", etc.
    { pattern: /(next\s+to|beside|near|close\s+to|adjacent\s+to)/, position: 'nearby' },
    // "above", "below", "over", "under", etc.
    { pattern: /(above|below|over|under|beneath)/, position: 'vertical' },
    // "to the left", "to the right", etc.
    { pattern: /(to\s+the\s+left|to\s+the\s+right)/, position: 'horizontal' }
  ];
  
  for (const pattern of relativePatterns) {
    const match = command.match(pattern.pattern);
    if (match) {
      return match[1] || match[2] || match[3];
    }
  }
  
  // Coordinate patterns
  const coordinatePatterns = [
    // "at 100, 200", "position 300 400", etc.
    { pattern: /(at|position)\s+(\d+)\s*,\s*(\d+)/, position: 'coordinates' },
    // "x: 100 y: 200", "x=100 y=200", etc.
    { pattern: /x\s*[:=]\s*(\d+)\s+y\s*[:=]\s*(\d+)/, position: 'coordinates' }
  ];
  
  for (const pattern of coordinatePatterns) {
    const match = command.match(pattern.pattern);
    if (match) {
      return 'coordinates';
    }
  }
  
  return null;
}

/**
 * Extracts spacing intent from command with enhanced pattern matching
 * @param {string} command - Lowercase command
 * @returns {number|null} - Spacing intent
 */
function extractSpacingIntent(command) {
  // Numeric spacing patterns
  const spacingPatterns = [
    // "30px spacing", "50px apart", etc.
    { pattern: /(\d+)\s*px\s+(spacing|apart|between|gap)/, value: '$1' },
    // "spacing of 30", "gap 50", etc.
    { pattern: /(spacing|gap|distance)\s+(of\s+)?(\d+)/, value: '$3' },
    // "30 pixels", "50 pixels apart", etc.
    { pattern: /(\d+)\s+pixels?\s+(apart|between|spacing)/, value: '$1' }
  ];
  
  for (const pattern of spacingPatterns) {
    const match = command.match(pattern.pattern);
    if (match) {
      const value = parseInt(match[1] || match[3]);
      if (value >= 0 && value <= 200) { // Reasonable spacing range
        return value;
      }
    }
  }
  
  // Descriptive spacing patterns
  const descriptiveSpacing = {
    'tight': 10,
    'close': 10,
    'tightly': 10,
    'close together': 10,
    'cramped': 5,
    'loose': 50,
    'spread': 50,
    'spread out': 50,
    'loosely': 50,
    'far apart': 100,
    'wide': 50,
    'normal': 20,
    'default': 20,
    'standard': 20
  };
  
  for (const [keyword, spacing] of Object.entries(descriptiveSpacing)) {
    if (command.includes(keyword)) {
      return spacing;
    }
  }
  
  return null;
}

/**
 * Extracts shape type intent from command
 * @param {string} command - Lowercase command
 * @returns {string|null} - Shape type intent
 */
function extractShapeIntent(command) {
  const shapeTypes = ['rectangle', 'circle', 'text', 'square', 'box'];
  
  // Direct shape type matching
  for (const shape of shapeTypes) {
    if (command.includes(shape)) {
      return shape;
    }
  }
  
  // Shape synonym matching
  const shapeSynonyms = {
    'rect': 'rectangle',
    'square': 'rectangle',
    'box': 'rectangle',
    'round': 'circle',
    'oval': 'circle',
    'label': 'text',
    'textbox': 'text',
    'text box': 'text'
  };
  
  for (const [synonym, shape] of Object.entries(shapeSynonyms)) {
    if (command.includes(synonym)) {
      return shape;
    }
  }
  
  return null;
}

/**
 * Extracts action intent from command
 * @param {string} command - Lowercase command
 * @returns {string|null} - Action intent
 */
function extractActionIntent(command) {
  const actionPatterns = [
    // Creation actions
    { pattern: /(create|make|add|draw|generate|build)/, action: 'create' },
    // Modification actions
    { pattern: /(modify|change|edit|update|alter|adjust)/, action: 'modify' },
    // Deletion actions
    { pattern: /(delete|remove|destroy|clear|erase)/, action: 'delete' },
    // Movement actions
    { pattern: /(move|drag|shift|relocate|position)/, action: 'move' },
    // Arrangement actions
    { pattern: /(arrange|organize|layout|align|distribute)/, action: 'arrange' },
    // Resize actions
    { pattern: /(resize|scale|grow|shrink|enlarge|reduce)/, action: 'resize' },
    // Rotation actions
    { pattern: /(rotate|turn|spin|flip)/, action: 'rotate' }
  ];
  
  for (const pattern of actionPatterns) {
    const match = command.match(pattern.pattern);
    if (match) {
      return pattern.action;
    }
  }
  
  return null;
}

/**
 * Extracts quantity intent from command
 * @param {string} command - Lowercase command
 * @returns {number|null} - Quantity intent
 */
function extractQuantityIntent(command) {
  const quantityPatterns = [
    // "3 circles", "5 rectangles", etc.
    { pattern: /(\d+)\s+(circles?|rectangles?|squares?|texts?|boxes?|shapes?)/, value: '$1' },
    // "create 3", "make 5", etc.
    { pattern: /(create|make|add|draw)\s+(\d+)/, value: '$2' },
    // "a few", "several", "many", etc.
    { pattern: /(a\s+few|several|many|multiple|some)/, value: 'multiple' }
  ];
  
  for (const pattern of quantityPatterns) {
    const match = command.match(pattern.pattern);
    if (match) {
      const value = match[1] || match[2];
      if (value === 'multiple') {
        return 3; // Default for "multiple"
      }
      const num = parseInt(value);
      if (num >= 1 && num <= 20) { // Reasonable quantity range
        return num;
      }
    }
  }
  
  return null;
}

/**
 * Extracts style intent from command
 * @param {string} command - Lowercase command
 * @returns {string|null} - Style intent
 */
function extractStyleIntent(command) {
  const stylePatterns = [
    // Border styles
    { pattern: /(border|outline|stroke|frame)/, style: 'border' },
    // Fill styles
    { pattern: /(fill|background|solid|filled)/, style: 'fill' },
    // Transparency styles
    { pattern: /(transparent|opaque|semi-transparent|translucent)/, style: 'transparency' },
    // Shadow styles
    { pattern: /(shadow|drop\s+shadow|glow)/, style: 'shadow' },
    // Gradient styles
    { pattern: /(gradient|fade|blend)/, style: 'gradient' }
  ];
  
  for (const pattern of stylePatterns) {
    const match = command.match(pattern.pattern);
    if (match) {
      return pattern.style;
    }
  }
  
  return null;
}

/**
 * Calculates confidence score for intent extraction
 * @param {string} command - Lowercase command
 * @returns {number} - Confidence score (0-1)
 */
function calculateIntentConfidence(command) {
  let confidence = 0;
  let totalChecks = 0;
  
  // Check for explicit keywords (high confidence)
  const explicitKeywords = [
    'red', 'blue', 'green', 'small', 'large', 'center', 'top-left',
    'rectangle', 'circle', 'text', 'create', 'make', 'delete', 'move'
  ];
  
  for (const keyword of explicitKeywords) {
    totalChecks++;
    if (command.includes(keyword)) {
      confidence += 0.8;
    }
  }
  
  // Check for pattern matches (medium confidence)
  const patterns = [
    /create\s+\w+/,
    /make\s+\w+/,
    /add\s+\w+/,
    /\d+\s*px/,
    /#[0-9a-fA-F]{3,6}/
  ];
  
  for (const pattern of patterns) {
    totalChecks++;
    if (pattern.test(command)) {
      confidence += 0.6;
    }
  }
  
  // Check for command structure (low confidence)
  const structureWords = ['the', 'a', 'an', 'this', 'that', 'it'];
  for (const word of structureWords) {
    totalChecks++;
    if (command.includes(word)) {
      confidence += 0.2;
    }
  }
  
  return totalChecks > 0 ? Math.min(confidence / totalChecks, 1) : 0;
}

export default {
  generateSmartDefaults,
  extractUserIntent,
  COLOR_PALETTE,
  SIZE_PRESETS
};
