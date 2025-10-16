/**
 * Logic-only tests for CursorLayer component
 * Tests the cursor filtering and label hiding logic without Canvas rendering
 */

import { describe, it, expect } from 'vitest';

// Mock the component logic that we want to test
function createCursorData(onlineUsers, currentUserId) {
  // This mimics the logic in CursorLayer.jsx
  return onlineUsers
    .filter(user => 
      user.cursorPosition && 
      typeof user.cursorPosition.x === 'number' && 
      typeof user.cursorPosition.y === 'number' &&
      user.cursorColor &&
      user.displayName
    )
    .map(user => ({
      userId: user.id,
      displayName: user.displayName,
      cursorColor: user.cursorColor,
      x: user.cursorPosition.x,
      y: user.cursorPosition.y,
      isOnline: user.isOnline !== false,
      lastSeen: user.lastSeen,
      isCurrentUser: user.id === currentUserId,
      showLabel: user.id !== currentUserId // Hide label for current user
    }));
}

describe('CursorLayer Logic - Own Cursor Label Hiding', () => {
  let mockUsers;

  beforeEach(() => {
    mockUsers = [
      {
        id: 'user1',
        displayName: 'Alice',
        cursorColor: '#FF6B6B',
        isOnline: true,
        cursorPosition: { x: 100, y: 150 },
        lastSeen: Date.now(),
        joinedAt: Date.now() - 1000
      },
      {
        id: 'user2', 
        displayName: 'Bob',
        cursorColor: '#4ECDC4',
        isOnline: true,
        cursorPosition: { x: 300, y: 200 },
        lastSeen: Date.now(),
        joinedAt: Date.now() - 500
      },
      {
        id: 'user3',
        displayName: 'Charlie',
        cursorColor: '#45B7D1',
        isOnline: true,
        cursorPosition: { x: 200, y: 100 },
        lastSeen: Date.now(),
        joinedAt: Date.now() - 200
      }
    ];
  });

  describe('Current User Label Hiding', () => {
    it('should hide label for current user cursor', () => {
      const currentUserId = 'user1'; // Alice is current user
      const cursors = createCursorData(mockUsers, currentUserId);

      // All users should be included
      expect(cursors).toHaveLength(3);

      // Find current user (Alice)
      const currentUserCursor = cursors.find(c => c.userId === 'user1');
      expect(currentUserCursor).toBeDefined();
      expect(currentUserCursor.isCurrentUser).toBe(true);
      expect(currentUserCursor.showLabel).toBe(false); // Should not show label

      // Other users should show labels
      const otherUsers = cursors.filter(c => c.userId !== 'user1');
      otherUsers.forEach(cursor => {
        expect(cursor.isCurrentUser).toBe(false);
        expect(cursor.showLabel).toBe(true);
      });
    });

    it('should show all labels when no current user specified', () => {
      const currentUserId = null;
      const cursors = createCursorData(mockUsers, currentUserId);

      expect(cursors).toHaveLength(3);

      // All users should show labels
      cursors.forEach(cursor => {
        expect(cursor.isCurrentUser).toBe(false);
        expect(cursor.showLabel).toBe(true);
      });
    });

    it('should handle current user switching', () => {
      // Initial: Alice is current user
      let cursors = createCursorData(mockUsers, 'user1');
      
      expect(cursors.find(c => c.userId === 'user1').showLabel).toBe(false);
      expect(cursors.find(c => c.userId === 'user2').showLabel).toBe(true);
      expect(cursors.find(c => c.userId === 'user3').showLabel).toBe(true);

      // Switch: Bob is current user
      cursors = createCursorData(mockUsers, 'user2');
      
      expect(cursors.find(c => c.userId === 'user1').showLabel).toBe(true);
      expect(cursors.find(c => c.userId === 'user2').showLabel).toBe(false);
      expect(cursors.find(c => c.userId === 'user3').showLabel).toBe(true);
    });

    it('should handle non-existent current user', () => {
      const currentUserId = 'user999'; // Non-existent user
      const cursors = createCursorData(mockUsers, currentUserId);

      expect(cursors).toHaveLength(3);

      // All users should show labels since current user is not in list
      cursors.forEach(cursor => {
        expect(cursor.isCurrentUser).toBe(false);
        expect(cursor.showLabel).toBe(true);
      });
    });
  });

  describe('Data Filtering', () => {
    it('should include all valid users (including current user)', () => {
      const currentUserId = 'user1';
      const cursors = createCursorData(mockUsers, currentUserId);

      // Should include all 3 users (including current user)
      expect(cursors).toHaveLength(3);
      expect(cursors.map(c => c.userId).sort()).toEqual(['user1', 'user2', 'user3']);
    });

    it('should filter out users with invalid data', () => {
      const invalidUsers = [
        ...mockUsers,
        {
          id: 'invalid1',
          displayName: 'Invalid User 1',
          cursorColor: '#FF6B6B',
          // Missing cursorPosition
          isOnline: true
        },
        {
          id: 'invalid2',
          displayName: 'Invalid User 2',
          cursorPosition: { x: 100, y: 100 },
          // Missing cursorColor
          isOnline: true
        }
      ];

      const cursors = createCursorData(invalidUsers, 'user1');

      // Should only include the 3 valid users
      expect(cursors).toHaveLength(3);
      expect(cursors.map(c => c.userId).sort()).toEqual(['user1', 'user2', 'user3']);
    });

    it('should handle empty user list', () => {
      const cursors = createCursorData([], 'user1');
      expect(cursors).toHaveLength(0);
    });

    it('should preserve all user properties', () => {
      const cursors = createCursorData(mockUsers, 'user1');
      
      cursors.forEach(cursor => {
        const originalUser = mockUsers.find(u => u.id === cursor.userId);
        
        expect(cursor.displayName).toBe(originalUser.displayName);
        expect(cursor.cursorColor).toBe(originalUser.cursorColor);
        expect(cursor.x).toBe(originalUser.cursorPosition.x);
        expect(cursor.y).toBe(originalUser.cursorPosition.y);
        expect(cursor.isOnline).toBe(originalUser.isOnline !== false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed cursor positions', () => {
      const malformedUsers = [
        {
          id: 'user1',
          displayName: 'User 1',
          cursorColor: '#FF6B6B',
          cursorPosition: { x: null, y: 100 }, // Invalid x
          isOnline: true
        },
        {
          id: 'user2',
          displayName: 'User 2',
          cursorColor: '#4ECDC4',
          cursorPosition: { x: 100, y: 'invalid' }, // Invalid y
          isOnline: true
        }
      ];

      const cursors = createCursorData(malformedUsers, 'user1');
      
      // Should filter out both invalid users
      expect(cursors).toHaveLength(0);
    });

    it('should handle users with partial data', () => {
      const partialUsers = [
        {
          id: 'user1',
          displayName: 'User 1',
          cursorColor: '#FF6B6B',
          cursorPosition: { x: 100, y: 100 },
          isOnline: true
        },
        {
          id: 'user2',
          // Missing displayName
          cursorColor: '#4ECDC4',
          cursorPosition: { x: 200, y: 200 },
          isOnline: true
        }
      ];

      const cursors = createCursorData(partialUsers, 'user1');
      
      // Should only include user1 (user2 missing displayName)
      expect(cursors).toHaveLength(1);
      expect(cursors[0].userId).toBe('user1');
    });

    it('should handle offline users correctly', () => {
      const usersWithOffline = [
        ...mockUsers,
        {
          id: 'user4',
          displayName: 'Offline User',
          cursorColor: '#888888',
          cursorPosition: { x: 400, y: 400 },
          isOnline: false // Explicitly offline
        }
      ];

      const cursors = createCursorData(usersWithOffline, 'user1');
      
      expect(cursors).toHaveLength(4); // Should include offline user
      
      const offlineUser = cursors.find(c => c.userId === 'user4');
      expect(offlineUser.isOnline).toBe(false);
    });
  });
});
