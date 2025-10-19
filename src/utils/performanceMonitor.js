/**
 * Performance monitoring utility for transform operations
 * Monitors FPS and operation timing to ensure 60 FPS requirement
 */

export class PerformanceMonitor {
  constructor() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 0;
    this.isMonitoring = false;
    this.operationTimes = [];
    this.maxOperationTime = 16.67; // 60 FPS = 16.67ms per frame
    this.callbacks = new Set();
  }

  /**
   * Start monitoring performance
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 0;
    this.operationTimes = [];
    
    console.log('🔧 PERFORMANCE MONITOR: Started monitoring transform operations');
    this.measureFrameRate();
  }

  /**
   * Stop monitoring performance
   */
  stopMonitoring() {
    this.isMonitoring = false;
    console.log('🔧 PERFORMANCE MONITOR: Stopped monitoring');
  }

  /**
   * Measure frame rate using requestAnimationFrame
   */
  measureFrameRate() {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    this.frameCount++;

    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      
      // Notify callbacks about FPS update
      this.callbacks.forEach(callback => {
        callback({ fps: this.fps, operationTimes: this.operationTimes });
      });

      // Log performance warnings
      if (this.fps < 60) {
        console.warn(`⚠️ PERFORMANCE WARNING: FPS dropped to ${this.fps} (target: 60 FPS)`);
      }

      this.frameCount = 0;
      this.lastTime = currentTime;
      this.operationTimes = []; // Reset operation times each second
    }

    requestAnimationFrame(() => this.measureFrameRate());
  }

  /**
   * Record the time taken for a transform operation
   * @param {string} operationType - Type of operation (resize, rotate, multiTransform, etc.)
   * @param {number} startTime - Start time of operation
   * @param {number} endTime - End time of operation
   * @param {Object} metadata - Additional metadata about the operation
   */
  recordOperation(operationType, startTime, endTime, metadata = {}) {
    const duration = endTime - startTime;
    
    this.operationTimes.push({
      type: operationType,
      duration,
      timestamp: endTime,
      ...metadata
    });

    // Log slow operations
    if (duration > this.maxOperationTime) {
      console.warn(`⚠️ SLOW OPERATION: ${operationType} took ${duration.toFixed(2)}ms (target: <${this.maxOperationTime}ms)`, metadata);
    } else {
      console.log(`✅ OPERATION: ${operationType} completed in ${duration.toFixed(2)}ms`, metadata);
    }
  }

  /**
   * Add a callback to receive performance updates
   * @param {Function} callback - Function to call with performance data
   */
  addCallback(callback) {
    this.callbacks.add(callback);
  }

  /**
   * Remove a callback
   * @param {Function} callback - Function to remove
   */
  removeCallback(callback) {
    this.callbacks.delete(callback);
  }

  /**
   * Get current performance statistics
   * @returns {Object} Performance statistics
   */
  getStats() {
    const avgOperationTime = this.operationTimes.length > 0 
      ? this.operationTimes.reduce((sum, op) => sum + op.duration, 0) / this.operationTimes.length
      : 0;

    const slowOperations = this.operationTimes.filter(op => op.duration > this.maxOperationTime);

    return {
      fps: this.fps,
      avgOperationTime: avgOperationTime.toFixed(2),
      totalOperations: this.operationTimes.length,
      slowOperations: slowOperations.length,
      isHealthy: this.fps >= 60 && slowOperations.length === 0
    };
  }

  /**
   * Create a performance wrapper for async operations
   * @param {string} operationType - Type of operation
   * @param {Function} operation - Async operation to wrap
   * @returns {Function} Wrapped operation
   */
  wrapAsyncOperation(operationType, operation) {
    return async (...args) => {
      const startTime = performance.now();
      try {
        const result = await operation(...args);
        const endTime = performance.now();
        this.recordOperation(operationType, startTime, endTime, { success: true });
        return result;
      } catch (error) {
        const endTime = performance.now();
        this.recordOperation(operationType, startTime, endTime, { success: false, error: error.message });
        throw error;
      }
    };
  }

  /**
   * Create a performance wrapper for sync operations
   * @param {string} operationType - Type of operation
   * @param {Function} operation - Sync operation to wrap
   * @returns {Function} Wrapped operation
   */
  wrapSyncOperation(operationType, operation) {
    return (...args) => {
      const startTime = performance.now();
      try {
        const result = operation(...args);
        const endTime = performance.now();
        this.recordOperation(operationType, startTime, endTime, { success: true });
        return result;
      } catch (error) {
        const endTime = performance.now();
        this.recordOperation(operationType, startTime, endTime, { success: false, error: error.message });
        throw error;
      }
    };
  }
}

// Create a global instance for the application
export const performanceMonitor = new PerformanceMonitor();

// Export utility functions
export const withPerformanceMonitoring = (operationType, operation) => {
  return performanceMonitor.wrapAsyncOperation(operationType, operation);
};

export const withSyncPerformanceMonitoring = (operationType, operation) => {
  return performanceMonitor.wrapSyncOperation(operationType, operation);
};

export default performanceMonitor;
