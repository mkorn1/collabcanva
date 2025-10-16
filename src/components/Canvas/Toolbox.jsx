import React from 'react';
import './Toolbox.css';

/**
 * Floating toolbox for canvas tools and shape creation
 * Provides an intuitive UI for users to select creation tools
 */
const Toolbox = ({
  selectedTool = null,
  onToolSelect,
  isVisible = true,
  position = { x: 20, y: 100 }
}) => {
  if (!isVisible) return null;

  const tools = [
    {
      id: 'select',
      name: 'Select',
      icon: '👆',
      description: 'Select and move objects',
      shortcut: 'V'
    },
    {
      id: 'rectangle',
      name: 'Rectangle',
      icon: '⬛',
      description: 'Create rectangles',
      shortcut: 'R'
    }
    // Future tools: circle, line, text, etc.
  ];

  const handleToolClick = (tool) => {
    if (onToolSelect) {
      onToolSelect(tool.id);
    }
  };

  const handleKeyPress = (event, tool) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToolClick(tool);
    }
  };

  return (
    <div 
      className="toolbox"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
      role="toolbar"
      aria-label="Canvas tools"
    >
      <div className="toolbox-header">
        <h3 className="toolbox-title">Tools</h3>
      </div>
      
      <div className="toolbox-tools">
        {tools.map((tool) => (
          <button
            key={tool.id}
            className={`tool-button ${selectedTool === tool.id ? 'active' : ''}`}
            onClick={() => handleToolClick(tool)}
            onKeyDown={(e) => handleKeyPress(e, tool)}
            title={`${tool.description} (${tool.shortcut})`}
            aria-label={tool.description}
            aria-pressed={selectedTool === tool.id}
          >
            <span className="tool-icon" aria-hidden="true">
              {tool.icon}
            </span>
            <span className="tool-name">{tool.name}</span>
            <span className="tool-shortcut">{tool.shortcut}</span>
          </button>
        ))}
      </div>
      
      <div className="toolbox-footer">
        <div className="creation-hint">
          {selectedTool === 'rectangle' ? (
            <span>Click and drag to create rectangle</span>
          ) : selectedTool === 'select' ? (
            <span>Click objects to select</span>
          ) : (
            <span>Select a tool to get started</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Toolbox;
