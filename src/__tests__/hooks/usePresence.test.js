/**
 * Unit tests for usePresence hook
 * Tests presence management, user tracking, and state management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePresence } from '../../hooks/usePresence';
import * as firestoreService from '../../services/firestore';

// Mock the firestore service
vi.mock('../../services/firestore', () => ({
  joinCanvas: vi.fn(),
  listenToPresence: vi.fn(),
  startHeartbeat: vi.fn(),
  stopHeartbeat: vi.fn(),
  setUserOffline: vi.fn(),
  removeUserPresence: vi.fn()
}));

describe('usePresence Hook', () => {
  const mockUser = {
    uid: 'test-user-id',
    displayName: 'Test User',
    email: 'test@example.com'
  };

  const mockOnlineUsers = [
    {
      id: 'user1',
      displayName: 'Alice',
      email: 'alice@example.com',
      cursorColor: '#FF0000',
      isOnline: true,
      lastSeen: Date.now(),
      cursorPosition: { x: 100, y: 100 }
    },
    {
      id: 'user2',
      displayName: 'Bob',
      email: 'bob@example.com',
      cursorColor: '#00FF00',
      isOnline: true,
      lastSeen: Date.now(),
      cursorPosition: { x: 200, y: 200 }
    },
    {
      id: 'test-user-id',
      displayName: 'Test User',
      email: 'test@example.com',
      cursorColor: '#0000FF',
      isOnline: true,
      lastSeen: Date.now(),
      cursorPosition: { x: 150, y: 150 }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful canvas join
    firestoreService.joinCanvas.mockResolvedValue({
      cursorColor: '#0000FF'
    });
    
    // Mock presence listener
    firestoreService.listenToPresence.mockImplementation((callback) => {
      // Simulate initial empty state
      callback([]);
      
      // Return unsubscribe function
      return vi.fn();
    });
    
    // Mock heartbeat functions
    firestoreService.startHeartbeat.mockReturnValue('heartbeat-interval');
    firestoreService.stopHeartbeat.mockImplementation(() => {});
    firestoreService.setUserOffline.mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with empty state when no user', () => {
      const { result } = renderHook(() => usePresence(null));

      expect(result.current.onlineUsers).toEqual([]);
      expect(result.current.otherUsers).toEqual([]);
      expect(result.current.currentUserPresence).toBeNull();
      expect(result.current.userCursorColor).toBeNull();
      expect(result.current.isJoining).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.isConnected).toBe(false);
      expect(result.current.onlineCount).toBe(0);
      expect(result.current.otherUsersCount).toBe(0);
    });

    it('should initialize with empty state when user provided', () => {
      const { result } = renderHook(() => usePresence(mockUser));

      expect(result.current.onlineUsers).toEqual([]);
      expect(result.current.isJoining).toBe(true); // Should be true when joining canvas
      expect(result.current.userCursorColor).toBeNull();
      expect(result.current.onlineCount).toBe(0);
      expect(result.current.otherUsersCount).toBe(0);
    });
  });

  describe('Canvas Joining', () => {
    it('should join canvas when user is provided', async () => {
      const { result } = renderHook(() => usePresence(mockUser));

      await act(async () => {
        // Wait for the useEffect to complete
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(firestoreService.joinCanvas).toHaveBeenCalledWith(
        mockUser.uid,
        mockUser
      );
    });

    it('should set cursor color after successful canvas join', async () => {
      const expectedResponse = { cursorColor: '#FF5733' };
      firestoreService.joinCanvas.mockResolvedValue(expectedResponse);

      const { result } = renderHook(() => usePresence(mockUser));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.userCursorColor).toEqual(expectedResponse);
    });

    it('should handle canvas join error gracefully', async () => {
      const error = new Error('Failed to join canvas');
      firestoreService.joinCanvas.mockRejectedValue(error);

      const { result } = renderHook(() => usePresence(mockUser));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.error).toBe(error.message);
      expect(result.current.userCursorColor).toBeNull();
    });
  });

  describe('Presence Listening', () => {
    it('should set up presence listener after joining canvas', async () => {
      const { result } = renderHook(() => usePresence(mockUser));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(firestoreService.listenToPresence).toHaveBeenCalled();
    });

    it('should update online users when presence changes', async () => {
      let presenceCallback;
      firestoreService.listenToPresence.mockImplementation((callback) => {
        presenceCallback = callback;
        return vi.fn();
      });

      const { result } = renderHook(() => usePresence(mockUser));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Simulate presence update
      await act(async () => {
        presenceCallback(mockOnlineUsers);
      });

      expect(result.current.onlineUsers).toEqual(mockOnlineUsers);
      expect(result.current.onlineCount).toBe(3);
    });
  });

  describe('User Filtering and Computed Values', () => {
    it('should correctly filter other users (excluding current user)', async () => {
      let presenceCallback;
      firestoreService.listenToPresence.mockImplementation((callback) => {
        presenceCallback = callback;
        return vi.fn();
      });

      const { result } = renderHook(() => usePresence(mockUser));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        presenceCallback(mockOnlineUsers);
      });

      const otherUsers = result.current.otherUsers;
      expect(otherUsers).toHaveLength(2);
      expect(otherUsers.find(u => u.id === mockUser.uid)).toBeUndefined();
      expect(otherUsers.map(u => u.displayName)).toEqual(['Alice', 'Bob']);
    });

    it('should correctly identify current user presence', async () => {
      let presenceCallback;
      firestoreService.listenToPresence.mockImplementation((callback) => {
        presenceCallback = callback;
        return vi.fn();
      });
      
      firestoreService.joinCanvas.mockResolvedValue({
        cursorColor: '#0000FF'
      });

      const { result } = renderHook(() => usePresence(mockUser));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        presenceCallback(mockOnlineUsers);
      });

      const currentUserPresence = result.current.currentUserPresence;
      expect(currentUserPresence).toBeDefined();
      expect(currentUserPresence.id).toBe(mockUser.uid);
      expect(currentUserPresence.displayName).toBe('Test User');
    });

    it('should return correct counts', async () => {
      let presenceCallback;
      firestoreService.listenToPresence.mockImplementation((callback) => {
        presenceCallback = callback;
        return vi.fn();
      });

      const { result } = renderHook(() => usePresence(mockUser));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        presenceCallback(mockOnlineUsers);
      });

      expect(result.current.onlineCount).toBe(3); // All users
      expect(result.current.otherUsersCount).toBe(2); // Excluding current user
    });
  });

  describe('Cleanup', () => {
    it('should cleanup when user becomes null', async () => {
      const unsubscribeFn = vi.fn();
      firestoreService.listenToPresence.mockReturnValue(unsubscribeFn);

      const { result, rerender } = renderHook(
        ({ user }) => usePresence(user),
        { initialProps: { user: mockUser } }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Change user to null
      await act(async () => {
        rerender({ user: null });
      });

      expect(unsubscribeFn).toHaveBeenCalled();
      expect(firestoreService.setUserOffline).toHaveBeenCalledWith(mockUser.uid);
    });

    it('should cleanup on unmount', async () => {
      const unsubscribeFn = vi.fn();
      firestoreService.listenToPresence.mockReturnValue(unsubscribeFn);

      const { result, unmount } = renderHook(() => usePresence(mockUser));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        unmount();
      });

      expect(unsubscribeFn).toHaveBeenCalled();
      expect(firestoreService.setUserOffline).toHaveBeenCalledWith(mockUser.uid);
    });

    it('should reset state after cleanup', async () => {
      let presenceCallback;
      firestoreService.listenToPresence.mockImplementation((callback) => {
        presenceCallback = callback;
        return vi.fn();
      });

      const { result, rerender } = renderHook(
        ({ user }) => usePresence(user),
        { initialProps: { user: mockUser } }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        presenceCallback(mockOnlineUsers);
      });

      // Verify state is populated
      expect(result.current.onlineUsers).toHaveLength(3);

      // Cleanup by setting user to null
      await act(async () => {
        rerender({ user: null });
      });

      // Verify state is reset
      expect(result.current.onlineUsers).toEqual([]);
      expect(result.current.userCursorColor).toBeNull();
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('Manual Leave Canvas', () => {
    it('should provide leaveCanvas method', () => {
      const { result } = renderHook(() => usePresence(mockUser));
      
      expect(typeof result.current.leaveCanvas).toBe('function');
    });

    it('should cleanup when leaveCanvas is called', async () => {
      const unsubscribeFn = vi.fn();
      firestoreService.listenToPresence.mockReturnValue(unsubscribeFn);

      const { result } = renderHook(() => usePresence(mockUser));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.leaveCanvas();
      });

      expect(unsubscribeFn).toHaveBeenCalled();
      expect(firestoreService.setUserOffline).toHaveBeenCalledWith(mockUser.uid);
      expect(result.current.onlineUsers).toEqual([]);
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty users list', async () => {
      let presenceCallback;
      firestoreService.listenToPresence.mockImplementation((callback) => {
        presenceCallback = callback;
        return vi.fn();
      });

      const { result } = renderHook(() => usePresence(mockUser));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        presenceCallback([]);
      });

      expect(result.current.onlineUsers).toEqual([]);
      expect(result.current.otherUsers).toEqual([]);
      expect(result.current.onlineCount).toBe(0);
      expect(result.current.otherUsersCount).toBe(0);
    });

    it('should handle user without cursor color', async () => {
      const { result } = renderHook(() => usePresence(mockUser));

      expect(result.current.currentUserPresence).toBeNull();
    });

    it('should handle presence listener error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();
      
      firestoreService.listenToPresence.mockImplementation((callback) => {
        throw new Error('Listener setup failed');
      });

      const { result } = renderHook(() => usePresence(mockUser));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.error).toBe('Listener setup failed');
      
      consoleErrorSpy.mockRestore();
    });
  });
});
