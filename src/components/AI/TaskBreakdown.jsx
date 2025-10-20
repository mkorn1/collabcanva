import React from 'react';

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
      className={`fixed z-[1000] bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg p-4 max-w-sm transition-all duration-300 ease-out ${
        position === 'top-right' ? 'top-20 right-5' : 
        position === 'top-left' ? 'top-20 left-5' : 
        position === 'bottom-right' ? 'bottom-20 right-5' : 
        'bottom-20 left-5'
      } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'} dark:bg-gray-700/95 dark:border-gray-600`}
      role="dialog"
      aria-label="Task Breakdown"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">{totalTasks}</span>
          <span className="text-sm text-gray-600 dark:text-gray-300">tasks</span>
        </div>
        <div 
          className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
            complexity === 'low' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
            complexity === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          <span className="text-xs">{complexityStyle.icon}</span>
          <span>{complexityStyle.label}</span>
        </div>
      </div>

      {/* Task Details */}
      <div className="space-y-3">
        <div className="text-sm text-gray-600 dark:text-gray-300">{summary}</div>
        
        {/* Show detailed step breakdown for multi-step commands */}
        {isMultiStep && detailedSteps && detailedSteps.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
              Step-by-step breakdown:
            </div>
            <div className="space-y-1">
              {detailedSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-2 text-xs">
                  <span className="flex-shrink-0 w-5 h-5 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="text-gray-600 dark:text-gray-300 leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show task list for single-step commands */}
        {!isMultiStep && tasks && tasks.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
              Tasks to execute:
            </div>
            <ul className="space-y-1">
              {tasks.map((task, index) => (
                <li key={index} className="flex items-start gap-2 text-xs">
                  <span className="flex-shrink-0 w-1.5 h-1.5 bg-primary-500 rounded-full mt-1.5"></span>
                  <span className="text-gray-600 dark:text-gray-300">{task}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions for complexity styling
const getComplexityStyle = (complexity) => {
  switch (complexity) {
    case 'low':
      return {
        icon: '✓',
        label: 'Low',
        color: '#059669',
        backgroundColor: '#d1fae5'
      };
    case 'medium':
      return {
        icon: '⚠',
        label: 'Medium',
        color: '#d97706',
        backgroundColor: '#fef3c7'
      };
    case 'high':
      return {
        icon: '⚡',
        label: 'High',
        color: '#dc2626',
        backgroundColor: '#fee2e2'
      };
    default:
      return {
        icon: '?',
        label: 'Unknown',
        color: '#6b7280',
        backgroundColor: '#f3f4f6'
      };
  }
};

const getTaskSummary = (taskBreakdown) => {
  const { totalTasks, complexity, isMultiStep, stepCount } = taskBreakdown;
  
  if (isMultiStep) {
    return `This command will execute ${totalTasks} tasks across ${stepCount} steps.`;
  } else {
    return `This command will execute ${totalTasks} task${totalTasks !== 1 ? 's' : ''}.`;
  }
};

export default TaskBreakdown;