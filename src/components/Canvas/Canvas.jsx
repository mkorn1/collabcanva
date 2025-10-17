import React, { useEffect, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT
} from '../../utils/constants.js';
import { useCanvas } from '../../hooks/useCanvas.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { usePresence } from '../../hooks/usePresence.js';
import { useRealtimeCursor } from '../../hooks/useRealtimeCursor.js';
import CursorLayer from '../Collaboration/CursorLayer.jsx';
import Toolbox from './Toolbox.jsx';
import Rectangle from './Rectangle.jsx';

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
    isLoading,
    syncError,
    startCreatingShape,
    updateCreatingShape,
    finishCreatingShape,
    cancelCreatingShape,
    selectObject,
    deselectObject,
    updateObject,
    getSelectedObjects,
    isObjectSelected
  } = useCanvas('main', user);

  // State for online users tooltip
  const [showOnlineUsersTooltip, setShowOnlineUsersTooltip] = useState(false);

  // State for toolbox and creation mode
  const [selectedTool, setSelectedTool] = useState('select');
  const [creationMode, setCreationMode] = useState(null);

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


  const [stageSize, setStageSize] = useState(() => {
    // Calculate available space (full window minus header height)
    const headerHeight = 60;
    return {
      width: window.innerWidth,
      height: window.innerHeight - headerHeight
    };
  });

  // Calculate toolbox position for bottom left
  const [toolboxPosition, setToolboxPosition] = useState(() => {
    const headerHeight = 60;
    return {
      x: 20,
      y: window.innerHeight - headerHeight - 300 // Increased space for debug info + margin
    };
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const headerHeight = 60;
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight - headerHeight
      });
      
      // Update toolbox position on resize
      setToolboxPosition({
        x: 20,
        y: window.innerHeight - headerHeight - 300
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize cursor tracking on the stage
  useEffect(() => {
    if (stageRef.current && user) {
      const stageElement = stageRef.current.getStage().container();
      return initializeCursorTracking(stageElement);
    }
  }, [initializeCursorTracking, user]);

  // Debug: Track stage position and scale changes
  useEffect(() => {
    console.log('📍 Stage Position Changed:', panPosition);
    console.log('🔍 Stage Scale Changed:', zoom);
  }, [panPosition, zoom]);

  // Handle tool selection from toolbox
  const handleToolSelect = (toolId) => {
    setSelectedTool(toolId);
    
    // Set creation mode based on tool
    if (toolId === 'rectangle') {
      setCreationMode('rectangle');
    } else if (toolId === 'select') {
      setCreationMode(null);
    }
  };

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
  }, [isCreatingRectangle, cancelCreatingShape]);

  // Handle drag (pan) functionality
  const handleDragStart = (e) => {
    // If event is provided, check if it's from a shape
    if (e && e.target && e.target !== e.target.getStage()) {
      console.log('🔍 Drag started on shape, ignoring stage drag');
      return;
    }
    
    console.log('🎯 Stage drag started');
    startDragging();
  };

  const handleDragEnd = (e) => {
    // Only handle drag end if it's the Stage itself
    if (e.target !== e.target.getStage()) {
      console.log('🔍 Drag end on shape, ignoring stage handler');
      return;
    }
    
    console.log('🎯 Stage drag ended');
    const stage = e.target;
    updatePanPosition({
      x: stage.x(),
      y: stage.y()
    });
    stopDragging();
  };

  // Handle zoom and trackpad pan functionality
  const handleWheel = (e) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const event = e.evt;
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    
    // Check if this is a zoom gesture (ctrl/cmd held) or trackpad pan
    if (isCtrlOrCmd) {
      // Zoom with ctrl/cmd + scroll
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();

      // Calculate zoom direction and amount
      const scaleBy = 1.05;
      const newScale = event.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
      
      // Use the hook's updateZoom function which handles limits and positioning
      updateZoom(newScale, pointer);
    } else {
      // Trackpad panning - treat wheel events as pan movements
      const currentX = stage.x();
      const currentY = stage.y();
      
      // Apply pan movement (invert deltaX/deltaY for natural scrolling feel)
      // 4x sensitivity for more responsive panning
      const sensitivity = 4;
      const newPosition = {
        x: currentX - (event.deltaX * sensitivity),
        y: currentY - (event.deltaY * sensitivity)
      };
      
      // updatePanPosition will clamp the position to boundaries
      updatePanPosition(newPosition);
    }
  };

  // Handle stage clicks (empty canvas area only)
  const handleStageMouseDown = (e) => {
    // More robust check - ensure we're only handling Stage clicks
    if (e.target !== e.target.getStage()) {
      console.log('🔍 Click on shape, ignoring stage handler');
      return;
    }

    console.log('🎯 Click on empty canvas - handling stage interaction');
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();

    // Deselect any selected objects when clicking empty canvas
    deselectObject();

    if (creationMode === 'rectangle' && pointerPos) {
      // Start rectangle creation
      startCreatingShape('rectangle', pointerPos, {
        userColor: userCursorColor || '#667eea'
      });
      return; // Don't start dragging when creating
    }

    // Handle normal canvas interactions (pan/drag)
    handleDragStart();
  };

  // Handle rectangle selection
  const handleRectangleSelect = (rectangleId, multiSelect = false) => {
    selectObject(rectangleId, multiSelect);
  };

  // Handle rectangle movement
  const handleRectangleMove = async (rectangleId, newPosition) => {
    try {
      await updateObject(rectangleId, newPosition);
      console.log('✅ Rectangle moved:', rectangleId, newPosition);
    } catch (error) {
      console.error('❌ Failed to move rectangle:', error);
    }
  };

  // Handle multi-object movement
  const handleMultiObjectMove = async (selectedObjects, delta, isFinal = false) => {
    try {
      // Move all selected objects by the same delta
      const movePromises = selectedObjects.map(async (obj) => {
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
        console.log('✅ Multi-object move completed for', selectedObjects.length, 'objects');
      }
    } catch (error) {
      console.error('❌ Failed to move multiple objects:', error);
    }
  };

  // Handle mouse move for creation
  const handleStageMouseMove = (e) => {
    if (isCreatingRectangle) {
      const stage = e.target.getStage();
      const pointerPos = stage.getPointerPosition();
      if (pointerPos) {
        updateCreatingShape(pointerPos);
      }
    }
  };

  // Handle mouse up for creation
  const handleStageMouseUp = (e) => {
    if (isCreatingRectangle) {
      const createdId = finishCreatingShape({
        userColor: userCursorColor || '#667eea',
        userId: user?.uid
      });
      
      if (createdId) {
        console.log('🎉 Rectangle created with ID:', createdId);
      }
      return;
    }

    // Only handle mouse up if it's on the Stage itself (not on shapes)
    if (e.target !== e.target.getStage()) {
      console.log('🔍 Mouse up on shape, ignoring stage handler');
      return;
    }

    console.log('🎯 Mouse up on empty canvas - updating position');
    // Handle normal drag end
    const stage = e.target;
    updatePanPosition({
      x: stage.x(),
      y: stage.y()
    });
    stopDragging();
  };

  // Update cursor based on creation mode
  const getCursorStyle = () => {
    if (creationMode === 'rectangle') {
      return 'crosshair';
    }
    return isDragging ? 'grabbing' : 'grab';
  };

  // Quick debug: log current state
  console.log('Canvas render state:', {
    isLoading,
    syncError,
    objectsCount: objects?.length || 0,
    selectedObjectIds,
    selectedCount: selectedObjectIds?.length || 0,
    user: user?.uid || 'no-user'
  });

  return (
    <div 
      className={`canvas-stage ${isDragging ? 'dragging' : ''}`}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        cursor: getCursorStyle()
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
        draggable={!isCreatingRectangle}
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
                  selectedObjects={getSelectedObjects()}
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
          <div>Canvas: {CANVAS_WIDTH} × {CANVAS_HEIGHT}</div>
          <div>Zoom: {(zoom * 100).toFixed(0)}%</div>
          <div>Position: x:{Math.round(panPosition.x)}, y:{Math.round(panPosition.y)}</div>
          <div>Cursor: x:{Math.round(cursorPosition.x)}, y:{Math.round(cursorPosition.y)} {isTracking ? '(tracking)' : '(idle)'}</div>
          <div>State: {isDragging ? 'Dragging' : 'Idle'}</div>
          <div>Presence: {presenceConnected ? '✅' : '❌'} | Cursor Sync: {syncStatus} | Objects: {syncError ? '❌' : '✅'}</div>
          <div>Objects: {objects.length} | Selected: {selectedObjectIds.length > 0 ? `🟦 (${selectedObjectIds.length})` : '➖'} | Creating: {isCreatingRectangle ? '🟦' : '➖'}</div>
          <div>
            Online Users: {onlineUsers.length} | 
            <span 
              className="hoverable-text"
              onMouseEnter={() => setShowOnlineUsersTooltip(true)}
              onMouseLeave={() => setShowOnlineUsersTooltip(false)}
            >
              Other Cursors: {otherCursors.length}
              {showOnlineUsersTooltip && onlineUsers.length > 0 && (
                <div className="online-users-tooltip">
                  <div className="tooltip-header">Online Users:</div>
                  {onlineUsers.map((onlineUser) => (
                    <div key={onlineUser.id} className="tooltip-user">
                      <span 
                        className="user-color-dot" 
                        style={{ backgroundColor: onlineUser.cursorColor }}
                      ></span>
                      <span className="user-name">
                        {onlineUser.displayName || onlineUser.email || 'Anonymous'}
                        {onlineUser.id === user?.uid && ' (You)'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </span>
          </div>
          {userCursorColor && <div>My Color: <span style={{color: userCursorColor}}>●</span> {userCursorColor}</div>}
        </div>
      )}

      {/* Floating toolbox for shape creation */}
      <Toolbox
        selectedTool={selectedTool}
        onToolSelect={handleToolSelect}
        isVisible={true}
        position={toolboxPosition}
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
    </div>
  );
};

export default Canvas;
