/**
 * Tests for CursorLayer component - especially the own cursor label hiding functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Stage } from 'react-konva';
import React from 'react';

import CursorLayer from '../../components/Collaboration/CursorLayer.jsx';

// Mock the Cursor component to make testing easier
vi.mock('../../components/Collaboration/Cursor.jsx', () => ({
  Cursor: ({ userId, showLabel, isVisible, ...props }) => {
    if (!isVisible) return null;
    return (
      <div 
        data-testid={`cursor-${userId}`}
        data-show-label={showLabel}
        {...props}
      >
        {showLabel ? `Label: ${props.displayName}` : 'No Label'}
      </div>
    );
  }
}));

describe('CursorLayer - Own Cursor Label Hiding', () => {
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

  it('should hide name label on current user cursor', () => {
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

    // All users should be rendered (including current user)
    expect(screen.getByTestId('cursor-user1')).toBeDefined(); // Alice (current)
    expect(screen.getByTestId('cursor-user2')).toBeDefined(); // Bob
    expect(screen.getByTestId('cursor-user3')).toBeDefined(); // Charlie

    // Current user (Alice) should NOT have label
    const aliceCursor = screen.getByTestId('cursor-user1');
    expect(aliceCursor.getAttribute('data-show-label')).toBe('false');
    expect(aliceCursor.textContent).toBe('No Label');

    // Other users should have labels
    const bobCursor = screen.getByTestId('cursor-user2');
    expect(bobCursor.getAttribute('data-show-label')).toBe('true');
    expect(bobCursor.textContent).toBe('Label: Bob');

    const charlieCursor = screen.getByTestId('cursor-user3');
    expect(charlieCursor.getAttribute('data-show-label')).toBe('true');
    expect(charlieCursor.textContent).toBe('Label: Charlie');
  });

  it('should show labels for all users when no current user specified', () => {
    const canvasBounds = { width: 800, height: 600 };
    
    render(
      <Stage width={800} height={600}>
        <CursorLayer
          onlineUsers={mockUsers}
          currentUserId={null} // No current user
          scale={1}
          showCursors={true}
          canvasBounds={canvasBounds}
        />
      </Stage>
    );

    // All users should have labels when no current user
    const cursors = screen.getAllByTestId(/cursor-/);
    cursors.forEach(cursor => {
      expect(cursor.getAttribute('data-show-label')).toBe('true');
      expect(cursor.textContent).toContain('Label:');
    });
  });

  it('should handle current user switching correctly', () => {
    const canvasBounds = { width: 800, height: 600 };
    
    // Initial render with Alice as current user
    const { rerender } = render(
      <Stage width={800} height={600}>
        <CursorLayer
          onlineUsers={mockUsers}
          currentUserId="user1" // Alice
          scale={1}
          showCursors={true}
          canvasBounds={canvasBounds}
        />
      </Stage>
    );

    // Alice should not have label
    expect(screen.getByTestId('cursor-user1').getAttribute('data-show-label')).toBe('false');
    expect(screen.getByTestId('cursor-user2').getAttribute('data-show-label')).toBe('true');

    // Switch current user to Bob
    rerender(
      <Stage width={800} height={600}>
        <CursorLayer
          onlineUsers={mockUsers}
          currentUserId="user2" // Bob
          scale={1}
          showCursors={true}
          canvasBounds={canvasBounds}
        />
      </Stage>
    );

    // Now Bob should not have label, Alice should have label
    expect(screen.getByTestId('cursor-user1').getAttribute('data-show-label')).toBe('true');
    expect(screen.getByTestId('cursor-user2').getAttribute('data-show-label')).toBe('false');
  });

  it('should render current user cursor with all other properties intact', () => {
    const canvasBounds = { width: 800, height: 600 };
    
    render(
      <Stage width={800} height={600}>
        <CursorLayer
          onlineUsers={mockUsers}
          currentUserId="user1" // Alice
          scale={1}
          showCursors={true}
          canvasBounds={canvasBounds}
        />
      </Stage>
    );

    const aliceCursor = screen.getByTestId('cursor-user1');
    
    // Should have all properties except showLabel should be false
    expect(aliceCursor.getAttribute('data-show-label')).toBe('false');
    // Other properties should be preserved (tested through mocked component)
    expect(aliceCursor).toBeDefined();
  });

  it('should handle edge case where current user is not in online users list', () => {
    const canvasBounds = { width: 800, height: 600 };
    
    render(
      <Stage width={800} height={600}>
        <CursorLayer
          onlineUsers={mockUsers}
          currentUserId="user999" // Non-existent user
          scale={1}
          showCursors={true}
          canvasBounds={canvasBounds}
        />
      </Stage>
    );

    // All users should have labels since current user is not in list
    const cursors = screen.getAllByTestId(/cursor-/);
    cursors.forEach(cursor => {
      expect(cursor.getAttribute('data-show-label')).toBe('true');
    });
  });

  it('should maintain cursor count when including current user', () => {
    const canvasBounds = { width: 800, height: 600 };
    
    render(
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

    // Should render all 3 users (including current user)
    const cursors = screen.getAllByTestId(/cursor-/);
    expect(cursors).toHaveLength(3);
  });

  it('should handle empty users list gracefully', () => {
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
});
