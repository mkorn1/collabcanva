import React, { useState, useEffect, useCallback, useRef } from 'react';
import { isValidLayerPosition } from '../../utils/canvasHelpers.js';

/**
 * Layer Position Dialog Component
 * Provides a modal dialog for editing object layer positions
 */
const LayerPositionDialog = ({
  isVisible = false,
  targetObject = null,
  onClose = null,
  onApply = null,
  position = { x: 0, y: 0 }
}) => {
  const [layerPosition, setLayerPosition] = useState(0);
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(true);
  const inputRef = useRef(null);

  // Update layer position when target object changes
  useEffect(() => {
    if (targetObject) {
      const currentPosition = targetObject.layerPosition || 0;
      setLayerPosition(currentPosition);
      setError('');
      setIsValid(true);
    }
  }, [targetObject]);

  // Focus input when dialog becomes visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      // Small delay to ensure the dialog is rendered
      setTimeout(() => {
        inputRef.current.focus();
        inputRef.current.select();
      }, 100);
    }
  }, [isVisible]);

  // Handle input change with validation
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setLayerPosition(value);

    // Clear previous error
    setError('');
    setIsValid(true);

    // Validate input
    if (value === '') {
      setError('Layer position is required');
      setIsValid(false);
      return;
    }

    const numValue = parseInt(value, 10);
    if (!isValidLayerPosition(numValue)) {
      setError('Layer position must be a positive integer (0 or greater)');
      setIsValid(false);
      return;
    }

    // Additional validation for reasonable range
    if (numValue > 1000) {
      setError('Layer position cannot exceed 1000');
      setIsValid(false);
      return;
    }
  }, []);

  // Handle keyboard events
  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (isValid) {
          handleApply();
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        handleCancel();
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        if (isValid) {
          const newValue = Math.max(0, layerPosition + 1);
          setLayerPosition(newValue);
        }
        break;
      
      case 'ArrowDown':
        e.preventDefault();
        if (isValid) {
          const newValue = Math.max(0, layerPosition - 1);
          setLayerPosition(newValue);
        }
        break;
      
      default:
        break;
    }
  }, [isValid, layerPosition]);

  // Handle apply button click
  const handleApply = useCallback(() => {
    if (!isValid || !targetObject) return;

    const numValue = parseInt(layerPosition, 10);
    if (onApply) {
      onApply(targetObject.id, numValue);
    }
    if (onClose) {
      onClose();
    }
  }, [isValid, layerPosition, targetObject, onApply, onClose]);

  // Handle cancel button click
  const handleCancel = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  // Handle quick layer position buttons
  const handleQuickPosition = useCallback((position) => {
    setLayerPosition(position);
    setError('');
    setIsValid(true);
  }, []);

  // Handle click outside to close
  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  }, [handleCancel]);

  if (!isVisible || !targetObject) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
      onClick={handleOverlayClick}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl p-6 w-96 max-w-sm mx-4 dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Layer Position
          </h3>
          <button
            onClick={handleCancel}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
            aria-label="Close layer position dialog"
          >
            ✕
          </button>
        </div>

        {/* Object info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg dark:bg-gray-700">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {targetObject.type?.charAt(0).toUpperCase() + targetObject.type?.slice(1)} Object
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Current layer: {targetObject.layerPosition || 0}
          </div>
        </div>

        {/* Layer position input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
            Layer Position
          </label>
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="number"
              min="0"
              max="1000"
              step="1"
              value={layerPosition}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className={`w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200 ${
                isValid 
                  ? 'border-gray-300 dark:border-gray-600' 
                  : 'border-red-500 dark:border-red-400'
              }`}
              placeholder="0"
              aria-label="Layer position input"
              aria-invalid={!isValid}
              aria-describedby={error ? "layer-position-error" : undefined}
            />
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleQuickPosition(Math.max(0, layerPosition + 1))}
                className="w-8 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded border border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 dark:border-gray-600"
                aria-label="Increase layer position"
                title="Increase layer position"
              >
                ↑
              </button>
              <button
                onClick={() => handleQuickPosition(Math.max(0, layerPosition - 1))}
                className="w-8 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded border border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 dark:border-gray-600"
                aria-label="Decrease layer position"
                title="Decrease layer position"
              >
                ↓
              </button>
            </div>
          </div>
          
          {/* Error message */}
          {error && (
            <div 
              id="layer-position-error"
              className="mt-2 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {error}
            </div>
          )}
        </div>

        {/* Quick position buttons */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
            Quick Positions
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 5, 10].map((pos) => (
              <button
                key={pos}
                onClick={() => handleQuickPosition(pos)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  layerPosition === pos
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200'
                }`}
                aria-label={`Set layer position to ${pos}`}
              >
                {pos === 0 ? 'Front' : pos}
              </button>
            ))}
          </div>
        </div>

        {/* Help text */}
        <div className="mb-6 p-3 bg-blue-50 rounded-lg dark:bg-blue-900/20">
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <div className="font-medium mb-1">Layer Position Guide:</div>
            <div className="text-xs space-y-1">
              <div>• <strong>0</strong> = Front (most visible)</div>
              <div>• <strong>Higher numbers</strong> = Back (less visible)</div>
              <div>• Use <strong>↑↓</strong> arrows or keyboard to adjust</div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors duration-200 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!isValid}
            className={`flex-1 px-4 py-2 font-medium rounded-lg transition-colors duration-200 ${
              isValid
                ? 'bg-primary-500 hover:bg-primary-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
            }`}
          >
            Apply
          </button>
        </div>

        {/* Keyboard shortcuts help */}
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Enter</kbd> to apply, 
            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs ml-1">Esc</kbd> to cancel
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayerPositionDialog;
