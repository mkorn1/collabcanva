import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Stage, Layer, Rect, Circle as KonvaCircle, Text as KonvaText } from 'react-konva';
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
import { performanceMonitor, withPerformanceMonitoring } from '../../utils/performanceMonitor.js';
import CursorLayer from '../Collaboration/CursorLayer.jsx';
import Toolbox from './Toolbox.jsx';
import Rectangle from './Rectangle.jsx';
import Circle from './Circle.jsx';
import Text from './Text.jsx';
import TextFormattingPanel from './TextFormattingPanel.jsx';
import ColorPicker from './ColorPicker.jsx';
import DeletionWarning from './DeletionWarning.jsx';

// Performance Stats Component for Development
const PerformanceStats = () => {
  const [stats, setStats] = useState({ fps: 0, avgOperationTime: '0.00', totalOperations: 0, slowOperations: 0, isHealthy: true });

  useEffect(() => {
    const updateStats = (data) => {
      setStats(performanceMonitor.getStats());
    };

    performanceMonitor.addCallback(updateStats);
    
    // Update stats every second
    const interval = setInterval(() => {
      setStats(performanceMonitor.getStats());
    }, 1000);

    return () => {
      performanceMonitor.removeCallback(updateStats);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: '50px',
        right: '10px',
        padding: '8px 12px',
        backgroundColor: stats.isHealthy ? '#28a745' : '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        zIndex: 1000,
        fontSize: '11px',
        fontFamily: 'monospace',
        minWidth: '120px'
      }}
    >
      <div>FPS: {stats.fps}</div>
      <div>Avg: {stats.avgOperationTime}ms</div>
      <div>Ops: {stats.totalOperations}</div>
      {stats.slowOperations > 0 && <div>Slow: {stats.slowOperations}</div>}
    </div>
  );
};

const Canvas = ({ canvasContext = null, previewObjects = [] }) => {
  // Get current authenticated user FIRST
  const { user } = useAuth();

  // Use provided canvas context or create our own
  const canvasHookResult = useCanvas('main', user);
  const canvasData = canvasContext || canvasHookResult;

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
    marqueeSelection,
    isMarqueeSelecting,
    isLoading,
    syncError,
    startCreatingShape,
    updateCreatingShape,
    finishCreatingShape,
    cancelCreatingShape,
    startMarqueeSelection,
    updateMarqueeSelection,
    finishMarqueeSelection,
    cancelMarqueeSelection,
    selectObject,
    deselectObject,
    updateObject,
    removeObject,
    addObject,
    getSelectedObjects,
    isObjectSelected
  } = canvasData;

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

  // Initialize performance monitoring
  useEffect(() => {
    console.log('🔧 PERFORMANCE MONITOR: Initializing transform operation monitoring');
    performanceMonitor.startMonitoring();
    
    // Add performance callback for debugging
    const performanceCallback = (data) => {
      if (data.fps < 60) {
        console.warn(`⚠️ PERFORMANCE ALERT: FPS dropped to ${data.fps}`);
      }
    };
    
    performanceMonitor.addCallback(performanceCallback);
    
    return () => {
      performanceMonitor.removeCallback(performanceCallback);
      performanceMonitor.stopMonitoring();
    };
  }, []);
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
    user,
    selectedTool,
    startMarqueeSelection,
    updateMarqueeSelection,
    finishMarqueeSelection,
    isMarqueeSelecting
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

  // Handle rectangle resize (debounced sync) with performance monitoring
  const handleRectangleResize = useCallback(withPerformanceMonitoring('rectangleResize', async (rectangleId, resizeData) => {
    console.log('🎯 CANVAS RECTANGLE RESIZE:', { rectangleId, resizeData });
    try {
      await updateObject(rectangleId, resizeData);
    } catch (error) {
      console.error('Failed to resize rectangle:', error);
    }
  }), [updateObject]);

  // Handle rectangle transform (rotation only - immediate sync) with performance monitoring
  const handleRectangleTransform = useCallback(withPerformanceMonitoring('rectangleTransform', async (rectangleId, transformData) => {
    try {
      await updateObject(rectangleId, transformData);
    } catch (error) {
      console.error('Failed to transform rectangle:', error);
    }
  }), [updateObject]);

  // Handle circle resize (debounced sync) with performance monitoring
  const handleCircleResize = useCallback(withPerformanceMonitoring('circleResize', async (circleId, resizeData) => {
    try {
      await updateObject(circleId, resizeData);
    } catch (error) {
      console.error('Failed to resize circle:', error);
    }
  }), [updateObject]);

  // Handle text resize (debounced sync) with performance monitoring
  const handleTextResize = useCallback(withPerformanceMonitoring('textResize', async (textId, resizeData) => {
    try {
      await updateObject(textId, resizeData);
    } catch (error) {
      console.error('Failed to resize text:', error);
    }
  }), [updateObject]);

  // Handle circle transform (rotation only - immediate sync) with performance monitoring
  const handleCircleTransform = useCallback(withPerformanceMonitoring('circleTransform', async (circleId, transformData) => {
    try {
      await updateObject(circleId, transformData);
    } catch (error) {
      console.error('Failed to transform circle:', error);
    }
  }), [updateObject]);

  // Handle text transform (rotation only - immediate sync) with performance monitoring
  const handleTextTransform = useCallback(withPerformanceMonitoring('textTransform', async (textId, transformData) => {
    try {
      await updateObject(textId, transformData);
    } catch (error) {
      console.error('Failed to transform text:', error);
    }
  }), [updateObject]);

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

  // Handle multi-object transform operations (resize and rotation) with performance monitoring
  const handleMultiObjectTransform = useCallback(withPerformanceMonitoring('multiObjectTransform', async (selectedObjectsParam, transformData, isFinal = false) => {
    try {
      console.log('🔧 MULTI-OBJECT TRANSFORM RECEIVED:', {
        selectedObjectsCount: selectedObjectsParam.length,
        selectedObjectIds: selectedObjectsParam.map(obj => ({ id: obj.id, type: obj.type, width: obj.width, height: obj.height, rotation: obj.rotation })),
        transformData,
        transformDataKeys: Object.keys(transformData),
        isFinal
      });
      
      console.log('🔧 MULTI-OBJECT TRANSFORM DATA ANALYSIS:', {
        hasWidth: transformData.width !== undefined,
        hasHeight: transformData.height !== undefined,
        hasRotation: transformData.rotation !== undefined,
        hasX: transformData.x !== undefined,
        hasY: transformData.y !== undefined,
        hasScaleX: transformData.scaleX !== undefined,
        hasScaleY: transformData.scaleY !== undefined,
        hasFontSize: transformData.fontSize !== undefined
      });

      if (!isFinal) {
        // Intermediate transform - skip Firestore updates for performance
        console.log('🔧 MULTI-OBJECT TRANSFORM: Skipping intermediate updates for performance');
        return;
      }

      // Batch size for optimal performance (adjust based on testing)
      const BATCH_SIZE = 5;
      const batches = [];
      
      // Split objects into batches
      for (let i = 0; i < selectedObjectsParam.length; i += BATCH_SIZE) {
        batches.push(selectedObjectsParam.slice(i, i + BATCH_SIZE));
      }

      console.log(`🔧 MULTI-OBJECT TRANSFORM: Processing ${selectedObjectsParam.length} objects in ${batches.length} batches`);

      // Process each batch sequentially to avoid overwhelming Firestore
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`🔧 MULTI-OBJECT TRANSFORM: Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} objects)`);
        
        // Process objects in current batch in parallel
        const batchPromises = batch.map(async (obj) => {
          const updates = {};
          
          console.log(`🔧 PROCESSING OBJECT ${obj.id}:`, {
            originalData: {
              width: obj.width,
              height: obj.height,
              rotation: obj.rotation,
              x: obj.x,
              y: obj.y
            },
            transformData
          });
          
          // Handle position changes (if any) - use deltas for multi-object operations
          if (transformData.deltaX !== undefined && transformData.deltaY !== undefined) {
            updates.x = obj.x + transformData.deltaX;
            updates.y = obj.y + transformData.deltaY;
            console.log(`🔧 APPLYING POSITION DELTA to ${obj.id}:`, { deltaX: transformData.deltaX, deltaY: transformData.deltaY });
          }
          
          // Handle rotation changes (if any) - apply same rotation to all objects
          if (transformData.rotation !== undefined) {
            updates.rotation = transformData.rotation;
            console.log(`🔧 APPLYING ROTATION to ${obj.id}:`, { from: obj.rotation, to: transformData.rotation });
          }
          
          // Handle scale changes (if any) - apply same scale to all objects
          if (transformData.scaleX !== undefined) {
            updates.scaleX = transformData.scaleX;
            console.log(`🔧 APPLYING SCALE X to ${obj.id}:`, { to: transformData.scaleX });
          }
          if (transformData.scaleY !== undefined) {
            updates.scaleY = transformData.scaleY;
            console.log(`🔧 APPLYING SCALE Y to ${obj.id}:`, { to: transformData.scaleY });
          }
          
          // Handle size changes (if any) - size data is now explicitly excluded from rotation operations
          if (transformData.width !== undefined) {
            updates.width = transformData.width;
            console.log(`🔧 APPLYING WIDTH to ${obj.id}:`, { from: obj.width, to: transformData.width });
          }
          if (transformData.height !== undefined) {
            updates.height = transformData.height;
            console.log(`🔧 APPLYING HEIGHT to ${obj.id}:`, { from: obj.height, to: transformData.height });
          }
          
          // Handle text-specific properties - fontSize is now explicitly excluded from rotation operations
          if (transformData.fontSize !== undefined) {
            updates.fontSize = transformData.fontSize;
            console.log(`🔧 APPLYING FONT SIZE to ${obj.id}:`, { to: transformData.fontSize });
          }
          
          console.log(`🔧 FINAL UPDATES for ${obj.id}:`, updates);
          
          // Apply updates if any exist
          if (Object.keys(updates).length > 0) {
            await updateObject(obj.id, updates);
            console.log(`🔧 MULTI-OBJECT TRANSFORM: Updated object ${obj.id}`, updates);
          } else {
            console.log(`🔧 MULTI-OBJECT TRANSFORM: No updates needed for ${obj.id}`);
          }
        });
        
        // Wait for current batch to complete before starting next batch
        await Promise.all(batchPromises);
        
        // Small delay between batches to prevent overwhelming Firestore
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay
        }
      }
      
      console.log('🔧 MULTI-OBJECT TRANSFORM: All batches completed successfully');
    } catch (error) {
      console.error('Failed to transform multiple objects:', error);
    }
  }), [updateObject]);



  return (
    <div 
      className={`canvas-stage ${isDragging ? 'dragging' : ''}`}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        cursor: getCursorStyle(isDragging, selectedTool)
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
        draggable={!isCreatingRectangle && !isCreatingCircle && !isCreatingText && !isMarqueeSelecting}
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
                  onResize={handleRectangleResize}
                  selectedObjects={selectedObjects}
                  onMultiMove={handleMultiObjectMove}
                  onMultiTransform={handleMultiObjectTransform}
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
                  onResize={handleCircleResize}
                  selectedObjects={selectedObjects}
                  onMultiMove={handleMultiObjectMove}
                  onMultiTransform={handleMultiObjectTransform}
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
                  onResize={handleTextResize}
                  selectedObjects={selectedObjects}
                  onMultiMove={handleMultiObjectMove}
                  onMultiTransform={handleMultiObjectTransform}
                />
              );
            }
            return null;
          })}
          
          {/* Render preview objects */}
          {previewObjects.map((previewObj) => {
            if (previewObj.type === 'rectangle') {
              return (
                <Rect
                  key={previewObj.id}
                  x={previewObj.x}
                  y={previewObj.y}
                  width={previewObj.width}
                  height={previewObj.height}
                  fill={previewObj.fill}
                  stroke={previewObj.stroke}
                  strokeWidth={previewObj.strokeWidth}
                  opacity={previewObj.opacity}
                  dash={previewObj.dash}
                  rotation={previewObj.rotation || 0}
                />
              );
            } else if (previewObj.type === 'circle') {
              return (
                <KonvaCircle
                  key={previewObj.id}
                  x={previewObj.x}
                  y={previewObj.y}
                  radius={previewObj.width / 2} // Convert diameter to radius
                  fill={previewObj.fill}
                  stroke={previewObj.stroke}
                  strokeWidth={previewObj.strokeWidth}
                  opacity={previewObj.opacity}
                  dash={previewObj.dash}
                  rotation={previewObj.rotation || 0}
                />
              );
            } else if (previewObj.type === 'text') {
              return (
                <KonvaText
                  key={previewObj.id}
                  x={previewObj.x}
                  y={previewObj.y}
                  text={previewObj.text || previewObj.text_content || 'New Text'}
                  fontSize={previewObj.fontSize || 16}
                  fontFamily={previewObj.fontFamily || 'Arial'}
                  fill={previewObj.fill}
                  stroke={previewObj.stroke}
                  strokeWidth={previewObj.strokeWidth}
                  opacity={previewObj.opacity}
                  dash={previewObj.dash}
                  rotation={previewObj.rotation || 0}
                  width={previewObj.width}
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
          
          {/* Render marquee selection */}
          {marqueeSelection && (
            <Rect
              key={marqueeSelection.id}
              x={marqueeSelection.x}
              y={marqueeSelection.y}
              width={marqueeSelection.width}
              height={marqueeSelection.height}
              fill="rgba(102, 126, 234, 0.1)"
              stroke="#667eea"
              strokeWidth={2}
              dash={[5, 5]}
              listening={false}
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
      {import.meta.env.DEV && (
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

    </div>
  );
};

export default Canvas;
