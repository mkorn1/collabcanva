import React, { memo } from 'react';
import { Rect } from 'react-konva';

/**
 * Rectangle component with selection and movement capabilities
 * Handles its own events to prevent bubbling to Stage
 */
const Rectangle = memo(({
  rectangle,
  isSelected = false,
  onSelect,
  onMove,
  onDeselect
}) => {
  // Handle rectangle click for selection
  const handleClick = (e) => {
    e.cancelBubble = true; // Stop event from bubbling to Stage
    
    if (onSelect) {
      onSelect(rectangle.id);
    }
  };

  // Handle drag start - prepare for movement
  const handleDragStart = (e) => {
    e.cancelBubble = true; // Prevent Stage from handling this
    
    // Ensure rectangle is selected when starting to drag
    if (!isSelected && onSelect) {
      onSelect(rectangle.id);
    }
  };

  // Handle drag movement - update position in real-time
  const handleDragMove = (e) => {
    // Update local position immediately for smooth dragging
    const newX = e.target.x();
    const newY = e.target.y();
    
    // Optional: call onMove for real-time updates (debounced)
    // For now, we'll wait for dragEnd to reduce Firestore calls
  };

  // Handle drag end - finalize position
  const handleDragEnd = (e) => {
    e.cancelBubble = true;
    
    const newX = e.target.x();
    const newY = e.target.y();
    
    // Only update if position actually changed
    if (newX !== rectangle.x || newY !== rectangle.y) {
      if (onMove) {
        onMove(rectangle.id, { x: newX, y: newY });
      }
    }
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
    <Rect
      // Rectangle properties
      x={rectangle.x}
      y={rectangle.y}
      width={rectangle.width}
      height={rectangle.height}
      fill={rectangle.fill}
      stroke={isSelected ? '#0066ff' : rectangle.stroke}
      strokeWidth={isSelected ? 3 : rectangle.strokeWidth || 2}
      opacity={rectangle.opacity || 1}
      
      // Interaction properties
      draggable={isSelected}
      
      // Event handlers
      onClick={handleClick}
      onTap={handleClick} // Mobile support
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      
      // Accessibility
      name={`rectangle-${rectangle.id}`}
    />
  );
}, (prevProps, nextProps) => {
  // Optimize re-renders - only update if relevant props changed
  return (
    prevProps.rectangle.updatedAt === nextProps.rectangle.updatedAt &&
    prevProps.isSelected === nextProps.isSelected
  );
});

Rectangle.displayName = 'Rectangle';

export default Rectangle;
