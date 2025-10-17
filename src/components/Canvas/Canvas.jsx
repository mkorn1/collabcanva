import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Stage, Layer, Rect, Circle as KonvaCircle } from 'react-konva';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT
} from '../../utils/constants.js';
import { useCanvas } from '../../hooks/useCanvas.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { usePresence } from '../../hooks/usePresence.js';
import { useRealtimeCursor } from '../../hooks/useRealtimeCursor.js';
import { useCanvasEvents } from '../../hooks/useCanvasEvents.js';
import { useCanvasTools } from '../../hooks/useCanvasTools.js';
import { useCanvasViewport } from '../../hooks/useCanvasViewport.js';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts.js';
import CursorLayer from '../Collaboration/CursorLayer.jsx';
import Toolbox from './Toolbox.jsx';
import Rectangle from './Rectangle.jsx';
import Circle from './Circle.jsx';
import Text from './Text.jsx';
import TextFormattingPanel from './TextFormattingPanel.jsx';
import ColorPicker from './ColorPicker.jsx';
import DeletionWarning from './DeletionWarning.jsx';

const Canvas = () => {
  // Get current authenticated user FIRST
  const { user } = useAuth();

  // Now we can use 'user' in other hooks
  const {
    zoom,
    panPosition,
    updateZoom,
    updatePanPosition,
    stageRef,
    startDragging,
    stopDragging,
    isDragging,
    objects,
    selectedObjectIds,
    currentRectangle,
    isCreatingRectangle,
    currentCircle,
    isCreatingCircle,
    currentText,
    isCreatingText,
    isLoading,
    syncError,
    startCreatingShape,
    updateCreatingShape,
    finishCreatingShape,
    cancelCreatingShape,
    selectObject,
    deselectObject,
    updateObject,
    removeObject,
    addObject,
    getSelectedObjects,
    isObjectSelected
  } = useCanvas('main', user);

  // Get presence data for online users
  const { 
    onlineUsers, 
    userCursorColor, 
    isConnected: presenceConnected 
  } = usePresence(user);

  // Initialize real-time cursor tracking and sync
  const { 
    cursorPosition, 
    isTracking, 
    otherCursors,
    syncStatus,
    isConnected: cursorSyncConnected,
    initializeCursorTracking 
  } = useRealtimeCursor(user, true);

  // Use custom hooks for canvas management
  const { stageSize } = useCanvasViewport();
  const { selectedTool, creationMode, handleToolSelect, getCursorStyle } = useCanvasTools({
    isCreatingRectangle,
    isCreatingCircle,
    isCreatingText,
    cancelCreatingShape
  });
  const {
    handleDragStart,
    handleDragEnd,
    handleWheel,
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp
  } = useCanvasEvents({
    stageRef,
    startDragging,
    stopDragging,
    updatePanPosition,
    updateZoom,
    deselectObject,
    creationMode,
    startCreatingShape,
    updateCreatingShape,
    finishCreatingShape,
    isCreatingRectangle,
    isCreatingCircle,
    isCreatingText,
    userCursorColor,
    user
  });

  // Initialize keyboard shortcuts
  const keyboardShortcuts = useKeyboardShortcuts({
    getSelectedObjects,
    removeObject,
    addObject,
    updateObject,
    isEnabled: true // Always enabled for now
  });

  // Initialize cursor tracking on the stage
  useEffect(() => {
    if (stageRef.current && user) {
      const stageElement = stageRef.current.getStage().container();
      return initializeCursorTracking(stageElement);
    }
  }, [initializeCursorTracking, user]);

  // Memoize selected objects to avoid recalculating on every render
  const selectedObjects = useMemo(() => {
    return objects.filter(obj => selectedObjectIds.includes(obj.id));
  }, [objects, selectedObjectIds]);

  // Get the first selected text object for formatting panel
  const selectedTextObject = useMemo(() => {
    return selectedObjects.find(obj => obj.type === 'text');
  }, [selectedObjects]);

  // Get any selected object for color picker
  const selectedObjectForColor = useMemo(() => {
    return selectedObjects.length === 1 ? selectedObjects[0] : null;
  }, [selectedObjects]);

  // Color picker state
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Handle rectangle selection
  const handleRectangleSelect = useCallback((rectangleId, multiSelect = false) => {
    selectObject(rectangleId, multiSelect);
  }, [selectObject]);

  // Handle rectangle movement  
  const handleRectangleMove = useCallback(async (rectangleId, newPosition) => {
    try {
      await updateObject(rectangleId, newPosition);
    } catch (error) {
      console.error('Failed to move rectangle:', error);
    }
  }, [updateObject]);

  // Handle rectangle transform (resize/rotate)
  const handleRectangleTransform = useCallback(async (rectangleId, transformData) => {
    try {
      await updateObject(rectangleId, transformData);
    } catch (error) {
      console.error('Failed to transform rectangle:', error);
    }
  }, [updateObject]);

  // Handle circle transform (resize/rotate)
  const handleCircleTransform = useCallback(async (circleId, transformData) => {
    try {
      await updateObject(circleId, transformData);
    } catch (error) {
      console.error('Failed to transform circle:', error);
    }
  }, [updateObject]);

  // Handle text transform (resize/rotate)
  const handleTextTransform = useCallback(async (textId, transformData) => {
    try {
      await updateObject(textId, transformData);
    } catch (error) {
      console.error('Failed to transform text:', error);
    }
  }, [updateObject]);

  // Handle text editing (content and formatting)
  const handleTextEdit = useCallback(async (textId, updates) => {
    try {
      await updateObject(textId, updates);
    } catch (error) {
      console.error('Failed to update text:', error);
    }
  }, [updateObject]);

  // Handle color changes for selected objects
  const handleColorChange = useCallback(async (newColor) => {
    if (!selectedObjectForColor) return;

    try {
      await updateObject(selectedObjectForColor.id, { fill: newColor });
      setShowColorPicker(false);
    } catch (error) {
      console.error('Failed to update object color:', error);
    }
  }, [selectedObjectForColor, updateObject]);

  // Handle opening color picker
  const handleOpenColorPicker = useCallback(() => {
    if (selectedObjectForColor) {
      setShowColorPicker(true);
    }
  }, [selectedObjectForColor]);

  // Handle canvas export
  const handleExportCanvas = useCallback(async () => {
    try {
      const { exportCanvasToPNG } = await import('../../utils/exportCanvas.js');
      const success = await exportCanvasToPNG(stageRef, 'collabcanvas');
      if (success) {
        console.log('Canvas exported successfully!');
      }
    } catch (error) {
      console.error('Failed to export canvas:', error);
    }
  }, [stageRef]);

  // Handle multi-object movement
  const handleMultiObjectMove = useCallback(async (selectedObjectsParam, delta, isFinal = false) => {
    try {
      // Move all selected objects by the same delta
      const movePromises = selectedObjectsParam.map(async (obj) => {
        const newX = obj.x + delta.deltaX;
        const newY = obj.y + delta.deltaY;
        
        if (isFinal) {
          // Final position - update in Firestore
          await updateObject(obj.id, { x: newX, y: newY });
        } else {
          // Intermediate position - for real-time visual feedback
          // Note: For now we'll skip intermediate updates to reduce Firestore calls
          // In the future, we could implement local state updates for smoother dragging
        }
      });
      
      if (isFinal) {
        await Promise.all(movePromises);
      }
    } catch (error) {
      console.error('Failed to move multiple objects:', error);
    }
  }, [updateObject]);



  return (
    <div 
      className={`canvas-stage ${isDragging ? 'dragging' : ''}`}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        cursor: getCursorStyle(isDragging)
      }}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        x={panPosition.x}
        y={panPosition.y}
        scaleX={zoom}
        scaleY={zoom}
        draggable={!isCreatingRectangle && !isCreatingCircle && !isCreatingText}
        onDragStart={handleDragStart}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onDragEnd={handleDragEnd}
        onWheel={handleWheel}
      >
        {/* Main canvas layer - this will contain all canvas objects */}
        <Layer>
          {/* Render existing objects */}
          {objects.map((obj) => {
            if (obj.type === 'rectangle') {
              return (
                <Rectangle
                  key={obj.id}
                  rectangle={obj}
                  isSelected={isObjectSelected(obj.id)}
                  onSelect={handleRectangleSelect}
                  onMove={handleRectangleMove}
                  onTransform={handleRectangleTransform}
                  selectedObjects={selectedObjects}
                  onMultiMove={handleMultiObjectMove}
                />
              );
            } else if (obj.type === 'circle') {
              return (
                <Circle
                  key={obj.id}
                  circle={obj}
                  isSelected={isObjectSelected(obj.id)}
                  onSelect={handleRectangleSelect} // Same selection logic
                  onMove={handleRectangleMove} // Same move logic
                  onTransform={handleCircleTransform}
                  selectedObjects={selectedObjects}
                  onMultiMove={handleMultiObjectMove}
                />
              );
            } else if (obj.type === 'text') {
              return (
                <Text
                  key={obj.id}
                  text={obj}
                  isSelected={isObjectSelected(obj.id)}
                  onSelect={handleRectangleSelect} // Same selection logic
                  onMove={handleRectangleMove} // Same move logic
                  onEdit={handleTextEdit} // Text-specific editing
                  onTransform={handleTextTransform}
                  selectedObjects={selectedObjects}
                  onMultiMove={handleMultiObjectMove}
                />
              );
            }
            return null;
          })}
          
          {/* Render current rectangle being created (preview) */}
          {currentRectangle && (
            <Rect
              key={currentRectangle.id}
              x={currentRectangle.x}
              y={currentRectangle.y}
              width={currentRectangle.width}
              height={currentRectangle.height}
              fill={currentRectangle.fill}
              stroke={currentRectangle.stroke}
              strokeWidth={currentRectangle.strokeWidth}
              opacity={currentRectangle.opacity}
              dash={[5, 5]} // Dashed border for preview
            />
          )}
          
          {/* Render current circle being created (preview) */}
          {currentCircle && (
            <KonvaCircle
              key={currentCircle.id}
              x={currentCircle.x}
              y={currentCircle.y}
              radius={currentCircle.radius}
              fill={currentCircle.fill}
              stroke={currentCircle.stroke}
              strokeWidth={currentCircle.strokeWidth}
              opacity={currentCircle.opacity}
              dash={[5, 5]} // Dashed border for preview
            />
          )}
        </Layer>

        {/* Cursor layer for real-time multiplayer cursors */}
        <CursorLayer
          onlineUsers={onlineUsers}
          currentUserId={user?.uid}
          scale={zoom}
          showCursors={presenceConnected && cursorSyncConnected}
          canvasBounds={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        />
        
        {/* UI layer for controls, selection indicators, etc. */}
        <Layer listening={false}>
          {/* Non-interactive UI elements will go here */}
        </Layer>
      </Stage>

      {/* Canvas loading state */}
      {isLoading && (
        <div className="canvas-loading">
          <div className="loading-spinner"></div>
          Loading canvas objects...
        </div>
      )}

      {/* Sync error notification */}
      {syncError && (
        <div className="canvas-error">
          <div className="error-message">
            ⚠️ Sync Error: {syncError}
          </div>
        </div>
      )}

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="canvas-debug">
          <div>Zoom: {(zoom * 100).toFixed(0)}% | Objects: {objects.length} | Online: {onlineUsers.length}</div>
        </div>
      )}

      {/* Fixed sidebar toolbox for shape creation */}
      <Toolbox
        selectedTool={selectedTool}
        onToolSelect={handleToolSelect}
        isVisible={true}
        selectedObjectsCount={selectedObjects.length}
        onColorPickerOpen={selectedObjects.length === 1 ? handleOpenColorPicker : null}
        onExportCanvas={handleExportCanvas}
        debugInfo={{
          position: panPosition,
          zoom: zoom,
          cursor: {
            x: cursorPosition.x,
            y: cursorPosition.y,
            isTracking: isTracking
          },
          onlineUsers: onlineUsers,
          otherCursors: otherCursors,
          currentUserId: user?.uid
        }}
      />

      {/* Text formatting panel - shows when text is selected */}
      {selectedTextObject && (
        <TextFormattingPanel
          textObject={selectedTextObject}
          onChange={(updatedText) => handleTextEdit(selectedTextObject.id, updatedText)}
          onClose={() => deselectObject()}
        />
      )}

      {/* Color picker - shows when any single object is selected and color picker is opened */}
      {showColorPicker && selectedObjectForColor && (
        <ColorPicker
          currentColor={selectedObjectForColor.fill || '#667eea'}
          onChange={handleColorChange}
          onClose={() => setShowColorPicker(false)}
          isVisible={showColorPicker}
        />
      )}

      {/* TEMPORARY TEST BUTTON FOR TOOLTIPS */}
      {process.env.NODE_ENV === 'development' && (
        <button 
          onClick={() => {
            // Force visual feedback on the first object
            if (objects.length > 0) {
              const firstObject = objects[0];
              updateObject(firstObject.id, {
                lastModifiedByName: user?.displayName || user?.email || 'Test User',
                lastModified: Date.now(),
                _conflictResolved: true,
                _lastEditorColor: '#ff6b6b'
              });
              console.log('🧪 Test tooltip applied to:', firstObject.id, firstObject);
            } else {
              console.log('🧪 No objects to test tooltip on. Create a shape first!');
            }
          }}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            padding: '8px 12px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            zIndex: 1000,
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          🧪 Test Tooltip
        </button>
      )}
    </div>
  );
};

export default Canvas;
