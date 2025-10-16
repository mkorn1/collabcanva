// Advanced throttling utilities for cursor updates and performance optimization
import throttle from 'lodash.throttle';

/**
 * Throttling strategies for different use cases
 */
export const THROTTLE_STRATEGIES = {
  RAF: 'requestAnimationFrame',    // For smooth animations
  LODASH: 'lodash',               // For consistent timing
  HYBRID: 'hybrid'                // Combines both approaches
};

/**
 * Enhanced throttling utility that supports multiple strategies
 */
export class AdvancedThrottle {
  constructor(callback, options = {}) {
    this.callback = callback;
    this.strategy = options.strategy || THROTTLE_STRATEGIES.HYBRID;
    this.interval = options.interval || 16; // 60 FPS default
    this.maxWait = options.maxWait || 100;  // Maximum wait time
    
    // State tracking
    this.lastCallTime = 0;
    this.rafId = null;
    this.lodashThrottle = null;
    this.pendingArgs = null;
    this.isDestroyed = false;
    
    this.setupStrategy();
  }

  /**
   * Setup the throttling strategy
   */
  setupStrategy() {
    switch (this.strategy) {
      case THROTTLE_STRATEGIES.RAF:
        this.throttledCallback = this.rafThrottle.bind(this);
        break;
      case THROTTLE_STRATEGIES.LODASH:
        this.lodashThrottle = throttle(this.callback, this.interval, {
          leading: true,
          trailing: true,
          maxWait: this.maxWait
        });
        this.throttledCallback = this.lodashThrottle;
        break;
      case THROTTLE_STRATEGIES.HYBRID:
        this.lodashThrottle = throttle(this.callback, this.maxWait, {
          leading: false,
          trailing: true
        });
        this.throttledCallback = this.hybridThrottle.bind(this);
        break;
      default:
        this.throttledCallback = this.rafThrottle.bind(this);
    }
  }

  /**
   * RequestAnimationFrame-based throttling for smooth animations
   */
  rafThrottle(...args) {
    if (this.isDestroyed) return;
    
    const now = Date.now();
    
    // Store the latest arguments
    this.pendingArgs = args;
    
    // If enough time has passed, execute immediately
    if (now - this.lastCallTime >= this.interval) {
      this.lastCallTime = now;
      this.callback(...args);
      return;
    }
    
    // Otherwise, schedule for next frame
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    
    this.rafId = requestAnimationFrame(() => {
      if (this.isDestroyed) return;
      
      const frameTime = Date.now();
      if (frameTime - this.lastCallTime >= this.interval) {
        this.lastCallTime = frameTime;
        if (this.pendingArgs) {
          this.callback(...this.pendingArgs);
          this.pendingArgs = null;
        }
      }
      this.rafId = null;
    });
  }

  /**
   * Hybrid throttling - RAF for frequent updates, lodash for guarantees
   */
  hybridThrottle(...args) {
    if (this.isDestroyed) return;
    
    const now = Date.now();
    
    // Store the latest arguments
    this.pendingArgs = args;
    
    // Use RAF for frequent updates (smooth animation)
    if (now - this.lastCallTime >= this.interval) {
      this.lastCallTime = now;
      this.callback(...args);
      return;
    }
    
    // Use lodash throttle as a fallback to guarantee execution
    this.lodashThrottle(...args);
    
    // Schedule RAF for next frame
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    
    this.rafId = requestAnimationFrame(() => {
      if (this.isDestroyed) return;
      
      const frameTime = Date.now();
      if (frameTime - this.lastCallTime >= this.interval && this.pendingArgs) {
        this.lastCallTime = frameTime;
        this.callback(...this.pendingArgs);
        this.pendingArgs = null;
      }
      this.rafId = null;
    });
  }

  /**
   * Execute the throttled callback
   */
  execute(...args) {
    return this.throttledCallback(...args);
  }

  /**
   * Flush any pending calls immediately
   */
  flush() {
    if (this.isDestroyed) return;
    
    if (this.lodashThrottle && typeof this.lodashThrottle.flush === 'function') {
      this.lodashThrottle.flush();
    }
    
    if (this.pendingArgs) {
      this.callback(...this.pendingArgs);
      this.pendingArgs = null;
      this.lastCallTime = Date.now();
    }
  }

  /**
   * Cancel any pending calls
   */
  cancel() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    if (this.lodashThrottle && typeof this.lodashThrottle.cancel === 'function') {
      this.lodashThrottle.cancel();
    }
    
    this.pendingArgs = null;
  }

  /**
   * Destroy the throttle instance
   */
  destroy() {
    this.isDestroyed = true;
    this.cancel();
    this.callback = null;
    this.lodashThrottle = null;
  }

  /**
   * Get current throttle status
   */
  getStatus() {
    return {
      strategy: this.strategy,
      interval: this.interval,
      maxWait: this.maxWait,
      lastCallTime: this.lastCallTime,
      hasPendingCall: !!this.rafId || !!this.pendingArgs,
      isDestroyed: this.isDestroyed
    };
  }
}

/**
 * Factory function to create optimized cursor position throttle
 * @param {Function} callback - The function to throttle
 * @param {Object} options - Throttling options
 * @returns {AdvancedThrottle} Throttle instance
 */
export function createCursorThrottle(callback, options = {}) {
  return new AdvancedThrottle(callback, {
    strategy: THROTTLE_STRATEGIES.HYBRID,
    interval: 16, // 60 FPS
    maxWait: 50,  // Guarantee execution within 50ms
    ...options
  });
}

/**
 * Factory function to create broadcast throttle (less frequent)
 * @param {Function} callback - The function to throttle
 * @param {Object} options - Throttling options
 * @returns {AdvancedThrottle} Throttle instance
 */
export function createBroadcastThrottle(callback, options = {}) {
  return new AdvancedThrottle(callback, {
    strategy: THROTTLE_STRATEGIES.RAF,
    interval: 16, // 60 FPS
    maxWait: 100, // Guarantee execution within 100ms
    ...options
  });
}

/**
 * Simple RAF throttle for immediate use
 * @param {Function} callback - Function to throttle
 * @param {number} interval - Throttle interval in ms
 * @returns {Function} Throttled function
 */
export function rafThrottle(callback, interval = 16) {
  let lastTime = 0;
  let rafId = null;
  let pendingArgs = null;
  
  const throttled = (...args) => {
    const now = Date.now();
    pendingArgs = args;
    
    if (now - lastTime >= interval) {
      lastTime = now;
      callback(...args);
      return;
    }
    
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    
    rafId = requestAnimationFrame(() => {
      const frameTime = Date.now();
      if (frameTime - lastTime >= interval && pendingArgs) {
        lastTime = frameTime;
        callback(...pendingArgs);
        pendingArgs = null;
      }
      rafId = null;
    });
  };
  
  throttled.cancel = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    pendingArgs = null;
  };
  
  return throttled;
}

/**
 * Performance-optimized throttle for high-frequency events
 * @param {Function} callback - Function to throttle
 * @param {number} fps - Target FPS (default: 60)
 * @returns {Function} Throttled function
 */
export function performanceThrottle(callback, fps = 60) {
  const interval = 1000 / fps;
  let lastTime = 0;
  let animationId = null;
  let latestArgs = null;
  
  const execute = () => {
    if (latestArgs) {
      callback(...latestArgs);
      latestArgs = null;
      lastTime = performance.now();
    }
    animationId = null;
  };
  
  const throttled = (...args) => {
    const now = performance.now();
    latestArgs = args;
    
    if (now - lastTime >= interval) {
      execute();
    } else if (!animationId) {
      animationId = requestAnimationFrame(execute);
    }
  };
  
  throttled.cancel = () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    latestArgs = null;
  };
  
  throttled.flush = () => {
    if (latestArgs) {
      execute();
    }
  };
  
  return throttled;
}
