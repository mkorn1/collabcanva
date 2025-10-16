// Hook that combines cursor tracking with real-time synchronization
import { useState, useEffect, useCallback, useRef } from 'react';
import { useCursor } from './useCursor';
import { 
  initializeCursorSync, 
  broadcastCursorPosition, 
  cleanupCursorSync 
} from '../services/realtime';
import { createBroadcastThrottle } from '../utils/throttle';

/**
 * Hook that provides real-time cursor synchronization
 * Combines local cursor tracking with real-time broadcasting and receiving
 * @param {Object} user - Current authenticated user
 * @param {boolean} isActive - Whether cursor sync should be active
 * @returns {Object} Real-time cursor state and methods
 */
export function useRealtimeCursor(user, isActive = true) {
  const [otherCursors, setOtherCursors] = useState([]);
  const [syncStatus, setSyncStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected', 'error'
  const [error, setError] = useState(null);
  
  // Refs for cleanup and status tracking
  const isInitializedRef = useRef(false);
  const lastBroadcastRef = useRef(0);
  const broadcastThrottleRef = useRef(null);
  const broadcastThrottle = 16; // 60 FPS throttling
  
  // Use the cursor tracking hook
  const cursorTracking = useCursor(user, isActive);

  /**
   * Handle incoming cursor updates from other users
   */
  const handleCursorUpdates = useCallback((cursors) => {
    setOtherCursors(cursors);
  }, []);

  /**
   * Initialize broadcast throttling
   */
  useEffect(() => {
    if (!broadcastThrottleRef.current) {
      broadcastThrottleRef.current = createBroadcastThrottle(async (position) => {
        if (!user || !isActive || syncStatus !== 'connected') {
          return;
        }

        try {
          lastBroadcastRef.current = Date.now();
          await broadcastCursorPosition(position);
        } catch (error) {
          console.error('❌ Error broadcasting cursor position:', error);
          setError(error.message);
        }
      }, {
        interval: broadcastThrottle,
        maxWait: 100 // Guarantee broadcast within 100ms
      });
    }

    return () => {
      if (broadcastThrottleRef.current) {
        broadcastThrottleRef.current.destroy();
        broadcastThrottleRef.current = null;
      }
    };
  }, [user, isActive, syncStatus]);

  /**
   * Broadcast current cursor position with advanced throttling
   */
  const broadcastPosition = useCallback((position) => {
    if (broadcastThrottleRef.current) {
      broadcastThrottleRef.current.execute(position);
    }
  }, []);

  /**
   * Enhanced cursor position update that includes broadcasting
   */
  const updatePosition = useCallback((position) => {
    // Update local cursor position
    cursorTracking.updatePosition(position);
    
    // Broadcast to other users
    broadcastPosition(position);
  }, [cursorTracking, broadcastPosition]);

  /**
   * Initialize real-time cursor sync
   */
  const initializeSync = useCallback(async () => {
    if (!user || !isActive || isInitializedRef.current) {
      return;
    }

    try {
      setSyncStatus('connecting');
      setError(null);
      
      console.log('🔄 Initializing real-time cursor sync...');
      
      await initializeCursorSync(user.uid, handleCursorUpdates);
      
      isInitializedRef.current = true;
      setSyncStatus('connected');
      
      console.log('✅ Real-time cursor sync connected');
      
    } catch (error) {
      console.error('❌ Error initializing cursor sync:', error);
      setSyncStatus('error');
      setError(error.message);
      isInitializedRef.current = false;
    }
  }, [user, isActive, handleCursorUpdates]);

  /**
   * Cleanup real-time sync
   */
  const cleanupSync = useCallback(() => {
    if (isInitializedRef.current) {
      console.log('🧹 Cleaning up real-time cursor sync...');
      cleanupCursorSync();
      isInitializedRef.current = false;
      setSyncStatus('disconnected');
      setOtherCursors([]);
      setError(null);
    }
  }, []);

  // Initialize sync when user becomes available
  useEffect(() => {
    if (user && isActive) {
      initializeSync();
    } else {
      cleanupSync();
    }

    return cleanupSync;
  }, [user, isActive, initializeSync, cleanupSync]);

  // Enhanced mouse event handlers that include broadcasting
  const handleMouseMove = useCallback((event) => {
    cursorTracking.handleMouseMove(event);
    
    if (user && isActive && syncStatus === 'connected') {
      const container = event.currentTarget;
      const rect = container.getBoundingClientRect();
      const position = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      
      // Throttled broadcast
      broadcastPosition(position);
    }
  }, [cursorTracking, user, isActive, syncStatus, broadcastPosition]);

  const handleMouseEnter = useCallback((event) => {
    cursorTracking.handleMouseEnter(event);
    
    if (user && isActive && syncStatus === 'connected') {
      const container = event.currentTarget;
      const rect = container.getBoundingClientRect();
      const position = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      
      broadcastPosition(position);
    }
  }, [cursorTracking, user, isActive, syncStatus, broadcastPosition]);

  const handleMouseLeave = useCallback(() => {
    cursorTracking.handleMouseLeave();
    // Note: We don't broadcast on mouse leave to avoid unnecessary updates
  }, [cursorTracking]);

  /**
   * Enhanced cursor tracking initialization that includes sync setup
   */
  const initializeCursorTracking = useCallback((element) => {
    const cleanup = cursorTracking.initializeCursorTracking(element);
    
    // Replace event handlers with sync-enabled versions
    if (element) {
      element.removeEventListener('mousemove', cursorTracking.handleMouseMove);
      element.removeEventListener('mouseenter', cursorTracking.handleMouseEnter);
      element.removeEventListener('mouseleave', cursorTracking.handleMouseLeave);
      
      element.addEventListener('mousemove', handleMouseMove, { passive: true });
      element.addEventListener('mouseenter', handleMouseEnter, { passive: true });
      element.addEventListener('mouseleave', handleMouseLeave, { passive: true });
      
      return () => {
        element.removeEventListener('mousemove', handleMouseMove);
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
        if (cleanup) cleanup();
      };
    }
    
    return cleanup;
  }, [cursorTracking, handleMouseMove, handleMouseEnter, handleMouseLeave]);

  return {
    // Local cursor state (from useCursor)
    cursorPosition: cursorTracking.cursorPosition,
    isTracking: cursorTracking.isTracking,
    
    // Real-time sync state
    otherCursors,
    syncStatus,
    error,
    
    // Combined status
    isActive: isActive && !!user,
    isConnected: syncStatus === 'connected',
    
    // Enhanced methods
    initializeCursorTracking,
    updatePosition,
    getBoundedPosition: cursorTracking.getBoundedPosition,
    cleanup: () => {
      if (broadcastThrottleRef.current) {
        broadcastThrottleRef.current.destroy();
        broadcastThrottleRef.current = null;
      }
      cursorTracking.cleanup();
      cleanupSync();
    },
    
    // Sync-enabled event handlers
    handleMouseMove,
    handleMouseEnter,
    handleMouseLeave,
    
    // Configuration
    throttleInterval: cursorTracking.throttleInterval,
    updateDebounce: cursorTracking.updateDebounce,
    
    // Stats
    otherCursorCount: otherCursors.length,
    lastBroadcastTime: lastBroadcastRef.current
  };
}
