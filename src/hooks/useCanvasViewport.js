import { useState, useEffect } from 'react';
import { HEADER_HEIGHT } from '../utils/constants.js';

// Sidebar width constants
const SIDEBAR_WIDTH_DESKTOP = 250;
const SIDEBAR_WIDTH_TABLET = 200;
const SIDEBAR_WIDTH_MOBILE = 180;

/**
 * Custom hook for managing canvas viewport dimensions and positioning
 * Handles stage size calculations and responsive layout accounting for sidebar
 */
export const useCanvasViewport = () => {
  const [stageSize, setStageSize] = useState(() => {
    // Calculate sidebar width based on screen size
    const getSidebarWidth = () => {
      if (window.innerWidth <= 480) return SIDEBAR_WIDTH_MOBILE;
      if (window.innerWidth <= 768) return SIDEBAR_WIDTH_TABLET;
      return SIDEBAR_WIDTH_DESKTOP;
    };

    const sidebarWidth = getSidebarWidth();
    
    // Calculate available space (full window minus header height and sidebar width)
    return {
      width: window.innerWidth - sidebarWidth,
      height: window.innerHeight - HEADER_HEIGHT,
      sidebarWidth: sidebarWidth
    };
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Calculate sidebar width based on screen size
      const getSidebarWidth = () => {
        if (window.innerWidth <= 480) return SIDEBAR_WIDTH_MOBILE;
        if (window.innerWidth <= 768) return SIDEBAR_WIDTH_TABLET;
        return SIDEBAR_WIDTH_DESKTOP;
      };

      const sidebarWidth = getSidebarWidth();
      
      setStageSize({
        width: window.innerWidth - sidebarWidth,
        height: window.innerHeight - HEADER_HEIGHT,
        sidebarWidth: sidebarWidth
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    stageSize
  };
};
