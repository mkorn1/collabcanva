import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConflictResolver } from '../../utils/debounce.js';

describe('Deletion Conflict Resolution', () => {
  describe('resolveDeletionConflict', () => {
    it('should save object when edit is newer than deletion intent', () => {
      const editUpdate = {
        id: 'rect-123',
        x: 200,
        y: 300,
        lastModified: 1634567890500, // newer
        lastModifiedByName: 'Alice'
      };

      const deletionIntent = {
        objectId: 'rect-123',
        userId: 'user-bob',
        userName: 'Bob',
        timestamp: 1634567890000, // older
        status: 'pending'
      };

      const result = ConflictResolver.resolveDeletionConflict(editUpdate, deletionIntent);

      expect(result.action).toBe('save');
      expect(result.object.x).toBe(200);
      expect(result.object.y).toBe(300);
      expect(result.object._conflictResolved).toBe(true);
      expect(result.object._savedFromDeletion).toBe(true);
      expect(result.object._lastEditor).toBe('Alice');
    });

    it('should delete object when deletion intent is newer than edit', () => {
      const editUpdate = {
        id: 'rect-123',
        x: 200,
        y: 300,
        lastModified: 1634567890000, // older
        lastModifiedByName: 'Alice'
      };

      const deletionIntent = {
        objectId: 'rect-123',
        userId: 'user-bob', 
        userName: 'Bob',
        timestamp: 1634567890500, // newer
        status: 'pending'
      };

      const result = ConflictResolver.resolveDeletionConflict(editUpdate, deletionIntent);

      expect(result.action).toBe('delete');
      expect(result.deletionIntent.userName).toBe('Bob');
      expect(result._conflictResolved).toBe(true);
    });

    it('should handle missing timestamps gracefully', () => {
      const editUpdate = {
        id: 'rect-123',
        x: 200,
        // No lastModified timestamp
        lastModifiedByName: 'Alice'
      };

      const deletionIntent = {
        objectId: 'rect-123',
        userId: 'user-bob',
        userName: 'Bob',
        timestamp: 1634567890000,
        status: 'pending'
      };

      const result = ConflictResolver.resolveDeletionConflict(editUpdate, deletionIntent);

      // Edit without timestamp should win (uses Date.now())
      expect(result.action).toBe('save');
      expect(result.object._savedFromDeletion).toBe(true);
    });
  });

  describe('checkDeletionBlock', () => {
    const mockDeletionIntents = [
      {
        id: 'intent-1',
        objectId: 'rect-123',
        userId: 'user-bob',
        userName: 'Bob',
        status: 'pending',
        gracePeriodEnd: Date.now() + 1000 // Still active
      },
      {
        id: 'intent-2', 
        objectId: 'rect-456',
        userId: 'user-charlie',
        userName: 'Charlie',
        status: 'pending',
        gracePeriodEnd: Date.now() - 1000 // Expired
      },
      {
        id: 'intent-3',
        objectId: 'rect-789',
        userId: 'user-dave',
        userName: 'Dave',
        status: 'confirmed', // Already processed
        gracePeriodEnd: Date.now() + 1000
      }
    ];

    it('should block edit when object has active deletion intent', () => {
      const blockingIntent = ConflictResolver.checkDeletionBlock('rect-123', mockDeletionIntents);
      
      expect(blockingIntent).not.toBeNull();
      expect(blockingIntent.userName).toBe('Bob');
      expect(blockingIntent.status).toBe('pending');
    });

    it('should allow edit when deletion intent is expired', () => {
      const blockingIntent = ConflictResolver.checkDeletionBlock('rect-456', mockDeletionIntents);
      
      expect(blockingIntent).toBeNull();
    });

    it('should allow edit when deletion intent is already confirmed', () => {
      const blockingIntent = ConflictResolver.checkDeletionBlock('rect-789', mockDeletionIntents);
      
      expect(blockingIntent).toBeNull();
    });

    it('should allow edit when object has no deletion intents', () => {
      const blockingIntent = ConflictResolver.checkDeletionBlock('rect-999', mockDeletionIntents);
      
      expect(blockingIntent).toBeNull();
    });

    it('should handle empty deletion intents array', () => {
      const blockingIntent = ConflictResolver.checkDeletionBlock('rect-123', []);
      
      expect(blockingIntent).toBeNull();
    });
  });

  describe('Real-world deletion conflict scenarios', () => {
    it('should handle simultaneous edit and delete', () => {
      // User A starts editing
      const editStart = Date.now();
      
      // User B requests deletion 100ms later
      const deletionStart = editStart + 100;
      
      // User A finishes editing 200ms after they started
      const editFinish = editStart + 200;
      
      const editUpdate = {
        id: 'rect-123',
        x: 250,
        y: 350,
        lastModified: editFinish,
        lastModifiedByName: 'Alice'
      };
      
      const deletionIntent = {
        objectId: 'rect-123',
        timestamp: deletionStart,
        userName: 'Bob',
        status: 'pending'
      };
      
      const result = ConflictResolver.resolveDeletionConflict(editUpdate, deletionIntent);
      
      // Alice's edit should win because she finished after Bob requested deletion
      expect(result.action).toBe('save');
      expect(result.object._savedFromDeletion).toBe(true);
    });

    it('should handle rapid edit attempts during deletion grace period', () => {
      const deletionTime = Date.now();
      const gracePeriodEnd = deletionTime + 500;
      
      const deletionIntents = [{
        objectId: 'rect-123',
        timestamp: deletionTime,
        userName: 'Bob',
        status: 'pending',
        gracePeriodEnd: gracePeriodEnd
      }];
      
      // Edit attempt during grace period
      const editAttempt1 = deletionTime + 100; // Within grace period
      const editAttempt2 = deletionTime + 600; // After grace period
      
      // Should block edit during grace period
      const block1 = ConflictResolver.checkDeletionBlock('rect-123', deletionIntents);
      expect(block1).not.toBeNull();
      
      // Update grace period to simulate time passing
      deletionIntents[0].gracePeriodEnd = Date.now() - 100;
      
      // Should allow edit after grace period
      const block2 = ConflictResolver.checkDeletionBlock('rect-123', deletionIntents);
      expect(block2).toBeNull();
    });

    it('should preserve all object properties when saving from deletion', () => {
      const complexObject = {
        id: 'complex-rect',
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 75,
        fill: 'blue',
        stroke: 'red',
        strokeWidth: 2,
        opacity: 0.8,
        rotation: 45,
        customData: { layer: 'foreground', tags: ['important'] },
        lastModified: Date.now(),
        lastModifiedByName: 'Alice'
      };

      const deletionIntent = {
        objectId: 'complex-rect',
        timestamp: Date.now() - 100, // older
        userName: 'Bob'
      };

      const result = ConflictResolver.resolveDeletionConflict(complexObject, deletionIntent);

      expect(result.action).toBe('save');
      expect(result.object.type).toBe('rectangle');
      expect(result.object.width).toBe(150);
      expect(result.object.height).toBe(75);
      expect(result.object.fill).toBe('blue');
      expect(result.object.stroke).toBe('red');
      expect(result.object.strokeWidth).toBe(2);
      expect(result.object.opacity).toBe(0.8);
      expect(result.object.rotation).toBe(45);
      expect(result.object.customData).toEqual({ layer: 'foreground', tags: ['important'] });
      expect(result.object._savedFromDeletion).toBe(true);
      expect(result.object._lastEditor).toBe('Alice');
    });
  });
});
