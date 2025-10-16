import { useState, useCallback, useRef, useEffect } from 'react';
import { INITIAL_ZOOM } from '../utils/constants.js';
import { 
  clampZoom, 
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
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  
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
      console.warn('No canvas ID provided, adding object locally only');
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
      console.log('✅ Object saved to Firestore with ID:', firestoreId);
      return firestoreId;
    } catch (error) {
      console.error('❌ Failed to save object to Firestore, keeping local only:', error);
      setSyncError(error.message);
      // Keep the object locally even if Firestore fails
      return newObject.id;
    }
  }, [canvasId, user, addObjectLocally]);

  const updateObject = useCallback(async (objectId, updates) => {
    if (!canvasId) {
      console.warn('No canvas ID provided, updating object locally only');
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
      console.log('✅ Object updated in Firestore:', objectId);
    } catch (error) {
      console.error('❌ Failed to update object in Firestore, updating locally only:', error);
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
      console.warn('No canvas ID provided, removing object locally only');
      setObjects(prev => prev.filter(obj => obj.id !== objectId));
      if (selectedObjectId === objectId) {
        setSelectedObjectId(null);
      }
      return;
    }

    try {
      // Remove from Firestore (this will trigger the real-time listener to update local state)
      await deleteObject(canvasId, objectId);
      console.log('✅ Object deleted from Firestore:', objectId);
    } catch (error) {
      console.error('❌ Failed to delete object from Firestore, removing locally only:', error);
      setSyncError(error.message);
      // Fallback to local-only if Firestore fails
      setObjects(prev => prev.filter(obj => obj.id !== objectId));
      if (selectedObjectId === objectId) {
        setSelectedObjectId(null);
      }
    }
  }, [canvasId, selectedObjectId]);

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

  // Firestore synchronization
  useEffect(() => {
    if (!canvasId) {
      console.log('🟡 No canvas ID provided, using local-only mode');
      setIsLoading(false);
      return;
    }

    console.log('🔄 Setting up canvas object sync for canvas:', canvasId);

    try {
      // Listen to real-time object changes
      const unsubscribe = listenToObjects(canvasId, (firestoreObjects) => {
        console.log('📡 Received object update from Firestore:', firestoreObjects.length, 'objects');
        setObjects(firestoreObjects);
        setIsLoading(false);
        setSyncError(null);
      });

      objectsUnsubscribeRef.current = unsubscribe;

    } catch (error) {
      console.error('❌ Error setting up object sync:', error);
      setSyncError(error.message);
      setIsLoading(false);
    }

    // Cleanup on unmount or canvasId change
    return () => {
      if (objectsUnsubscribeRef.current) {
        console.log('🧹 Cleaning up object sync');
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
    
    console.log('🟦 Started rectangle creation at:', canvasPoint);
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
    
    console.log('❌ Rectangle creation cancelled');
  }, []);

  const finishRectangleCreation = useCallback((userColor = '#667eea', userId = null) => {
    if (!isCreatingRectangle || !currentRectangle || !dragStartRef.current) {
      return null;
    }
    
    // Only create rectangle if it has meaningful size
    const minSize = 10; // Minimum 10px width or height
    if (currentRectangle.width < minSize && currentRectangle.height < minSize) {
      console.log('🟦 Rectangle too small, cancelling creation');
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
    
    console.log('✅ Rectangle created successfully:', finalRect);
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
    selectedObjectId,
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
    
    // Shape creation (rectangle-specific)
    startRectangleCreation,
    updateRectangleCreation,
    finishRectangleCreation,
    cancelRectangleCreation,
    
    // Shape creation (generic)
    startCreatingShape,
    updateCreatingShape,
    finishCreatingShape,
    cancelCreatingShape,
    
    // Utilities
    clearCanvas,
    getObjectCount,
    screenToCanvas: convertScreenToCanvas,
    canvasToScreen: convertCanvasToScreen
  };
};
