/**
 * Mock implementations for Firebase services used in testing
 */

import { vi } from 'vitest';

// Mock Firebase Auth
export const mockFirebaseAuth = {
  currentUser: {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
  },
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
};

// Mock Firebase Realtime Database
export const mockFirebaseDatabase = {
  ref: vi.fn(() => ({
    set: vi.fn(),
    update: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    once: vi.fn(),
    push: vi.fn(),
    remove: vi.fn(),
  })),
  onDisconnect: vi.fn(() => ({
    remove: vi.fn(),
    set: vi.fn(),
  })),
};

// Mock Firebase Firestore
export const mockFirebaseFirestore = {
  collection: vi.fn(() => ({
    doc: vi.fn(() => ({
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      onSnapshot: vi.fn(),
    })),
    add: vi.fn(),
    get: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
  })),
  doc: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    onSnapshot: vi.fn(),
  })),
};

// Mock presence data factory
export function createMockPresenceData(count = 2) {
  const users = [];
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFEAA7', '#FF8C94'];
  
  for (let i = 0; i < count; i++) {
    users.push({
      id: `user${i + 1}`,
      displayName: `User ${i + 1}`,
      email: `user${i + 1}@test.com`,
      cursorColor: colors[i % colors.length],
      isOnline: true,
      cursorPosition: { 
        x: 100 + (i * 50), 
        y: 150 + (i * 30) 
      },
      lastSeen: Date.now(),
      joinedAt: Date.now() - (1000 * i),
    });
  }
  
  return users;
}

// Mock cursor position factory
export function createMockCursorPosition(x = 100, y = 100) {
  return { x, y };
}

// Mock Firebase error factory
export function createMockFirebaseError(code = 'permission-denied', message = 'Permission denied') {
  const error = new Error(message);
  error.code = code;
  return error;
}

// Mock user factory
export function createMockUser(overrides = {}) {
  return {
    uid: 'mock-user-id',
    email: 'mock@example.com',
    displayName: 'Mock User',
    cursorColor: '#FF6B6B',
    isOnline: true,
    lastSeen: new Date().toISOString(),
    ...overrides,
  };
}

// Utility to simulate presence updates
export class MockPresenceSimulator {
  constructor() {
    this.users = new Map();
    this.callbacks = new Set();
  }

  addUser(userId, userData) {
    this.users.set(userId, { ...userData, id: userId });
    this.notifyCallbacks();
  }

  removeUser(userId) {
    this.users.delete(userId);
    this.notifyCallbacks();
  }

  updateUserCursor(userId, position) {
    if (this.users.has(userId)) {
      const user = this.users.get(userId);
      user.cursorPosition = position;
      user.lastSeen = Date.now();
      this.notifyCallbacks();
    }
  }

  setUserOffline(userId) {
    if (this.users.has(userId)) {
      const user = this.users.get(userId);
      user.isOnline = false;
      user.lastSeen = Date.now();
      this.notifyCallbacks();
    }
  }

  onPresenceChange(callback) {
    this.callbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  notifyCallbacks() {
    const onlineUsers = Array.from(this.users.values())
      .filter(user => user.isOnline)
      .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
      
    this.callbacks.forEach(callback => {
      callback(onlineUsers);
    });
  }

  reset() {
    this.users.clear();
    this.callbacks.clear();
  }
}

// Global mock simulator instance for tests
export const mockPresenceSimulator = new MockPresenceSimulator();
