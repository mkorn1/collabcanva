import React from 'react';
import './TaskBreakdown.css';

/**
 * Task Breakdown Component
 * Shows the number of tasks and complexity for AI commands
 * Displays step-by-step breakdown for complex operations
 */
const TaskBreakdown = ({
  taskBreakdown = null,
  isVisible = false,
  position = 'top-right'
}) => {
  if (!isVisible || !taskBreakdown) {
    return null;
  }

  const { totalTasks, complexity, tasks, isMultiStep, stepCount, detailedSteps } = taskBreakdown;
  const complexityStyle = getComplexityStyle(complexity);
  const summary = getTaskSummary(taskBreakdown);

  return (
    <div 
      className={`task-breakdown ${position} ${isVisible ? 'visible' : ''}`}
      role="dialog"
      aria-label="Task Breakdown"
    >
      {/* Header */}
      <div className="task-breakdown-header">
        <div className="task-summary">
          <span className="task-count">{totalTasks}</span>
          <span className="task-label">tasks</span>
        </div>
        <div 
          className={`complexity-badge ${complexity}`}
          style={{ 
            color: complexityStyle.color,
            backgroundColor: complexityStyle.backgroundColor 
          }}
        >
          <span className="complexity-icon">{complexityStyle.icon}</span>
          <span className="complexity-label">{complexityStyle.label}</span>
        </div>
      </div>

      {/* Task Details */}
      <div className="task-details">
        <div className="task-summary-text">{summary}</div>
        
        {/* Show detailed step breakdown for multi-step commands */}
        {isMultiStep && detailedSteps && (
          <div className="step-breakdown-detailed">
            <div className="step-breakdown-header">Step Breakdown:</div>
            <div className="step-list">
              {detailedSteps.map((step) => (
                <div key={step.stepNumber} className="step-item">
                  <div className="step-header">
                    <span className="step-number">Step {step.stepNumber}:</span>
                    <span className="step-function">{step.functionName}</span>
                    <span className="step-task-count">({step.totalTasks} task{step.totalTasks !== 1 ? 's' : ''})</span>
                  </div>
                  {step.tasks.length <= 3 && (
                    <div className="step-tasks">
                      {step.tasks.map((task, index) => (
                        <div key={task.id} className="step-task-item">
                          <span className="step-task-bullet">•</span>
                          <span className="step-task-description">{task.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Show detailed breakdown for complex tasks (non-multi-step) */}
        {!isMultiStep && complexity === 'complex' && tasks.length <= 10 && (
          <div className="task-list">
            <div className="task-list-header">Task Breakdown:</div>
            <div className="task-items">
              {tasks.slice(0, 5).map((task, index) => (
                <div key={task.id} className="task-item">
                  <span className="task-number">{index + 1}.</span>
                  <span className="task-description">{task.description}</span>
                </div>
              ))}
              {tasks.length > 5 && (
                <div className="task-item task-more">
                  <span className="task-more-text">... and {tasks.length - 5} more tasks</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Show step breakdown for multi-step commands */}
        {isMultiStep && (
          <div className="step-breakdown">
            <div className="step-info">
              <span className="step-icon">🔄</span>
              <span className="step-text">{stepCount} steps</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions (imported from taskAnalyzer)
function getComplexityStyle(complexity) {
  switch (complexity) {
    case 'simple':
      return {
        color: '#2ed573',
        backgroundColor: '#d4edda',
        icon: '✓',
        label: 'Simple'
      };
    case 'moderate':
      return {
        color: '#f39c12',
        backgroundColor: '#fff3cd',
        icon: '⚠',
        label: 'Moderate'
      };
    case 'complex':
      return {
        color: '#e74c3c',
        backgroundColor: '#f8d7da',
        icon: '⚡',
        label: 'Complex'
      };
    default:
      return {
        color: '#6c757d',
        backgroundColor: '#e9ecef',
        icon: '?',
        label: 'Unknown'
      };
  }
}

function getTaskSummary(breakdown) {
  const { totalTasks, complexity, isMultiStep, stepCount } = breakdown;
  
  if (isMultiStep) {
    return `${totalTasks} tasks across ${stepCount} steps`;
  }
  
  if (totalTasks === 1) {
    return '1 task';
  }
  
  return `${totalTasks} tasks`;
}

export default TaskBreakdown;
