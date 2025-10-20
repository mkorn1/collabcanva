import { CANVAS_WIDTH, CANVAS_HEIGHT, MIN_ZOOM, MAX_ZOOM, MIN_PAN_POSITION, MAX_PAN_POSITION } from './constants.js';

/**
 * Canvas utility functions for coordinate transformations and bounds checking
 */

// ============ COORDINATE TRANSFORMATIONS ============

/**
 * Convert screen coordinates to canvas coordinates
 * @param {Object} screenPoint - { x, y } in screen pixels
 * @param {Object} stage - Konva stage reference
 * @returns {Object} - { x, y } in canvas coordinates
 */
export const screenToCanvas = (screenPoint, stage) => {
  if (!stage) return screenPoint;
  
  return {
    x: (screenPoint.x - stage.x()) / stage.scaleX(),
    y: (screenPoint.y - stage.y()) / stage.scaleY()
  };
};

/**
 * Convert canvas coordinates to screen coordinates
 * @param {Object} canvasPoint - { x, y } in canvas coordinates
 * @param {Object} stage - Konva stage reference
 * @returns {Object} - { x, y } in screen pixels
 */
export const canvasToScreen = (canvasPoint, stage) => {
  if (!stage) return canvasPoint;
  
  return {
    x: canvasPoint.x * stage.scaleX() + stage.x(),
    y: canvasPoint.y * stage.scaleY() + stage.y()
  };
};

/**
 * Get the visible canvas bounds in canvas coordinates
 * @param {Object} stage - Konva stage reference
 * @returns {Object} - { x, y, width, height } bounds
 */
export const getVisibleCanvasBounds = (stage) => {
  if (!stage) return { x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  
  const stageBox = stage.container().getBoundingClientRect();
  const topLeft = screenToCanvas({ x: 0, y: 0 }, stage);
  const bottomRight = screenToCanvas({ x: stageBox.width, y: stageBox.height }, stage);
  
  return {
    x: topLeft.x,
    y: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y
  };
};

// ============ BOUNDS CHECKING ============

/**
 * Check if a point is within the canvas bounds
 * @param {Object} point - { x, y } coordinates
 * @returns {boolean} - true if point is within bounds
 */
export const isPointInCanvas = (point) => {
  return point.x >= 0 && 
         point.x <= CANVAS_WIDTH && 
         point.y >= 0 && 
         point.y <= CANVAS_HEIGHT;
};

/**
 * Check if a rectangle is within the canvas bounds
 * @param {Object} rect - { x, y, width, height }
 * @returns {boolean} - true if rectangle is within bounds
 */
export const isRectInCanvas = (rect) => {
  return rect.x >= 0 && 
         rect.y >= 0 && 
         (rect.x + rect.width) <= CANVAS_WIDTH && 
         (rect.y + rect.height) <= CANVAS_HEIGHT;
};

/**
 * Check if two rectangles intersect
 * @param {Object} rect1 - { x, y, width, height }
 * @param {Object} rect2 - { x, y, width, height }
 * @returns {boolean} - true if rectangles intersect
 */
export const rectsIntersect = (rect1, rect2) => {
  return !(rect1.x + rect1.width < rect2.x || 
           rect2.x + rect2.width < rect1.x || 
           rect1.y + rect1.height < rect2.y || 
           rect2.y + rect2.height < rect1.y);
};

/**
 * Clamp a rectangle to fit within canvas bounds
 * @param {Object} rect - { x, y, width, height }
 * @returns {Object} - Clamped rectangle
 */
export const clampRectToCanvas = (rect) => {
  return {
    x: Math.max(0, Math.min(rect.x, CANVAS_WIDTH - rect.width)),
    y: Math.max(0, Math.min(rect.y, CANVAS_HEIGHT - rect.height)),
    width: Math.min(rect.width, CANVAS_WIDTH),
    height: Math.min(rect.height, CANVAS_HEIGHT)
  };
};

// ============ ZOOM CALCULATIONS ============

/**
 * Clamp zoom level within allowed limits
 * @param {number} zoom - Proposed zoom level
 * @returns {number} - Clamped zoom level
 */
export const clampZoom = (zoom) => {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
};

/**
 * Clamp pan position within allowed boundaries
 * @param {Object} position - { x, y } pan position
 * @returns {Object} - Clamped position { x, y }
 */
export const clampPanPosition = (position) => {
  return {
    x: Math.max(MIN_PAN_POSITION, Math.min(MAX_PAN_POSITION, position.x)),
    y: Math.max(MIN_PAN_POSITION, Math.min(MAX_PAN_POSITION, position.y))
  };
};

/**
 * Calculate zoom to fit content in viewport
 * @param {Object} contentBounds - { x, y, width, height } of content
 * @param {Object} viewportSize - { width, height } of viewport
 * @param {number} padding - Optional padding (default: 50)
 * @returns {number} - Calculated zoom level
 */
export const calculateFitZoom = (contentBounds, viewportSize, padding = 50) => {
  const paddedViewport = {
    width: viewportSize.width - (padding * 2),
    height: viewportSize.height - (padding * 2)
  };
  
  const scaleX = paddedViewport.width / contentBounds.width;
  const scaleY = paddedViewport.height / contentBounds.height;
  
  return clampZoom(Math.min(scaleX, scaleY));
};

/**
 * Calculate center position for zoom operation
 * @param {Object} targetPoint - { x, y } point to zoom toward
 * @param {number} oldZoom - Current zoom level
 * @param {number} newZoom - Target zoom level
 * @param {Object} stagePosition - Current stage position
 * @returns {Object} - New stage position { x, y }
 */
export const calculateZoomPosition = (targetPoint, oldZoom, newZoom, stagePosition) => {
  const mousePointTo = {
    x: (targetPoint.x - stagePosition.x) / oldZoom,
    y: (targetPoint.y - stagePosition.y) / oldZoom
  };

  return {
    x: targetPoint.x - mousePointTo.x * newZoom,
    y: targetPoint.y - mousePointTo.y * newZoom
  };
};

// ============ DISTANCE AND GEOMETRY ============

/**
 * Calculate distance between two points
 * @param {Object} point1 - { x, y }
 * @param {Object} point2 - { x, y }
 * @returns {number} - Distance between points
 */
export const getDistance = (point1, point2) => {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calculate angle between two points
 * @param {Object} point1 - { x, y }
 * @param {Object} point2 - { x, y }
 * @returns {number} - Angle in radians
 */
export const getAngle = (point1, point2) => {
  return Math.atan2(point2.y - point1.y, point2.x - point1.x);
};

/**
 * Get the center point of a rectangle
 * @param {Object} rect - { x, y, width, height }
 * @returns {Object} - Center point { x, y }
 */
export const getRectCenter = (rect) => {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2
  };
};

/**
 * Snap a value to a grid
 * @param {number} value - Value to snap
 * @param {number} gridSize - Grid size (default: 10)
 * @returns {number} - Snapped value
 */
export const snapToGrid = (value, gridSize = 10) => {
  return Math.round(value / gridSize) * gridSize;
};

/**
 * Snap a point to a grid
 * @param {Object} point - { x, y }
 * @param {number} gridSize - Grid size (default: 10)
 * @returns {Object} - Snapped point { x, y }
 */
export const snapPointToGrid = (point, gridSize = 10) => {
  return {
    x: snapToGrid(point.x, gridSize),
    y: snapToGrid(point.y, gridSize)
  };
};

// ============ LAYER MANAGEMENT ============

/**
 * Sort objects by layer position (descending order for Konva rendering)
 * Objects with lower layerPosition values appear in front (foreground)
 * Objects with higher layerPosition values appear behind (background)
 * In Konva, objects rendered later appear on top, so we sort descending
 * @param {Array} objects - Array of objects with layerPosition property
 * @returns {Array} - Sorted array of objects (higher numbers first for rendering)
 */
export const sortObjectsByLayerPosition = (objects) => {
  if (!Array.isArray(objects)) {
    console.warn('sortObjectsByLayerPosition: Invalid input - expected array');
    return [];
  }
  
  return [...objects].sort((a, b) => {
    // Ensure layerPosition exists and is a number, default to 0
    const layerA = typeof a.layerPosition === 'number' ? a.layerPosition : 0;
    const layerB = typeof b.layerPosition === 'number' ? b.layerPosition : 0;
    
    // Sort in descending order (higher numbers first) so lower numbers render last (on top)
    return layerB - layerA;
  });
};

/**
 * Get the next available layer position for new objects
 * @param {Array} objects - Array of existing objects
 * @param {number} preferredPosition - Preferred layer position (default: 0)
 * @returns {number} - Next available layer position
 */
export const getNextLayerPosition = (objects, preferredPosition = 0) => {
  if (!Array.isArray(objects)) {
    return preferredPosition;
  }
  
  // If preferred position is available, use it
  const existingPositions = objects.map(obj => obj.layerPosition || 0);
  if (!existingPositions.includes(preferredPosition)) {
    return preferredPosition;
  }
  
  // Find the next available position after preferred
  let nextPosition = preferredPosition + 1;
  while (existingPositions.includes(nextPosition)) {
    nextPosition++;
  }
  
  return nextPosition;
};

/**
 * Validate layer position value
 * @param {number} layerPosition - Layer position to validate
 * @returns {boolean} - true if valid
 */
export const isValidLayerPosition = (layerPosition) => {
  return typeof layerPosition === 'number' && 
         !isNaN(layerPosition) && 
         isFinite(layerPosition) &&
         layerPosition >= 0 &&
         Number.isInteger(layerPosition);
};

// ============ VALIDATION ============

/**
 * Validate that an object has valid coordinates
 * @param {Object} obj - Object with x, y properties
 * @returns {boolean} - true if coordinates are valid numbers
 */
export const hasValidCoordinates = (obj) => {
  return typeof obj.x === 'number' && 
         typeof obj.y === 'number' && 
         !isNaN(obj.x) && 
         !isNaN(obj.y) &&
         isFinite(obj.x) &&
         isFinite(obj.y);
};

/**
 * Validate that a rectangle has valid dimensions
 * @param {Object} rect - { x, y, width, height }
 * @returns {boolean} - true if rectangle is valid
 */
export const hasValidDimensions = (rect) => {
  return hasValidCoordinates(rect) &&
         typeof rect.width === 'number' &&
         typeof rect.height === 'number' &&
         rect.width > 0 &&
         rect.height > 0 &&
         isFinite(rect.width) &&
         isFinite(rect.height);
};
