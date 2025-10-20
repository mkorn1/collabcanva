import React, { useState, useEffect, useCallback } from 'react';

/**
 * Color picker component with recent colors palette
 * Stores and displays the last 8 colors used
 */
const ColorPicker = ({ currentColor, onChange, onClose, isVisible = true }) => {
  const [selectedColor, setSelectedColor] = useState(currentColor || '#667eea');
  const [recentColors, setRecentColors] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  // Load recent colors from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('collabcanvas-recent-colors');
    if (stored) {
      try {
        const colors = JSON.parse(stored);
        setRecentColors(colors);
      } catch (error) {
        console.warn('Failed to load recent colors:', error);
      }
    }
  }, []);

  // Update selected color when currentColor prop changes
  useEffect(() => {
    if (currentColor && currentColor !== selectedColor) {
      setSelectedColor(currentColor);
    }
  }, [currentColor]);

  // Save recent colors to localStorage
  const saveRecentColors = useCallback((colors) => {
    try {
      localStorage.setItem('collabcanvas-recent-colors', JSON.stringify(colors));
    } catch (error) {
      console.warn('Failed to save recent colors:', error);
    }
  }, []);

  // Add color to recent colors (max 8 colors)
  const addToRecentColors = useCallback((color) => {
    setRecentColors(prev => {
      // Remove if already exists to avoid duplicates
      const filtered = prev.filter(c => c !== color);
      // Add to beginning and limit to 8 colors
      const updated = [color, ...filtered].slice(0, 8);
      saveRecentColors(updated);
      return updated;
    });
  }, [saveRecentColors]);

  // Handle color selection
  const handleColorSelect = (color) => {
    setSelectedColor(color);
    addToRecentColors(color);
    if (onChange) {
      onChange(color);
    }
  };

  // Handle color input change
  const handleColorInputChange = (e) => {
    const color = e.target.value;
    setSelectedColor(color);
    if (onChange) {
      onChange(color);
    }
  };

  // Handle apply button click
  const handleApply = () => {
    addToRecentColors(selectedColor);
    if (onChange) {
      onChange(selectedColor);
    }
    if (onClose) {
      onClose();
    }
  };

  // Handle cancel button click
  const handleCancel = () => {
    if (onClose) {
      onClose();
    }
  };

  // Predefined color palette
  const predefinedColors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c',
    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
    '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3',
    '#d299c2', '#fef9d7', '#667eea', '#764ba2'
  ];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-80 max-w-sm mx-4 dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Choose Color</h3>
          <button
            onClick={handleCancel}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
            aria-label="Close color picker"
          >
            ✕
          </button>
        </div>

        {/* Current color display */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
            Selected Color
          </label>
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
              style={{ backgroundColor: selectedColor }}
            ></div>
            <input
              type="color"
              value={selectedColor}
              onChange={handleColorInputChange}
              className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
              aria-label="Color input"
            />
            <div className="flex-1">
              <input
                type="text"
                value={selectedColor}
                onChange={handleColorInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                placeholder="#667eea"
              />
            </div>
          </div>
        </div>

        {/* Predefined colors */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
            Quick Colors
          </label>
          <div className="grid grid-cols-8 gap-2">
            {predefinedColors.map((color, index) => (
              <button
                key={index}
                onClick={() => handleColorSelect(color)}
                className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                  selectedColor === color 
                    ? 'border-gray-800 shadow-lg' 
                    : 'border-gray-300 hover:border-gray-500'
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Recent colors */}
        {recentColors.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Recent Colors
            </label>
            <div className="grid grid-cols-8 gap-2">
              {recentColors.map((color, index) => (
                <button
                  key={index}
                  onClick={() => handleColorSelect(color)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                    selectedColor === color 
                      ? 'border-gray-800 shadow-lg' 
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select recent color ${color}`}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

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
            className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;