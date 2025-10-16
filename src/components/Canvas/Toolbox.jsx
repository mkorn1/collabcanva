import React, { useState } from 'react';
import './Toolbox.css';

/**
 * Floating toolbox for canvas tools and shape creation
 * Provides an intuitive UI for users to select creation tools and view debug info
 */
const Toolbox = ({
  selectedTool = null,
  onToolSelect,
  isVisible = true,
  position = { x: 20, y: 100 },
  // Debug info props
  debugInfo = null
}) => {
  const [showOnlineUsersTooltip, setShowOnlineUsersTooltip] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(true);
  
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
      
      {/* Information section - only show in development */}
      {debugInfo && process.env.NODE_ENV === 'development' && (
        <div className="toolbox-info">
          <div className="info-header" onClick={() => setIsInfoExpanded(!isInfoExpanded)}>
            <h4 className="info-title">Information</h4>
            <span className={`info-toggle ${isInfoExpanded ? 'expanded' : 'collapsed'}`}>
              {isInfoExpanded ? '▼' : '▶'}
            </span>
          </div>
          {isInfoExpanded && (
            <div className="info-items">
              <div className="info-item">
                <span className="info-label">Position:</span>
                <span className="info-value">
                  x:{Math.round(debugInfo.position.x)}, y:{Math.round(debugInfo.position.y)}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Zoom:</span>
                <span className="info-value">{(debugInfo.zoom * 100).toFixed(0)}%</span>
              </div>
              <div className="info-item">
                <span className="info-label">Cursor:</span>
                <span className="info-value">
                  x:{Math.round(debugInfo.cursor.x)}, y:{Math.round(debugInfo.cursor.y)} 
                  {debugInfo.cursor.isTracking ? ' (tracking)' : ' (idle)'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Online:</span>
                <span className="info-value">
                  {debugInfo.onlineUsers.length} users | 
                  <span 
                    className="hoverable-cursors"
                    onMouseEnter={() => setShowOnlineUsersTooltip(true)}
                    onMouseLeave={() => setShowOnlineUsersTooltip(false)}
                  >
                    {debugInfo.otherCursors.length} cursors
                    {showOnlineUsersTooltip && debugInfo.onlineUsers.length > 0 && (
                      <div className="online-users-tooltip">
                        <div className="tooltip-header">Online Users:</div>
                        {debugInfo.onlineUsers.map((onlineUser) => (
                          <div key={onlineUser.id} className="tooltip-user">
                            <span 
                              className="user-color-dot" 
                              style={{ backgroundColor: onlineUser.cursorColor }}
                            ></span>
                            <span className="user-name">
                              {onlineUser.displayName || onlineUser.email || 'Anonymous'}
                              {onlineUser.id === debugInfo.currentUserId && ' (You)'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

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
