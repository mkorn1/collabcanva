import React, { useState, useEffect, useCallback } from 'react';
import './ColorPicker.css';

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

  // Handle color change
  const handleColorChange = (newColor) => {
    setSelectedColor(newColor);
    addToRecentColors(newColor);
    if (onChange) {
      onChange(newColor);
    }
  };

  // Handle direct color input
  const handleInputChange = (e) => {
    const newColor = e.target.value;
    handleColorChange(newColor);
  };

  // Handle recent color click
  const handleRecentColorClick = (color) => {
    handleColorChange(color);
  };

  // Preset color palette
  const presetColors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c',
    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
    '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3',
    '#ffeaa7', '#fab1a0', '#fd79a8', '#fdcb6e',
    '#6c5ce7', '#a29bfe', '#fd79a8', '#fdcb6e'
  ];

  if (!isVisible) return null;

  return (
    <div className="color-picker-overlay" onClick={onClose}>
      <div className="color-picker" onClick={e => e.stopPropagation()}>
        <div className="color-picker-header">
          <h3>Choose Color</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="color-picker-content">
          {/* Current color display and input */}
          <div className="current-color-section">
            <div 
              className="current-color-preview"
              style={{ backgroundColor: selectedColor }}
              title={`Current color: ${selectedColor}`}
            />
            <div className="color-input-group">
              <input
                type="color"
                value={selectedColor}
                onChange={handleInputChange}
                className="color-input"
              />
              <input
                type="text"
                value={selectedColor}
                onChange={(e) => handleColorChange(e.target.value)}
                placeholder="#667eea"
                className="color-text-input"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>

          {/* Preset colors */}
          <div className="preset-colors-section">
            <h4>Preset Colors</h4>
            <div className="color-grid">
              {presetColors.map((color, index) => (
                <button
                  key={index}
                  className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Recent colors */}
          {recentColors.length > 0 && (
            <div className="recent-colors-section">
              <h4>Recent Colors</h4>
              <div className="color-grid recent-grid">
                {recentColors.map((color, index) => (
                  <button
                    key={index}
                    className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleRecentColorClick(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="color-picker-actions">
            <button 
              className="btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className="btn-primary"
              onClick={() => {
                handleColorChange(selectedColor);
                onClose();
              }}
            >
              Apply Color
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
