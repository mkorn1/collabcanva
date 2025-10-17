import { useState, useCallback, useRef, useEffect } from 'react';
import { INITIAL_ZOOM, MIN_RECTANGLE_SIZE, LOADING_TIMEOUT_MS } from '../utils/constants.js';
import { 
  clampZoom, 
  clampPanPosition,
  calculateZoomPosition,
  screenToCanvas,
  canvasToScreen 
} from '../utils/canvasHelpers.js';
import {
  createObject,
  updateObject as updateObjectInFirestore,
  deleteObject,
  listenToObjects
} from '../services/firestore.js';

/**
 * Custom hook for managing canvas state with Firestore persistence
 * Handles objects, selection, zoom, pan position, canvas interactions, and real-time sync
 * @param {string} canvasId - The canvas ID for Firestore operations
 * @param {Object} user - Current authenticated user for object attribution
 */
export const useCanvas = (canvasId = 'main', user = null) => {
  // Canvas objects state  
  const [objects, setObjects] = useState([]);
  const [selectedObjectIds, setSelectedObjectIds] = useState([]);
  
  // Sync state
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState(null);
  
  // Canvas viewport state
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  
  // Canvas interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Rectangle creation state
  const [currentRectangle, setCurrentRectangle] = useState(null);
  const [isCreatingRectangle, setIsCreatingRectangle] = useState(false);
  
  // Refs for performance and cleanup
  const stageRef = useRef(null);
  const dragStartRef = useRef(null);
  const objectsUnsubscribeRef = useRef(null);

  // Local object management (for immediate UI updates before Firestore sync)
  const addObjectLocally = useCallback((newObject) => {
    const objectWithId = {
      ...newObject,
      id: newObject.id || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    setObjects(prev => [...prev, objectWithId]);
    return objectWithId.id;
  }, []);

  // Firestore object management
  const addObject = useCallback(async (newObject) => {
    if (!canvasId) {
      return addObjectLocally(newObject);
    }

    try {
      // Create object with proper structure for Firestore
      const objectForFirestore = {
        ...newObject,
        type: newObject.type || 'rectangle',
        createdBy: user?.uid || null,
        createdByName: user?.displayName || user?.email || 'Anonymous'
      };

      // Save to Firestore (this will trigger the real-time listener to update local state)
      const firestoreId = await createObject(canvasId, objectForFirestore);
      return firestoreId;
    } catch (error) {
      console.error('Failed to save object to Firestore, keeping local only:', error);
      setSyncError(error.message);
      // Keep the object locally even if Firestore fails
      return newObject.id;
    }
  }, [canvasId, user, addObjectLocally]);

  const updateObject = useCallback(async (objectId, updates) => {
    if (!canvasId) {
      setObjects(prev => prev.map(obj => 
        obj.id === objectId 
          ? { ...obj, ...updates, updatedAt: Date.now() }
          : obj
      ));
      return;
    }

    try {
      // Update in Firestore (this will trigger the real-time listener to update local state)
      await updateObjectInFirestore(canvasId, objectId, updates);
    } catch (error) {
      console.error('Failed to update object in Firestore, updating locally only:', error);
      setSyncError(error.message);
      // Fallback to local-only if Firestore fails
      setObjects(prev => prev.map(obj => 
        obj.id === objectId 
          ? { ...obj, ...updates, updatedAt: Date.now() }
          : obj
      ));
    }
  }, [canvasId]);

  const removeObject = useCallback(async (objectId) => {
    if (!canvasId) {
      setObjects(prev => prev.filter(obj => obj.id !== objectId));
      // Remove from selection if it was selected
      setSelectedObjectIds(prev => prev.filter(id => id !== objectId));
      return;
    }

    try {
      // Remove from Firestore (this will trigger the real-time listener to update local state)
      await deleteObject(canvasId, objectId);
    } catch (error) {
      console.error('Failed to delete object from Firestore, removing locally only:', error);
      setSyncError(error.message);
      // Fallback to local-only if Firestore fails
      setObjects(prev => prev.filter(obj => obj.id !== objectId));
      // Remove from selection if it was selected
      setSelectedObjectIds(prev => prev.filter(id => id !== objectId));
    }
  }, [canvasId]);

  const selectObject = useCallback((objectId, multiSelect = false) => {
    if (multiSelect) {
      setSelectedObjectIds(prev => {
        if (prev.includes(objectId)) {
          // Remove from selection if already selected
          return prev.filter(id => id !== objectId);
        } else {
          // Add to selection
          return [...prev, objectId];
        }
      });
    } else {
      // Single select - replace selection
      setSelectedObjectIds([objectId]);
    }
  }, []);

  const deselectObject = useCallback((objectId = null) => {
    if (objectId) {
      // Deselect specific object
      setSelectedObjectIds(prev => prev.filter(id => id !== objectId));
    } else {
      // Deselect all
      setSelectedObjectIds([]);
    }
  }, []);

  const selectAll = useCallback(() => {
    setSelectedObjectIds(objects.map(obj => obj.id));
  }, [objects]);

  const getSelectedObjects = useCallback(() => {
    return objects.filter(obj => selectedObjectIds.includes(obj.id));
  }, [objects, selectedObjectIds]);

  const isObjectSelected = useCallback((objectId) => {
    return selectedObjectIds.includes(objectId);
  }, [selectedObjectIds]);

  // Canvas viewport functions
  const updateZoom = useCallback((newZoom, pointer = null) => {
    const clampedZoom = clampZoom(newZoom);
    
    if (pointer && stageRef.current) {
      const stage = stageRef.current;
      const oldScale = stage.scaleX();
      const currentPosition = { x: stage.x(), y: stage.y() };
      
      const newPos = calculateZoomPosition(pointer, oldScale, clampedZoom, currentPosition);
      const clampedPos = clampPanPosition(newPos);
      setPanPosition(clampedPos);
    }
    
    setZoom(clampedZoom);
  }, []);

  const updatePanPosition = useCallback((position) => {
    const clampedPosition = clampPanPosition(position);
    setPanPosition(clampedPosition);
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


  // Canvas coordinate transformations
  const convertScreenToCanvas = useCallback((screenPoint) => {
    return screenToCanvas(screenPoint, stageRef.current);
  }, []);

  const convertCanvasToScreen = useCallback((canvasPoint) => {
    return canvasToScreen(canvasPoint, stageRef.current);
  }, []);

  // Firestore synchronization
  useEffect(() => {
    if (!canvasId) {
      setIsLoading(false);
      return;
    }

    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
      setSyncError('Connection timeout - using local mode');
    }, LOADING_TIMEOUT_MS);

    try {
      // Listen to real-time object changes
      const unsubscribe = listenToObjects(canvasId, (firestoreObjects) => {
        clearTimeout(loadingTimeout);
        setObjects(firestoreObjects);
        setIsLoading(false);
        setSyncError(null);
      });

      objectsUnsubscribeRef.current = unsubscribe;

    } catch (error) {
      console.error('Error setting up object sync:', error);
      clearTimeout(loadingTimeout);
      setSyncError(error.message);
      setIsLoading(false);
    }

    // Cleanup on unmount or canvasId change
    return () => {
      clearTimeout(loadingTimeout);
      if (objectsUnsubscribeRef.current) {
        objectsUnsubscribeRef.current();
        objectsUnsubscribeRef.current = null;
      }
    };
  }, [canvasId]);

  // Rectangle creation functions
  const startRectangleCreation = useCallback((startPoint, userColor = '#667eea') => {
    const canvasPoint = screenToCanvas(startPoint, stageRef.current);
    
    dragStartRef.current = canvasPoint;
    setIsCreatingRectangle(true);
    setIsCreating(true);
    
    // Create initial rectangle preview
    const initialRect = {
      id: `temp_rect_${Date.now()}`,
      type: 'rectangle',
      x: canvasPoint.x,
      y: canvasPoint.y,
      width: 0,
      height: 0,
      fill: userColor,
      stroke: userColor,
      strokeWidth: 2,
      opacity: 0.7,
      isPreview: true, // Mark as preview for visual distinction
      createdBy: null // Will be set when finalized
    };
    
    setCurrentRectangle(initialRect);
  }, []);

  const updateRectangleCreation = useCallback((currentPoint) => {
    if (!isCreatingRectangle || !dragStartRef.current || !currentRectangle) {
      return;
    }
    
    const canvasPoint = screenToCanvas(currentPoint, stageRef.current);
    const start = dragStartRef.current;
    
    // Calculate rectangle dimensions
    const minX = Math.min(start.x, canvasPoint.x);
    const minY = Math.min(start.y, canvasPoint.y);
    const width = Math.abs(canvasPoint.x - start.x);
    const height = Math.abs(canvasPoint.y - start.y);
    
    // Update preview rectangle
    const updatedRect = {
      ...currentRectangle,
      x: minX,
      y: minY,
      width: width,
      height: height
    };
    
    setCurrentRectangle(updatedRect);
  }, [isCreatingRectangle, currentRectangle]);

  const cancelRectangleCreation = useCallback(() => {
    setCurrentRectangle(null);
    setIsCreatingRectangle(false);
    setIsCreating(false);
    dragStartRef.current = null;
  }, []);

  const finishRectangleCreation = useCallback((userColor = '#667eea', userId = null) => {
    if (!isCreatingRectangle || !currentRectangle || !dragStartRef.current) {
      return null;
    }
    
    // Only create rectangle if it has meaningful size
    if (currentRectangle.width < MIN_RECTANGLE_SIZE && currentRectangle.height < MIN_RECTANGLE_SIZE) {
      cancelRectangleCreation();
      return null;
    }
    
    // Create final rectangle object
    const finalRect = {
      ...currentRectangle,
      id: `rect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      opacity: 1.0, // Full opacity for final rectangle
      isPreview: false,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Add to objects array
    const objectId = addObject(finalRect);
    
    // Clean up creation state
    setCurrentRectangle(null);
    setIsCreatingRectangle(false);
    setIsCreating(false);
    dragStartRef.current = null;
    
    return objectId;
  }, [isCreatingRectangle, currentRectangle, addObject, cancelRectangleCreation]);

  // Enhanced creation state management
  const startCreatingShape = useCallback((shapeType, startPoint, options = {}) => {
    if (shapeType === 'rectangle') {
      startRectangleCreation(startPoint, options.userColor);
    }
    // Future: Add other shapes like circle, line, etc.
  }, [startRectangleCreation]);

  const updateCreatingShape = useCallback((currentPoint) => {
    if (isCreatingRectangle) {
      updateRectangleCreation(currentPoint);
    }
    // Future: Handle other shapes
  }, [isCreatingRectangle, updateRectangleCreation]);

  const finishCreatingShape = useCallback((options = {}) => {
    if (isCreatingRectangle) {
      return finishRectangleCreation(options.userColor, options.userId);
    }
    // Future: Handle other shapes
    return null;
  }, [isCreatingRectangle, finishRectangleCreation]);

  const cancelCreatingShape = useCallback(() => {
    if (isCreatingRectangle) {
      cancelRectangleCreation();
    }
    // Future: Handle other shapes
  }, [isCreatingRectangle, cancelRectangleCreation]);

  return {
    // State
    objects,
    selectedObjectIds,
    zoom,
    panPosition,
    isDragging,
    isCreating,
    stageRef,
    
    // Rectangle creation state
    currentRectangle,
    isCreatingRectangle,
    
    // Sync state
    isLoading,
    syncError,
    
    // Object management
    addObject,
    updateObject,
    removeObject,
    selectObject,
    deselectObject,
    selectAll,
    getSelectedObjects,
    isObjectSelected,
    
    // Viewport management
    updateZoom,
    updatePanPosition,
    resetViewport,
    
    // Interaction state
    startDragging,
    stopDragging,
    startCreating,
    stopCreating,
    
    // Shape creation (generic)
    startCreatingShape,
    updateCreatingShape,
    finishCreatingShape,
    cancelCreatingShape,
    
    // Utilities
    screenToCanvas: convertScreenToCanvas,
    canvasToScreen: convertCanvasToScreen
  };
};
