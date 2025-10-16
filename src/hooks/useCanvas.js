import { useState, useCallback, useRef } from 'react';
import { INITIAL_ZOOM } from '../utils/constants.js';
import { 
  clampZoom, 
  calculateZoomPosition,
  screenToCanvas,
  canvasToScreen 
} from '../utils/canvasHelpers.js';

/**
 * Custom hook for managing canvas state
 * Handles objects, selection, zoom, pan position, and canvas interactions
 */
export const useCanvas = () => {
  // Canvas objects state
  const [objects, setObjects] = useState([]);
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  
  // Canvas viewport state
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  
  // Canvas interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Refs for performance
  const stageRef = useRef(null);

  // Object management functions
  const addObject = useCallback((newObject) => {
    const objectWithId = {
      ...newObject,
      id: newObject.id || `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    setObjects(prev => [...prev, objectWithId]);
    return objectWithId.id;
  }, []);

  const updateObject = useCallback((objectId, updates) => {
    setObjects(prev => prev.map(obj => 
      obj.id === objectId 
        ? { ...obj, ...updates, updatedAt: Date.now() }
        : obj
    ));
  }, []);

  const removeObject = useCallback((objectId) => {
    setObjects(prev => prev.filter(obj => obj.id !== objectId));
    if (selectedObjectId === objectId) {
      setSelectedObjectId(null);
    }
  }, [selectedObjectId]);

  const selectObject = useCallback((objectId) => {
    setSelectedObjectId(objectId);
  }, []);

  const deselectObject = useCallback(() => {
    setSelectedObjectId(null);
  }, []);

  const getSelectedObject = useCallback(() => {
    return objects.find(obj => obj.id === selectedObjectId) || null;
  }, [objects, selectedObjectId]);

  // Canvas viewport functions
  const updateZoom = useCallback((newZoom, pointer = null) => {
    const clampedZoom = clampZoom(newZoom);
    
    if (pointer && stageRef.current) {
      const stage = stageRef.current;
      const oldScale = stage.scaleX();
      const currentPosition = { x: stage.x(), y: stage.y() };
      
      const newPos = calculateZoomPosition(pointer, oldScale, clampedZoom, currentPosition);
      setPanPosition(newPos);
    }
    
    setZoom(clampedZoom);
  }, []);

  const updatePanPosition = useCallback((position) => {
    setPanPosition(position);
  }, []);

  const resetViewport = useCallback(() => {
    setZoom(INITIAL_ZOOM);
    setPanPosition({ x: 0, y: 0 });
  }, []);

  // Canvas interaction functions
  const startDragging = useCallback(() => {
    setIsDragging(true);
  }, []);

  const stopDragging = useCallback(() => {
    setIsDragging(false);
  }, []);

  const startCreating = useCallback(() => {
    setIsCreating(true);
  }, []);

  const stopCreating = useCallback(() => {
    setIsCreating(false);
  }, []);

  // Utility functions
  const clearCanvas = useCallback(() => {
    setObjects([]);
    setSelectedObjectId(null);
  }, []);

  const getObjectCount = useCallback(() => {
    return objects.length;
  }, [objects]);

  // Canvas coordinate transformations
  const convertScreenToCanvas = useCallback((screenPoint) => {
    return screenToCanvas(screenPoint, stageRef.current);
  }, []);

  const convertCanvasToScreen = useCallback((canvasPoint) => {
    return canvasToScreen(canvasPoint, stageRef.current);
  }, []);

  return {
    // State
    objects,
    selectedObjectId,
    zoom,
    panPosition,
    isDragging,
    isCreating,
    stageRef,
    
    // Object management
    addObject,
    updateObject,
    removeObject,
    selectObject,
    deselectObject,
    getSelectedObject,
    
    // Viewport management
    updateZoom,
    updatePanPosition,
    resetViewport,
    
    // Interaction state
    startDragging,
    stopDragging,
    startCreating,
    stopCreating,
    
    // Utilities
    clearCanvas,
    getObjectCount,
    screenToCanvas: convertScreenToCanvas,
    canvasToScreen: convertCanvasToScreen
  };
};
