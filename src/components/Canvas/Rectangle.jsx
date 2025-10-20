import React, { memo, useRef, useState, useEffect } from 'react';
import { Rect, Group, Text as KonvaText, Transformer } from 'react-konva';

/**
 * Rectangle component with selection and movement capabilities
 * Handles its own events to prevent bubbling to Stage
 */
const Rectangle = memo(({
  rectangle,
  isSelected = false,
  onSelect,
  onMove,
  onDeselect,
  onTransform, // Function to handle transform operations (rotation)
  onResize, // Function to handle resize operations
  selectedObjects = [], // Array of all selected objects for coordinated dragging
  onMultiMove, // Function to handle multi-object movement
  onMultiTransform, // Function to handle multi-object transform operations
  onContextMenu // Function to handle right-click context menu
}) => {
  // Track drag start position for multi-object movement
  const dragStartPosRef = useRef(null);
  const transformerRef = useRef(null);
  const rectRef = useRef(null);
  
  // Visual feedback state for conflict resolution
  const [showLastEditor, setShowLastEditor] = useState(false);
  const [lastEditorInfo, setLastEditorInfo] = useState(null);
  
  // Track Shift key state for aspect ratio preservation
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  
  // Handle mouse down to prevent stage drag
  const handleMouseDown = (e) => {
    // Handle both Konva events (e.evt) and DOM events (e)
    const event = e.evt || e;
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
    e.cancelBubble = true; // Keep for compatibility
  };

  // Handle rectangle click for selection
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
      onSelect(rectangle.id, isMultiSelect);
    }
  };

  // Handle right-click for context menu
  const handleRightClick = (e) => {
    // Handle both Konva events (e.evt) and DOM events (e)
    const event = e.evt || e;
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
    e.cancelBubble = true; // Keep for compatibility
    
    if (onContextMenu) {
      onContextMenu(event, rectangle);
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
    
    // Ensure rectangle is selected when starting to drag
    if (!isSelected && onSelect) {
      onSelect(rectangle.id, false); // Single select when starting drag
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
      if (newX !== rectangle.x || newY !== rectangle.y) {
        if (onMove) {
          onMove(rectangle.id, { x: newX, y: newY });
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
    
    // Show last editor info on hover if available (for any edited object)
    if (rectangle.lastModifiedByName) {
      setLastEditorInfo({
        name: rectangle.lastModifiedByName,
        timestamp: rectangle.lastModified,
        color: rectangle._lastEditorColor || '#0066ff'
      });
      setShowLastEditor(true);
    }
  };

  const handleMouseLeave = (e) => {
    // Reset cursor
    e.target.getStage().container().style.cursor = 'default';
    // Hide last editor info
    setShowLastEditor(false);
  };

  // Handle transform end - detect resize vs rotation and update properties
  const handleTransformEnd = (e) => {
    const node = rectRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();
    const oldRotation = rectangle.rotation || 0;

    // Detect if this was a resize operation (scale changed) or rotation operation
    const wasResize = scaleX !== 1 || scaleY !== 1;
    const wasRotation = Math.abs(rotation - oldRotation) > 0.1; // Small tolerance for floating point

    console.log('🔧 RECTANGLE TRANSFORM:', {
      id: rectangle.id,
      scaleX,
      scaleY,
      rotation,
      oldRotation,
      wasResize,
      wasRotation,
      isMultiSelect: selectedObjects.length > 1
    });

    // Check if multiple objects are selected for coordinated transform
    if (selectedObjects.length > 1 && onMultiTransform) {
      const transformData = {};
      
      console.log('🔍 RECTANGLE MULTI-TRANSFORM DEBUG:', {
        wasResize,
        wasRotation,
        selectedObjectsCount: selectedObjects.length,
        nodeData: {
          width: node.width(),
          height: node.height(),
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY()
        }
      });
      
      if (wasRotation) {
        // PRIORITIZE ROTATION: Apply rotation with snap-to-grid - EXCLUDE ALL SIZE DATA
        transformData.rotation = Math.round(rotation / 15) * 15; // Snap to 15° increments
        // Explicitly exclude: width, height, x, y, scaleX, scaleY for rotation operations
        
        console.log('🔍 RECTANGLE ROTATION DATA (PRIORITIZED):', {
          originalRotation: rotation,
          snappedRotation: transformData.rotation,
          transformData,
          excludedData: {
            width: node.width(),
            height: node.height(),
            x: node.x(),
            y: node.y(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY()
          }
        });
      } else if (wasResize) {
        // Reset scale and calculate new dimensions
        node.scaleX(1);
        node.scaleY(1);
        transformData.width = Math.max(10, node.width() * scaleX);
        transformData.height = Math.max(10, node.height() * scaleY);
        transformData.x = node.x();
        transformData.y = node.y();
        
        console.log('🔍 RECTANGLE RESIZE DATA:', {
          scaleX,
          scaleY,
          transformData
        });
      }
      
      console.log('🔍 RECTANGLE FINAL TRANSFORM DATA:', {
        transformData,
        keys: Object.keys(transformData),
        isEmpty: Object.keys(transformData).length === 0
      });
      
      if (Object.keys(transformData).length > 0) {
        console.log('🔍 RECTANGLE CALLING onMultiTransform with:', {
          selectedObjects: selectedObjects.map(obj => ({ id: obj.id, type: obj.type })),
          transformData,
          isFinal: true
        });
        onMultiTransform(selectedObjects, transformData, true); // true indicates final position
      }
    } else {
      // Single object transform - use existing logic
      if (wasResize && onResize) {
        // Reset scale and update size properties
        node.scaleX(1);
        node.scaleY(1);
        
        onResize(rectangle.id, {
          x: node.x(),
          y: node.y(),
          width: Math.max(10, node.width() * scaleX),
          height: Math.max(10, node.height() * scaleY)
        });
      } else if (wasRotation && onTransform) {
        // Update rotation only
        onTransform(rectangle.id, {
          x: node.x(),
          y: node.y(),
          rotation: Math.round(rotation / 15) * 15 // Snap to 15° increments
        });
      }
    }
  };

  // Set up transformer when selected
  useEffect(() => {
    if (isSelected && transformerRef.current && rectRef.current) {
      transformerRef.current.nodes([rectRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  // Handle Shift key events for aspect ratio preservation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Shift' && isSelected) {
        setIsShiftPressed(true);
        console.log('🔧 RECTANGLE: Shift key pressed - aspect ratio preservation enabled');
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
        console.log('🔧 RECTANGLE: Shift key released - aspect ratio preservation disabled');
      }
    };

    // Only add listeners when rectangle is selected
    if (isSelected) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSelected]);

  // Auto-show conflict resolution feedback
  useEffect(() => {
    if (rectangle._conflictResolved && rectangle.lastModifiedByName) {
      setLastEditorInfo({
        name: rectangle.lastModifiedByName,
        timestamp: rectangle.lastModified,
        color: rectangle._lastEditorColor || '#0066ff'
      });
      setShowLastEditor(true);
      
      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        setShowLastEditor(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [rectangle._conflictResolved, rectangle.lastModifiedByName, rectangle.lastModified]);

  return (
    <Group>
      {/* Main rectangle */}
      <Rect
        ref={rectRef}
        // Rectangle properties
        x={rectangle.x}
        y={rectangle.y}
        width={rectangle.width}
        height={rectangle.height}
        rotation={rectangle.rotation || 0}
        fill={rectangle.fill}
        stroke={isSelected ? '#0066ff' : (showLastEditor ? lastEditorInfo?.color || '#ff6b6b' : rectangle.stroke)}
        strokeWidth={isSelected ? 3 : (showLastEditor ? 3 : rectangle.strokeWidth || 2)}
        opacity={rectangle.opacity || 1}
        
        // Add dashed stroke for conflict resolution feedback
        dash={showLastEditor && !isSelected ? [8, 4] : undefined}
        
        // Interaction properties
        draggable={isSelected}
        
        // Event handlers
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onTap={handleClick} // Mobile support
        onContextMenu={handleRightClick}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        
        // Accessibility
        name={`rectangle-${rectangle.id}`}
      />
      
      {/* Last editor tooltip */}
      {showLastEditor && lastEditorInfo && (
        <Group
          x={rectangle.x + rectangle.width + 10}
          y={rectangle.y}
        >
          {/* Tooltip background */}
          <Rect
            x={0}
            y={0}
            width={lastEditorInfo.name.length * 8 + 16}
            height={24}
            fill="rgba(0, 0, 0, 0.8)"
            cornerRadius={4}
          />
          {/* Tooltip text */}
          <KonvaText
            x={8}
            y={6}
            text={`Last edited by ${lastEditorInfo.name}`}
            fontSize={12}
            fill="white"
            fontFamily="Arial"
          />
        </Group>
      )}
      
      {/* Transformer for resize and rotate */}
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Minimum size constraints
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }
            return newBox;
          }}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']} // Enable resize anchors
          rotateEnabled={true}
          keepRatio={isShiftPressed} // Preserve aspect ratio when Shift is pressed
          onTransformEnd={handleTransformEnd}
        />
      )}
    </Group>
  );
}, (prevProps, nextProps) => {
  // Optimize re-renders - only update if relevant props changed
  return (
    prevProps.rectangle.updatedAt === nextProps.rectangle.updatedAt &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.selectedObjects.length === nextProps.selectedObjects.length
  );
});

Rectangle.displayName = 'Rectangle';

export default Rectangle;
