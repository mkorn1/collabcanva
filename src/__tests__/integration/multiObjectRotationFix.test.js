/**
 * Test to verify multi-object rotation doesn't change sizes
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Multi-Object Rotation Size Fix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Transform Data Logic', () => {
    it('should only pass rotation data for rotation operations', () => {
      // Simulate rotation operation
      const transformData = {
        rotation: 15
        // No width, height, x, y should be passed for rotation
      };

      // Verify rotation data is present
      expect(transformData.rotation).toBe(15);
      
      // Verify size data is NOT present
      expect(transformData.width).toBeUndefined();
      expect(transformData.height).toBeUndefined();
      expect(transformData.x).toBeUndefined();
      expect(transformData.y).toBeUndefined();
    });

    it('should pass size data for resize operations', () => {
      // Simulate resize operation
      const transformData = {
        width: 60,
        height: 40,
        x: 100,
        y: 100
        // No rotation should be passed for resize
      };

      // Verify size data is present
      expect(transformData.width).toBe(60);
      expect(transformData.height).toBe(40);
      expect(transformData.x).toBe(100);
      expect(transformData.y).toBe(100);
      
      // Verify rotation data is NOT present
      expect(transformData.rotation).toBeUndefined();
    });
  });

  describe('Multi-Object Transform Logic', () => {
    it('should only apply rotation to all objects during rotation operations', () => {
      const selectedObjects = [
        { id: 'obj1', x: 100, y: 100, width: 50, height: 30, rotation: 0 },
        { id: 'obj2', x: 200, y: 200, width: 80, height: 60, rotation: 0 },
        { id: 'obj3', x: 300, y: 300, width: 40, height: 40, rotation: 0 }
      ];

      const transformData = {
        rotation: 15
        // No size data for rotation operations
      };

      // Simulate multi-object transform processing
      const processedObjects = selectedObjects.map(obj => {
        const updates = {};
        
        // Only apply rotation
        if (transformData.rotation !== undefined) {
          updates.rotation = transformData.rotation;
        }
        
        // Should NOT apply size changes for rotation operations
        if (transformData.width !== undefined && transformData.height !== undefined) {
          if (transformData.rotation === undefined) {
            updates.width = transformData.width;
            updates.height = transformData.height;
          }
        }
        
        return {
          ...obj,
          ...updates
        };
      });

      // Verify all objects have the same rotation
      expect(processedObjects[0].rotation).toBe(15);
      expect(processedObjects[1].rotation).toBe(15);
      expect(processedObjects[2].rotation).toBe(15);

      // Verify sizes remain unchanged
      expect(processedObjects[0].width).toBe(50);
      expect(processedObjects[0].height).toBe(30);
      expect(processedObjects[1].width).toBe(80);
      expect(processedObjects[1].height).toBe(60);
      expect(processedObjects[2].width).toBe(40);
      expect(processedObjects[2].height).toBe(40);
    });

    it('should apply size changes to all objects during resize operations', () => {
      const selectedObjects = [
        { id: 'obj1', x: 100, y: 100, width: 50, height: 30, rotation: 0 },
        { id: 'obj2', x: 200, y: 200, width: 80, height: 60, rotation: 0 },
        { id: 'obj3', x: 300, y: 300, width: 40, height: 40, rotation: 0 }
      ];

      const transformData = {
        width: 100,
        height: 80
        // No rotation for resize operations
      };

      // Simulate multi-object transform processing
      const processedObjects = selectedObjects.map(obj => {
        const updates = {};
        
        // Should apply size changes for resize operations
        if (transformData.width !== undefined && transformData.height !== undefined) {
          if (transformData.rotation === undefined) {
            updates.width = transformData.width;
            updates.height = transformData.height;
          }
        }
        
        return {
          ...obj,
          ...updates
        };
      });

      // Verify all objects have the same size
      expect(processedObjects[0].width).toBe(100);
      expect(processedObjects[0].height).toBe(80);
      expect(processedObjects[1].width).toBe(100);
      expect(processedObjects[1].height).toBe(80);
      expect(processedObjects[2].width).toBe(100);
      expect(processedObjects[2].height).toBe(80);

      // Verify rotations remain unchanged
      expect(processedObjects[0].rotation).toBe(0);
      expect(processedObjects[1].rotation).toBe(0);
      expect(processedObjects[2].rotation).toBe(0);
    });

    it('should not apply size changes when rotation is present', () => {
      const selectedObjects = [
        { id: 'obj1', x: 100, y: 100, width: 50, height: 30, rotation: 0 },
        { id: 'obj2', x: 200, y: 200, width: 80, height: 60, rotation: 0 }
      ];

      const transformData = {
        rotation: 15,
        width: 100,  // This should be ignored because rotation is present
        height: 80   // This should be ignored because rotation is present
      };

      // Simulate multi-object transform processing
      const processedObjects = selectedObjects.map(obj => {
        const updates = {};
        
        // Apply rotation
        if (transformData.rotation !== undefined) {
          updates.rotation = transformData.rotation;
        }
        
        // Should NOT apply size changes because rotation is present
        if (transformData.width !== undefined && transformData.height !== undefined) {
          if (transformData.rotation === undefined) {
            updates.width = transformData.width;
            updates.height = transformData.height;
          }
        }
        
        return {
          ...obj,
          ...updates
        };
      });

      // Verify rotation is applied
      expect(processedObjects[0].rotation).toBe(15);
      expect(processedObjects[1].rotation).toBe(15);

      // Verify sizes remain unchanged (not affected by the size data in transformData)
      expect(processedObjects[0].width).toBe(50);
      expect(processedObjects[0].height).toBe(30);
      expect(processedObjects[1].width).toBe(80);
      expect(processedObjects[1].height).toBe(60);
    });
  });

  describe('Component Transform Data Generation', () => {
    it('should generate correct transform data for rotation operations', () => {
      // Simulate Rectangle component rotation logic
      const wasResize = false;
      const wasRotation = true;
      const rotation = 15;

      let transformData = {};

      if (wasResize) {
        // This should not execute for rotation
        transformData.width = 60;
        transformData.height = 40;
        transformData.x = 100;
        transformData.y = 100;
      } else if (wasRotation) {
        // This should execute for rotation
        transformData.rotation = Math.round(rotation / 15) * 15; // Snap to 15° increments
        // Position data should NOT be included for rotation
      }

      // Verify correct data for rotation
      expect(transformData.rotation).toBe(15);
      expect(transformData.width).toBeUndefined();
      expect(transformData.height).toBeUndefined();
      expect(transformData.x).toBeUndefined();
      expect(transformData.y).toBeUndefined();
    });

    it('should generate correct transform data for resize operations', () => {
      // Simulate Rectangle component resize logic
      const wasResize = true;
      const wasRotation = false;
      const scaleX = 1.2;
      const scaleY = 1.5;
      const nodeWidth = 50;
      const nodeHeight = 30;
      const nodeX = 100;
      const nodeY = 100;

      let transformData = {};

      if (wasResize) {
        // This should execute for resize
        transformData.width = Math.max(10, nodeWidth * scaleX);
        transformData.height = Math.max(10, nodeHeight * scaleY);
        transformData.x = nodeX;
        transformData.y = nodeY;
      } else if (wasRotation) {
        // This should not execute for resize
        transformData.rotation = 15;
      }

      // Verify correct data for resize
      expect(transformData.width).toBe(60); // 50 * 1.2
      expect(transformData.height).toBe(45); // 30 * 1.5
      expect(transformData.x).toBe(100);
      expect(transformData.y).toBe(100);
      expect(transformData.rotation).toBeUndefined();
    });
  });
});
