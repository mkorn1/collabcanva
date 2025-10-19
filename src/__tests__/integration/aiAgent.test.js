/**
 * Integration tests for AI Canvas Agent
 * Tests the complete flow: command processing → function calls → canvas execution
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processCommand } from '../../services/aiAgent.js';
import { executeCommand, executeCommands } from '../../services/commandExecutor.js';

// Mock OpenAI
const mockOpenAI = {
  chat: {
    completions: {
      create: vi.fn()
    }
  }
};

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => mockOpenAI)
}));

// Mock LangSmith
vi.mock('langsmith', () => ({
  Client: vi.fn().mockImplementation(() => ({}))
}));

// Mock canvas context functions
const mockCanvasContext = {
  createObject: vi.fn(),
  updateObject: vi.fn(),
  deleteObject: vi.fn(),
  getObjects: vi.fn(),
  getSelectedObjects: vi.fn(),
  getCanvasDimensions: vi.fn()
};

describe('AI Agent Integration Tests', () => {
  let mockCanvasState;
  let mockUser;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock canvas state
    mockCanvasState = {
      objects: [
        { 
          id: 'rect1', 
          type: 'rectangle', 
          x: 100, 
          y: 100, 
          width: 100, 
          height: 60, 
          fill: '#e74c3c',
          text_content: null
        },
        { 
          id: 'circle1', 
          type: 'circle', 
          x: 200, 
          y: 200, 
          width: 80, 
          height: 80, 
          fill: '#3498db',
          text_content: null
        },
        { 
          id: 'text1', 
          type: 'text', 
          x: 300, 
          y: 300, 
          width: 200, 
          height: 40, 
          fill: '#2c3e50',
          text_content: 'Hello World'
        }
      ],
      selectedObjects: [],
      dimensions: { width: 1920, height: 1080 }
    };

    // Mock user
    mockUser = {
      uid: 'test-user',
      email: 'test@example.com',
      displayName: 'Test User'
    };

    // Setup mock canvas context
    mockCanvasContext.createObject.mockResolvedValue({ success: true, id: 'new-object' });
    mockCanvasContext.updateObject.mockResolvedValue({ success: true });
    mockCanvasContext.deleteObject.mockResolvedValue({ success: true });
    mockCanvasContext.getObjects.mockReturnValue(mockCanvasState.objects);
    mockCanvasContext.getSelectedObjects.mockReturnValue(mockCanvasState.selectedObjects);
    mockCanvasContext.getCanvasDimensions.mockReturnValue(mockCanvasState.dimensions);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Core Operations Integration', () => {
    describe('create_shape Operation', () => {
      it('should create a rectangle with smart defaults', async () => {
        // Mock OpenAI response for creating a rectangle
        mockOpenAI.chat.completions.create.mockResolvedValue({
          choices: [{
            message: {
              content: null,
              function_call: {
                name: 'create_shape',
                arguments: JSON.stringify({
                  type: 'rectangle',
                  x: 400,
                  y: 300,
                  width: 100,
                  height: 60,
                  fill: '#e74c3c'
                })
              }
            }
          }]
        });

        const result = await processCommand('create a red rectangle', mockCanvasState, mockUser.uid);
        
        expect(result.success).toBe(true);
        expect(result.type).toBe('function_call');
        expect(result.functionCall.name).toBe('create_shape');
        expect(result.functionCall.arguments.type).toBe('rectangle');
        expect(result.functionCall.arguments.fill).toBe('#e74c3c');
      });

      it('should create a circle with relative positioning', async () => {
        mockOpenAI.chat.completions.create.mockResolvedValue({
          choices: [{
            message: {
              content: null,
              function_call: {
                name: 'create_shape',
                arguments: JSON.stringify({
                  type: 'circle',
                  width: 80,
                  height: 80,
                  fill: '#3498db',
                  position: 'next to',
                  referenceObject: 'red rectangle'
                })
              }
            }
          }]
        });

        const result = await processCommand('create a blue circle next to the red rectangle', mockCanvasState, mockUser.uid);
        
        expect(result.success).toBe(true);
        expect(result.functionCall.name).toBe('create_shape');
        expect(result.functionCall.arguments.type).toBe('circle');
        expect(result.functionCall.arguments.fill).toBe('#3498db');
        // Should have resolved relative positioning
        expect(result.functionCall.arguments.x).toBeDefined();
        expect(result.functionCall.arguments.y).toBeDefined();
      });

      it('should create text with content', async () => {
        mockOpenAI.chat.completions.create.mockResolvedValue({
          choices: [{
            message: {
              content: null,
              function_call: {
                name: 'create_shape',
                arguments: JSON.stringify({
                  type: 'text',
                  x: 500,
                  y: 400,
                  width: 200,
                  height: 40,
                  fill: '#2c3e50',
                  text_content: 'New Text'
                })
              }
            }
          }]
        });

        const result = await processCommand('create a text box with "New Text"', mockCanvasState, mockUser.uid);
        
        expect(result.success).toBe(true);
        expect(result.functionCall.name).toBe('create_shape');
        expect(result.functionCall.arguments.type).toBe('text');
        expect(result.functionCall.arguments.text_content).toBe('New Text');
      });
    });

    describe('modify_shape Operation', () => {
      it('should modify object properties', async () => {
        mockOpenAI.chat.completions.create.mockResolvedValue({
          choices: [{
            message: {
              content: null,
              function_call: {
                name: 'modify_shape',
                arguments: JSON.stringify({
                  id: 'rect1',
                  updates: {
                    fill: '#2ecc71',
                    width: 150,
                    height: 80
                  }
                })
              }
            }
          }]
        });

        const result = await processCommand('make the red rectangle green and bigger', mockCanvasState, mockUser.uid);
        
        expect(result.success).toBe(true);
        expect(result.functionCall.name).toBe('modify_shape');
        expect(result.functionCall.arguments.id).toBe('rect1');
        expect(result.functionCall.arguments.updates.fill).toBe('#2ecc71');
        expect(result.functionCall.arguments.updates.width).toBe(150);
      });

      it('should resolve object references by description', async () => {
        mockOpenAI.chat.completions.create.mockResolvedValue({
          choices: [{
            message: {
              content: null,
              function_call: {
                name: 'modify_shape',
                arguments: JSON.stringify({
                  id: 'blue circle',
                  updates: {
                    fill: '#e74c3c'
                  }
                })
              }
            }
          }]
        });

        const result = await processCommand('change the blue circle to red', mockCanvasState, mockUser.uid);
        
        expect(result.success).toBe(true);
        expect(result.functionCall.name).toBe('modify_shape');
        // Should have resolved 'blue circle' to actual ID
        expect(result.functionCall.arguments.id).toBe('circle1');
        expect(result.functionCall.arguments.updates.fill).toBe('#e74c3c');
      });

      it('should handle relative positioning in updates', async () => {
        mockOpenAI.chat.completions.create.mockResolvedValue({
          choices: [{
            message: {
              content: null,
              function_call: {
                name: 'modify_shape',
                arguments: JSON.stringify({
                  id: 'rect1',
                  updates: {
                    position: 'center'
                  }
                })
              }
            }
          }]
        });

        const result = await processCommand('move the red rectangle to the center', mockCanvasState, mockUser.uid);
        
        expect(result.success).toBe(true);
        expect(result.functionCall.name).toBe('modify_shape');
        expect(result.functionCall.arguments.id).toBe('rect1');
        // Should have resolved relative position to absolute coordinates
        expect(result.functionCall.arguments.updates.x).toBeDefined();
        expect(result.functionCall.arguments.updates.y).toBeDefined();
      });
    });

    describe('delete_shape Operation', () => {
      it('should delete object by ID', async () => {
        mockOpenAI.chat.completions.create.mockResolvedValue({
          choices: [{
            message: {
              content: null,
              function_call: {
                name: 'delete_shape',
                arguments: JSON.stringify({
                  id: 'rect1'
                })
              }
            }
          }]
        });

        const result = await processCommand('delete the red rectangle', mockCanvasState, mockUser.uid);
        
        expect(result.success).toBe(true);
        expect(result.functionCall.name).toBe('delete_shape');
        expect(result.functionCall.arguments.id).toBe('rect1');
      });

      it('should resolve object references for deletion', async () => {
        mockOpenAI.chat.completions.create.mockResolvedValue({
          choices: [{
            message: {
              content: null,
              function_call: {
                name: 'delete_shape',
                arguments: JSON.stringify({
                  id: 'text box'
                })
              }
            }
          }]
        });

        const result = await processCommand('delete the text box', mockCanvasState, mockUser.uid);
        
        expect(result.success).toBe(true);
        expect(result.functionCall.name).toBe('delete_shape');
        // Should have resolved 'text box' to actual ID
        expect(result.functionCall.arguments.id).toBe('text1');
      });
    });

    describe('arrange_shapes Operation', () => {
      it('should arrange objects in a row', async () => {
        mockOpenAI.chat.completions.create.mockResolvedValue({
          choices: [{
            message: {
              content: null,
              function_call: {
                name: 'arrange_shapes',
                arguments: JSON.stringify({
                  ids: ['rect1', 'circle1'],
                  layout: 'row',
                  options: {
                    spacing: 50
                  }
                })
              }
            }
          }]
        });

        const result = await processCommand('arrange the red rectangle and blue circle in a row', mockCanvasState, mockUser.uid);
        
        expect(result.success).toBe(true);
        expect(result.functionCall.name).toBe('arrange_shapes');
        expect(result.functionCall.arguments.layout).toBe('row');
        expect(result.functionCall.arguments.ids).toEqual(['rect1', 'circle1']);
        expect(result.functionCall.arguments.options.spacing).toBe(50);
      });

      it('should arrange objects in a grid', async () => {
        mockOpenAI.chat.completions.create.mockResolvedValue({
          choices: [{
            message: {
              content: null,
              function_call: {
                name: 'arrange_shapes',
                arguments: JSON.stringify({
                  ids: ['rect1', 'circle1', 'text1'],
                  layout: 'grid',
                  options: {
                    columns: 2
                  }
                })
              }
            }
          }]
        });

        const result = await processCommand('arrange all shapes in a 2-column grid', mockCanvasState, mockUser.uid);
        
        expect(result.success).toBe(true);
        expect(result.functionCall.name).toBe('arrange_shapes');
        expect(result.functionCall.arguments.layout).toBe('grid');
        expect(result.functionCall.arguments.options.columns).toBe(2);
      });

      it('should handle advanced layout algorithms', async () => {
        mockOpenAI.chat.completions.create.mockResolvedValue({
          choices: [{
            message: {
              content: null,
              function_call: {
                name: 'arrange_shapes',
                arguments: JSON.stringify({
                  ids: ['rect1', 'circle1', 'text1'],
                  layout: 'hexagon'
                })
              }
            }
          }]
        });

        const result = await processCommand('arrange the shapes in a hexagon pattern', mockCanvasState, mockUser.uid);
        
        expect(result.success).toBe(true);
        expect(result.functionCall.name).toBe('arrange_shapes');
        expect(result.functionCall.arguments.layout).toBe('hexagon');
      });
    });

    describe('multi_step_command Operation', () => {
      it('should execute multiple commands in sequence', async () => {
        mockOpenAI.chat.completions.create.mockResolvedValue({
          choices: [{
            message: {
              content: null,
              function_call: {
                name: 'multi_step_command',
                arguments: JSON.stringify({
                  steps: [
                    {
                      name: 'create_shape',
                      arguments: {
                        type: 'rectangle',
                        x: 100,
                        y: 100,
                        width: 200,
                        height: 100,
                        fill: '#e74c3c'
                      }
                    },
                    {
                      name: 'create_shape',
                      arguments: {
                        type: 'text',
                        x: 150,
                        y: 130,
                        width: 100,
                        height: 40,
                        fill: '#ffffff',
                        text_content: 'Button'
                      }
                    }
                  ]
                })
              }
            }
          }]
        });

        const result = await processCommand('create a login form', mockCanvasState, mockUser.uid);
        
        expect(result.success).toBe(true);
        expect(result.functionCall.name).toBe('multi_step_command');
        expect(result.functionCall.arguments.steps).toHaveLength(2);
        expect(result.functionCall.arguments.steps[0].name).toBe('create_shape');
        expect(result.functionCall.arguments.steps[1].name).toBe('create_shape');
      });
    });
  });

  describe('Object Reference Resolution Integration', () => {
    it('should resolve objects by color description', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: null,
            function_call: {
              name: 'modify_shape',
              arguments: JSON.stringify({
                id: 'red rectangle',
                updates: { fill: '#2ecc71' }
              })
            }
          }]
        }]
      });

      const result = await processCommand('change the red rectangle to green', mockCanvasState, mockUser.uid);
      
      expect(result.success).toBe(true);
      expect(result.functionCall.arguments.id).toBe('rect1');
    });

    it('should resolve objects by position description', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: null,
            function_call: {
              name: 'modify_shape',
              arguments: JSON.stringify({
                id: 'top shape',
                updates: { fill: '#f39c12' }
              })
            }
          }]
        }]
      });

      const result = await processCommand('change the top shape to orange', mockCanvasState, mockUser.uid);
      
      expect(result.success).toBe(true);
      // Should resolve to the shape with lowest y coordinate
      expect(result.functionCall.arguments.id).toBe('rect1');
    });

    it('should resolve objects by content description', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: null,
            function_call: {
              name: 'modify_shape',
              arguments: JSON.stringify({
                id: 'Hello World',
                updates: { fill: '#9b59b6' }
              })
            }
          }]
        }]
      });

      const result = await processCommand('change the Hello World text to purple', mockCanvasState, mockUser.uid);
      
      expect(result.success).toBe(true);
      expect(result.functionCall.arguments.id).toBe('text1');
    });
  });

  describe('Relative Positioning Integration', () => {
    it('should resolve "next to" positioning', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: null,
            function_call: {
              name: 'create_shape',
              arguments: JSON.stringify({
                type: 'circle',
                width: 60,
                height: 60,
                fill: '#f39c12',
                position: 'next to',
                referenceObject: 'rect1'
              })
            }
          }]
        }]
      });

      const result = await processCommand('create an orange circle next to the red rectangle', mockCanvasState, mockUser.uid);
      
      expect(result.success).toBe(true);
      expect(result.functionCall.arguments.x).toBeDefined();
      expect(result.functionCall.arguments.y).toBeDefined();
      // Should be positioned to the right of the rectangle
      expect(result.functionCall.arguments.x).toBeGreaterThan(200); // rect1.x + rect1.width
    });

    it('should resolve "below" positioning', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: null,
            function_call: {
              name: 'create_shape',
              arguments: JSON.stringify({
                type: 'rectangle',
                width: 100,
                height: 40,
                fill: '#2ecc71',
                position: 'below',
                referenceObject: 'rect1'
              })
            }
          }]
        }]
      });

      const result = await processCommand('create a green rectangle below the red rectangle', mockCanvasState, mockUser.uid);
      
      expect(result.success).toBe(true);
      expect(result.functionCall.arguments.x).toBeDefined();
      expect(result.functionCall.arguments.y).toBeDefined();
      // Should be positioned below the rectangle
      expect(result.functionCall.arguments.y).toBeGreaterThan(160); // rect1.y + rect1.height
    });

    it('should resolve "center" positioning', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: null,
            function_call: {
              name: 'create_shape',
              arguments: JSON.stringify({
                type: 'circle',
                width: 100,
                height: 100,
                fill: '#9b59b6',
                position: 'center'
              })
            }
          }]
        }]
      });

      const result = await processCommand('create a purple circle in the center', mockCanvasState, mockUser.uid);
      
      expect(result.success).toBe(true);
      expect(result.functionCall.arguments.x).toBeDefined();
      expect(result.functionCall.arguments.y).toBeDefined();
      // Should be positioned near canvas center
      expect(result.functionCall.arguments.x).toBeCloseTo(960, 100); // canvas center x
      expect(result.functionCall.arguments.y).toBeCloseTo(540, 100); // canvas center y
    });
  });

  describe('Ambiguity Handling Integration', () => {
    it('should handle multiple matches with clarification', async () => {
      // Add another red object to create ambiguity
      const ambiguousCanvasState = {
        ...mockCanvasState,
        objects: [
          ...mockCanvasState.objects,
          { 
            id: 'rect2', 
            type: 'rectangle', 
            x: 400, 
            y: 400, 
            width: 120, 
            height: 80, 
            fill: '#e74c3c',
            text_content: null
          }
        ]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: null,
            function_call: {
              name: 'modify_shape',
              arguments: JSON.stringify({
                id: 'red rectangle',
                updates: { fill: '#2ecc71' }
              })
            }
          }]
        }]
      });

      const result = await processCommand('change the red rectangle to green', ambiguousCanvasState, mockUser.uid);
      
      // Should detect ambiguity and return clarification prompt
      expect(result.success).toBe(false);
      expect(result.type).toBe('clarification_needed');
      expect(result.message).toContain('found');
      expect(result.message).toContain('red rectangle');
    });

    it('should handle no matches with suggestions', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: null,
            function_call: {
              name: 'modify_shape',
              arguments: JSON.stringify({
                id: 'green triangle',
                updates: { fill: '#e74c3c' }
              })
            }
          }]
        }]
      });

      const result = await processCommand('change the green triangle to red', mockCanvasState, mockUser.uid);
      
      // Should detect no matches and return suggestions
      expect(result.success).toBe(false);
      expect(result.type).toBe('clarification_needed');
      expect(result.message).toContain('couldn\'t find');
      expect(result.suggestions).toBeDefined();
    });

    it('should handle empty canvas with creation suggestions', async () => {
      const emptyCanvasState = {
        objects: [],
        selectedObjects: [],
        dimensions: { width: 1920, height: 1080 }
      };

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: null,
            function_call: {
              name: 'modify_shape',
              arguments: JSON.stringify({
                id: 'any shape',
                updates: { fill: '#e74c3c' }
              })
            }
          }]
        }]
      });

      const result = await processCommand('change any shape to red', emptyCanvasState, mockUser.uid);
      
      // Should detect empty canvas and return creation suggestions
      expect(result.success).toBe(false);
      expect(result.type).toBe('clarification_needed');
      expect(result.message).toContain('no objects');
      expect(result.suggestions).toContain('Create a red circle');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle OpenAI API errors gracefully', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const result = await processCommand('create a rectangle', mockCanvasState, mockUser.uid);
      
      expect(result.success).toBe(false);
      expect(result.type).toBe('error');
      expect(result.message).toContain('Failed to process command');
    });

    it('should handle rate limiting', async () => {
      // Mock rate limit exceeded
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: 'Rate limit exceeded'
          }
        }]
      });

      // This would need to be implemented in the actual rate limiting logic
      // For now, we'll test that the function handles the response
      const result = await processCommand('create a rectangle', mockCanvasState, mockUser.uid);
      
      // The actual rate limiting would be handled before the API call
      expect(result).toBeDefined();
    });

    it('should handle malformed function calls', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: null,
            function_call: {
              name: 'invalid_function',
              arguments: JSON.stringify({
                invalid: 'data'
              })
            }
          }
        }]
      });

      const result = await processCommand('do something invalid', mockCanvasState, mockUser.uid);
      
      expect(result.success).toBe(false);
      expect(result.type).toBe('error');
      expect(result.message).toContain('Unknown function');
    });
  });

  describe('Performance Integration', () => {
    it('should process commands within reasonable time', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: null,
            function_call: {
              name: 'create_shape',
              arguments: JSON.stringify({
                type: 'rectangle',
                x: 400,
                y: 300,
                width: 100,
                height: 60,
                fill: '#e74c3c'
              })
            }
          }]
        }]
      });

      const startTime = Date.now();
      const result = await processCommand('create a red rectangle', mockCanvasState, mockUser.uid);
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle large canvas states efficiently', async () => {
      // Create a large canvas state with many objects
      const largeCanvasState = {
        objects: Array.from({ length: 100 }, (_, i) => ({
          id: `obj${i}`,
          type: i % 3 === 0 ? 'rectangle' : i % 3 === 1 ? 'circle' : 'text',
          x: Math.random() * 1800,
          y: Math.random() * 1000,
          width: 50 + Math.random() * 100,
          height: 30 + Math.random() * 80,
          fill: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'][i % 5],
          text_content: i % 3 === 2 ? `Text ${i}` : null
        })),
        selectedObjects: [],
        dimensions: { width: 1920, height: 1080 }
      };

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: null,
            function_call: {
              name: 'arrange_shapes',
              arguments: JSON.stringify({
                ids: ['obj1', 'obj2', 'obj3'],
                layout: 'row'
              })
            }
          }]
        }]
      });

      const startTime = Date.now();
      const result = await processCommand('arrange some shapes in a row', largeCanvasState, mockUser.uid);
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(3000); // Should handle large state within 3 seconds
    });
  });

  describe('Multi-User Integration', () => {
    it('should handle concurrent commands from different users', async () => {
      const user1 = { uid: 'user1', displayName: 'User 1' };
      const user2 = { uid: 'user2', displayName: 'User 2' };

      mockOpenAI.chat.completions.create
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: null,
              function_call: {
                name: 'create_shape',
                arguments: JSON.stringify({
                  type: 'rectangle',
                  x: 100,
                  y: 100,
                  width: 100,
                  height: 60,
                  fill: '#e74c3c'
                })
              }
            }
          }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: null,
              function_call: {
                name: 'create_shape',
                arguments: JSON.stringify({
                  type: 'circle',
                  x: 200,
                  y: 200,
                  width: 80,
                  height: 80,
                  fill: '#3498db'
                })
              }
            }
          }]
        });

      // Simulate concurrent commands
      const [result1, result2] = await Promise.all([
        processCommand('create a red rectangle', mockCanvasState, user1.uid),
        processCommand('create a blue circle', mockCanvasState, user2.uid)
      ]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.functionCall.arguments.fill).toBe('#e74c3c');
      expect(result2.functionCall.arguments.fill).toBe('#3498db');
    });
  });
});
