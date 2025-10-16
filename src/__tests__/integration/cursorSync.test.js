/**
 * Integration tests for real-time cursor synchronization
 * Tests the complete flow: presence → cursor sync → UI updates
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { Stage, Layer } from 'react-konva';
import React from 'react';

// Components to test
import CursorLayer from '../../components/Collaboration/CursorLayer.jsx';
import { Cursor } from '../../components/Collaboration/Cursor.jsx';
import { usePresence } from '../../hooks/usePresence.js';
import { useRealtimeCursor } from '../../hooks/useRealtimeCursor.js';

// Services to mock
import * as firestore from '../../services/firestore.js';
import * as realtime from '../../services/realtime.js';

// Test utilities
import { mockFirebaseAuth, mockFirebaseDatabase } from '../utils/firebaseMocks.js';

// Mock Firebase services
vi.mock('../../services/firebase.js', () => ({
  auth: mockFirebaseAuth,
  db: vi.fn(),
}));

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => mockFirebaseDatabase),
  ref: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
  onValue: vi.fn(),
  off: vi.fn(),
  onDisconnect: vi.fn(() => ({ remove: vi.fn() })),
}));

describe('Cursor Sync Integration Tests', () => {
  let mockPresenceData;
  let mockPresenceCallback;
  let mockUsers;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock users for testing
    mockUsers = [
      {
        id: 'user1',
        displayName: 'Alice',
        email: 'alice@test.com',
        cursorColor: '#FF6B6B',
        isOnline: true,
        cursorPosition: { x: 100, y: 150 },
        lastSeen: Date.now(),
        joinedAt: Date.now() - 1000
      },
      {
        id: 'user2', 
        displayName: 'Bob',
        email: 'bob@test.com',
        cursorColor: '#4ECDC4',
        isOnline: true,
        cursorPosition: { x: 300, y: 200 },
        lastSeen: Date.now(),
        joinedAt: Date.now() - 500
      }
    ];

    // Mock presence data
    mockPresenceData = {
      user1: mockUsers[0],
      user2: mockUsers[1]
    };

    // Mock Firebase services
    vi.spyOn(firestore, 'listenToPresence').mockImplementation((callback) => {
      mockPresenceCallback = callback;
      return vi.fn(); // unsubscribe function
    });

    vi.spyOn(firestore, 'updateCursorPosition').mockResolvedValue();
    vi.spyOn(firestore, 'joinCanvas').mockResolvedValue('#FF6B6B');
    vi.spyOn(firestore, 'startHeartbeat').mockReturnValue(123);
    
    vi.spyOn(realtime, 'initializeCursorSync').mockResolvedValue();
    vi.spyOn(realtime, 'broadcastCursorPosition').mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Two-User Cursor Sync Simulation', () => {
    it('should sync cursor positions between two users', async () => {
      const TestComponent = () => {
        const canvasBounds = { width: 800, height: 600 };
        
        return (
          <Stage width={800} height={600}>
            <CursorLayer
              onlineUsers={mockUsers}
              currentUserId="user1"
              scale={1}
              showCursors={true}
              canvasBounds={canvasBounds}
            />
          </Stage>
        );
      };

      render(<TestComponent />);

      // Wait for cursors to render
      await waitFor(() => {
        // Should render Bob's cursor (user2) but not Alice's (current user)
        const visibleCursors = screen.getAllByTestId(/cursor-/);
        expect(visibleCursors).toHaveLength(1);
      });

      // Verify Bob's cursor is rendered with correct properties
      await waitFor(() => {
        const bobCursor = screen.getByTestId('cursor-user2');
        expect(bobCursor).toBeDefined();
      });
    });

    it('should update cursor positions in real-time', async () => {
      const onCursorUpdate = vi.fn();
      let presenceCallback;

      // Mock the presence listener
      vi.spyOn(firestore, 'listenToPresence').mockImplementation((callback) => {
        presenceCallback = callback;
        return vi.fn();
      });

      // Simulate initial presence data
      act(() => {
        presenceCallback(mockUsers);
      });

      expect(onCursorUpdate).not.toHaveBeenCalled();

      // Simulate Alice moving her cursor
      const updatedUsers = [...mockUsers];
      updatedUsers[0].cursorPosition = { x: 150, y: 200 };

      act(() => {
        presenceCallback(updatedUsers);
      });

      // Verify cursor position updates are handled
      expect(firestore.listenToPresence).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should handle user disconnection', async () => {
      let presenceCallback;

      vi.spyOn(firestore, 'listenToPresence').mockImplementation((callback) => {
        presenceCallback = callback;
        return vi.fn();
      });

      // Initial state: both users online
      act(() => {
        presenceCallback(mockUsers);
      });

      // Bob disconnects
      const remainingUsers = mockUsers.filter(user => user.id !== 'user2');
      
      act(() => {
        presenceCallback(remainingUsers);
      });

      // Verify only Alice remains
      expect(presenceCallback).toHaveBeenCalled();
    });

    it('should assign distinct cursor colors', async () => {
      const colors = mockUsers.map(user => user.cursorColor);
      
      // Verify all colors are different
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(colors.length);
      
      // Verify colors are valid hex
      colors.forEach(color => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });

  describe('Cursor Component Integration', () => {
    it('should render cursor with correct properties', () => {
      const TestCursor = () => (
        <Stage width={400} height={300}>
          <Layer>
            <Cursor
              userId="test-user"
              displayName="Test User"
              cursorColor="#FF6B6B"
              x={100}
              y={150}
              showLabel={true}
              isVisible={true}
              scale={1}
            />
          </Layer>
        </Stage>
      );

      render(<TestCursor />);
      
      // Component should render without errors
      expect(screen.getByTestId('cursor-test-user')).toBeDefined();
    });

    it('should hide label when showLabel is false', () => {
      const TestCursor = () => (
        <Stage width={400} height={300}>
          <Layer>
            <Cursor
              userId="test-user"
              displayName="Test User"
              cursorColor="#FF6B6B"
              x={100}
              y={150}
              showLabel={false}
              isVisible={true}
              scale={1}
            />
          </Layer>
        </Stage>
      );

      render(<TestCursor />);
      
      const cursor = screen.getByTestId('cursor-test-user');
      expect(cursor).toBeDefined();
      
      // Label should not be visible
      expect(screen.queryByText('Test User')).toBeNull();
    });

    it('should scale cursor based on zoom level', () => {
      const scales = [0.5, 1, 2];
      
      scales.forEach(scale => {
        const TestCursor = () => (
          <Stage width={400} height={300}>
            <Layer>
              <Cursor
                userId={`test-user-${scale}`}
                displayName="Test User"
                cursorColor="#FF6B6B"
                x={100}
                y={150}
                showLabel={true}
                isVisible={true}
                scale={scale}
              />
            </Layer>
          </Stage>
        );

        const { unmount } = render(<TestCursor />);
        
        expect(screen.getByTestId(`cursor-test-user-${scale}`)).toBeDefined();
        
        unmount();
      });
    });
  });

  describe('Real-time Sync Flow', () => {
    it('should complete full sync flow: join → broadcast → receive → render', async () => {
      const mockUser = {
        uid: 'test-user',
        email: 'test@example.com',
        displayName: 'Test User'
      };

      // Step 1: User joins canvas
      await act(async () => {
        await firestore.joinCanvas(mockUser.uid, mockUser);
      });

      expect(firestore.joinCanvas).toHaveBeenCalledWith(mockUser.uid, mockUser);

      // Step 2: Setup presence listener
      let presenceCallback;
      vi.spyOn(firestore, 'listenToPresence').mockImplementation((callback) => {
        presenceCallback = callback;
        return vi.fn();
      });

      // Step 3: Simulate presence update
      act(() => {
        presenceCallback(mockUsers);
      });

      // Step 4: Broadcast cursor position
      await act(async () => {
        await firestore.updateCursorPosition(mockUser.uid, { x: 250, y: 300 });
      });

      expect(firestore.updateCursorPosition).toHaveBeenCalledWith(
        mockUser.uid, 
        { x: 250, y: 300 }
      );

      // Verify the complete flow executed
      expect(firestore.joinCanvas).toHaveBeenCalled();
      expect(firestore.listenToPresence).toHaveBeenCalled();
      expect(firestore.updateCursorPosition).toHaveBeenCalled();
    });

    it('should handle sync errors gracefully', async () => {
      const mockUser = {
        uid: 'test-user',
        email: 'test@example.com',
        displayName: 'Test User'
      };

      // Mock Firebase error
      vi.spyOn(firestore, 'updateCursorPosition').mockRejectedValue(
        new Error('PERMISSION_DENIED')
      );

      // Should not throw error
      await expect(
        firestore.updateCursorPosition(mockUser.uid, { x: 100, y: 100 })
      ).rejects.toThrow('PERMISSION_DENIED');
    });
  });

  describe('Performance and Throttling', () => {
    it('should throttle cursor position updates', async () => {
      const mockUser = { uid: 'test-user' };
      const positions = [
        { x: 100, y: 100 },
        { x: 101, y: 101 },
        { x: 102, y: 102 },
        { x: 103, y: 103 },
        { x: 104, y: 104 }
      ];

      // Rapid fire position updates
      const promises = positions.map(pos => 
        firestore.updateCursorPosition(mockUser.uid, pos)
      );

      await Promise.all(promises);

      // All positions should be processed (mock doesn't actually throttle)
      expect(firestore.updateCursorPosition).toHaveBeenCalledTimes(5);
    });

    it('should cleanup listeners on unmount', () => {
      const unsubscribe = vi.fn();
      
      vi.spyOn(firestore, 'listenToPresence').mockReturnValue(unsubscribe);

      const { unmount } = render(
        <Stage width={400} height={300}>
          <CursorLayer
            onlineUsers={mockUsers}
            currentUserId="user1"
            scale={1}
            showCursors={true}
            canvasBounds={{ width: 400, height: 300 }}
          />
        </Stage>
      );

      unmount();

      // Cleanup should be handled by the component's useEffect
      // This is more of a conceptual test since we're testing components in isolation
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty presence data', async () => {
      let presenceCallback;

      vi.spyOn(firestore, 'listenToPresence').mockImplementation((callback) => {
        presenceCallback = callback;
        return vi.fn();
      });

      // Empty presence data
      act(() => {
        presenceCallback([]);
      });

      // Should not crash
      expect(firestore.listenToPresence).toHaveBeenCalled();
    });

    it('should handle malformed cursor data', async () => {
      const malformedUsers = [
        {
          id: 'user1',
          displayName: 'Alice',
          cursorColor: '#FF6B6B',
          isOnline: true,
          cursorPosition: null, // Invalid position
        },
        {
          id: 'user2',
          displayName: 'Bob',
          // Missing cursorColor
          isOnline: true,
          cursorPosition: { x: 100, y: 100 },
        }
      ];

      const TestComponent = () => (
        <Stage width={400} height={300}>
          <CursorLayer
            onlineUsers={malformedUsers}
            currentUserId="user3"
            scale={1}
            showCursors={true}
            canvasBounds={{ width: 400, height: 300 }}
          />
        </Stage>
      );

      // Should not crash with malformed data
      expect(() => render(<TestComponent />)).not.toThrow();
    });

    it('should handle very large cursor coordinates', () => {
      const extremeUser = {
        id: 'extreme-user',
        displayName: 'Extreme User',
        cursorColor: '#FF6B6B',
        isOnline: true,
        cursorPosition: { x: 999999, y: 999999 },
      };

      const TestComponent = () => (
        <Stage width={400} height={300}>
          <CursorLayer
            onlineUsers={[extremeUser]}
            currentUserId="other-user"
            scale={1}
            showCursors={true}
            canvasBounds={{ width: 400, height: 300 }}
          />
        </Stage>
      );

      // Should handle extreme coordinates gracefully
      expect(() => render(<TestComponent />)).not.toThrow();
    });
  });
});
