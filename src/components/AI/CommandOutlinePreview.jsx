import React from 'react';
import './CommandOutlinePreview.css';

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
        default:
          return `${call.name} command`;
      }
    }).join(', ');
  };

  const outlineText = generateOutline();

  return (
    <div 
      className={`command-outline-preview ${position} visible`}
      role="dialog"
      aria-label="Command Preview"
    >
      {/* Outline Content */}
      <div className="outline-content">
        <div className="outline-text">
          {outlineText}
        </div>
        {taskCount && (
          <div className="task-count-indicator">
            {taskCount} task{taskCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="outline-actions">
        <button
          className="outline-button reject-button"
          onClick={handleReject}
          aria-label="Reject command"
          title="Reject"
        >
          ✕
        </button>
        <button
          className="outline-button approve-button"
          onClick={handleApprove}
          aria-label="Approve command"
          title="Approve"
        >
          ✓
        </button>
      </div>
    </div>
  );
};

export default CommandOutlinePreview;
