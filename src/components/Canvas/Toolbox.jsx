import React, { useState } from 'react';

/**
 * Fixed sidebar toolbox for canvas tools and shape creation
 * Provides an intuitive UI for users to select creation tools and view debug info
 */
const Toolbox = ({
  selectedTool = null,
  onToolSelect,
  isVisible = true,
  // Debug info props
  debugInfo = null,
  // New props for color picker and export
  selectedObjectsCount = 0,
  onColorPickerOpen = null,
  onExportCanvas = null,
  // AI Chat prop
  onAIChatOpen = null
}) => {
  const [isInfoExpanded, setIsInfoExpanded] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
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
      id: 'marquee',
      name: 'Multi-select',
      icon: '⬜',
      description: 'Select multiple objects',
      shortcut: 'M'
    },
    {
      id: 'rectangle',
      name: 'Rectangle',
      icon: '⬛',
      description: 'Create rectangles',
      shortcut: 'R'
    },
    {
      id: 'circle',
      name: 'Circle',
      icon: '⭕',
      description: 'Create circles',
      shortcut: 'C'
    },
    {
      id: 'text',
      name: 'Text',
      icon: '✏️',
      description: 'Add text',
      shortcut: 'T'
    },
    {
      id: 'ai-chat',
      name: 'AI Chat',
      icon: '🤖',
      description: 'Open AI Assistant',
      shortcut: '⌘K'
    }
  ];

  const handleToolClick = (tool) => {
    if (tool.id === 'ai-chat' && onAIChatOpen) {
      onAIChatOpen();
    } else if (onToolSelect) {
      onToolSelect(tool.id);
    }
  };

  const handleKeyPress = (event, tool) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToolClick(tool);
    }
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div 
      className={`fixed top-[60px] left-0 z-[200] bg-white/95 backdrop-blur-sm border-r border-gray-200 shadow-lg font-sans select-none transition-all duration-300 ease-out flex flex-col overflow-hidden hover:shadow-xl dark:bg-gray-700/95 dark:border-gray-600 dark:hover:shadow-2xl ${
        isCollapsed ? 'w-16' : 'w-64'
      } h-[calc(100vh-60px)]`}
      role="toolbar"
      aria-label="Canvas tools"
    >
      <div className="p-4 pb-3 border-b border-gray-200 flex-shrink-0 bg-inherit sticky top-0 z-10 dark:border-gray-600">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h3 className="m-0 text-sm font-semibold text-gray-800 tracking-tight dark:text-gray-100">Tools</h3>
          )}
          <button
            onClick={handleToggleCollapse}
            className="w-8 h-8 border-0 rounded-lg bg-transparent cursor-pointer transition-all duration-150 ease-out text-sm text-gray-500 flex items-center justify-center hover:bg-primary-500/10 hover:text-primary-500 focus:outline-2 focus:outline-primary-500 focus:outline-offset-2 dark:text-gray-400 dark:hover:bg-primary-500/20 dark:hover:text-primary-400"
            aria-label={isCollapsed ? 'Expand toolbox' : 'Collapse toolbox'}
            title={isCollapsed ? 'Expand toolbox' : 'Collapse toolbox'}
          >
            {isCollapsed ? '▶' : '◀'}
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-5">
        <div className="p-3 flex flex-col gap-1.5 flex-shrink-0">
          {tools.map((tool) => (
            <button
              key={tool.id}
              className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 border-0 rounded-lg bg-transparent cursor-pointer transition-all duration-200 ease-out text-sm text-gray-700 text-left w-full min-h-9 relative hover:bg-primary-500/8 hover:text-primary-500 focus:outline-2 focus:outline-primary-500 focus:outline-offset-2 focus:bg-primary-500/8 ${
                selectedTool === tool.id 
                  ? 'bg-primary-500 text-white font-medium hover:bg-primary-600 shadow-lg ring-2 ring-primary-300 ring-offset-1 border-2 border-primary-400 transform scale-105' 
                  : ''
              }`}
              onClick={() => handleToolClick(tool)}
              onKeyDown={(e) => handleKeyPress(e, tool)}
              title={`${tool.description} (${tool.shortcut})`}
              aria-label={tool.description}
              aria-pressed={selectedTool === tool.id}
            >
              <span className="text-base w-5 h-5 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                {tool.icon}
              </span>
              {!isCollapsed && (
                <>
                  <span className="flex-1 font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">{tool.name}</span>
                  <span className={`text-xs opacity-80 font-normal bg-gray-200 px-1.5 py-0.5 rounded font-mono tracking-wide text-gray-700 ${
                    selectedTool === tool.id ? 'bg-white/30 opacity-90' : ''
                  } dark:bg-gray-600 dark:text-gray-200`}>{tool.shortcut}</span>
                </>
              )}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        {!isCollapsed && (
          <div className="flex flex-col gap-2 mt-4 mx-0 pt-4 border-t border-black/10 flex-shrink-0 px-4">
            {/* Color picker button - shows when exactly one object is selected */}
            {selectedObjectsCount === 1 && onColorPickerOpen && (
              <button
                className="w-full py-2.5 px-3 bg-white border border-gray-300 rounded-lg cursor-pointer transition-all duration-200 ease-out text-sm flex items-center gap-2 text-left hover:bg-gray-50 hover:border-gray-400 hover:-translate-y-0.5"
                onClick={onColorPickerOpen}
                title="Change Color"
                aria-label="Change object color"
              >
                <span className="text-base min-w-5 text-center" aria-hidden="true">🎨</span>
                <span className="font-medium text-gray-800">Color</span>
              </button>
            )}

            {/* Export button */}
            {onExportCanvas && (
              <button
                className="w-full py-2.5 px-3 bg-green-600 border-0 text-white cursor-pointer transition-all duration-200 ease-out text-sm flex items-center gap-2 text-left hover:bg-green-700 hover:-translate-y-0.5 hover:shadow-lg"
                onClick={onExportCanvas}
                title="Export as PNG"
                aria-label="Export canvas as PNG"
              >
                <span className="text-base min-w-5 text-center" aria-hidden="true">📷</span>
                <span className="font-medium text-white">Export</span>
              </button>
            )}
          </div>
        )}
        
        {/* Collapsed action buttons - show only icons */}
        {isCollapsed && (
          <div className="flex flex-col gap-2 mt-4 mx-0 pt-4 border-t border-black/10 flex-shrink-0 px-2">
            {selectedObjectsCount === 1 && onColorPickerOpen && (
              <button
                className="w-full py-2 px-2 bg-white border border-gray-300 rounded-lg cursor-pointer transition-all duration-200 ease-out text-sm flex items-center justify-center hover:bg-gray-50 hover:border-gray-400 hover:-translate-y-0.5"
                onClick={onColorPickerOpen}
                title="Change Color"
                aria-label="Change object color"
              >
                <span className="text-base" aria-hidden="true">🎨</span>
              </button>
            )}

            {onExportCanvas && (
              <button
                className="w-full py-2 px-2 bg-green-600 border-0 text-white cursor-pointer transition-all duration-200 ease-out text-sm flex items-center justify-center hover:bg-green-700 hover:-translate-y-0.5 hover:shadow-lg"
                onClick={onExportCanvas}
                title="Export as PNG"
                aria-label="Export canvas as PNG"
              >
                <span className="text-base" aria-hidden="true">📷</span>
              </button>
            )}
          </div>
        )}
        
        {/* Information section */}
        {debugInfo && !isCollapsed && (
          <div className="border-t border-black/8 bg-black/2 mx-4 mt-4 mb-2 rounded-lg flex-shrink-0 dark:bg-black/20 dark:border-gray-600/30">
            <div className="p-2 px-3 flex justify-between items-center cursor-pointer transition-colors duration-150 ease-out rounded mx-1 my-1 hover:bg-primary-500/5" onClick={() => setIsInfoExpanded(!isInfoExpanded)}>
              <h4 className="m-0 text-xs font-semibold text-gray-600 tracking-tight dark:text-gray-100">Information</h4>
              <span className={`text-xs text-gray-500 transition-transform duration-150 ease-out select-none ${
                isInfoExpanded ? 'rotate-0' : '-rotate-90'
              } dark:text-gray-400`}>
                {isInfoExpanded ? '▼' : '▶'}
              </span>
            </div>
            {isInfoExpanded && (
              <div className="p-1 px-3 pb-2 flex flex-col gap-1 animate-slide-down">
                <div className="flex justify-between items-center text-xs leading-tight">
                  <span className="text-gray-500 font-medium min-w-12">Position:</span>
                  <span className="text-gray-700 font-mono text-xs text-right flex-1 ml-2">
                    x:{Math.round(debugInfo.position.x)}, y:{Math.round(debugInfo.position.y)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs leading-tight">
                  <span className="text-gray-500 font-medium min-w-12">Zoom:</span>
                  <span className="text-gray-700 font-mono text-xs text-right flex-1 ml-2">
                    {(debugInfo.zoom * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs leading-tight">
                  <span className="text-gray-500 font-medium min-w-12">Cursor:</span>
                  <span className="text-gray-700 font-mono text-xs text-right flex-1 ml-2">
                    x:{Math.round(debugInfo.cursor.x)}, y:{Math.round(debugInfo.cursor.y)} 
                    {debugInfo.cursor.isTracking ? ' (tracking)' : ' (idle)'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-black/8 bg-black/2 flex-shrink-0 mt-auto dark:bg-black/20 dark:border-gray-600/30">
        <div className="text-xs text-gray-500 text-center font-normal leading-snug py-0.5 dark:text-gray-400">
          Click and drag to create shapes
        </div>
      </div>
    </div>
  );
};

export default Toolbox;