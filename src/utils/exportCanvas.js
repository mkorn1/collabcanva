/**
 * Canvas export utilities
 * Handles exporting the current canvas view as PNG
 */

/**
 * Export the current canvas as PNG
 * @param {Object} stageRef - Reference to the Konva Stage
 * @param {string} filename - Optional filename for the download
 * @returns {Promise<boolean>} - Success status
 */
export const exportCanvasToPNG = async (stageRef, filename = 'canvas-export') => {
  try {
    if (!stageRef || !stageRef.current) {
      console.error('Stage reference is not available');
      return false;
    }

    const stage = stageRef.current;
    
    // Get the current canvas data as image
    const dataURL = stage.toDataURL({
      mimeType: 'image/png',
      quality: 1, // Maximum quality
      pixelRatio: 2 // Higher resolution for better quality
    });

    // Create download link
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.png`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('Canvas exported successfully as PNG');
    return true;
  } catch (error) {
    console.error('Failed to export canvas:', error);
    return false;
  }
};

/**
 * Export a specific region of the canvas as PNG
 * @param {Object} stageRef - Reference to the Konva Stage
 * @param {Object} region - Region to export {x, y, width, height}
 * @param {string} filename - Optional filename for the download
 * @returns {Promise<boolean>} - Success status
 */
export const exportCanvasRegionToPNG = async (stageRef, region, filename = 'canvas-region-export') => {
  try {
    if (!stageRef || !stageRef.current) {
      console.error('Stage reference is not available');
      return false;
    }

    const stage = stageRef.current;
    
    // Get the canvas data for the specific region
    const dataURL = stage.toDataURL({
      mimeType: 'image/png',
      quality: 1,
      pixelRatio: 2,
      x: region.x,
      y: region.y,
      width: region.width,
      height: region.height
    });

    // Create download link
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.png`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('Canvas region exported successfully as PNG');
    return true;
  } catch (error) {
    console.error('Failed to export canvas region:', error);
    return false;
  }
};

/**
 * Export all objects (full canvas content) as PNG
 * @param {Object} stageRef - Reference to the Konva Stage
 * @param {Array} objects - Array of canvas objects
 * @param {string} filename - Optional filename for the download
 * @returns {Promise<boolean>} - Success status
 */
export const exportAllObjectsToPNG = async (stageRef, objects, filename = 'canvas-full-export') => {
  try {
    if (!stageRef || !stageRef.current) {
      console.error('Stage reference is not available');
      return false;
    }

    if (!objects || objects.length === 0) {
      console.warn('No objects to export');
      return false;
    }

    // Calculate bounds of all objects
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    objects.forEach(obj => {
      const objMinX = obj.x;
      const objMinY = obj.y;
      let objMaxX, objMaxY;

      if (obj.type === 'rectangle') {
        objMaxX = obj.x + (obj.width || 100);
        objMaxY = obj.y + (obj.height || 100);
      } else if (obj.type === 'circle') {
        objMaxX = obj.x + (obj.radius || 50);
        objMaxY = obj.y + (obj.radius || 50);
      } else if (obj.type === 'text') {
        // Estimate text bounds (simplified)
        const fontSize = obj.fontSize || 16;
        const textLength = (obj.text || '').length;
        objMaxX = obj.x + (textLength * fontSize * 0.6);
        objMaxY = obj.y + fontSize * 1.2;
      } else {
        objMaxX = obj.x + 100; // Default fallback
        objMaxY = obj.y + 100;
      }

      minX = Math.min(minX, objMinX);
      minY = Math.min(minY, objMinY);
      maxX = Math.max(maxX, objMaxX);
      maxY = Math.max(maxY, objMaxY);
    });

    // Add some padding
    const padding = 20;
    const region = {
      x: minX - padding,
      y: minY - padding,
      width: (maxX - minX) + (padding * 2),
      height: (maxY - minY) + (padding * 2)
    };

    return await exportCanvasRegionToPNG(stageRef, region, filename);
  } catch (error) {
    console.error('Failed to export all objects:', error);
    return false;
  }
};

/**
 * Get canvas as base64 image data (for preview or sharing)
 * @param {Object} stageRef - Reference to the Konva Stage
 * @returns {string|null} - Base64 image data or null if failed
 */
export const getCanvasAsBase64 = (stageRef) => {
  try {
    if (!stageRef || !stageRef.current) {
      console.error('Stage reference is not available');
      return null;
    }

    const stage = stageRef.current;
    return stage.toDataURL({
      mimeType: 'image/png',
      quality: 0.8,
      pixelRatio: 1
    });
  } catch (error) {
    console.error('Failed to get canvas as base64:', error);
    return null;
  }
};
