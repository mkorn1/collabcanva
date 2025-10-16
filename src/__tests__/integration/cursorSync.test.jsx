/**
 * Integration tests for real-time cursor synchronization
 * Tests the complete cursor sync flow with mocked Firebase services
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Stage, Layer } from 'react-konva';
import React from 'react';

// Components to test
import CursorLayer from '../../components/Collaboration/CursorLayer.jsx';
import { Cursor } from '../../components/Collaboration/Cursor.jsx';

// Test utilities
import { createMockPresenceData, MockPresenceSimulator } from '../utils/firebaseMocks.js';

describe('Cursor Sync Integration Tests', () => {
  let mockUsers;
  let presenceSimulator;

  beforeEach(() => {
    // Create mock users for testing
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
      },
      {
        id: 'user3',
        displayName: 'Charlie',
        email: 'charlie@test.com',
        cursorColor: '#45B7D1',
        isOnline: true,
        cursorPosition: { x: 200, y: 100 },
        lastSeen: Date.now(),
        joinedAt: Date.now() - 200
      }
    ];

    presenceSimulator = new MockPresenceSimulator();
  });

  afterEach(() => {
    cleanup();
    presenceSimulator.reset();
  });

  describe('Multi-User Cursor Rendering', () => {
    it('should render multiple users cursors correctly', () => {
        const canvasBounds = { width: 800, height: 600 };
        
      render(
          <Stage width={800} height={600}>
            <CursorLayer
              onlineUsers={mockUsers}
            currentUserId="user1" // Alice is current user
              scale={1}
              showCursors={true}
              canvasBounds={canvasBounds}
            />
          </Stage>
        );

      // Should render Bob's and Charlie's cursors (not current user Alice)
      const cursors = screen.getAllByTestId(/cursor-/);
      expect(cursors).toHaveLength(2);
      
      // Verify specific cursors are rendered
      expect(screen.getByTestId('cursor-user2')).toBeDefined(); // Bob
      expect(screen.getByTestId('cursor-user3')).toBeDefined(); // Charlie
      
      // Alice's cursor should NOT be rendered (current user)
      expect(screen.queryByTestId('cursor-user1')).toBeNull();
    });

    it('should handle empty user list', () => {
      const canvasBounds = { width: 800, height: 600 };
      
      render(
        <Stage width={800} height={600}>
          <CursorLayer
            onlineUsers={[]}
            currentUserId="user1"
            scale={1}
            showCursors={true}
            canvasBounds={canvasBounds}
          />
        </Stage>
      );

      // Should render no cursors
      const cursors = screen.queryAllByTestId(/cursor-/);
      expect(cursors).toHaveLength(0);
    });

    it('should filter out current user from rendered cursors', () => {
      const canvasBounds = { width: 800, height: 600 };
      
      render(
        <Stage width={800} height={600}>
          <CursorLayer
            onlineUsers={mockUsers}
            currentUserId="user2" // Bob is current user
            scale={1}
            showCursors={true}
            canvasBounds={canvasBounds}
          />
        </Stage>
      );

      // Should render Alice's and Charlie's cursors (not Bob)
      const cursors = screen.getAllByTestId(/cursor-/);
      expect(cursors).toHaveLength(2);
      
      expect(screen.getByTestId('cursor-user1')).toBeDefined(); // Alice
      expect(screen.getByTestId('cursor-user3')).toBeDefined(); // Charlie
      expect(screen.queryByTestId('cursor-user2')).toBeNull(); // Bob (current user)
    });
  });

  describe('Cursor Component Properties', () => {
    it('should render cursor with all properties', () => {
      render(
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

      const cursor = screen.getByTestId('cursor-test-user');
      expect(cursor).toBeDefined();
    });

    it('should not render when isVisible is false', () => {
      render(
        <Stage width={400} height={300}>
          <Layer>
            <Cursor
              userId="invisible-user"
              displayName="Invisible User"
              cursorColor="#FF6B6B"
              x={100}
              y={150}
              showLabel={true}
              isVisible={false}
              scale={1}
            />
          </Layer>
        </Stage>
      );

      // Should not render when invisible
      expect(screen.queryByTestId('cursor-invisible-user')).toBeNull();
    });

    it('should handle different scale values', () => {
      const scales = [0.5, 1, 2];
      
      scales.forEach(scale => {
        const { unmount } = render(
          <Stage width={400} height={300}>
            <Layer>
              <Cursor
                userId={`scale-test-${scale}`}
                displayName="Scale Test"
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

        expect(screen.getByTestId(`cursor-scale-test-${scale}`)).toBeDefined();
        unmount();
      });
    });
  });

  describe('Cursor Data Validation', () => {
    it('should handle users with missing cursor data', () => {
      const incompleteUsers = [
        {
          id: 'user1',
          displayName: 'Alice',
          cursorColor: '#FF6B6B',
          isOnline: true,
          // Missing cursorPosition
        },
        {
          id: 'user2',
          displayName: 'Bob',
          isOnline: true,
          cursorPosition: { x: 100, y: 100 },
          // Missing cursorColor
        }
      ];

      const canvasBounds = { width: 800, height: 600 };
      
      // Should not crash with incomplete data
      expect(() => {
        render(
          <Stage width={800} height={600}>
          <CursorLayer
              onlineUsers={incompleteUsers}
              currentUserId="user3"
            scale={1}
            showCursors={true}
              canvasBounds={canvasBounds}
          />
        </Stage>
      );
      }).not.toThrow();
    });

    it('should handle users with invalid position data', () => {
      const invalidUsers = [
        {
          id: 'user1',
          displayName: 'Alice',
          cursorColor: '#FF6B6B',
          isOnline: true,
          cursorPosition: { x: null, y: 100 }, // Invalid x
        },
        {
          id: 'user2',
          displayName: 'Bob',
          cursorColor: '#4ECDC4',
          isOnline: true,
          cursorPosition: { x: 100, y: 'invalid' }, // Invalid y
        }
      ];

      const canvasBounds = { width: 800, height: 600 };
      
      // Should handle invalid position data gracefully
      expect(() => {
        render(
          <Stage width={800} height={600}>
            <CursorLayer
              onlineUsers={invalidUsers}
              currentUserId="user3"
              scale={1}
              showCursors={true}
              canvasBounds={canvasBounds}
            />
          </Stage>
        );
      }).not.toThrow();
    });
  });

  describe('Cursor Visibility and Bounds', () => {
    it('should show cursors within canvas bounds', () => {
      const visibleUsers = [
        {
          id: 'visible-user',
          displayName: 'Visible User',
          cursorColor: '#FF6B6B',
          isOnline: true,
          cursorPosition: { x: 100, y: 100 }, // Within bounds
        }
      ];

      const canvasBounds = { width: 800, height: 600 };
      
      render(
        <Stage width={800} height={600}>
          <CursorLayer
            onlineUsers={visibleUsers}
            currentUserId="other-user"
            scale={1}
            showCursors={true}
            canvasBounds={canvasBounds}
          />
        </Stage>
      );

      expect(screen.getByTestId('cursor-visible-user')).toBeDefined();
    });

    it('should handle cursors at extreme coordinates', () => {
      const extremeUsers = [
        {
        id: 'extreme-user',
        displayName: 'Extreme User',
        cursorColor: '#FF6B6B',
        isOnline: true,
          cursorPosition: { x: 99999, y: 99999 }, // Very far out
        }
      ];

      const canvasBounds = { width: 800, height: 600 };
      
      // Should not crash with extreme coordinates
      expect(() => {
        render(
          <Stage width={800} height={600}>
          <CursorLayer
              onlineUsers={extremeUsers}
            currentUserId="other-user"
            scale={1}
            showCursors={true}
              canvasBounds={canvasBounds}
          />
        </Stage>
        );
      }).not.toThrow();
    });
  });

  describe('Cursor Color Assignment', () => {
    it('should ensure all cursors have distinct colors', () => {
      const colors = mockUsers.map(user => user.cursorColor);
      const uniqueColors = new Set(colors);
      
      // All colors should be unique
      expect(uniqueColors.size).toBe(colors.length);
    });

    it('should validate cursor colors are proper hex format', () => {
      mockUsers.forEach(user => {
        expect(user.cursorColor).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });

  describe('Presence Simulation', () => {
    it('should simulate adding users to presence', () => {
      const callback = vi.fn();
      presenceSimulator.onPresenceChange(callback);

      // Add first user
      presenceSimulator.addUser('user1', {
        displayName: 'Alice',
        cursorColor: '#FF6B6B',
        cursorPosition: { x: 100, y: 100 },
        isOnline: true,
        joinedAt: Date.now()
      });

      expect(callback).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'user1',
          displayName: 'Alice',
          isOnline: true
        })
      ]);

      // Add second user
      presenceSimulator.addUser('user2', {
        displayName: 'Bob',
        cursorColor: '#4ECDC4',
        cursorPosition: { x: 200, y: 200 },
        isOnline: true,
        joinedAt: Date.now()
      });

      expect(callback).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'user1' }),
        expect.objectContaining({ id: 'user2' })
      ]);
    });

    it('should simulate removing users from presence', () => {
      const callback = vi.fn();
      presenceSimulator.onPresenceChange(callback);

      // Add users
      presenceSimulator.addUser('user1', { displayName: 'Alice', isOnline: true, joinedAt: Date.now() });
      presenceSimulator.addUser('user2', { displayName: 'Bob', isOnline: true, joinedAt: Date.now() });

      // Remove one user
      presenceSimulator.removeUser('user1');

      expect(callback).toHaveBeenLastCalledWith([
        expect.objectContaining({ id: 'user2' })
      ]);
    });

    it('should simulate cursor position updates', () => {
      const callback = vi.fn();
      presenceSimulator.onPresenceChange(callback);

      // Add user
      presenceSimulator.addUser('user1', {
        displayName: 'Alice',
        cursorPosition: { x: 100, y: 100 },
        isOnline: true,
        joinedAt: Date.now()
      });

      // Update cursor position
      presenceSimulator.updateUserCursor('user1', { x: 150, y: 200 });

      expect(callback).toHaveBeenLastCalledWith([
        expect.objectContaining({
          id: 'user1',
          cursorPosition: { x: 150, y: 200 }
        })
      ]);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete join-move-leave cycle', () => {
      const callback = vi.fn();
      const unsubscribe = presenceSimulator.onPresenceChange(callback);

      // User joins
      presenceSimulator.addUser('user1', {
        displayName: 'Alice',
        cursorColor: '#FF6B6B',
        cursorPosition: { x: 50, y: 50 },
        isOnline: true,
        joinedAt: Date.now()
      });

      expect(callback).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'user1', isOnline: true })
      ]);

      // User moves cursor
      presenceSimulator.updateUserCursor('user1', { x: 100, y: 100 });
      presenceSimulator.updateUserCursor('user1', { x: 200, y: 200 });

      // User goes offline
      presenceSimulator.setUserOffline('user1');

      expect(callback).toHaveBeenLastCalledWith([]);

      // Cleanup
      unsubscribe();
    });

    it('should handle multiple simultaneous users', () => {
      const callback = vi.fn();
      presenceSimulator.onPresenceChange(callback);

      // Add multiple users simultaneously
      const users = ['Alice', 'Bob', 'Charlie'].map((name, i) => ({
        displayName: name,
        cursorColor: `#${(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0')}`,
        cursorPosition: { x: i * 100, y: i * 50 },
        isOnline: true,
        joinedAt: Date.now() + i
      }));

      users.forEach((userData, i) => {
        presenceSimulator.addUser(`user${i + 1}`, userData);
      });

      // All users should be present
      expect(callback).toHaveBeenLastCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'user1' }),
          expect.objectContaining({ id: 'user2' }),
          expect.objectContaining({ id: 'user3' })
        ])
      );

      // Move all cursors
      users.forEach((_, i) => {
        presenceSimulator.updateUserCursor(`user${i + 1}`, { 
          x: (i + 1) * 150, 
          y: (i + 1) * 75 
        });
      });

      // Remove middle user
      presenceSimulator.removeUser('user2');

      expect(callback).toHaveBeenLastCalledWith([
        expect.objectContaining({ id: 'user1' }),
        expect.objectContaining({ id: 'user3' })
      ]);
    });
  });
});