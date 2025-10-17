import React, { memo, useRef, useState, useEffect } from 'react';
import { Text as KonvaText, Transformer, Group, Rect } from 'react-konva';

/**
 * Text component with selection, movement, editing, and formatting capabilities
 * Handles its own events to prevent bubbling to Stage
 */
const Text = memo(({
  text,
  isSelected = false,
  onSelect,
  onMove,
  onEdit,
  onTransform, // Function to handle transform operations
  selectedObjects = [], // Array of all selected objects for coordinated dragging
  onMultiMove // Function to handle multi-object movement
}) => {
  // Track drag start position for multi-object movement
  const dragStartPosRef = useRef(null);
  const textRef = useRef(null);
  const transformerRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Visual feedback state for conflict resolution
  const [showLastEditor, setShowLastEditor] = useState(false);
  const [lastEditorInfo, setLastEditorInfo] = useState(null);

  // Set up transformer when selected
  useEffect(() => {
    if (isSelected && transformerRef.current && textRef.current && !isEditing) {
      transformerRef.current.nodes([textRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected, isEditing]);

  // Handle mouse down to prevent stage drag
  const handleMouseDown = (e) => {
    // Handle both Konva events (e.evt) and DOM events (e)
    const event = e.evt || e;
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
    e.cancelBubble = true; // Keep for compatibility
  };

  // Handle text click for selection
  const handleClick = (e) => {
    // Handle both Konva events (e.evt) and DOM events (e)
    const event = e.evt || e;
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
    e.cancelBubble = true; // Keep for compatibility
    
    if (onSelect && !isEditing) {
      // Check if Ctrl/Cmd key is pressed for multi-select
      const isMultiSelect = event && (event.ctrlKey || event.metaKey);
      onSelect(text.id, isMultiSelect);
    }
  };

  // Handle double click for editing
  const handleDoubleClick = (e) => {
    // Handle both Konva events (e.evt) and DOM events (e)
    const event = e.evt || e;
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
    e.cancelBubble = true;
    
    if (isSelected && textRef.current) {
      setIsEditing(true);
      
      const textNode = textRef.current;
      const stage = textNode.getStage();
      const stageBox = stage.container().getBoundingClientRect();
      
      // Get text position on screen
      const areaPosition = {
        x: stageBox.left + textNode.x() * stage.scaleX(),
        y: stageBox.top + textNode.y() * stage.scaleY(),
      };

      // Create textarea for editing
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      // Style textarea to match text node
      textarea.value = textNode.text();
      textarea.style.position = 'absolute';
      textarea.style.top = areaPosition.y + 'px';
      textarea.style.left = areaPosition.x + 'px';
      textarea.style.width = Math.max(100, textNode.width() * stage.scaleX()) + 'px';
      textarea.style.fontSize = (text.fontSize || 16) * stage.scaleX() + 'px';
      textarea.style.fontFamily = text.fontFamily || 'Arial';
      textarea.style.color = text.fill || '#000000';
      textarea.style.border = '2px solid #0066ff';
      textarea.style.borderRadius = '4px';
      textarea.style.padding = '4px';
      textarea.style.margin = '0px';
      textarea.style.overflow = 'hidden';
      textarea.style.background = 'white';
      textarea.style.outline = 'none';
      textarea.style.resize = 'none';
      textarea.style.lineHeight = text.lineHeight || 1;
      textarea.style.transformOrigin = 'left top';
      textarea.style.textAlign = text.align || 'left';
      textarea.style.zIndex = '1000';

      // Handle bold/italic
      const fontStyle = text.fontStyle || '';
      if (fontStyle.includes('bold')) {
        textarea.style.fontWeight = 'bold';
      }
      if (fontStyle.includes('italic')) {
        textarea.style.fontStyle = 'italic';
      }

      textarea.focus();
      textarea.select();

      // Auto-resize textarea
      const resize = () => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      };
      textarea.addEventListener('input', resize);
      resize();

      // Save on blur or Enter
      const removeTextarea = () => {
        if (textarea.parentNode) {
          const newText = textarea.value;
          if (onEdit && newText.trim() !== '') {
            onEdit(text.id, { text: newText.trim() });
          }
          textarea.parentNode.removeChild(textarea);
          setIsEditing(false);
        }
      };

      // Cancel editing
      const cancelEditing = () => {
        if (textarea.parentNode) {
          textarea.parentNode.removeChild(textarea);
          setIsEditing(false);
        }
      };

      textarea.addEventListener('blur', removeTextarea);
      textarea.addEventListener('keydown', (e) => {
        e.stopPropagation(); // Prevent keyboard shortcuts while editing
        
        // Enter without shift = save
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          removeTextarea();
        }
        // Escape = cancel
        if (e.key === 'Escape') {
          e.preventDefault();
          cancelEditing();
        }
      });
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
    
    // Ensure text is selected when starting to drag
    if (!isSelected && onSelect) {
      onSelect(text.id, false); // Single select when starting drag
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
      if (newX !== text.x || newY !== text.y) {
        if (onMove) {
          onMove(text.id, { x: newX, y: newY });
        }
      }
    }
    
    // Clear drag start reference
    dragStartPosRef.current = null;
  };

  // Handle transform end - update text properties
  const handleTransformEnd = (e) => {
    const node = textRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();

    // Reset scale and update width/fontSize
    node.scaleX(1);
    node.scaleY(1);
    
    if (onTransform) {
      // Use onTransform for resize and rotation operations
      onTransform(text.id, {
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX),
        fontSize: Math.max(8, (text.fontSize || 16) * scaleY),
        rotation: Math.round(rotation / 15) * 15 // Snap to 15° increments
      });
    } else if (onEdit) {
      // Fallback to onEdit for resize only (backward compatibility)
      onEdit(text.id, {
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX),
        fontSize: Math.max(8, (text.fontSize || 16) * scaleY),
      });
    }
  };

  // Handle mouse enter/leave for hover effects and visual feedback
  const handleMouseEnter = (e) => {
    if (!isSelected && !isEditing) {
      // Change cursor to indicate interactivity
      e.target.getStage().container().style.cursor = 'text';
    }
    
    // Show last editor info on hover if available (for any edited object)
    if (text.lastModifiedByName) {
      setLastEditorInfo({
        name: text.lastModifiedByName,
        timestamp: text.lastModified,
        color: text._lastEditorColor || '#0066ff'
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

  // Auto-show conflict resolution feedback
  useEffect(() => {
    if (text._conflictResolved && text.lastModifiedByName) {
      setLastEditorInfo({
        name: text.lastModifiedByName,
        timestamp: text.lastModified,
        color: text._lastEditorColor || '#0066ff'
      });
      setShowLastEditor(true);
      
      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        setShowLastEditor(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [text._conflictResolved, text.lastModifiedByName, text.lastModified]);

  return (
    <Group>
      {/* Main text */}
      <KonvaText
        ref={textRef}
        // Text properties
        x={text.x}
        y={text.y}
        text={text.text || 'Double-click to edit'}
        fontSize={text.fontSize || 16}
        fontFamily={text.fontFamily || 'Arial'}
        fontStyle={text.fontStyle || ''}
        fill={text.fill || '#000000'}
        align={text.align || 'left'}
        lineHeight={text.lineHeight || 1}
        letterSpacing={text.letterSpacing || 0}
        width={text.width || undefined}
        stroke={isSelected ? '#0066ff' : (showLastEditor ? lastEditorInfo?.color || '#ff6b6b' : text.stroke)}
        strokeWidth={isSelected ? 1 : (showLastEditor ? 2 : text.strokeWidth || 0)}
        
        // Add dashed stroke for conflict resolution feedback
        dash={showLastEditor && !isSelected ? [8, 4] : undefined}
        opacity={isEditing ? 0.5 : (text.opacity || 1)}
        
        // Interaction properties
        draggable={isSelected && !isEditing}
        
        // Event handlers
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onDblClick={handleDoubleClick}
        onTap={handleClick} // Mobile support
        onDblTap={handleDoubleClick}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        
        // Accessibility
        name={`text-${text.id}`}
      />
      {isSelected && !isEditing && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize
            if (newBox.width < 20 || newBox.height < 10) {
              return oldBox;
            }
            return newBox;
          }}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          rotateEnabled={true}
          keepRatio={false}
          onTransformEnd={handleTransformEnd}
        />
      )}
      
      {/* Last editor tooltip */}
      {showLastEditor && lastEditorInfo && (
        <Group
          x={text.x + (text.width || 100) + 10}
          y={text.y}
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
    </Group>
  );
}, (prevProps, nextProps) => {
  // Optimize re-renders - only update if relevant props changed
  return (
    prevProps.text.updatedAt === nextProps.text.updatedAt &&
    prevProps.isSelected === nextProps.isSelected
  );
});

Text.displayName = 'Text';

export default Text;