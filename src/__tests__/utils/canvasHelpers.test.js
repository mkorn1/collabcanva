/**
 * @jest-environment jsdom
 */

import {
  screenToCanvas,
  canvasToScreen,
  getVisibleCanvasBounds,
  isPointInCanvas,
  isRectInCanvas,
  rectsIntersect,
  clampRectToCanvas,
  clampZoom,
  calculateFitZoom,
  calculateZoomPosition,
  getDistance,
  getAngle,
  getRectCenter,
  snapToGrid,
  snapPointToGrid,
  hasValidCoordinates,
  hasValidDimensions
} from '../../utils/canvasHelpers.js';

// Mock stage object for testing
const createMockStage = (x = 0, y = 0, scaleX = 1, scaleY = 1, width = 800, height = 600) => ({
  x: () => x,
  y: () => y,
  scaleX: () => scaleX,
  scaleY: () => scaleY,
  container: () => ({
    getBoundingClientRect: () => ({ width, height })
  })
});

describe('Canvas Helpers', () => {
  
  describe('Coordinate Transformations', () => {
    test('screenToCanvas should convert screen coordinates to canvas coordinates', () => {
      const stage = createMockStage(100, 50, 2, 2);
      const screenPoint = { x: 300, y: 150 };
      
      const result = screenToCanvas(screenPoint, stage);
      
      expect(result).toEqual({ x: 100, y: 50 });
    });

    test('screenToCanvas should handle null stage', () => {
      const screenPoint = { x: 100, y: 200 };
      
      const result = screenToCanvas(screenPoint, null);
      
      expect(result).toEqual(screenPoint);
    });

    test('canvasToScreen should convert canvas coordinates to screen coordinates', () => {
      const stage = createMockStage(100, 50, 2, 2);
      const canvasPoint = { x: 100, y: 50 };
      
      const result = canvasToScreen(canvasPoint, stage);
      
      expect(result).toEqual({ x: 300, y: 150 });
    });

    test('canvasToScreen should handle null stage', () => {
      const canvasPoint = { x: 100, y: 200 };
      
      const result = canvasToScreen(canvasPoint, null);
      
      expect(result).toEqual(canvasPoint);
    });

    test('coordinate transformations should be reversible', () => {
      const stage = createMockStage(50, 25, 1.5, 1.5);
      const originalPoint = { x: 200, y: 300 };
      
      const canvasPoint = screenToCanvas(originalPoint, stage);
      const backToScreen = canvasToScreen(canvasPoint, stage);
      
      expect(Math.round(backToScreen.x)).toBe(originalPoint.x);
      expect(Math.round(backToScreen.y)).toBe(originalPoint.y);
    });
  });

  describe('Bounds Checking', () => {
    test('isPointInCanvas should return true for points within canvas', () => {
      const pointInside = { x: 2000, y: 2000 };
      const pointOnEdge = { x: 0, y: 0 };
      const pointAtMax = { x: 4000, y: 4000 };
      
      expect(isPointInCanvas(pointInside)).toBe(true);
      expect(isPointInCanvas(pointOnEdge)).toBe(true);
      expect(isPointInCanvas(pointAtMax)).toBe(true);
    });

    test('isPointInCanvas should return false for points outside canvas', () => {
      const pointNegativeX = { x: -1, y: 2000 };
      const pointNegativeY = { x: 2000, y: -1 };
      const pointTooFarX = { x: 4001, y: 2000 };
      const pointTooFarY = { x: 2000, y: 4001 };
      
      expect(isPointInCanvas(pointNegativeX)).toBe(false);
      expect(isPointInCanvas(pointNegativeY)).toBe(false);
      expect(isPointInCanvas(pointTooFarX)).toBe(false);
      expect(isPointInCanvas(pointTooFarY)).toBe(false);
    });

    test('isRectInCanvas should return true for rectangles within canvas', () => {
      const rectInside = { x: 100, y: 100, width: 200, height: 300 };
      const rectOnEdge = { x: 0, y: 0, width: 100, height: 100 };
      const rectMaxSize = { x: 0, y: 0, width: 4000, height: 4000 };
      
      expect(isRectInCanvas(rectInside)).toBe(true);
      expect(isRectInCanvas(rectOnEdge)).toBe(true);
      expect(isRectInCanvas(rectMaxSize)).toBe(true);
    });

    test('isRectInCanvas should return false for rectangles outside canvas', () => {
      const rectPartiallyOut = { x: 3900, y: 100, width: 200, height: 100 };
      const rectCompletelyOut = { x: 5000, y: 5000, width: 100, height: 100 };
      const rectNegativePosition = { x: -50, y: 100, width: 100, height: 100 };
      
      expect(isRectInCanvas(rectPartiallyOut)).toBe(false);
      expect(isRectInCanvas(rectCompletelyOut)).toBe(false);
      expect(isRectInCanvas(rectNegativePosition)).toBe(false);
    });

    test('rectsIntersect should detect intersecting rectangles', () => {
      const rect1 = { x: 0, y: 0, width: 100, height: 100 };
      const rect2 = { x: 50, y: 50, width: 100, height: 100 };
      const rect3 = { x: 200, y: 200, width: 50, height: 50 };
      
      expect(rectsIntersect(rect1, rect2)).toBe(true);
      expect(rectsIntersect(rect1, rect3)).toBe(false);
      expect(rectsIntersect(rect2, rect3)).toBe(false);
    });

    test('clampRectToCanvas should clamp rectangle to canvas bounds', () => {
      const rectOutside = { x: -50, y: -30, width: 200, height: 150 };
      const rectTooLarge = { x: 100, y: 100, width: 5000, height: 5000 };
      
      const clamped1 = clampRectToCanvas(rectOutside);
      const clamped2 = clampRectToCanvas(rectTooLarge);
      
      expect(clamped1).toEqual({ x: 0, y: 0, width: 200, height: 150 });
      expect(clamped2).toEqual({ x: 0, y: 0, width: 4000, height: 4000 });
    });
  });

  describe('Zoom Calculations', () => {
    test('clampZoom should limit zoom to valid range', () => {
      expect(clampZoom(0.05)).toBe(0.1); // Below minimum
      expect(clampZoom(0.5)).toBe(0.5);  // Within range
      expect(clampZoom(2.0)).toBe(2.0);  // Within range
      expect(clampZoom(10.0)).toBe(5.0); // Above maximum
    });

    test('calculateFitZoom should calculate appropriate zoom for content', () => {
      const contentBounds = { x: 0, y: 0, width: 400, height: 300 };
      const viewportSize = { width: 800, height: 600 };
      
      const zoom = calculateFitZoom(contentBounds, viewportSize);
      
      // Should fit content with padding (takes minimum of scale ratios)
      // ScaleX: (800 - 100) / 400 = 1.75
      // ScaleY: (600 - 100) / 300 = 1.6667
      // Takes minimum: 1.6667
      expect(Math.round(zoom * 1000) / 1000).toBe(1.667);
    });

    test('calculateZoomPosition should calculate correct position for zoom', () => {
      const targetPoint = { x: 400, y: 300 };
      const oldZoom = 1.0;
      const newZoom = 2.0;
      const stagePosition = { x: 0, y: 0 };
      
      const result = calculateZoomPosition(targetPoint, oldZoom, newZoom, stagePosition);
      
      expect(result).toEqual({ x: -400, y: -300 });
    });
  });

  describe('Distance and Geometry', () => {
    test('getDistance should calculate correct distance between points', () => {
      const point1 = { x: 0, y: 0 };
      const point2 = { x: 3, y: 4 };
      
      const distance = getDistance(point1, point2);
      
      expect(distance).toBe(5);
    });

    test('getAngle should calculate correct angle between points', () => {
      const point1 = { x: 0, y: 0 };
      const point2 = { x: 1, y: 0 };
      const point3 = { x: 0, y: 1 };
      
      expect(getAngle(point1, point2)).toBe(0);
      expect(getAngle(point1, point3)).toBe(Math.PI / 2);
    });

    test('getRectCenter should return center point of rectangle', () => {
      const rect = { x: 100, y: 200, width: 300, height: 400 };
      
      const center = getRectCenter(rect);
      
      expect(center).toEqual({ x: 250, y: 400 });
    });

    test('snapToGrid should snap values to grid', () => {
      expect(snapToGrid(127)).toBe(130);
      expect(snapToGrid(123)).toBe(120);
      expect(snapToGrid(125)).toBe(130);
      expect(snapToGrid(123, 5)).toBe(125);
    });

    test('snapPointToGrid should snap point coordinates to grid', () => {
      const point = { x: 127, y: 143 };
      
      const snapped = snapPointToGrid(point);
      
      expect(snapped).toEqual({ x: 130, y: 140 });
    });
  });

  describe('Validation', () => {
    test('hasValidCoordinates should validate coordinate objects', () => {
      const validPoint = { x: 100, y: 200 };
      const invalidPointNaN = { x: NaN, y: 200 };
      const invalidPointString = { x: "100", y: 200 };
      const invalidPointInfinite = { x: Infinity, y: 200 };
      const missingProperty = { x: 100 };
      
      expect(hasValidCoordinates(validPoint)).toBe(true);
      expect(hasValidCoordinates(invalidPointNaN)).toBe(false);
      expect(hasValidCoordinates(invalidPointString)).toBe(false);
      expect(hasValidCoordinates(invalidPointInfinite)).toBe(false);
      expect(hasValidCoordinates(missingProperty)).toBe(false);
    });

    test('hasValidDimensions should validate rectangle objects', () => {
      const validRect = { x: 10, y: 20, width: 100, height: 200 };
      const invalidRectNegativeSize = { x: 10, y: 20, width: -100, height: 200 };
      const invalidRectZeroSize = { x: 10, y: 20, width: 0, height: 200 };
      const invalidRectCoords = { x: NaN, y: 20, width: 100, height: 200 };
      
      expect(hasValidDimensions(validRect)).toBe(true);
      expect(hasValidDimensions(invalidRectNegativeSize)).toBe(false);
      expect(hasValidDimensions(invalidRectZeroSize)).toBe(false);
      expect(hasValidDimensions(invalidRectCoords)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle negative coordinates correctly', () => {
      const negativePoint = { x: -100, y: -200 };
      
      expect(isPointInCanvas(negativePoint)).toBe(false);
      expect(hasValidCoordinates(negativePoint)).toBe(true); // Negative is valid, just not in canvas
    });

    test('should handle very large coordinates', () => {
      const largePoint = { x: 1000000, y: 2000000 };
      
      expect(isPointInCanvas(largePoint)).toBe(false);
      expect(hasValidCoordinates(largePoint)).toBe(true);
    });

    test('should handle zero dimensions', () => {
      const zeroRect = { x: 100, y: 100, width: 0, height: 0 };
      
      expect(hasValidDimensions(zeroRect)).toBe(false);
      expect(isRectInCanvas(zeroRect)).toBe(true); // Zero rect is technically "in" canvas
    });

    test('should handle extreme zoom values', () => {
      expect(clampZoom(-10)).toBe(0.1);
      expect(clampZoom(1000)).toBe(5.0);
      expect(clampZoom(0)).toBe(0.1);
    });
  });
});
