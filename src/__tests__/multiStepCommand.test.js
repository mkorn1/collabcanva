/**
 * Simple test for multi-step commands
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_OPENAI_API_KEY: 'test-key',
    VITE_LANGSMITH_API_KEY: 'test-langsmith-key'
  }
}));

// Mock OpenAI
const mockCreate = vi.fn();
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate
      }
    }
  }))
}));

// Mock LangSmith
vi.mock('langsmith', () => ({
  Client: vi.fn().mockImplementation(() => ({}))
}));

// Now import the modules after mocking
import { processCommand } from '../services/aiAgent.js';
import { executeCommand, executeCommands } from '../services/commandExecutor.js';

describe('Multi-Step Command Tests', () => {
  const mockCanvasState = {
    objects: [
      { id: 'rect1', type: 'rectangle', x: 100, y: 100, width: 100, height: 60, fill: '#e74c3c' },
      { id: 'text1', type: 'text', x: 200, y: 200, width: 100, height: 40, fill: '#2c3e50', text: 'Hello World' }
    ],
    selectedObjects: [],
    dimensions: { width: 1920, height: 1080 }
  };

  const mockUser = { uid: 'test-user' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process multi-step command successfully', async () => {
    // Get the mocked OpenAI instance
    const { default: OpenAI } = await import('openai');
    const mockOpenAI = OpenAI();
    
    // Mock OpenAI response for multi-step command
    const mockResponse = {
      model: 'gpt-4o-mini',
      usage: { total_tokens: 100 },
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
    };
    
    mockCreate.mockResolvedValue(mockResponse);

    const result = await processCommand('create a login form', mockCanvasState, mockUser.uid);
    
    console.log('Test result:', result);
    console.log('Mock was called:', mockCreate.mock.calls);
    
    expect(result.success).toBe(true);
    expect(result.functionCall.name).toBe('multi_step_command');
    expect(result.functionCall.arguments.steps).toHaveLength(2);
    expect(result.functionCall.arguments.steps[0].name).toBe('create_shape');
    expect(result.functionCall.arguments.steps[1].name).toBe('create_shape');
  });

  it('should execute multi-step command steps correctly', async () => {
    const mockCanvasContext = {
      addObject: vi.fn().mockResolvedValue('new-id'),
      updateObject: vi.fn().mockResolvedValue(true),
      removeObject: vi.fn().mockResolvedValue(true),
      objects: mockCanvasState.objects,
      getSelectedObjects: vi.fn().mockReturnValue([])
    };

    const steps = [
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
    ];

    const result = await executeCommands(steps, mockCanvasContext, mockUser);
    
    expect(result.success).toBe(true);
    expect(result.successCount).toBe(2);
    expect(result.executedCount).toBe(2);
    expect(mockCanvasContext.addObject).toHaveBeenCalledTimes(2);
  });

  it('should handle partial failures in multi-step commands', async () => {
    const mockCanvasContext = {
      addObject: vi.fn()
        .mockResolvedValueOnce('id1')
        .mockRejectedValueOnce(new Error('Failed to create second shape')),
      updateObject: vi.fn().mockResolvedValue(true),
      removeObject: vi.fn().mockResolvedValue(true),
      objects: mockCanvasState.objects,
      getSelectedObjects: vi.fn().mockReturnValue([])
    };

    const steps = [
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
    ];

    const result = await executeCommands(steps, mockCanvasContext, mockUser);
    
    expect(result.success).toBe(false);
    expect(result.type).toBe('partial_success');
    expect(result.successCount).toBe(1);
    expect(result.errorCount).toBe(1);
    expect(result.executedCount).toBe(2);
  });
});
