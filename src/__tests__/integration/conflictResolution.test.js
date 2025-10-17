import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConflictResolver, WriteQueue } from '../../utils/debounce.js';

// Mock Firestore services
vi.mock('../../services/firestore.js', () => ({
  updateObject: vi.fn().mockResolvedValue(undefined),
  createObject: vi.fn().mockResolvedValue('mock-id'),
  deleteObject: vi.fn().mockResolvedValue(undefined)
}));

// Mock auth context
const mockUser = {
  uid: 'test-user-123',
  displayName: 'Test User',
  email: 'test@example.com'
};

describe('Conflict Resolution Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Simultaneous Edit Scenarios', () => {
    it('should resolve simultaneous position updates', () => {
      // User A's local state (older)
      const userAObject = {
        id: 'rect-123',
        x: 100,
        y: 150,
        lastModified: 1634567890000,
        lastModifiedBy: 'user-a',
        lastModifiedByName: 'Alice'
      };

      // User B's update (newer - wins)
      const userBObject = {
        id: 'rect-123',
        x: 200,
        y: 250,
        lastModified: 1634567890500,
        lastModifiedBy: 'user-b',
        lastModifiedByName: 'Bob'
      };

      const resolved = ConflictResolver.resolve(userAObject, userBObject);

      expect(resolved.x).toBe(200); // Bob's position wins
      expect(resolved.y).toBe(250);
      expect(resolved._conflictResolved).toBe(true);
      expect(resolved._lastEditor).toBe('Bob');
    });

    it('should handle rapid color changes during movement', () => {
      // Scenario: Alice moves object while Bob changes color
      const aliceMovement = {
        id: 'rect-123',
        x: 300,
        y: 100,
        fill: 'blue', // original color
        lastModified: 1634567890200,
        lastModifiedBy: 'alice',
        lastModifiedByName: 'Alice'
      };

      const bobColorChange = {
        id: 'rect-123',
        x: 100, // original position
        y: 100,
        fill: 'red', // new color
        lastModified: 1634567890100, // earlier timestamp
        lastModifiedBy: 'bob',
        lastModifiedByName: 'Bob'
      };

      const resolved = ConflictResolver.resolve(bobColorChange, aliceMovement);

      // Alice's update is newer, so her changes win
      expect(resolved.x).toBe(300); // Alice's position
      expect(resolved.y).toBe(100);
      expect(resolved.fill).toBe('blue'); // Alice's version of color
      expect(resolved._lastEditor).toBe('Alice');
    });

    it('should handle delete vs edit race condition', () => {
      // User tries to edit while another user deletes
      const editUpdate = {
        id: 'rect-123',
        x: 150,
        lastModified: 1634567890100,
        lastModifiedBy: 'editor',
        lastModifiedByName: 'Editor'
      };

      // Deletion is represented by null/undefined remote object
      const resolved = ConflictResolver.resolve(editUpdate, null);

      // Local edit should be preserved since no remote object
      expect(resolved).toBe(editUpdate);
    });
  });

  describe('Write Queue Performance', () => {
    it('should batch rapid updates efficiently', async () => {
      const batchedUpdates = [];
      const mockFlush = vi.fn().mockImplementation((updates) => {
        batchedUpdates.push(Array.from(updates.entries()));
        return Promise.resolve();
      });

      const writeQueue = new WriteQueue(mockFlush, 50);

      // Simulate rapid editing (15 updates/second)
      const updateInterval = 1000 / 15; // ~67ms between updates
      
      for (let i = 0; i < 10; i++) {
        writeQueue.queueUpdate('rect-123', {
          x: 100 + i * 10,
          y: 200 + i * 5,
          lastModified: Date.now() + i
        });
        
        vi.advanceTimersByTime(updateInterval);
      }

      // Final flush
      vi.advanceTimersByTime(100);

      // Should have batched multiple updates into fewer Firestore calls
      expect(mockFlush).toHaveBeenCalledTimes(1);
      
      const [batchedUpdate] = batchedUpdates[0];
      const [objectId, finalState] = batchedUpdate;
      
      expect(objectId).toBe('rect-123');
      expect(finalState.x).toBe(190); // Final x position
      expect(finalState.y).toBe(245); // Final y position
    });

    it('should handle network disconnection gracefully', async () => {
      let networkConnected = true;
      const mockFlush = vi.fn().mockImplementation(() => {
        if (!networkConnected) {
          return Promise.reject(new Error('Network disconnected'));
        }
        return Promise.resolve();
      });

      const writeQueue = new WriteQueue(mockFlush, 50);

      // Start with successful updates
      writeQueue.queueUpdate('rect-123', { x: 100 });
      vi.advanceTimersByTime(50);
      
      expect(mockFlush).toHaveBeenCalledTimes(1);

      // Simulate network disconnection
      networkConnected = false;
      
      writeQueue.queueUpdate('rect-123', { x: 200 });
      vi.advanceTimersByTime(50);
      
      // Should have attempted the update but failed
      expect(mockFlush).toHaveBeenCalledTimes(2);

      // Reconnect and verify retry behavior
      networkConnected = true;
      
      // Queue should maintain pending updates despite failures
      expect(writeQueue.getPendingCount()).toBeGreaterThan(0);
    });
  });

  describe('Timestamp Conflict Edge Cases', () => {
    it('should handle clock skew between users', () => {
      // User A with slightly fast clock
      const userAObject = {
        id: 'test',
        value: 'A',
        lastModified: Date.now() + 5000, // 5 seconds fast
        lastModifiedByName: 'Alice'
      };

      // User B with correct time but actually edited later
      const userBObject = {
        id: 'test',
        value: 'B',
        lastModified: Date.now(), // "earlier" due to clock skew
        lastModifiedByName: 'Bob'
      };

      const resolved = ConflictResolver.resolve(userBObject, userAObject);

      // Alice wins due to timestamp (even with clock skew)
      expect(resolved.value).toBe('A');
      expect(resolved._lastEditor).toBe('Alice');
    });

    it('should resolve ties consistently', () => {
      const timestamp = 1634567890123;
      
      const objA = {
        id: 'test',
        value: 'A',
        lastModified: timestamp,
        lastModifiedByName: 'Alice'
      };

      const objB = {
        id: 'test',
        value: 'B',
        lastModified: timestamp,
        lastModifiedByName: 'Bob'
      };

      // Test multiple resolutions with same timestamps
      const result1 = ConflictResolver.resolve(objA, objB);
      const result2 = ConflictResolver.resolve(objA, objB);

      // Should be consistent (remote wins on ties)
      expect(result1.value).toBe('B');
      expect(result2.value).toBe('B');
    });
  });

  describe('Visual Feedback Integration', () => {
    it('should mark resolved conflicts for visual feedback', () => {
      const localObj = {
        id: 'test',
        x: 100,
        lastModified: 1634567890000,
        lastModifiedByName: 'Alice'
      };

      const remoteObj = {
        id: 'test', 
        x: 200,
        lastModified: 1634567890123,
        lastModifiedByName: 'Bob'
      };

      const resolved = ConflictResolver.resolve(localObj, remoteObj);

      // Should include visual feedback metadata
      expect(resolved._conflictResolved).toBe(true);
      expect(resolved._lastEditor).toBe('Bob');
      expect(resolved.lastModifiedByName).toBe('Bob');
    });

    it('should preserve conflict metadata through multiple resolutions', () => {
      // Initial conflict
      const obj1 = {
        id: 'test',
        x: 100,
        lastModified: 1000,
        lastModifiedByName: 'Alice'
      };

      const obj2 = {
        id: 'test',
        x: 200, 
        lastModified: 2000,
        lastModifiedByName: 'Bob'
      };

      const firstResolution = ConflictResolver.resolve(obj1, obj2);

      // Subsequent update
      const obj3 = {
        id: 'test',
        x: 300,
        lastModified: 3000,
        lastModifiedByName: 'Charlie'
      };

      const secondResolution = ConflictResolver.resolve(firstResolution, obj3);

      expect(secondResolution._conflictResolved).toBe(true);
      expect(secondResolution._lastEditor).toBe('Charlie');
      expect(secondResolution.x).toBe(300);
    });
  });

  describe('Data Integrity', () => {
    it('should preserve all object properties during conflict resolution', () => {
      const localObj = {
        id: 'rect-123',
        type: 'rectangle',
        x: 100,
        y: 150,
        width: 200,
        height: 100,
        fill: 'blue',
        stroke: 'black',
        strokeWidth: 2,
        opacity: 0.8,
        rotation: 45,
        customProperty: 'test-value',
        lastModified: 1000,
        lastModifiedByName: 'Alice'
      };

      const remoteObj = {
        ...localObj,
        x: 300, // Only position changed
        y: 250,
        lastModified: 2000,
        lastModifiedByName: 'Bob'
      };

      const resolved = ConflictResolver.resolve(localObj, remoteObj);

      // All properties should be preserved
      expect(resolved.type).toBe('rectangle');
      expect(resolved.width).toBe(200);
      expect(resolved.height).toBe(100);
      expect(resolved.fill).toBe('blue');
      expect(resolved.stroke).toBe('black');
      expect(resolved.strokeWidth).toBe(2);
      expect(resolved.opacity).toBe(0.8);
      expect(resolved.rotation).toBe(45);
      expect(resolved.customProperty).toBe('test-value');
      
      // Updated properties
      expect(resolved.x).toBe(300);
      expect(resolved.y).toBe(250);
      expect(resolved._lastEditor).toBe('Bob');
    });

    it('should handle missing metadata gracefully', () => {
      const objWithoutMetadata = {
        id: 'test',
        x: 100,
        y: 200
        // No timestamp or user info
      };

      const objWithMetadata = {
        id: 'test',
        x: 300,
        y: 400,
        lastModified: Date.now(),
        lastModifiedByName: 'Alice'
      };

      const resolved = ConflictResolver.resolve(objWithoutMetadata, objWithMetadata);

      // Object with metadata should win
      expect(resolved.x).toBe(300);
      expect(resolved.y).toBe(400);
      expect(resolved._lastEditor).toBe('Alice');
    });
  });
});

describe('Real-world Scenarios', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should handle collaborative drawing session', async () => {
    // Simulate 3 users collaborating on a canvas
    const updates = [];
    const mockFlush = vi.fn().mockImplementation((writesToProcess) => {
      updates.push(Array.from(writesToProcess.entries()));
      return Promise.resolve();
    });

    const writeQueue = new WriteQueue(mockFlush, 50);

    // User A creates rectangles rapidly
    for (let i = 0; i < 5; i++) {
      writeQueue.queueUpdate(`rect-a-${i}`, {
        type: 'rectangle',
        x: i * 100,
        y: 100,
        width: 80,
        height: 60,
        fill: 'blue',
        lastModifiedBy: 'user-a',
        lastModifiedByName: 'Alice'
      });
    }

    // User B creates circles while A is drawing
    vi.advanceTimersByTime(25); // Overlap with A's drawing
    
    for (let i = 0; i < 3; i++) {
      writeQueue.queueUpdate(`circle-b-${i}`, {
        type: 'circle',
        x: i * 150 + 50,
        y: 300,
        radius: 40,
        fill: 'red',
        lastModifiedBy: 'user-b',
        lastModifiedByName: 'Bob'
      });
    }

    // User C edits existing objects
    vi.advanceTimersByTime(25);
    
    writeQueue.queueUpdate('rect-a-0', {
      fill: 'green', // Color change
      lastModifiedBy: 'user-c',
      lastModifiedByName: 'Charlie'
    });

    // Flush all pending writes
    vi.advanceTimersByTime(100);

    // Verify all updates were batched efficiently
    expect(mockFlush).toHaveBeenCalled();
    expect(updates.length).toBeGreaterThan(0);

    // Check that rapid updates were properly batched
    const totalUpdates = updates.reduce((sum, batch) => sum + batch.length, 0);
    expect(totalUpdates).toBe(9); // 5 rects + 3 circles + 1 edit
  });

  it('should maintain performance under stress', () => {
    const updates = [];
    const mockFlush = vi.fn().mockImplementation((writesToProcess) => {
      updates.push(writesToProcess.size);
      return Promise.resolve();
    });

    const writeQueue = new WriteQueue(mockFlush, 50);

    const startTime = Date.now();

    // Simulate intense collaborative session (100 users, 10 updates each)
    for (let user = 0; user < 100; user++) {
      for (let update = 0; update < 10; update++) {
        writeQueue.queueUpdate(`obj-${user}`, {
          x: Math.random() * 1000,
          y: Math.random() * 1000,
          timestamp: Date.now(),
          lastModifiedBy: `user-${user}`,
          lastModifiedByName: `User ${user}`
        });
      }
      
      // Stagger updates
      if (user % 10 === 0) {
        vi.advanceTimersByTime(5);
      }
    }

    // Final flush
    vi.advanceTimersByTime(100);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Performance requirements
    expect(duration).toBeLessThan(100); // Should complete quickly
    expect(mockFlush).toHaveBeenCalled();
    
    // Should have significantly reduced write operations
    const totalWrites = updates.reduce((sum, count) => sum + count, 0);
    expect(totalWrites).toBeLessThan(500); // Much less than 1000 original updates
  });
});
