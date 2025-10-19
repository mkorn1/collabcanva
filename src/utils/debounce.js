/**
 * Debouncing utility for conflict resolution
 * Handles batching rapid updates to prevent Firestore overload
 */

/**
 * Creates a debounced function that delays execution until after specified time
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds (default: 50ms)
 * @returns {Function} Debounced function with cancel method
 */
export function debounce(func, delay = 50) {
  let timeoutId;
  let lastArgs;
  
  const debouncedFunc = (...args) => {
    lastArgs = args;
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      func.apply(this, lastArgs);
    }, delay);
  };
  
  // Add cancel method to clear pending execution
  debouncedFunc.cancel = () => {
    clearTimeout(timeoutId);
  };
  
  // Add flush method to execute immediately
  debouncedFunc.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      func.apply(this, lastArgs);
    }
  };
  
  return debouncedFunc;
}

/**
 * Write queue manager for batching rapid object updates
 * Prevents Firestore write storms while maintaining responsiveness
 */
export class WriteQueue {
  constructor(flushCallback, debounceDelay = 50) {
    this.pendingWrites = new Map(); // objectId -> updateData
    this.flushCallback = flushCallback;
    this.debounceDelay = debounceDelay;
    
    // Create debounced flush function
    this.debouncedFlush = this.debounce(this._flush.bind(this), debounceDelay);
  }
  
  /**
   * Queue an update for an object
   * @param {string} objectId - Object ID to update
   * @param {Object} updates - Update data to apply
   * @param {number} customDelay - Custom debounce delay (optional)
   */
  queueUpdate(objectId, updates, customDelay = null) {
    console.log('🔧 WRITEQUEUE QUEUE:', objectId, 'updates:', updates, 'delay:', customDelay || this.debounceDelay);
    // Merge with any existing pending updates for this object
    const existing = this.pendingWrites.get(objectId) || {};
    const merged = {
      ...existing,
      ...updates,
      // Ensure we always have fresh metadata
      lastModified: new Date(), // Will be replaced with serverTimestamp() in Firestore
      updatedAt: new Date()
    };
    
    this.pendingWrites.set(objectId, merged);
    console.log('🔧 WRITEQUEUE MERGED:', objectId, 'merged:', merged);
    
    // For now, ignore custom delay and always use the default debounce
    // This ensures consistent behavior and prevents multiple debounced functions
    console.log('🔧 WRITEQUEUE: Using default debounce delay:', this.debounceDelay);
    
    // Trigger debounced flush
    this.debouncedFlush();
  }
  
  /**
   * Force flush all pending writes immediately
   */
  flush() {
    this.debouncedFlush.cancel();
    this._flush();
  }
  
  /**
   * Internal flush implementation
   */
  async _flush() {
    if (this.pendingWrites.size === 0) {
      return;
    }
    
    console.log('🔧 WRITEQUEUE FLUSHING:', this.pendingWrites.size, 'writes');
    for (const [objectId, updates] of this.pendingWrites) {
      console.log('🔧 WRITEQUEUE FLUSH:', objectId, 'updates:', updates);
    }
    
    // Copy and clear the queue
    const writesToProcess = new Map(this.pendingWrites);
    this.pendingWrites.clear();
    
    // Process all writes
    try {
      await this.flushCallback(writesToProcess);
      console.log(`✅ Flushed ${writesToProcess.size} batched updates`);
    } catch (error) {
      console.error('❌ Error flushing batched updates:', error);
      
      // Re-queue failed writes (simple retry strategy)
      for (const [objectId, updates] of writesToProcess) {
        this.pendingWrites.set(objectId, updates);
      }
    }
  }
  
  /**
   * Get number of pending writes
   */
  getPendingCount() {
    return this.pendingWrites.size;
  }
  
  /**
   * Clear all pending writes
   */
  clear() {
    this.debouncedFlush.cancel();
    this.pendingWrites.clear();
  }
  
  /**
   * Basic debounce implementation (avoiding external dependencies)
   */
  debounce(func, delay) {
    let timeoutId;
    
    const debouncedFunc = (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
    
    debouncedFunc.cancel = () => clearTimeout(timeoutId);
    debouncedFunc.flush = () => {
      clearTimeout(timeoutId);
      func.apply(this);
    };
    
    return debouncedFunc;
  }
}

/**
 * Conflict resolver utility
 * Implements last-write-wins strategy using timestamps
 * Enhanced with deletion conflict resolution
 */
export class ConflictResolver {
  /**
   * Resolve conflict between local and remote object states
   * @param {Object} localObject - Current local object state
   * @param {Object} remoteObject - Incoming remote object state
   * @returns {Object} Resolved object state
   */
  static resolve(localObject, remoteObject) {
    // If we don't have a local object, accept the remote one
    if (!localObject) {
      return remoteObject;
    }
    
    // If we don't have a remote object, keep the local one
    if (!remoteObject) {
      return localObject;
    }
    
    // Compare timestamps for last-write-wins
    const localTime = this._getTimestamp(localObject);
    const remoteTime = this._getTimestamp(remoteObject);
    
    console.log(`🔄 Conflict resolution: local=${localTime}, remote=${remoteTime}`);
    
    // If remote is newer (or equal), use remote object
    if (remoteTime >= localTime) {
      console.log('✅ Remote object wins (newer or equal timestamp)');
      return {
        ...remoteObject,
        _conflictResolved: true,
        _lastEditor: remoteObject.lastModifiedByName
      };
    }
    
    // Local object is newer, keep it
    console.log('✅ Local object wins (newer timestamp)');
    return {
      ...localObject,
      _conflictResolved: true,
      _lastEditor: localObject.lastModifiedByName
    };
  }
  
  /**
   * Extract timestamp from object for comparison
   * @param {Object} obj - Object with timestamp data
   * @returns {number} Timestamp in milliseconds
   */
  static _getTimestamp(obj) {
    // Try different timestamp fields (Firestore can have different formats)
    if (obj.lastModified?.toMillis) {
      return obj.lastModified.toMillis(); // Firestore Timestamp
    }
    if (obj.lastModified?.seconds) {
      return obj.lastModified.seconds * 1000; // Firestore Timestamp object
    }
    if (typeof obj.lastModified === 'number') {
      return obj.lastModified; // JavaScript timestamp
    }
    if (obj.updatedAt?.toMillis) {
      return obj.updatedAt.toMillis(); // Fallback to updatedAt
    }
    if (obj.updatedAt?.seconds) {
      return obj.updatedAt.seconds * 1000;
    }
    if (typeof obj.updatedAt === 'number') {
      return obj.updatedAt;
    }
    
    // Fallback to creation time or 0
    return obj.createdAt?.toMillis?.() || obj.createdAt?.seconds * 1000 || 0;
  }
  
  /**
   * Check if an object has conflict resolution metadata
   * @param {Object} obj - Object to check
   * @returns {boolean} True if object has conflict metadata
   */
  static hasConflictMetadata(obj) {
    return !!(obj.lastModified && obj.lastModifiedBy);
  }

  /**
   * Resolve conflict between object edit and deletion intent
   * @param {Object} editUpdate - Object update attempt
   * @param {Object} deletionIntent - Deletion intent from RTDB
   * @returns {Object} Resolution result with action and metadata
   */
  static resolveDeletionConflict(editUpdate, deletionIntent) {
    const editTime = editUpdate.lastModified || Date.now();
    const deleteTime = deletionIntent.timestamp || 0;
    
    console.log(`🔄 Deletion conflict: edit=${editTime}, delete=${deleteTime}`);
    
    if (editTime > deleteTime) {
      console.log('✅ Edit wins - object will be saved');
      return {
        action: 'save',
        object: {
          ...editUpdate,
          _conflictResolved: true,
          _savedFromDeletion: true,
          _lastEditor: editUpdate.lastModifiedByName
        }
      };
    } else {
      console.log('✅ Deletion wins - object will be removed');
      return {
        action: 'delete',
        deletionIntent,
        _conflictResolved: true
      };
    }
  }

  /**
   * Check if an edit should be blocked due to pending deletion
   * @param {string} objectId - Object being edited
   * @param {Array} deletionIntents - Active deletion intents
   * @returns {Object|null} Blocking intent if found, null if edit allowed
   */
  static checkDeletionBlock(objectId, deletionIntents) {
    const blockingIntent = deletionIntents.find(intent => 
      intent.objectId === objectId && 
      intent.status === 'pending' &&
      intent.gracePeriodEnd > Date.now()
    );
    
    if (blockingIntent) {
      console.log('⚠️ Edit blocked - object has pending deletion intent');
      return blockingIntent;
    }
    
    return null;
  }
}

export default {
  debounce,
  WriteQueue,
  ConflictResolver
};
