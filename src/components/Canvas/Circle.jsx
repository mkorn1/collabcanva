import React, { memo, useRef } from 'react';
import { Circle as KonvaCircle } from 'react-konva';

/**
 * Circle component with selection and movement capabilities
 * Handles its own events to prevent bubbling to Stage
 */
const Circle = memo(({
  circle,
  isSelected = false,
  onSelect,
  onMove,
  onDeselect,
  selectedObjects = [], // Array of all selected objects for coordinated dragging
  onMultiMove // Function to handle multi-object movement
}) => {
  // Track drag start position for multi-object movement
  const dragStartPosRef = useRef(null);
  
  // Handle mouse down to prevent stage drag
  const handleMouseDown = (e) => {
    // Handle both Konva events (e.evt) and DOM events (e)
    const event = e.evt || e;
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
    e.cancelBubble = true; // Keep for compatibility
  };

  // Handle circle click for selection
  const handleClick = (e) => {
    // Handle both Konva events (e.evt) and DOM events (e)
    const event = e.evt || e;
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
    e.cancelBubble = true; // Keep for compatibility
    
    if (onSelect) {
      // Check if Ctrl/Cmd key is pressed for multi-select
      const isMultiSelect = event && (event.ctrlKey || event.metaKey);
      onSelect(circle.id, isMultiSelect);
    }
  };

  // Handle drag start - prepare for movement
  const handleDragStart = (e) => {
    // Handle both Konva events (e.evt) and DOM events (e)
    const event = e.evt || e;
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
    e.cancelBubble = true; // Keep for compatibility
    
    // Store initial position for multi-object dragging
    dragStartPosRef.current = {
      x: e.target.x(),
      y: e.target.y()
    };
    
    // Ensure circle is selected when starting to drag
    if (!isSelected && onSelect) {
      onSelect(circle.id, false); // Single select when starting drag
    }
  };

  // Handle drag movement - update position in real-time
  const handleDragMove = (e) => {
    // If multiple objects are selected and we have onMultiMove, handle coordinated movement
    if (selectedObjects.length > 1 && onMultiMove && dragStartPosRef.current) {
      const currentX = e.target.x();
      const currentY = e.target.y();
      
      // Calculate delta from drag start
      const deltaX = currentX - dragStartPosRef.current.x;
      const deltaY = currentY - dragStartPosRef.current.y;
      
      // Move all selected objects by the same delta
      onMultiMove(selectedObjects, { deltaX, deltaY });
    }
    
    // Optional: call onMove for single object real-time updates (debounced)
    // For now, we'll wait for dragEnd to reduce Firestore calls
  };

  // Handle drag end - finalize position
  const handleDragEnd = (e) => {
    // Handle both Konva events (e.evt) and DOM events (e)
    const event = e.evt || e;
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
    e.cancelBubble = true; // Keep for compatibility
    
    const newX = e.target.x();
    const newY = e.target.y();
    
    // Handle multi-object movement
    if (selectedObjects.length > 1 && onMultiMove && dragStartPosRef.current) {
      // Calculate final delta
      const deltaX = newX - dragStartPosRef.current.x;
      const deltaY = newY - dragStartPosRef.current.y;
      
      // Apply final positions to all selected objects if there was actual movement
      if (deltaX !== 0 || deltaY !== 0) {
        onMultiMove(selectedObjects, { deltaX, deltaY }, true); // true indicates final position
      }
    } else {
      // Single object movement
      // Only update if position actually changed
      if (newX !== circle.x || newY !== circle.y) {
        if (onMove) {
          onMove(circle.id, { x: newX, y: newY });
        }
      }
    }
    
    // Clear drag start reference
    dragStartPosRef.current = null;
  };

  // Handle mouse enter/leave for future hover effects
  const handleMouseEnter = (e) => {
    if (!isSelected) {
      // Change cursor to indicate interactivity
      e.target.getStage().container().style.cursor = 'pointer';
    }
  };

  const handleMouseLeave = (e) => {
    // Reset cursor
    e.target.getStage().container().style.cursor = 'default';
  };

  return (
    <KonvaCircle
      // Circle properties
      x={circle.x}
      y={circle.y}
      radius={circle.radius}
      fill={circle.fill}
      stroke={isSelected ? '#0066ff' : circle.stroke}
      strokeWidth={isSelected ? 3 : circle.strokeWidth || 2}
      opacity={circle.opacity || 1}
      
      // Interaction properties
      draggable={isSelected}
      
      // Event handlers
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onTap={handleClick} // Mobile support
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      
      // Accessibility
      name={`circle-${circle.id}`}
    />
  );
}, (prevProps, nextProps) => {
  // Optimize re-renders - only update if relevant props changed
  return (
    prevProps.circle.updatedAt === nextProps.circle.updatedAt &&
    prevProps.isSelected === nextProps.isSelected
  );
});

Circle.displayName = 'Circle';

export default Circle;
