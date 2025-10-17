import { useCallback } from 'react';

/**
 * Custom hook for managing canvas event handlers
 * Handles drag, wheel, mouse events for canvas interaction
 */
export const useCanvasEvents = ({
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
}) => {
  
  // Handle drag (pan) functionality
  const handleDragStart = useCallback((e) => {
    // If event is provided, check if it's from a shape
    if (e && e.target && e.target !== e.target.getStage()) {
      return;
    }
    
    startDragging();
  }, [startDragging]);

  const handleDragEnd = useCallback((e) => {
    // Only handle drag end if it's the Stage itself
    if (e.target !== e.target.getStage()) {
      return;
    }
    
    const stage = e.target;
    updatePanPosition({
      x: stage.x(),
      y: stage.y()
    });
    stopDragging();
  }, [updatePanPosition, stopDragging]);

  // Handle zoom and trackpad pan functionality
  const handleWheel = useCallback((e) => {
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
  }, [stageRef, updateZoom, updatePanPosition]);

  // Handle stage clicks (empty canvas area only)
  const handleStageMouseDown = useCallback((e) => {
    // More robust check - ensure we're only handling Stage clicks
    if (e.target !== e.target.getStage()) {
      return;
    }

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
    } else if (creationMode === 'circle' && pointerPos) {
      // Start circle creation
      startCreatingShape('circle', pointerPos, {
        userColor: userCursorColor || '#667eea'
      });
      return; // Don't start dragging when creating
    } else if (creationMode === 'text' && pointerPos) {
      // Create text immediately (no drag creation)
      startCreatingShape('text', pointerPos, {
        userColor: '#000000' // Black text by default
      });
      return; // Don't start dragging when creating
    }

    // Handle normal canvas interactions (pan/drag)
    handleDragStart();
  }, [deselectObject, creationMode, startCreatingShape, userCursorColor, handleDragStart]);

  // Handle mouse move for creation
  const handleStageMouseMove = useCallback((e) => {
    if (isCreatingRectangle || isCreatingCircle) {
      const stage = e.target.getStage();
      const pointerPos = stage.getPointerPosition();
      if (pointerPos) {
        updateCreatingShape(pointerPos);
      }
    }
  }, [isCreatingRectangle, isCreatingCircle, updateCreatingShape]);

  // Handle mouse up for creation
  const handleStageMouseUp = useCallback((e) => {
    if (isCreatingRectangle || isCreatingCircle) {
      finishCreatingShape({
        userColor: userCursorColor || '#667eea',
        userId: user?.uid
      });
      return;
    }

    // Only handle mouse up if it's on the Stage itself (not on shapes)
    if (e.target !== e.target.getStage()) {
      return;
    }

    // Handle normal drag end
    const stage = e.target;
    updatePanPosition({
      x: stage.x(),
      y: stage.y()
    });
    stopDragging();
  }, [isCreatingRectangle, isCreatingCircle, finishCreatingShape, userCursorColor, user, updatePanPosition, stopDragging]);

  return {
    handleDragStart,
    handleDragEnd,
    handleWheel,
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp
  };
};
