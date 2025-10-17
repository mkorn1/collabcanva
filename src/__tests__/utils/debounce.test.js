import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce, WriteQueue, ConflictResolver } from '../../utils/debounce.js';

describe('Debounce Utility', () => {
  let mockFn;
  
  beforeEach(() => {
    mockFn = vi.fn();
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should debounce function calls', () => {
    const debouncedFn = debounce(mockFn, 100);
    
    // Call multiple times rapidly
    debouncedFn('arg1');
    debouncedFn('arg2');
    debouncedFn('arg3');
    
    // Should not have been called yet
    expect(mockFn).not.toHaveBeenCalled();
    
    // Fast forward time
    vi.advanceTimersByTime(100);
    
    // Should be called once with last arguments
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('arg3');
  });

  it('should cancel debounced function', () => {
    const debouncedFn = debounce(mockFn, 100);
    
    debouncedFn('test');
    debouncedFn.cancel();
    
    vi.advanceTimersByTime(100);
    
    expect(mockFn).not.toHaveBeenCalled();
  });

  it('should flush debounced function immediately', () => {
    const debouncedFn = debounce(mockFn, 100);
    
    debouncedFn('immediate');
    debouncedFn.flush();
    
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('immediate');
  });
});

describe('WriteQueue', () => {
  let mockFlushCallback;
  let writeQueue;
  
  beforeEach(() => {
    mockFlushCallback = vi.fn().mockResolvedValue(undefined);
    writeQueue = new WriteQueue(mockFlushCallback, 50);
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should batch multiple updates for same object', () => {
    writeQueue.queueUpdate('obj1', { x: 10 });
    writeQueue.queueUpdate('obj1', { y: 20 });
    writeQueue.queueUpdate('obj1', { fill: 'red' });
    
    // Advance time to trigger flush
    vi.advanceTimersByTime(50);
    
    expect(mockFlushCallback).toHaveBeenCalledTimes(1);
    
    const [[writesToProcess]] = mockFlushCallback.mock.calls;
    const merged = writesToProcess.get('obj1');
    
    expect(merged).toMatchObject({
      x: 10,
      y: 20,
      fill: 'red'
    });
  });

  it('should handle rapid updates without overwhelming callback', () => {
    // Queue 20 rapid updates
    for (let i = 0; i < 20; i++) {
      writeQueue.queueUpdate('obj1', { x: i });
      vi.advanceTimersByTime(5); // 5ms between updates (200 updates/sec)
    }
    
    // Advance time to trigger final flush
    vi.advanceTimersByTime(50);
    
    // Only final batch should be processed
    expect(mockFlushCallback).toHaveBeenCalledTimes(1);
    
    const [[writesToProcess]] = mockFlushCallback.mock.calls;
    expect(writesToProcess.get('obj1').x).toBe(19); // Last update wins
  });

  it('should flush immediately when requested', async () => {
    writeQueue.queueUpdate('obj1', { immediate: true });
    
    await writeQueue.flush();
    
    expect(mockFlushCallback).toHaveBeenCalledTimes(1);
  });

  it('should track pending write count', () => {
    expect(writeQueue.getPendingCount()).toBe(0);
    
    writeQueue.queueUpdate('obj1', { x: 10 });
    writeQueue.queueUpdate('obj2', { y: 20 });
    
    expect(writeQueue.getPendingCount()).toBe(2);
    
    vi.advanceTimersByTime(50);
    
    expect(writeQueue.getPendingCount()).toBe(0);
  });

  it('should clear all pending writes', () => {
    writeQueue.queueUpdate('obj1', { x: 10 });
    writeQueue.queueUpdate('obj2', { y: 20 });
    
    expect(writeQueue.getPendingCount()).toBe(2);
    
    writeQueue.clear();
    
    expect(writeQueue.getPendingCount()).toBe(0);
    
    vi.advanceTimersByTime(50);
    
    expect(mockFlushCallback).not.toHaveBeenCalled();
  });
});

describe('ConflictResolver', () => {
  describe('timestamp extraction', () => {
    it('should extract Firestore timestamp (toMillis)', () => {
      const obj = {
        lastModified: { toMillis: () => 1634567890123 }
      };
      
      const timestamp = ConflictResolver._getTimestamp(obj);
      expect(timestamp).toBe(1634567890123);
    });

    it('should extract Firestore timestamp (seconds)', () => {
      const obj = {
        lastModified: { seconds: 1634567890 }
      };
      
      const timestamp = ConflictResolver._getTimestamp(obj);
      expect(timestamp).toBe(1634567890000);
    });

    it('should extract JavaScript timestamp', () => {
      const obj = {
        lastModified: 1634567890123
      };
      
      const timestamp = ConflictResolver._getTimestamp(obj);
      expect(timestamp).toBe(1634567890123);
    });

    it('should fallback to updatedAt if lastModified missing', () => {
      const obj = {
        updatedAt: { toMillis: () => 1634567890456 }
      };
      
      const timestamp = ConflictResolver._getTimestamp(obj);
      expect(timestamp).toBe(1634567890456);
    });

    it('should return 0 for objects without timestamps', () => {
      const obj = { id: 'test' };
      
      const timestamp = ConflictResolver._getTimestamp(obj);
      expect(timestamp).toBe(0);
    });
  });

  describe('conflict resolution', () => {
    it('should choose remote object when it has newer timestamp', () => {
      const localObj = {
        id: 'test',
        x: 100,
        lastModified: 1634567890000, // older
        lastModifiedByName: 'Alice'
      };
      
      const remoteObj = {
        id: 'test',
        x: 200,
        lastModified: 1634567890123, // newer
        lastModifiedByName: 'Bob'
      };
      
      const result = ConflictResolver.resolve(localObj, remoteObj);
      
      expect(result.x).toBe(200); // Remote value wins
      expect(result._conflictResolved).toBe(true);
      expect(result._lastEditor).toBe('Bob');
    });

    it('should choose local object when it has newer timestamp', () => {
      const localObj = {
        id: 'test',
        x: 100,
        lastModified: 1634567890123, // newer
        lastModifiedByName: 'Alice'
      };
      
      const remoteObj = {
        id: 'test',
        x: 200,
        lastModified: 1634567890000, // older
        lastModifiedByName: 'Bob'
      };
      
      const result = ConflictResolver.resolve(localObj, remoteObj);
      
      expect(result.x).toBe(100); // Local value wins
      expect(result._conflictResolved).toBe(true);
      expect(result._lastEditor).toBe('Alice');
    });

    it('should choose remote object when timestamps are equal', () => {
      const timestamp = 1634567890123;
      
      const localObj = {
        id: 'test',
        x: 100,
        lastModified: timestamp,
        lastModifiedByName: 'Alice'
      };
      
      const remoteObj = {
        id: 'test',
        x: 200,
        lastModified: timestamp,
        lastModifiedByName: 'Bob'
      };
      
      const result = ConflictResolver.resolve(localObj, remoteObj);
      
      expect(result.x).toBe(200); // Remote wins on tie
      expect(result._conflictResolved).toBe(true);
    });

    it('should return remote object when no local object exists', () => {
      const remoteObj = {
        id: 'test',
        x: 200,
        lastModified: 1634567890123,
        lastModifiedByName: 'Bob'
      };
      
      const result = ConflictResolver.resolve(null, remoteObj);
      
      expect(result).toBe(remoteObj);
    });

    it('should return local object when no remote object exists', () => {
      const localObj = {
        id: 'test',
        x: 100,
        lastModified: 1634567890123,
        lastModifiedByName: 'Alice'
      };
      
      const result = ConflictResolver.resolve(localObj, null);
      
      expect(result).toBe(localObj);
    });
  });

  describe('conflict metadata detection', () => {
    it('should detect objects with conflict metadata', () => {
      const obj = {
        id: 'test',
        lastModified: 1634567890123,
        lastModifiedBy: 'user123'
      };
      
      expect(ConflictResolver.hasConflictMetadata(obj)).toBe(true);
    });

    it('should detect objects without conflict metadata', () => {
      const obj = {
        id: 'test',
        x: 100,
        y: 200
      };
      
      expect(ConflictResolver.hasConflictMetadata(obj)).toBe(false);
    });

    it('should require both lastModified and lastModifiedBy', () => {
      const objOnlyTime = {
        id: 'test',
        lastModified: 1634567890123
      };
      
      const objOnlyUser = {
        id: 'test',
        lastModifiedBy: 'user123'
      };
      
      expect(ConflictResolver.hasConflictMetadata(objOnlyTime)).toBe(false);
      expect(ConflictResolver.hasConflictMetadata(objOnlyUser)).toBe(false);
    });
  });
});

describe('Performance Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should handle 100+ rapid updates efficiently', () => {
    const mockCallback = vi.fn().mockResolvedValue(undefined);
    const writeQueue = new WriteQueue(mockCallback, 50);
    
    // Simulate 100 rapid updates (1000 updates/second)
    const updateCount = 100;
    for (let i = 0; i < updateCount; i++) {
      writeQueue.queueUpdate(`obj${i % 10}`, { x: i, timestamp: Date.now() });
      vi.advanceTimersByTime(1);
    }
    
    // Advance time to flush all writes
    vi.advanceTimersByTime(50);
    
    // Should have batched updates efficiently (much fewer calls than updates)
    expect(mockCallback.mock.calls.length).toBeLessThan(updateCount / 2);
    expect(writeQueue.getPendingCount()).toBe(0);
    
    // Verify batching worked - should have 10 objects with final states
    const lastCall = mockCallback.mock.calls[mockCallback.mock.calls.length - 1];
    const [writesToProcess] = lastCall;
    expect(writesToProcess.size).toBeLessThanOrEqual(10); // Max 10 objects
  });

  it('should maintain memory efficiency during stress test', () => {
    const mockCallback = vi.fn().mockResolvedValue(undefined);
    const writeQueue = new WriteQueue(mockCallback, 50);
    
    // Simulate memory stress test
    const initialMemory = process.memoryUsage().heapUsed;
    
    for (let i = 0; i < 1000; i++) {
      writeQueue.queueUpdate('stress-test', {
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        data: new Array(100).fill(i) // Some payload
      });
      
      if (i % 100 === 0) {
        vi.advanceTimersByTime(50); // Periodic flush
      }
    }
    
    // Final flush
    vi.advanceTimersByTime(50);
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be reasonable (< 10MB for stress test)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    expect(writeQueue.getPendingCount()).toBe(0);
  });
});
