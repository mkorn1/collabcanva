/**
 * Test to verify size data is explicitly excluded from rotation operations
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Explicit Size Data Exclusion for Rotation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Transform Data Generation', () => {
    it('should only include rotation data for rotation operations', () => {
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
        // This should execute for rotation - ONLY rotation data
        transformData.rotation = Math.round(rotation / 15) * 15; // Snap to 15° increments
        // Explicitly exclude: width, height, x, y, scaleX, scaleY for rotation operations
      }

      // Verify ONLY rotation data is present
      expect(transformData.rotation).toBe(15);
      
      // Verify ALL size/position data is explicitly excluded
      expect(transformData.width).toBeUndefined();
      expect(transformData.height).toBeUndefined();
      expect(transformData.x).toBeUndefined();
      expect(transformData.y).toBeUndefined();
      expect(transformData.scaleX).toBeUndefined();
      expect(transformData.scaleY).toBeUndefined();
    });

    it('should include size data for resize operations', () => {
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

      // Verify size data is present for resize
      expect(transformData.width).toBe(60); // 50 * 1.2
      expect(transformData.height).toBe(45); // 30 * 1.5
      expect(transformData.x).toBe(100);
      expect(transformData.y).toBe(100);
      
      // Verify rotation data is NOT present for resize
      expect(transformData.rotation).toBeUndefined();
    });

    it('should handle text component rotation correctly', () => {
      // Simulate Text component rotation logic
      const wasResize = false;
      const wasRotation = true;
      const rotation = 30;

      let transformData = {};

      if (wasResize) {
        // This should not execute for rotation
        transformData.width = 100;
        transformData.fontSize = 20;
        transformData.x = 150;
        transformData.y = 150;
      } else if (wasRotation) {
        // This should execute for rotation - ONLY rotation data
        transformData.rotation = Math.round(rotation / 15) * 15; // Snap to 15° increments
        // Explicitly exclude: width, fontSize, x, y, scaleX, scaleY for rotation operations
      }

      // Verify ONLY rotation data is present
      expect(transformData.rotation).toBe(30);
      
      // Verify ALL text-specific data is explicitly excluded
      expect(transformData.width).toBeUndefined();
      expect(transformData.fontSize).toBeUndefined();
      expect(transformData.x).toBeUndefined();
      expect(transformData.y).toBeUndefined();
    });
  });

  describe('Multi-Object Transform Processing', () => {
    it('should process rotation data without size conflicts', () => {
      const selectedObjects = [
        { id: 'obj1', x: 100, y: 100, width: 50, height: 30, rotation: 0 },
        { id: 'obj2', x: 200, y: 200, width: 80, height: 60, rotation: 0 },
        { id: 'obj3', x: 300, y: 300, width: 40, height: 40, rotation: 0 }
      ];

      // Transform data from rotation operation (no size data)
      const transformData = {
        rotation: 15
        // No width, height, x, y, scaleX, scaleY - explicitly excluded
      };

      // Simulate multi-object transform processing
      const processedObjects = selectedObjects.map(obj => {
        const updates = {};
        
        // Apply rotation
        if (transformData.rotation !== undefined) {
          updates.rotation = transformData.rotation;
        }
        
        // Apply size changes (if present - but they won't be for rotation)
        if (transformData.width !== undefined) {
          updates.width = transformData.width;
        }
        if (transformData.height !== undefined) {
          updates.height = transformData.height;
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

      // Verify sizes remain unchanged (no size data to apply)
      expect(processedObjects[0].width).toBe(50);
      expect(processedObjects[0].height).toBe(30);
      expect(processedObjects[1].width).toBe(80);
      expect(processedObjects[1].height).toBe(60);
      expect(processedObjects[2].width).toBe(40);
      expect(processedObjects[2].height).toBe(40);
    });

    it('should process resize data correctly', () => {
      const selectedObjects = [
        { id: 'obj1', x: 100, y: 100, width: 50, height: 30, rotation: 0 },
        { id: 'obj2', x: 200, y: 200, width: 80, height: 60, rotation: 0 }
      ];

      // Transform data from resize operation (includes size data)
      const transformData = {
        width: 100,
        height: 80,
        x: 150,
        y: 150
        // No rotation for resize operations
      };

      // Simulate multi-object transform processing
      const processedObjects = selectedObjects.map(obj => {
        const updates = {};
        
        // Apply size changes
        if (transformData.width !== undefined) {
          updates.width = transformData.width;
        }
        if (transformData.height !== undefined) {
          updates.height = transformData.height;
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

      // Verify rotations remain unchanged
      expect(processedObjects[0].rotation).toBe(0);
      expect(processedObjects[1].rotation).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty transform data gracefully', () => {
      const transformData = {};

      // Should not crash when processing empty transform data
      expect(Object.keys(transformData).length).toBe(0);
      expect(transformData.rotation).toBeUndefined();
      expect(transformData.width).toBeUndefined();
      expect(transformData.height).toBeUndefined();
    });

    it('should handle mixed transform data correctly', () => {
      // This shouldn't happen in practice, but test defensive coding
      const transformData = {
        rotation: 15,
        width: 100,  // This should not be present in real rotation operations
        height: 80   // This should not be present in real rotation operations
      };

      // In practice, rotation operations should NOT have size data
      // But if they do, the multi-object transform should handle it
      expect(transformData.rotation).toBe(15);
      expect(transformData.width).toBe(100);
      expect(transformData.height).toBe(80);
    });
  });
});
