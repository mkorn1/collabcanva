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
import { WriteQueue, ConflictResolver } from '../utils/debounce.js';
import {
  broadcastDeletionIntent,
  cancelDeletionIntent,
  confirmDeletionIntent,
  listenToDeletionIntents,
  getObjectDeletionIntent
} from '../services/deletionIntents.js';
import { broadcastDeletion, listenToLiveDeletions } from '../services/realtimeDeletions.js';

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
  
  // Circle creation state
  const [currentCircle, setCurrentCircle] = useState(null);
  const [isCreatingCircle, setIsCreatingCircle] = useState(false);
  
  // Text creation state
  const [currentText, setCurrentText] = useState(null);
  const [isCreatingText, setIsCreatingText] = useState(false);
  
  // Refs for performance and cleanup
  const stageRef = useRef(null);
  const dragStartRef = useRef(null);
  const objectsUnsubscribeRef = useRef(null);
  
  // Write queue for debouncing rapid updates (conflict resolution)
  const writeQueueRef = useRef(null);
  
  // Deletion intents state for smooth deletion conflict resolution
  const [deletionIntents, setDeletionIntents] = useState([]);
  const deletionIntentsUnsubscribeRef = useRef(null);
  
  // Live deletions state for immediate propagation
  const [liveDeletions, setLiveDeletions] = useState([]);
  const liveDeletionsUnsubscribeRef = useRef(null);

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

  // Initialize write queue for debounced updates
  useEffect(() => {
    if (canvasId && !writeQueueRef.current) {
      writeQueueRef.current = new WriteQueue(async (writesToProcess) => {
        // Batch process all pending writes
        const promises = [];
        
        for (const [objectId, updates] of writesToProcess) {
          promises.push(
            updateObjectInFirestore(canvasId, objectId, updates).catch(error => {
              console.error(`Failed to update object ${objectId}:`, error);
              setSyncError(error.message);
            })
          );
        }
        
        await Promise.allSettled(promises);
      }, 50); // 50ms debounce delay (below 100ms requirement)
    }
    
    return () => {
      if (writeQueueRef.current) {
        writeQueueRef.current.flush(); // Flush any pending writes
        writeQueueRef.current.clear();
        writeQueueRef.current = null;
      }
    };
  }, [canvasId]);

  const updateObject = useCallback(async (objectId, updates, options = {}) => {
    if (!canvasId) {
      setObjects(prev => prev.map(obj => 
        obj.id === objectId 
          ? { ...obj, ...updates, updatedAt: Date.now() }
          : obj
      ));
      return;
    }

    try {
      // Check if object has pending deletion intent
      const deletionBlock = ConflictResolver.checkDeletionBlock(objectId, deletionIntents);
      if (deletionBlock) {
        // Show user warning about pending deletion
        setSyncError(`Warning: "${deletionBlock.userName}" is trying to delete this object`);
        
        // Still allow the edit but mark it as conflicted
        updates._savedFromDeletion = true;
      }

      // Apply optimistic update locally for immediate feedback
      setObjects(prev => prev.map(obj => 
        obj.id === objectId 
          ? { 
              ...obj, 
              ...updates, 
              updatedAt: Date.now(),
              // Don't set lastModified here - let Firestore set it with serverTimestamp
              lastModifiedBy: user?.uid,
              lastModifiedByName: user?.displayName || user?.email || 'Anonymous',
              _isOptimistic: true // Mark as optimistic update
            }
          : obj
      ));

      // Check if this is a transform operation (resize/rotate)
      const isTransformOperation = updates.rotation !== undefined || 
                                  updates.width !== undefined || 
                                  updates.height !== undefined || 
                                  updates.radius !== undefined || 
                                  updates.fontSize !== undefined;
      
      if (isTransformOperation) {
        // Transform operations: use direct update for immediate sync
        await updateObjectInFirestore(canvasId, objectId, updates, options);
      } else {
        // Other operations: use write queue for debounced updates
        if (writeQueueRef.current) {
          writeQueueRef.current.queueUpdate(objectId, updates);
        } else {
          // Fallback to direct update if write queue not available
          await updateObjectInFirestore(canvasId, objectId, updates, options);
        }
      }
    } catch (error) {
      console.error('Failed to update object, using local fallback:', error);
      setSyncError(error.message);
      
      // Remove optimistic flag on error
      setObjects(prev => prev.map(obj => 
        obj.id === objectId && obj._isOptimistic
          ? { ...obj, _isOptimistic: false }
          : obj
      ));
    }
  }, [canvasId, user]);

  const removeObject = useCallback(async (objectId) => {
    if (!canvasId) {
      setObjects(prev => prev.filter(obj => obj.id !== objectId));
      setSelectedObjectIds(prev => prev.filter(id => id !== objectId));
      return;
    }

    if (!user) {
      console.error('Cannot delete object: No user authenticated');
      return;
    }

    // Store the object for potential rollback
    let deletedObject = null;
    let wasSelected = false;

    // Find the object to delete
    const objectToDelete = objects.find(obj => obj.id === objectId);
    if (!objectToDelete) {
      console.warn('Object not found for deletion:', objectId);
      return;
    }

    try {
      // Step 1: Immediate optimistic deletion (for responsiveness)
      setObjects(prev => {
        const objToDelete = prev.find(obj => obj.id === objectId);
        if (objToDelete) {
          deletedObject = { ...objToDelete, _isOptimisticDelete: true };
        }
        return prev.filter(obj => obj.id !== objectId);
      });

      setSelectedObjectIds(prev => {
        if (prev.includes(objectId)) {
          wasSelected = true;
        }
        return prev.filter(id => id !== objectId);
      });

      // Step 2: Broadcast deletion immediately via RTDB (for other users to see)
      await broadcastDeletion(
        canvasId, 
        objectId, 
        user.uid, 
        user.displayName || user.email || 'Anonymous'
      );

      // Also broadcast deletion intent for conflict resolution (optional)
      const intentId = await broadcastDeletionIntent(
        canvasId, 
        objectId, 
        user.uid, 
        user.displayName || user.email || 'Anonymous'
      );

      // Step 3: Delete from Firestore immediately (no grace period delay)
      await deleteObject(canvasId, objectId);
      
      // Step 4: Confirm deletion intent 
      await confirmDeletionIntent(canvasId, intentId);
      
      console.log('✅ Object successfully deleted with immediate propagation:', objectId);
    } catch (error) {
      console.error('Failed to delete object, rolling back:', error);
      setSyncError(`Failed to delete object: ${error.message}`);
      
      // Rollback: restore the object to local state
      if (deletedObject) {
        const { _isOptimisticDelete, ...cleanObject } = deletedObject;
        setObjects(prev => [...prev, cleanObject]);
      }
      
      // Rollback: restore selection
      if (wasSelected) {
        setSelectedObjectIds(prev => [...prev, objectId]);
      }
    }
  }, [canvasId, user, objects]);

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
      // Listen to real-time object changes with conflict resolution
      const unsubscribe = listenToObjects(canvasId, (firestoreObjects) => {
        clearTimeout(loadingTimeout);
        
        // Apply conflict resolution for incoming objects
        setObjects(prevObjects => {
          const resolvedObjects = firestoreObjects.map(remoteObj => {
            // Find corresponding local object
            const localObj = prevObjects.find(local => local.id === remoteObj.id);
            
            // Apply conflict resolution
            if (localObj && localObj._isOptimistic) {
              // Check if this is the same user's update (avoid self-conflict)
              if (localObj.lastModifiedBy === remoteObj.lastModifiedBy) {
                // Same user - check if the data is essentially the same
                const isSameData = JSON.stringify({
                  x: localObj.x,
                  y: localObj.y,
                  width: localObj.width,
                  height: localObj.height,
                  radius: localObj.radius,
                  fontSize: localObj.fontSize,
                  rotation: localObj.rotation
                }) === JSON.stringify({
                  x: remoteObj.x,
                  y: remoteObj.y,
                  width: remoteObj.width,
                  height: remoteObj.height,
                  radius: remoteObj.radius,
                  fontSize: remoteObj.fontSize,
                  rotation: remoteObj.rotation
                });
                
                if (isSameData) {
                  // Same user, same data - use remote object (it has server timestamp)
                  const { _isOptimistic, ...cleanRemote } = remoteObj;
                  return cleanRemote;
                } else {
                  // Same user, different data - this shouldn't happen, but use remote
                  console.warn('Same user but different data detected:', { localObj, remoteObj });
                  const { _isOptimistic, ...cleanRemote } = remoteObj;
                  return cleanRemote;
                }
              }
              
              // Different user - apply conflict resolution
              const resolved = ConflictResolver.resolve(localObj, remoteObj);
              
              // Remove optimistic flag from resolved object
              const { _isOptimistic, ...cleanResolved } = resolved;
              return cleanResolved;
            }
            
            // No conflict, use remote object as-is
            return remoteObj;
          });
          
          // Handle deleted objects (objects that exist locally but not in Firestore)
          const remoteIds = new Set(firestoreObjects.map(obj => obj.id));
          const localOnlyObjects = prevObjects.filter(local => !remoteIds.has(local.id));
          
          // Only keep local objects that are newly created (not yet synced)
          // Remove any objects that were deleted by other users (not in Firestore anymore)
          const keptLocalObjects = localOnlyObjects.filter(obj => 
            !obj._isOptimistic && // Not an optimistic update
            !obj._isOptimisticDelete && // Not an optimistic deletion
            !obj.createdAt && // Newly created objects don't have createdAt yet
            Date.now() - obj.updatedAt < 5000 // Only keep very recent objects (5sec)
          );
          
          // Log deletions for debugging
          const deletedObjects = localOnlyObjects.filter(obj => 
            obj.createdAt || // Has been synced to Firestore before
            Date.now() - obj.updatedAt >= 5000 // Or is old enough to be considered synced
          );
          
          if (deletedObjects.length > 0) {
            console.log('🗑️ Objects deleted by other users:', deletedObjects.map(obj => obj.id));
          }
          
          return [...resolvedObjects, ...keptLocalObjects];
        });
        
        setIsLoading(false);
        setSyncError(null);
      });

      objectsUnsubscribeRef.current = unsubscribe;

      // Set up deletion intents listener
      const deletionIntentsUnsubscribe = listenToDeletionIntents(canvasId, (intents) => {
        setDeletionIntents(intents);
      });
      deletionIntentsUnsubscribeRef.current = deletionIntentsUnsubscribe;

      // Set up live deletions listener for immediate propagation
      const liveDeletionsUnsubscribe = listenToLiveDeletions(canvasId, (deletions) => {
        setLiveDeletions(deletions);
        
        // Immediately remove deleted objects from local state
        if (deletions.length > 0) {
          setObjects(prevObjects => {
            let updatedObjects = prevObjects;
            
            deletions.forEach(deletion => {
              // Only remove if deleted by someone else (not self)
              if (deletion.userId !== user?.uid) {
                updatedObjects = updatedObjects.filter(obj => obj.id !== deletion.objectId);
                console.log('🗑️ Removed object deleted by', deletion.userName, ':', deletion.objectId);
              }
            });
            
            return updatedObjects;
          });
          
          // Also remove from selection
          setSelectedObjectIds(prevSelected => {
            let updatedSelection = prevSelected;
            
            deletions.forEach(deletion => {
              if (deletion.userId !== user?.uid) {
                updatedSelection = updatedSelection.filter(id => id !== deletion.objectId);
              }
            });
            
            return updatedSelection;
          });
        }
      });
      liveDeletionsUnsubscribeRef.current = liveDeletionsUnsubscribe;

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
      if (deletionIntentsUnsubscribeRef.current) {
        deletionIntentsUnsubscribeRef.current();
        deletionIntentsUnsubscribeRef.current = null;
      }
      if (liveDeletionsUnsubscribeRef.current) {
        liveDeletionsUnsubscribeRef.current();
        liveDeletionsUnsubscribeRef.current = null;
      }
      // Flush any pending writes before cleanup
      if (writeQueueRef.current) {
        writeQueueRef.current.flush();
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

  // Circle creation functions
  const startCircleCreation = useCallback((startPoint, userColor = '#667eea') => {
    const canvasPoint = screenToCanvas(startPoint, stageRef.current);
    
    dragStartRef.current = canvasPoint;
    setIsCreatingCircle(true);
    setIsCreating(true);
    
    // Create initial circle preview
    const initialCircle = {
      id: `temp_circle_${Date.now()}`,
      type: 'circle',
      x: canvasPoint.x,
      y: canvasPoint.y,
      radius: 0,
      fill: userColor,
      stroke: userColor,
      strokeWidth: 2,
      opacity: 0.7, // Preview opacity
      isPreview: true,
      createdAt: null,
      updatedAt: null
    };
    
    setCurrentCircle(initialCircle);
  }, []);

  const updateCircleCreation = useCallback((currentPoint) => {
    if (!isCreatingCircle || !dragStartRef.current || !currentCircle) {
      return;
    }
    
    const canvasPoint = screenToCanvas(currentPoint, stageRef.current);
    const start = dragStartRef.current;
    
    // Calculate radius as distance from center to current point
    const deltaX = canvasPoint.x - start.x;
    const deltaY = canvasPoint.y - start.y;
    const radius = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Update preview circle
    const updatedCircle = {
      ...currentCircle,
      radius: radius
    };
    
    setCurrentCircle(updatedCircle);
  }, [isCreatingCircle, currentCircle]);

  const cancelCircleCreation = useCallback(() => {
    setCurrentCircle(null);
    setIsCreatingCircle(false);
    setIsCreating(false);
    dragStartRef.current = null;
  }, []);

  const finishCircleCreation = useCallback((userColor = '#667eea', userId = null) => {
    if (!isCreatingCircle || !currentCircle || !dragStartRef.current) {
      return null;
    }
    
    const MIN_CIRCLE_RADIUS = 5;
    
    // Only create circle if it has meaningful size
    if (currentCircle.radius < MIN_CIRCLE_RADIUS) {
      cancelCircleCreation();
      return null;
    }
    
    // Create final circle object
    const finalCircle = {
      ...currentCircle,
      id: `circle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      opacity: 1.0, // Full opacity for final circle
      isPreview: false,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Add to objects array
    const objectId = addObject(finalCircle);
    
    // Clean up creation state
    setCurrentCircle(null);
    setIsCreatingCircle(false);
    setIsCreating(false);
    dragStartRef.current = null;
    
    return objectId;
  }, [isCreatingCircle, currentCircle, addObject, cancelCircleCreation]);

  // Text creation functions
  const startTextCreation = useCallback((startPoint, userColor = '#000000') => {
    const canvasPoint = screenToCanvas(startPoint, stageRef.current);
    
    // Create initial text object
    const initialText = {
      id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'text',
      x: canvasPoint.x,
      y: canvasPoint.y,
      text: 'Double-click to edit',
      fontSize: 16,
      fontFamily: 'Arial',
      fill: userColor,
      stroke: null,
      strokeWidth: 0,
      opacity: 1.0,
      isPreview: false,
      createdBy: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Add text object immediately (no drag creation for text)
    const objectId = addObject(initialText);
    
    return objectId;
  }, [addObject]);

  // Enhanced creation state management
  const startCreatingShape = useCallback((shapeType, startPoint, options = {}) => {
    if (shapeType === 'rectangle') {
      startRectangleCreation(startPoint, options.userColor);
    } else if (shapeType === 'circle') {
      startCircleCreation(startPoint, options.userColor);
    } else if (shapeType === 'text') {
      return startTextCreation(startPoint, options.userColor);
    }
  }, [startRectangleCreation, startCircleCreation, startTextCreation]);

  const updateCreatingShape = useCallback((currentPoint) => {
    if (isCreatingRectangle) {
      updateRectangleCreation(currentPoint);
    } else if (isCreatingCircle) {
      updateCircleCreation(currentPoint);
    }
    // Text doesn't need updating during creation
  }, [isCreatingRectangle, isCreatingCircle, updateRectangleCreation, updateCircleCreation]);

  const finishCreatingShape = useCallback((options = {}) => {
    if (isCreatingRectangle) {
      return finishRectangleCreation(options.userColor, options.userId);
    } else if (isCreatingCircle) {
      return finishCircleCreation(options.userColor, options.userId);
    }
    // Text is created immediately, no finish needed
    return null;
  }, [isCreatingRectangle, isCreatingCircle, finishRectangleCreation, finishCircleCreation]);

  const cancelCreatingShape = useCallback(() => {
    if (isCreatingRectangle) {
      cancelRectangleCreation();
    } else if (isCreatingCircle) {
      cancelCircleCreation();
    }
    // Text is created immediately, no cancel needed
  }, [isCreatingRectangle, isCreatingCircle, cancelRectangleCreation, cancelCircleCreation]);

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
    
    // Circle creation state
    currentCircle,
    isCreatingCircle,
    
    // Text creation state
    currentText,
    isCreatingText,
    
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
