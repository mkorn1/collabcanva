import { useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for keyboard shortcuts in the canvas
 * Handles delete, duplicate, and arrow key movement for selected objects
 * @param {Object} params - Hook parameters
 * @param {Function} params.getSelectedObjects - Function to get currently selected objects
 * @param {Function} params.removeObject - Function to remove an object
 * @param {Function} params.addObject - Function to add a new object
 * @param {Function} params.updateObject - Function to update an object
 * @param {boolean} params.isEnabled - Whether shortcuts are enabled (default: true)
 */
export const useKeyboardShortcuts = ({
  getSelectedObjects,
  removeObject,
  addObject,
  updateObject,
  isEnabled = true
}) => {
  const clipboardRef = useRef([]);
  const moveStepSize = 10; // pixels to move per arrow key press

  /**
   * Delete selected objects
   */
  const deleteSelectedObjects = useCallback(async () => {
    if (!isEnabled) return;

    const selectedObjects = getSelectedObjects();
    if (selectedObjects.length === 0) return;

    console.log('Deleting', selectedObjects.length, 'selected objects');

    // Delete all selected objects
    const deletePromises = selectedObjects.map(obj => removeObject(obj.id));
    
    try {
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Failed to delete objects:', error);
    }
  }, [getSelectedObjects, removeObject, isEnabled]);

  /**
   * Duplicate selected objects
   */
  const duplicateSelectedObjects = useCallback(async () => {
    if (!isEnabled) return;

    const selectedObjects = getSelectedObjects();
    if (selectedObjects.length === 0) return;

    console.log('Duplicating', selectedObjects.length, 'selected objects');

    const offset = 20; // Offset for duplicated objects

    // Create duplicated objects
    const duplicatePromises = selectedObjects.map(obj => {
      const duplicatedObject = {
        ...obj,
        id: `${obj.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        x: obj.x + offset,
        y: obj.y + offset,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      // Remove Firestore-specific fields that shouldn't be copied
      delete duplicatedObject.createdBy;
      
      return addObject(duplicatedObject);
    });

    try {
      await Promise.all(duplicatePromises);
    } catch (error) {
      console.error('Failed to duplicate objects:', error);
    }
  }, [getSelectedObjects, addObject, isEnabled]);

  /**
   * Copy selected objects to clipboard
   */
  const copySelectedObjects = useCallback(() => {
    if (!isEnabled) return;

    const selectedObjects = getSelectedObjects();
    if (selectedObjects.length === 0) return;

    console.log('Copying', selectedObjects.length, 'objects to clipboard');
    
    // Store objects in clipboard reference
    clipboardRef.current = selectedObjects.map(obj => ({
      ...obj,
      // Remove IDs and Firestore fields so they get new ones when pasted
      id: undefined,
      createdBy: undefined,
      createdAt: undefined,
      updatedAt: undefined
    }));
  }, [getSelectedObjects, isEnabled]);

  /**
   * Paste objects from clipboard
   */
  const pasteObjects = useCallback(async () => {
    if (!isEnabled) return;
    if (clipboardRef.current.length === 0) return;

    console.log('Pasting', clipboardRef.current.length, 'objects from clipboard');

    const offset = 20; // Offset for pasted objects

    // Create pasted objects
    const pastePromises = clipboardRef.current.map(obj => {
      const pastedObject = {
        ...obj,
        id: `${obj.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        x: obj.x + offset,
        y: obj.y + offset,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      return addObject(pastedObject);
    });

    try {
      await Promise.all(pastePromises);
    } catch (error) {
      console.error('Failed to paste objects:', error);
    }
  }, [addObject, isEnabled]);

  /**
   * Move selected objects by arrow keys
   */
  const moveSelectedObjects = useCallback(async (direction) => {
    if (!isEnabled) return;

    const selectedObjects = getSelectedObjects();
    if (selectedObjects.length === 0) return;

    let deltaX = 0, deltaY = 0;
    
    switch (direction) {
      case 'ArrowUp':
        deltaY = -moveStepSize;
        break;
      case 'ArrowDown':
        deltaY = moveStepSize;
        break;
      case 'ArrowLeft':
        deltaX = -moveStepSize;
        break;
      case 'ArrowRight':
        deltaX = moveStepSize;
        break;
      default:
        return;
    }

    console.log('Moving', selectedObjects.length, 'objects', direction, `(${deltaX}, ${deltaY})`);

    // Move all selected objects
    const movePromises = selectedObjects.map(obj => 
      updateObject(obj.id, {
        x: obj.x + deltaX,
        y: obj.y + deltaY
      })
    );

    try {
      await Promise.all(movePromises);
    } catch (error) {
      console.error('Failed to move objects:', error);
    }
  }, [getSelectedObjects, updateObject, isEnabled]);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback(async (event) => {
    if (!isEnabled) return;

    // Don't handle shortcuts when typing in input fields
    const activeElement = document.activeElement;
    if (activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    )) {
      return;
    }

    const { key, code, metaKey, ctrlKey } = event;
    const isModifierPressed = metaKey || ctrlKey; // Cmd on Mac, Ctrl on Windows/Linux

    // Handle different key combinations
    switch (true) {
      // Delete key (Delete or Backspace)
      case (key === 'Delete' || key === 'Backspace') && !isModifierPressed:
        event.preventDefault();
        await deleteSelectedObjects();
        break;

      // Duplicate (Cmd/Ctrl + D)
      case key === 'd' && isModifierPressed:
        event.preventDefault();
        await duplicateSelectedObjects();
        break;

      // Copy (Cmd/Ctrl + C)
      case key === 'c' && isModifierPressed:
        event.preventDefault();
        copySelectedObjects();
        break;

      // Paste (Cmd/Ctrl + V)
      case key === 'v' && isModifierPressed:
        event.preventDefault();
        await pasteObjects();
        break;

      // Arrow keys for movement
      case ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key) && !isModifierPressed:
        event.preventDefault();
        await moveSelectedObjects(key);
        break;

      default:
        // No action for other keys
        break;
    }
  }, [
    isEnabled,
    deleteSelectedObjects,
    duplicateSelectedObjects,
    copySelectedObjects,
    pasteObjects,
    moveSelectedObjects
  ]);

  // Set up keyboard event listener
  useEffect(() => {
    if (!isEnabled) return;

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, isEnabled]);

  // Return the available actions for external use
  return {
    deleteSelectedObjects,
    duplicateSelectedObjects,
    copySelectedObjects,
    pasteObjects,
    moveSelectedObjects,
    isEnabled
  };
};

export default useKeyboardShortcuts;
