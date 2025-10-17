import { useState, useEffect } from 'react';
import { HEADER_HEIGHT } from '../utils/constants.js';

/**
 * Custom hook for managing canvas viewport dimensions and positioning
 * Handles stage size calculations and responsive layout
 */
export const useCanvasViewport = () => {
  const [stageSize, setStageSize] = useState(() => {
    // Calculate available space (full window minus header height)
    return {
      width: window.innerWidth,
      height: window.innerHeight - HEADER_HEIGHT
    };
  });

  // Calculate toolbox position for bottom left
  const [toolboxPosition, setToolboxPosition] = useState(() => {
    return {
      x: 20,
      y: window.innerHeight - HEADER_HEIGHT - 300 // Space for toolbox + margin
    };
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight - HEADER_HEIGHT
      });
      
      // Update toolbox position on resize
      setToolboxPosition({
        x: 20,
        y: window.innerHeight - HEADER_HEIGHT - 300
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    stageSize,
    toolboxPosition
  };
};
