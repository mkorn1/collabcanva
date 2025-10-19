import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing canvas tools and keyboard shortcuts
 * Handles tool selection, creation mode, and keyboard interactions
 */
export const useCanvasTools = ({
  isCreatingRectangle,
  isCreatingCircle,
  isCreatingText,
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
    } else if (toolId === 'circle') {
      setCreationMode('circle');
    } else if (toolId === 'text') {
      setCreationMode('text');
    } else if (toolId === 'select' || toolId === 'marquee') {
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
        case 'm':
          handleToolSelect('marquee');
          break;
        case 'r':
          handleToolSelect('rectangle');
          break;
        case 'c':
          handleToolSelect('circle');
          break;
        case 't':
          handleToolSelect('text');
          break;
        case 'escape':
          if (isCreatingRectangle || isCreatingCircle || isCreatingText) {
            cancelCreatingShape();
          }
          handleToolSelect('select');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isCreatingRectangle, isCreatingCircle, isCreatingText, cancelCreatingShape, handleToolSelect]);

  // Update cursor based on creation mode
  const getCursorStyle = useCallback((isDragging, selectedTool) => {
    if (creationMode === 'rectangle' || creationMode === 'circle') {
      return 'crosshair';
    } else if (creationMode === 'text') {
      return 'text';
    } else if (selectedTool === 'marquee') {
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
