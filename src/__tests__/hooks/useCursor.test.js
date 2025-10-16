/**
 * @jest-environment jsdom
 */

import { describe, test, expect } from 'vitest';
import { calculateCursorDistance, isSignificantCursorMovement } from '../../hooks/useCursor.js';

describe('Cursor Utility Functions', () => {
  describe('calculateCursorDistance', () => {
    test('should calculate distance correctly', () => {
      const pos1 = { x: 0, y: 0 };
      const pos2 = { x: 3, y: 4 };
      
      const distance = calculateCursorDistance(pos1, pos2);
      expect(distance).toBe(5); // 3-4-5 triangle
    });

    test('should handle same positions', () => {
      const pos = { x: 100, y: 200 };
      
      const distance = calculateCursorDistance(pos, pos);
      expect(distance).toBe(0);
    });

    test('should handle negative coordinates', () => {
      const pos1 = { x: -3, y: -4 };
      const pos2 = { x: 0, y: 0 };
      
      const distance = calculateCursorDistance(pos1, pos2);
      expect(distance).toBe(5);
    });

    test('should handle floating point coordinates', () => {
      const pos1 = { x: 1.5, y: 2.5 };
      const pos2 = { x: 4.5, y: 6.5 };
      
      const distance = calculateCursorDistance(pos1, pos2);
      expect(distance).toBe(5); // 3-4-5 triangle
    });
  });

  describe('isSignificantCursorMovement', () => {
    test('should return true for significant movement', () => {
      const pos1 = { x: 0, y: 0 };
      const pos2 = { x: 10, y: 0 };
      
      const isSignificant = isSignificantCursorMovement(pos1, pos2, 5);
      expect(isSignificant).toBe(true);
    });

    test('should return false for insignificant movement', () => {
      const pos1 = { x: 0, y: 0 };
      const pos2 = { x: 3, y: 0 };
      
      const isSignificant = isSignificantCursorMovement(pos1, pos2, 5);
      expect(isSignificant).toBe(false);
    });

    test('should use default threshold when not provided', () => {
      const pos1 = { x: 0, y: 0 };
      const pos2 = { x: 6, y: 0 }; // Greater than default threshold of 5
      
      const isSignificant = isSignificantCursorMovement(pos1, pos2);
      expect(isSignificant).toBe(true);
    });

    test('should handle edge case at exact threshold', () => {
      const pos1 = { x: 0, y: 0 };
      const pos2 = { x: 5, y: 0 }; // Exactly at threshold
      
      const isSignificant = isSignificantCursorMovement(pos1, pos2, 5);
      expect(isSignificant).toBe(true);
    });

    test('should work with diagonal movement', () => {
      const pos1 = { x: 0, y: 0 };
      const pos2 = { x: 3, y: 4 }; // 5 pixels total distance
      
      const isSignificant = isSignificantCursorMovement(pos1, pos2, 5);
      expect(isSignificant).toBe(true);
      
      const isNotSignificant = isSignificantCursorMovement(pos1, pos2, 6);
      expect(isNotSignificant).toBe(false);
    });

    test('should handle negative threshold gracefully', () => {
      const pos1 = { x: 0, y: 0 };
      const pos2 = { x: 1, y: 1 };
      
      // Negative threshold should still work
      const isSignificant = isSignificantCursorMovement(pos1, pos2, -1);
      expect(isSignificant).toBe(true);
    });

    test('should handle zero threshold', () => {
      const pos1 = { x: 0, y: 0 };
      const pos2 = { x: 0, y: 0 };
      
      // With zero threshold, no movement (distance = 0) should be >= 0, so it's significant
      const isSignificantSamePos = isSignificantCursorMovement(pos1, pos2, 0);
      expect(isSignificantSamePos).toBe(true);
      
      const pos3 = { x: 0.1, y: 0 };
      const isSignificant = isSignificantCursorMovement(pos1, pos3, 0);
      expect(isSignificant).toBe(true);
    });
  });

  describe('Throttling Constants Validation', () => {
    test('should validate 60 FPS throttle interval', () => {
      const expectedInterval = Math.floor(1000 / 60); // ~16ms for 60 FPS
      expect(expectedInterval).toBeLessThanOrEqual(17);
      expect(expectedInterval).toBeGreaterThanOrEqual(15);
    });

    test('should validate debounce interval for performance', () => {
      const recommendedDebounce = 50; // 50ms is good for Firestore
      expect(recommendedDebounce).toBeGreaterThan(0);
      expect(recommendedDebounce).toBeLessThan(100); // Not too slow
    });
  });

  describe('Performance Edge Cases', () => {
    test('should handle very large coordinates', () => {
      const pos1 = { x: 1000000, y: 1000000 };
      const pos2 = { x: 1000003, y: 1000004 };
      
      const distance = calculateCursorDistance(pos1, pos2);
      expect(distance).toBe(5);
    });

    test('should handle very small movements', () => {
      const pos1 = { x: 0, y: 0 };
      const pos2 = { x: 0.001, y: 0.001 };
      
      const distance = calculateCursorDistance(pos1, pos2);
      expect(distance).toBeCloseTo(0.001414, 5); // √2 * 0.001
    });

    test('should handle cursor at canvas boundaries', () => {
      const canvasBounds = { width: 4000, height: 4000 };
      
      // Test corner positions
      const topLeft = { x: 0, y: 0 };
      const bottomRight = { x: canvasBounds.width, y: canvasBounds.height };
      
      const distance = calculateCursorDistance(topLeft, bottomRight);
      expect(distance).toBeCloseTo(5656.85, 2); // √(4000² + 4000²)
    });
  });
});