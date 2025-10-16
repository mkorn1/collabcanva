import React, { useEffect, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT
} from '../../utils/constants.js';
import { useCanvas } from '../../hooks/useCanvas.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { usePresence } from '../../hooks/usePresence.js';
import { useRealtimeCursor } from '../../hooks/useRealtimeCursor.js';
import CursorLayer from '../Collaboration/CursorLayer.jsx';

const Canvas = () => {
  const {
    zoom,
    panPosition,
    updateZoom,
    updatePanPosition,
    stageRef,
    startDragging,
    stopDragging,
    isDragging
  } = useCanvas();

  // Get current authenticated user
  const { user } = useAuth();

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

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const headerHeight = 60;
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight - headerHeight
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

  // Handle drag (pan) functionality
  const handleDragStart = () => {
    startDragging();
  };

  const handleDragEnd = (e) => {
    const stage = e.target;
    updatePanPosition({
      x: stage.x(),
      y: stage.y()
    });
    stopDragging();
  };

  // Handle zoom functionality
  const handleWheel = (e) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    // Calculate zoom direction and amount
    const scaleBy = 1.05;
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    
    // Use the hook's updateZoom function which handles limits and positioning
    updateZoom(newScale, pointer);
  };

  return (
    <div 
      className={`canvas-stage ${isDragging ? 'dragging' : ''}`}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative'
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
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onWheel={handleWheel}
      >
        {/* Main canvas layer - this will contain all canvas objects */}
        <Layer>
          {/* Canvas background - visual indicator of the canvas bounds */}
          <React.Fragment>
            {/* Grid pattern or canvas boundary could go here in the future */}
            {/* For now, we have an empty layer ready for objects */}
          </React.Fragment>
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

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="canvas-debug">
          <div>Canvas: {CANVAS_WIDTH} × {CANVAS_HEIGHT}</div>
          <div>Zoom: {(zoom * 100).toFixed(0)}%</div>
          <div>Position: x:{Math.round(panPosition.x)}, y:{Math.round(panPosition.y)}</div>
          <div>Cursor: x:{Math.round(cursorPosition.x)}, y:{Math.round(cursorPosition.y)} {isTracking ? '(tracking)' : '(idle)'}</div>
          <div>State: {isDragging ? 'Dragging' : 'Idle'}</div>
          <div>Presence: {presenceConnected ? '✅' : '❌'} | Sync: {syncStatus}</div>
          <div>Online Users: {onlineUsers.length} | Other Cursors: {otherCursors.length}</div>
          {userCursorColor && <div>My Color: <span style={{color: userCursorColor}}>●</span> {userCursorColor}</div>}
        </div>
      )}
    </div>
  );
};

export default Canvas;
