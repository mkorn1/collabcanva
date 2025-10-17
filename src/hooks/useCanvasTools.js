import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing canvas tools and keyboard shortcuts
 * Handles tool selection, creation mode, and keyboard interactions
 */
export const useCanvasTools = ({
  isCreatingRectangle,
  cancelCreatingShape
}) => {
  // State for toolbox and creation mode
  const [selectedTool, setSelectedTool] = useState('select');
  const [creationMode, setCreationMode] = useState(null);

  // Handle tool selection from toolbox
  const handleToolSelect = useCallback((toolId) => {
    setSelectedTool(toolId);
    
    // Set creation mode based on tool
    if (toolId === 'rectangle') {
      setCreationMode('rectangle');
    } else if (toolId === 'select') {
      setCreationMode(null);
    }
  }, []);

  // Handle keyboard shortcuts for tools
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Don't handle shortcuts if user is typing in an input
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'v':
          handleToolSelect('select');
          break;
        case 'r':
          handleToolSelect('rectangle');
          break;
        case 'escape':
          if (isCreatingRectangle) {
            cancelCreatingShape();
          }
          handleToolSelect('select');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isCreatingRectangle, cancelCreatingShape, handleToolSelect]);

  // Update cursor based on creation mode
  const getCursorStyle = useCallback((isDragging) => {
    if (creationMode === 'rectangle') {
      return 'crosshair';
    }
    return isDragging ? 'grabbing' : 'grab';
  }, [creationMode]);

  return {
    selectedTool,
    creationMode,
    handleToolSelect,
    getCursorStyle
  };
};
