import React from 'react';

/**
 * Command Outline Preview Component
 * Shows a minimal outline of AI commands with accept/reject buttons on the edge
 * Replaces the modal-style preview with a cleaner, less intrusive design
 */
const CommandOutlinePreview = ({
  isVisible = false,
  previewData = null,
  onApprove = null,
  onReject = null,
  position = 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
  taskCount = null // Optional task count to display
}) => {
  if (!isVisible || !previewData) {
    return null;
  }

  const { functionCalls, summary } = previewData;

  const handleApprove = () => {
    if (onApprove) {
      onApprove(previewData);
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject(previewData);
    }
  };

  // Generate outline text from function calls
  const generateOutline = () => {
    if (!functionCalls || functionCalls.length === 0) {
      return summary || 'AI Command';
    }

    return functionCalls.map(call => {
      switch (call.name) {
        case 'create_shape':
          return `Create ${call.arguments.type} at (${call.arguments.x}, ${call.arguments.y})`;
        case 'modify_shape':
          return `Modify ${call.arguments.id}`;
        case 'delete_shape':
          return `Delete ${call.arguments.id}`;
        case 'arrange_shapes':
          return `Arrange ${call.arguments.ids.length} objects in ${call.arguments.layout}`;
        case 'select_shapes':
          return `Select ${call.arguments.ids.length} objects`;
        case 'move_shapes':
          return `Move ${call.arguments.ids.length} objects`;
        case 'resize_shapes':
          return `Resize ${call.arguments.ids.length} objects`;
        case 'change_color':
          return `Change color to ${call.arguments.color}`;
        default:
          return `${call.name}(${Object.keys(call.arguments).length} args)`;
      }
    }).join(', ');
  };

  const outlineText = generateOutline();

  return (
    <div 
      className={`fixed z-[1000] bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg transition-all duration-300 ease-out max-w-sm ${
        position === 'bottom-right' ? 'bottom-20 right-5' : 
        position === 'bottom-left' ? 'bottom-20 left-5' : 
        position === 'top-right' ? 'top-20 right-5' : 
        'top-20 left-5'
      } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'} dark:bg-gray-700/95 dark:border-gray-600`}
      role="dialog"
      aria-label="Command Preview"
    >
      {/* Header with task count */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">AI Command</span>
          {taskCount && (
            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full dark:bg-primary-900/30 dark:text-primary-400">
              {taskCount} task{taskCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleApprove}
            className="w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center text-xs transition-colors duration-200"
            aria-label="Approve command"
            title="Approve command"
          >
            ✓
          </button>
          <button
            onClick={handleReject}
            className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors duration-200"
            aria-label="Reject command"
            title="Reject command"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {outlineText}
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleApprove}
            className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
          >
            Execute
          </button>
          <button
            onClick={handleReject}
            className="flex-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommandOutlinePreview;