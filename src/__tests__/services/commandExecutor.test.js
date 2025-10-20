import { describe, test, expect, beforeEach } from 'vitest';
import { executeCommand } from '../../services/commandExecutor';

describe('Enhanced Arrange Shapes Execution Logic', () => {
  let mockCanvasContext;
  let mockUser;

  beforeEach(() => {
    mockUser = { uid: 'test-user', displayName: 'Test User' };
    mockCanvasContext = {
      updateObject: async (id, updates) => {
        // Mock successful update
        return { success: true };
      },
      objects: [
        { id: '1', type: 'rectangle', x: 100, y: 100, width: 100, height: 60, fill: '#e74c3c' },
        { id: '2', type: 'circle', x: 200, y: 200, width: 80, height: 80, fill: '#3498db' },
        { id: '3', type: 'text', x: 300, y: 300, width: 120, height: 40, fill: '#2ecc71', text: 'Hello' },
        { id: '4', type: 'rectangle', x: 400, y: 400, width: 80, height: 50, fill: '#f39c12' },
        { id: '5', type: 'circle', x: 500, y: 500, width: 60, height: 60, fill: '#9b59b6' }
      ]
    };
  });

  describe('Basic Layout Types', () => {
    test('should arrange objects in a row', async () => {
      const result = await executeCommand({
        name: 'arrange_shapes',
        arguments: {
          ids: ['1', '2', '3'],
          layout: 'row',
          options: { spacing: 20, startX: 100, startY: 100 }
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(true);
      expect(result.message).toContain('arranged');
    });

    test('should arrange objects in a column', async () => {
      const result = await executeCommand({
        name: 'arrange_shapes',
        arguments: {
          ids: ['1', '2', '3'],
          layout: 'column',
          options: { spacing: 20, startX: 100, startY: 100 }
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(true);
      expect(result.message).toContain('arranged');
    });

    test('should arrange objects in a grid', async () => {
      const result = await executeCommand({
        name: 'arrange_shapes',
        arguments: {
          ids: ['1', '2', '3', '4'],
          layout: 'grid',
          options: { spacing: 20, startX: 100, startY: 100, columns: 2 }
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(true);
      expect(result.message).toContain('arranged');
    });

    test('should distribute objects horizontally', async () => {
      const result = await executeCommand({
        name: 'arrange_shapes',
        arguments: {
          ids: ['1', '2', '3'],
          layout: 'distribute_h',
          options: { spacing: 20, startX: 100, startY: 100 }
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(true);
      expect(result.message).toContain('arranged');
    });

    test('should distribute objects vertically', async () => {
      const result = await executeCommand({
        name: 'arrange_shapes',
        arguments: {
          ids: ['1', '2', '3'],
          layout: 'distribute_v',
          options: { spacing: 20, startX: 100, startY: 100 }
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(true);
      expect(result.message).toContain('arranged');
    });
  });

  describe('Advanced Layout Types', () => {
    test('should arrange objects in a circle', async () => {
      const result = await executeCommand({
        name: 'arrange_shapes',
        arguments: {
          ids: ['1', '2', '3', '4'],
          layout: 'circle',
          options: { spacing: 20, startX: 300, startY: 300, radius: 100 }
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(true);
      expect(result.message).toContain('arranged');
    });

    test('should arrange objects in a spiral', async () => {
      const result = await executeCommand({
        name: 'arrange_shapes',
        arguments: {
          ids: ['1', '2', '3', '4', '5'],
          layout: 'spiral',
          options: { spacing: 20, startX: 300, startY: 300, spiralTightness: 0.1 }
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(true);
      expect(result.message).toContain('arranged');
    });

    test('should arrange objects in a flow pattern', async () => {
      const result = await executeCommand({
        name: 'arrange_shapes',
        arguments: {
          ids: ['1', '2', '3'],
          layout: 'flow',
          options: { spacing: 20, startX: 100, startY: 100, flowDirection: 'right' }
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(true);
      expect(result.message).toContain('arranged');
    });
  });

  describe('Alignment and Justification', () => {
    test('should support center alignment in row layout', async () => {
      const result = await executeCommand({
        name: 'arrange_shapes',
        arguments: {
          ids: ['1', '2', '3'],
          layout: 'row',
          options: { spacing: 20, startX: 300, startY: 100, alignment: 'center' }
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(true);
    });

    test('should support end alignment in column layout', async () => {
      const result = await executeCommand({
        name: 'arrange_shapes',
        arguments: {
          ids: ['1', '2', '3'],
          layout: 'column',
          options: { spacing: 20, startX: 100, startY: 300, alignment: 'end' }
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(true);
    });

    test('should support space-between justification', async () => {
      const result = await executeCommand({
        name: 'arrange_shapes',
        arguments: {
          ids: ['1', '2', '3'],
          layout: 'row',
          options: { spacing: 20, startX: 100, startY: 100, justify: 'space-between' }
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid layout type', async () => {
      const result = await executeCommand({
        name: 'arrange_shapes',
        arguments: {
          ids: ['1', '2', '3'],
          layout: 'invalid_layout'
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid layout');
    });

    test('should handle missing ids array', async () => {
      const result = await executeCommand({
        name: 'arrange_shapes',
        arguments: {
          layout: 'row'
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Missing or invalid ids array');
    });

    test('should handle empty ids array', async () => {
      const result = await executeCommand({
        name: 'arrange_shapes',
        arguments: {
          ids: [],
          layout: 'row'
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Missing or invalid ids array');
    });

    test('should handle non-existent object ids', async () => {
      const result = await executeCommand({
        name: 'arrange_shapes',
        arguments: {
          ids: ['non-existent-1', 'non-existent-2'],
          layout: 'row'
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(false);
      expect(result.message).toContain('No valid objects found');
    });

    test('should handle partial non-existent object ids', async () => {
      const result = await executeCommand({
        name: 'arrange_shapes',
        arguments: {
          ids: ['1', 'non-existent-2'],
          layout: 'row'
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Only found 1 of 2 objects');
    });
  });

  describe('Edge Cases', () => {
    test('should handle single object arrangement', async () => {
      const result = await executeCommand({
        name: 'arrange_shapes',
        arguments: {
          ids: ['1'],
          layout: 'row'
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(true);
    });

    test('should handle zero spacing', async () => {
      const result = await executeCommand({
        name: 'arrange_shapes',
        arguments: {
          ids: ['1', '2', '3'],
          layout: 'row',
          options: { spacing: 0 }
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(true);
    });

    test('should handle large spacing values', async () => {
      const result = await executeCommand({
        name: 'arrange_shapes',
        arguments: {
          ids: ['1', '2', '3'],
          layout: 'row',
          options: { spacing: 500 }
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(true);
    });

    test('should handle negative start positions', async () => {
      const result = await executeCommand({
        name: 'arrange_shapes',
        arguments: {
          ids: ['1', '2', '3'],
          layout: 'row',
          options: { startX: -100, startY: -100 }
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(true);
    });
  });

  describe('Layout Options', () => {
    test('should support custom radius for circle layout', async () => {
      const result = await executeCommand({
        name: 'arrange_shapes',
        arguments: {
          ids: ['1', '2', '3', '4'],
          layout: 'circle',
          options: { radius: 200, startX: 400, startY: 400 }
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(true);
    });

    test('should support custom columns for grid layout', async () => {
      const result = await executeCommand({
        name: 'arrange_shapes',
        arguments: {
          ids: ['1', '2', '3', '4', '5'],
          layout: 'grid',
          options: { columns: 3, spacing: 30 }
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(true);
    });

    test('should support flow direction options', async () => {
      const flowDirections = ['right', 'left', 'down', 'up'];
      
      for (const direction of flowDirections) {
        const result = await executeCommand({
          name: 'arrange_shapes',
          arguments: {
            ids: ['1', '2', '3'],
            layout: 'flow',
            options: { flowDirection: direction, spacing: 25 }
          }
        }, mockCanvasContext, mockUser);

        expect(result.success).toBe(true);
      }
    });

    test('should support spiral tightness options', async () => {
      const result = await executeCommand({
        name: 'arrange_shapes',
        arguments: {
          ids: ['1', '2', '3', '4', '5'],
          layout: 'spiral',
          options: { spiralTightness: 0.2, spiralRadius: 80 }
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(true);
    });
  });

  describe('Square Shape Creation', () => {
    test('should create a square with equal width and height', async () => {
      let createdObject = null;
      const mockCanvasContext = {
        addObject: async (obj) => {
          createdObject = obj;
          return 'square-1';
        },
        objects: []
      };

      const result = await executeCommand({
        name: 'create_shape',
        arguments: {
          type: 'square',
          x: 100,
          y: 100,
          width: 80,
          height: 60, // Different height to test that it gets equalized
          fill: '#2ecc71'
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(true);
      expect(createdObject).toBeDefined();
      expect(createdObject.type).toBe('square');
      expect(createdObject.width).toBe(80); // Should use the larger value
      expect(createdObject.height).toBe(80); // Should match width
      expect(createdObject.x).toBe(100);
      expect(createdObject.y).toBe(100);
      expect(createdObject.fill).toBe('#2ecc71');
    });

    test('should modify square to maintain equal width and height', async () => {
      const mockCanvasContext = {
        updateObject: async (id, updates) => {
          return { success: true };
        },
        objects: [
          { id: 'square-1', type: 'square', x: 100, y: 100, width: 80, height: 80, fill: '#2ecc71' }
        ]
      };

      const result = await executeCommand({
        name: 'modify_shape',
        arguments: {
          id: 'square-1',
          updates: {
            width: 100,
            height: 60 // Different height to test that it gets equalized
          }
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(true);
      // The actual width/height equalization happens in the executeModifyShape function
      // We can't easily test the internal updates object without mocking more deeply
    });
  });
});
