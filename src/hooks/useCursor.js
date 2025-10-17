// Hook for tracking and broadcasting cursor position with advanced throttling
import { useState, useEffect, useRef, useCallback } from 'react';
import { updateCursorPosition } from '../services/firestore';
import { createCursorThrottle, performanceThrottle } from '../utils/throttle';

/**
 * Custom hook for tracking cursor position with 60 FPS throttling
 * @param {Object} user - Current authenticated user
 * @param {boolean} isCanvasActive - Whether cursor tracking should be active
 * @returns {Object} Cursor tracking state and methods
 */
export function useCursor(user, isCanvasActive = true) {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  
  // Refs for throttling and cleanup
  const lastUpdateTimeRef = useRef(0);
  const throttleInstanceRef = useRef(null);
  const firestoreThrottleRef = useRef(null);
  const containerRef = useRef(null);
  
  // Throttling configuration (60 FPS = ~16.67ms)
  const THROTTLE_INTERVAL = 16; // milliseconds
  const UPDATE_DEBOUNCE = 50; // milliseconds for firestore updates

  /**
   * Converts screen coordinates to canvas coordinates
   * @param {number} clientX - Screen X coordinate
   * @param {number} clientY - Screen Y coordinate
   * @param {HTMLElement} container - Canvas container element
   * @returns {Object} Canvas coordinates {x, y}
   */
  const screenToCanvasCoords = useCallback((clientX, clientY, container) => {
    if (!container) return { x: clientX, y: clientY };
    
    const rect = container.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  /**
   * Initialize throttling instances
   */
  useEffect(() => {
    // Create cursor position throttle for local updates (60 FPS)
    throttleInstanceRef.current = createCursorThrottle((position) => {
      setCursorPosition(position);
      lastUpdateTimeRef.current = Date.now();
    }, {
      interval: THROTTLE_INTERVAL,
      strategy: 'hybrid' // Use hybrid strategy for best performance
    });

    // Create Firestore update throttle (less frequent, guaranteed execution)
    firestoreThrottleRef.current = performanceThrottle((position) => {
      if (user && isCanvasActive) {
        updateCursorPosition(user.uid, position).catch((error) => {
          console.error('❌ Error updating cursor position:', error);
          setError(error.message);
        });
      }
    }, 20); // 20 FPS for Firestore updates to reduce load

    return () => {
      if (throttleInstanceRef.current) {
        throttleInstanceRef.current.destroy();
      }
      if (firestoreThrottleRef.current) {
        firestoreThrottleRef.current.cancel();
      }
    };
  }, [user, isCanvasActive]);

  /**
   * Enhanced throttled cursor position update
   * @param {Object} position - New cursor position {x, y}
   */
  const throttledUpdatePosition = useCallback((position) => {
    if (!throttleInstanceRef.current || !firestoreThrottleRef.current) {
      return;
    }

    // Update local position immediately with throttling
    throttleInstanceRef.current.execute(position);
    
    // Update Firestore with separate throttling
    firestoreThrottleRef.current(position);
    
  }, []);

  /**
   * Mouse move event handler
   */
  const handleMouseMove = useCallback((event) => {
    if (!isCanvasActive || !user) return;
    
    const container = containerRef.current || event.currentTarget;
    const canvasCoords = screenToCanvasCoords(event.clientX, event.clientY, container);
    
    throttledUpdatePosition(canvasCoords);
  }, [isCanvasActive, user, screenToCanvasCoords, throttledUpdatePosition]);

  /**
   * Mouse enter event handler
   */
  const handleMouseEnter = useCallback((event) => {
    if (!isCanvasActive || !user) return;
    
    setIsTracking(true);
    setError(null);
    
    const container = containerRef.current || event.currentTarget;
    const canvasCoords = screenToCanvasCoords(event.clientX, event.clientY, container);
    
    throttledUpdatePosition(canvasCoords);
  }, [isCanvasActive, user, screenToCanvasCoords, throttledUpdatePosition]);

  /**
   * Mouse leave event handler
   */
  const handleMouseLeave = useCallback(() => {
    setIsTracking(false);
    
    // Flush any pending updates before leaving
    if (throttleInstanceRef.current) {
      throttleInstanceRef.current.flush();
    }
    
    if (firestoreThrottleRef.current) {
      firestoreThrottleRef.current.flush();
    }
  }, []);

  /**
   * Initialize cursor tracking on a container element
   * @param {HTMLElement} element - Container element to track cursor on
   */
  const initializeCursorTracking = useCallback((element) => {
    if (!element) return;
    
    containerRef.current = element;
    
    // Add event listeners
    element.addEventListener('mousemove', handleMouseMove, { passive: true });
    element.addEventListener('mouseenter', handleMouseEnter, { passive: true });
    element.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    
    // console.log('🖱️ Cursor tracking initialized on element');
    
    // Return cleanup function
    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      // console.log('🖱️ Cursor tracking cleaned up');
    };
  }, [handleMouseMove, handleMouseEnter, handleMouseLeave]);

  /**
   * Cleanup function for component unmount
   */
  const cleanup = useCallback(() => {
    // Cancel throttling instances
    if (throttleInstanceRef.current) {
      throttleInstanceRef.current.cancel();
    }
    
    if (firestoreThrottleRef.current) {
      firestoreThrottleRef.current.cancel();
    }
    
    setIsTracking(false);
    containerRef.current = null;
  }, []);

  // Cleanup on unmount or when user changes
  useEffect(() => {
    return cleanup;
  }, [cleanup, user]);

  // Reset error when canvas becomes active again
  useEffect(() => {
    if (isCanvasActive) {
      setError(null);
    }
  }, [isCanvasActive]);

  /**
   * Manually update cursor position (for programmatic updates)
   * @param {Object} position - New position {x, y}
   */
  const updatePosition = useCallback((position) => {
    if (!user || !isCanvasActive) return;
    throttledUpdatePosition(position);
  }, [user, isCanvasActive, throttledUpdatePosition]);

  /**
   * Get current cursor position with bounds checking
   * @param {Object} bounds - Optional bounds {width, height}
   * @returns {Object} Position with bounds applied
   */
  const getBoundedPosition = useCallback((bounds) => {
    if (!bounds) return cursorPosition;
    
    return {
      x: Math.max(0, Math.min(bounds.width, cursorPosition.x)),
      y: Math.max(0, Math.min(bounds.height, cursorPosition.y))
    };
  }, [cursorPosition]);

  return {
    // State
    cursorPosition,
    isTracking,
    error,
    isActive: isCanvasActive && !!user,
    
    // Methods
    initializeCursorTracking,
    updatePosition,
    getBoundedPosition,
    cleanup,
    
    // Event handlers (for manual setup)
    handleMouseMove,
    handleMouseEnter,
    handleMouseLeave,
    
    // Configuration
    throttleInterval: THROTTLE_INTERVAL,
    updateDebounce: UPDATE_DEBOUNCE,
    
    // Throttling status
    getThrottleStatus: () => ({
      cursorThrottle: throttleInstanceRef.current?.getStatus(),
      firestoreThrottle: firestoreThrottleRef.current ? 'active' : 'inactive'
    })
  };
}

/**
 * Higher-order component to automatically set up cursor tracking
 * Note: This would need to be in a .jsx file to use JSX syntax
 * For now, consumers should use the useCursor hook directly
 */

/**
 * Utility function to calculate cursor movement distance
 * @param {Object} pos1 - First position {x, y}
 * @param {Object} pos2 - Second position {x, y}
 * @returns {number} Distance in pixels
 */
export function calculateCursorDistance(pos1, pos2) {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Utility function to check if cursor moved significantly
 * @param {Object} pos1 - First position {x, y}
 * @param {Object} pos2 - Second position {x, y}
 * @param {number} threshold - Minimum distance to consider significant (default: 5px)
 * @returns {boolean} True if movement is significant
 */
export function isSignificantCursorMovement(pos1, pos2, threshold = 5) {
  return calculateCursorDistance(pos1, pos2) >= threshold;
}
