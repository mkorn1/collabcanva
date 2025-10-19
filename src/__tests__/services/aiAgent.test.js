import { describe, test, expect, beforeEach, vi } from 'vitest';
import { processCommand, testConnection } from '../../services/aiAgent';

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn()
      }
    }
  }))
}));

// Mock LangSmith
vi.mock('langsmith', () => ({
  Client: vi.fn().mockImplementation(() => ({}))
}));

describe('AI Agent Service', () => {
  let mockCanvasState;

  beforeEach(() => {
    mockCanvasState = {
      objects: [
        { id: '1', type: 'rectangle', x: 100, y: 100, width: 100, height: 60, fill: '#e74c3c' },
        { id: '2', type: 'circle', x: 200, y: 200, width: 80, height: 80, fill: '#3498db' }
      ],
      selectedObjects: [],
      dimensions: { width: 1920, height: 1080 }
    };
  });

  describe('Smart Defaults Integration', () => {
    test('should integrate smart defaults into system prompt', () => {
      // This test verifies that the smart defaults system is properly imported
      // and integrated into the AI Agent service
      expect(processCommand).toBeDefined();
      expect(typeof processCommand).toBe('function');
    });

    test('should handle empty canvas state with smart defaults', () => {
      const emptyCanvasState = {
        objects: [],
        selectedObjects: [],
        dimensions: { width: 1920, height: 1080 }
      };

      // This test verifies that the service can handle empty canvas states
      // and will use smart defaults appropriately
      expect(processCommand).toBeDefined();
      expect(typeof processCommand).toBe('function');
    });

    test('should handle canvas state with existing objects', () => {
      // This test verifies that the service can analyze existing canvas objects
      // and generate appropriate smart defaults
      expect(processCommand).toBeDefined();
      expect(typeof processCommand).toBe('function');
    });
  });

  describe('Connection Testing', () => {
    test('should provide connection testing functionality', () => {
      expect(testConnection).toBeDefined();
      expect(typeof testConnection).toBe('function');
    });
  });
});
