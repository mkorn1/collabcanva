/**
 * Task Analyzer Service
 * Analyzes AI commands and breaks them down into individual tasks
 * Provides task counting and step-by-step breakdown for user understanding
 */

/**
 * Analyzes a function call and determines the number of tasks required
 * @param {Object} functionCall - The function call to analyze
 * @returns {Object} - Task breakdown information
 */
export function analyzeTaskBreakdown(functionCall) {
  const { name, arguments: args } = functionCall;
  
  switch (name) {
    case 'create_shape':
      return {
        totalTasks: 1,
        tasks: [
          {
            id: 'create-shape',
            type: 'create',
            description: `Create ${args.type} at (${args.x}, ${args.y})`,
            estimatedTime: 'instant',
            dependencies: []
          }
        ],
        complexity: 'simple'
      };
    
    case 'modify_shape':
      const modificationCount = Object.keys(args.updates || {}).length;
      return {
        totalTasks: modificationCount,
        tasks: Object.entries(args.updates || {}).map(([key, value], index) => ({
          id: `modify-${key}-${index}`,
          type: 'modify',
          description: `Update ${key} to ${value}`,
          estimatedTime: 'instant',
          dependencies: []
        })),
        complexity: modificationCount > 3 ? 'complex' : 'simple'
      };
    
    case 'delete_shape':
      return {
        totalTasks: 1,
        tasks: [
          {
            id: 'delete-shape',
            type: 'delete',
            description: `Delete shape ${args.id}`,
            estimatedTime: 'instant',
            dependencies: []
          }
        ],
        complexity: 'simple'
      };
    
    case 'arrange_shapes':
      const arrangeSteps = calculateArrangeSteps(args);
      return {
        totalTasks: arrangeSteps.length,
        tasks: arrangeSteps,
        complexity: args.ids.length > 5 ? 'complex' : 'simple'
      };
    
    case 'multi_step_command':
      // Multi-step commands contain an array of actual function calls
      const stepBreakdowns = args.steps.map((step, index) => 
        analyzeTaskBreakdown(step)
      );
      
      const allTasks = stepBreakdowns.flatMap(breakdown => breakdown.tasks);
      const totalTasks = allTasks.length;
      
      // Create a detailed breakdown showing each step and its tasks
      const detailedSteps = args.steps.map((step, stepIndex) => {
        const stepBreakdown = analyzeTaskBreakdown(step);
        return {
          stepNumber: stepIndex + 1,
          functionName: step.name,
          functionArgs: step.arguments,
          tasks: stepBreakdown.tasks,
          totalTasks: stepBreakdown.totalTasks,
          complexity: stepBreakdown.complexity
        };
      });
      
      return {
        totalTasks,
        tasks: allTasks.map((task, index) => ({
          ...task,
          id: `step-${index + 1}-${task.id}`,
          stepNumber: index + 1,
          description: `Step ${index + 1}: ${task.description}`
        })),
        complexity: totalTasks > 5 ? 'complex' : totalTasks > 2 ? 'moderate' : 'simple',
        isMultiStep: true,
        stepCount: args.steps.length,
        detailedSteps: detailedSteps // Include detailed step breakdown
      };
    
    case 'create_layout_template':
      const templateSteps = calculateTemplateSteps(args);
      return {
        totalTasks: templateSteps.length,
        tasks: templateSteps,
        complexity: 'moderate'
      };
    
    default:
      return {
        totalTasks: 1,
        tasks: [
          {
            id: 'unknown-task',
            type: 'unknown',
            description: `${name} command`,
            estimatedTime: 'unknown',
            dependencies: []
          }
        ],
        complexity: 'simple'
      };
  }
}

/**
 * Calculates the steps required for arrange_shapes operations
 * @param {Object} args - Arrange shapes arguments
 * @returns {Array} - Array of task objects
 */
function calculateArrangeSteps(args) {
  const steps = [];
  
  // Step 1: Calculate new positions
  steps.push({
    id: 'calculate-positions',
    type: 'calculate',
    description: `Calculate ${args.layout} layout for ${args.ids.length} objects`,
    estimatedTime: 'instant',
    dependencies: []
  });
  
  // Step 2: Update each object's position
  args.ids.forEach((id, index) => {
    steps.push({
      id: `move-object-${index}`,
      type: 'modify',
      description: `Move object ${id} to new position`,
      estimatedTime: 'instant',
      dependencies: ['calculate-positions']
    });
  });
  
  return steps;
}

/**
 * Calculates the steps required for layout template creation
 * @param {Object} args - Template creation arguments
 * @returns {Array} - Array of task objects
 */
function calculateTemplateSteps(args) {
  const steps = [];
  const templateType = args.template_type;
  
  // Step 1: Create base layout structure
  steps.push({
    id: 'create-base-layout',
    type: 'create',
    description: `Create ${templateType} base structure`,
    estimatedTime: 'instant',
    dependencies: []
  });
  
  // Add template-specific steps
  switch (templateType) {
    case 'login_form':
      steps.push(
        { id: 'create-username-field', type: 'create', description: 'Create username input field', estimatedTime: 'instant', dependencies: ['create-base-layout'] },
        { id: 'create-password-field', type: 'create', description: 'Create password input field', estimatedTime: 'instant', dependencies: ['create-base-layout'] },
        { id: 'create-login-button', type: 'create', description: 'Create login button', estimatedTime: 'instant', dependencies: ['create-base-layout'] }
      );
      break;
    
    case 'card_layout':
      const cardCount = args.options?.cardCount || 3;
      for (let i = 0; i < cardCount; i++) {
        steps.push({
          id: `create-card-${i}`,
          type: 'create',
          description: `Create card ${i + 1}`,
          estimatedTime: 'instant',
          dependencies: ['create-base-layout']
        });
      }
      break;
    
    case 'navigation_bar':
      const navItems = args.options?.navItems || ['Home', 'About', 'Contact'];
      navItems.forEach((item, index) => {
        steps.push({
          id: `create-nav-item-${index}`,
          type: 'create',
          description: `Create navigation item: ${item}`,
          estimatedTime: 'instant',
          dependencies: ['create-base-layout']
        });
      });
      break;
    
    case 'dashboard':
      steps.push(
        { id: 'create-sidebar', type: 'create', description: 'Create sidebar', estimatedTime: 'instant', dependencies: ['create-base-layout'] },
        { id: 'create-main-content', type: 'create', description: 'Create main content area', estimatedTime: 'instant', dependencies: ['create-base-layout'] },
        { id: 'create-header', type: 'create', description: 'Create header', estimatedTime: 'instant', dependencies: ['create-base-layout'] }
      );
      break;
    
    case 'hero_section':
      steps.push(
        { id: 'create-hero-background', type: 'create', description: 'Create hero background', estimatedTime: 'instant', dependencies: ['create-base-layout'] },
        { id: 'create-hero-title', type: 'create', description: 'Create hero title', estimatedTime: 'instant', dependencies: ['create-base-layout'] },
        { id: 'create-cta-button', type: 'create', description: 'Create call-to-action button', estimatedTime: 'instant', dependencies: ['create-base-layout'] }
      );
      break;
  }
  
  return steps;
}

/**
 * Gets a human-readable summary of the task breakdown
 * @param {Object} breakdown - Task breakdown result
 * @returns {string} - Human-readable summary
 */
export function getTaskSummary(breakdown) {
  const { totalTasks, complexity, isMultiStep, stepCount } = breakdown;
  
  if (isMultiStep) {
    return `${totalTasks} tasks across ${stepCount} steps`;
  }
  
  if (totalTasks === 1) {
    return '1 task';
  }
  
  return `${totalTasks} tasks`;
}

/**
 * Gets complexity-based styling information
 * @param {string} complexity - Complexity level
 * @returns {Object} - Styling information
 */
export function getComplexityStyle(complexity) {
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

/**
 * Analyzes multiple function calls and provides overall breakdown
 * @param {Array} functionCalls - Array of function calls
 * @returns {Object} - Overall task breakdown
 */
export function analyzeMultipleTasks(functionCalls) {
  // Handle the case where we have a single multi_step_command
  if (functionCalls.length === 1 && functionCalls[0].name === 'multi_step_command') {
    // For multi-step commands, we already have detailed analysis
    return analyzeTaskBreakdown(functionCalls[0]);
  }
  
  // Handle multiple individual function calls
  const breakdowns = functionCalls.map(call => analyzeTaskBreakdown(call));
  const totalTasks = breakdowns.reduce((sum, breakdown) => sum + breakdown.totalTasks, 0);
  const allTasks = breakdowns.flatMap(breakdown => breakdown.tasks);
  
  // Determine overall complexity
  const complexities = breakdowns.map(b => b.complexity);
  let overallComplexity = 'simple';
  if (complexities.includes('complex') || totalTasks > 10) {
    overallComplexity = 'complex';
  } else if (complexities.includes('moderate') || totalTasks > 3) {
    overallComplexity = 'moderate';
  }
  
  return {
    totalTasks,
    tasks: allTasks,
    complexity: overallComplexity,
    breakdowns: breakdowns,
    isMultiCommand: functionCalls.length > 1
  };
}

export default {
  analyzeTaskBreakdown,
  getTaskSummary,
  getComplexityStyle,
  analyzeMultipleTasks
};
