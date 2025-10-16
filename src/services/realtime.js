// Real-time synchronization service for cursor positions and canvas data
import { updateCursorPosition, listenToPresence } from './firestore';

/**
 * Real-time cursor synchronization manager
 * Handles broadcasting and receiving cursor position updates
 */
class RealtimeCursorSync {
  constructor() {
    this.listeners = new Map(); // Store active listeners
    this.currentUserId = null;
    this.isActive = false;
    this.throttleMap = new Map(); // Throttle outgoing updates per user
    this.lastUpdateTime = 0;
    this.updateInterval = 16; // ~60 FPS (16ms)
    this.presenceUnsubscribe = null;
  }

  /**
   * Initialize real-time cursor sync for a user
   * @param {string} userId - Current user's ID
   * @param {Function} onCursorUpdate - Callback for cursor position updates
   * @returns {Promise<void>}
   */
  async initialize(userId, onCursorUpdate) {
    if (this.isActive && this.currentUserId === userId) {
      console.log('🔄 Cursor sync already active for user:', userId);
      return;
    }

    try {
      console.log('🚀 Initializing real-time cursor sync for user:', userId);
      
      this.currentUserId = userId;
      this.isActive = true;

      // Set up presence listener to get cursor updates
      this.presenceUnsubscribe = listenToPresence((users) => {
        this.handlePresenceUpdate(users, onCursorUpdate);
      });

      console.log('✅ Real-time cursor sync initialized');
    } catch (error) {
      console.error('❌ Error initializing cursor sync:', error);
      throw error;
    }
  }

  /**
   * Handle presence updates and extract cursor positions
   * @param {Array} users - Array of online users with presence data
   * @param {Function} onCursorUpdate - Callback for cursor updates
   */
  handlePresenceUpdate(users, onCursorUpdate) {
    if (!this.isActive || !onCursorUpdate) return;

    try {
      // Filter out current user and extract cursor data
      const otherUserCursors = users
        .filter(user => user.id !== this.currentUserId)
        .filter(user => user.cursorPosition && user.isOnline)
        .map(user => ({
          userId: user.id,
          displayName: user.displayName,
          cursorColor: user.cursorColor,
          position: user.cursorPosition,
          lastSeen: user.lastSeen
        }));

      // Call the update callback with cursor data
      onCursorUpdate(otherUserCursors);
      
    } catch (error) {
      console.error('❌ Error handling presence update:', error);
    }
  }

  /**
   * Broadcast cursor position update (throttled)
   * @param {Object} position - Cursor position {x, y}
   * @returns {Promise<void>}
   */
  async broadcastCursorPosition(position) {
    if (!this.isActive || !this.currentUserId) {
      return;
    }

    const now = Date.now();
    
    // Throttle updates to maintain 60 FPS
    if (now - this.lastUpdateTime < this.updateInterval) {
      return;
    }

    try {
      this.lastUpdateTime = now;
      
      // Update cursor position in Firestore (this will trigger presence updates)
      await updateCursorPosition(this.currentUserId, position);
      
    } catch (error) {
      console.error('❌ Error broadcasting cursor position:', error);
      // Don't throw - cursor sync should be non-blocking
    }
  }

  /**
   * Add a listener for specific cursor events
   * @param {string} event - Event type ('cursorMove', 'cursorEnter', 'cursorLeave')
   * @param {Function} callback - Event callback
   * @returns {Function} Unsubscribe function
   */
  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event).add(callback);
    
    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
      }
    };
  }

  /**
   * Emit an event to all listeners
   * @param {string} event - Event type
   * @param {*} data - Event data
   */
  emit(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in cursor sync listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get current sync status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isActive: this.isActive,
      currentUserId: this.currentUserId,
      listenerCount: Array.from(this.listeners.values())
        .reduce((total, listeners) => total + listeners.size, 0),
      lastUpdateTime: this.lastUpdateTime,
      updateInterval: this.updateInterval
    };
  }

  /**
   * Update sync configuration
   * @param {Object} config - Configuration options
   */
  configure(config = {}) {
    if (config.updateInterval && config.updateInterval > 0) {
      this.updateInterval = config.updateInterval;
      console.log('🔧 Updated cursor sync interval to:', this.updateInterval, 'ms');
    }
  }

  /**
   * Cleanup and stop real-time sync
   */
  cleanup() {
    console.log('🧹 Cleaning up real-time cursor sync...');
    
    this.isActive = false;
    this.currentUserId = null;
    
    // Unsubscribe from presence updates
    if (this.presenceUnsubscribe) {
      this.presenceUnsubscribe();
      this.presenceUnsubscribe = null;
    }
    
    // Clear all listeners
    this.listeners.clear();
    this.throttleMap.clear();
    
    console.log('✅ Real-time cursor sync cleaned up');
  }
}

// Create singleton instance
const realtimeCursorSync = new RealtimeCursorSync();

// Export convenience functions
export async function initializeCursorSync(userId, onCursorUpdate) {
  return realtimeCursorSync.initialize(userId, onCursorUpdate);
}

export async function broadcastCursorPosition(position) {
  return realtimeCursorSync.broadcastCursorPosition(position);
}

export function addCursorListener(event, callback) {
  return realtimeCursorSync.addListener(event, callback);
}

export function getCursorSyncStatus() {
  return realtimeCursorSync.getStatus();
}

export function configureCursorSync(config) {
  return realtimeCursorSync.configure(config);
}

export function cleanupCursorSync() {
  return realtimeCursorSync.cleanup();
}

// Export the class for advanced usage
export { RealtimeCursorSync };

// Export default instance
export default realtimeCursorSync;
