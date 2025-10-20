/**
 * Command Executor Service
 * Executes AI-generated function calls on the canvas
 * Bridges AI Agent commands with actual canvas operations
 * Enhanced with comprehensive error handling for partial failures
 */

import { createLayoutTemplate } from './layoutTemplates';

/**
 * Error types for better error categorization
 */
export const ERROR_TYPES = {
  VALIDATION_ERROR: 'validation_error',
  EXECUTION_ERROR: 'execution_error',
  PARTIAL_FAILURE: 'partial_failure',
  NETWORK_ERROR: 'network_error',
  PERMISSION_ERROR: 'permission_error',
  UNKNOWN_ERROR: 'unknown_error'
};

/**
 * Creates a standardized error result
 * @param {string} message - Error message
 * @param {string} type - Error type from ERROR_TYPES
 * @param {Error} error - Original error object
 * @param {Object} context - Additional context
 * @returns {Object} - Standardized error result
 */
export function createErrorResult(message, type = ERROR_TYPES.UNKNOWN_ERROR, error = null, context = {}) {
  return {
    success: false,
    message: message,
    type: type,
    error: error,
    context: context,
    timestamp: new Date().toISOString()
  };
}

/**
 * Creates a standardized success result
 * @param {string} message - Success message
 * @param {Object} data - Additional data
 * @returns {Object} - Standardized success result
 */
export function createSuccessResult(message, data = {}) {
  return {
    success: true,
    message: message,
    type: 'success',
    data: data,
    timestamp: new Date().toISOString()
  };
}

/**
 * Attempts to rollback partial changes when a command fails
 * @param {Array} successfulOperations - Array of operations that succeeded
 * @param {Object} canvasContext - Canvas state and functions
 * @returns {Promise<Object>} - Rollback result
 */
export async function attemptRollback(successfulOperations, canvasContext) {
  const rollbackResults = [];
  const rollbackErrors = [];
  
  for (const operation of successfulOperations) {
    try {
      switch (operation.type) {
        case 'create':
          // Delete the created object
          await canvasContext.removeObject(operation.objectId);
          rollbackResults.push({
            success: true,
            operation: 'delete',
            objectId: operation.objectId,
            message: `Rolled back creation of ${operation.objectType}`
          });
          break;
          
        case 'update':
          // Restore original properties
          await canvasContext.updateObject(operation.objectId, operation.originalProperties);
          rollbackResults.push({
            success: true,
            operation: 'restore',
            objectId: operation.objectId,
            message: `Restored ${operation.objectType} to original state`
          });
          break;
          
        case 'delete':
          // Recreate the deleted object
          await canvasContext.addObject(operation.originalObject);
          rollbackResults.push({
            success: true,
            operation: 'recreate',
            objectId: operation.objectId,
            message: `Recreated deleted ${operation.objectType}`
          });
          break;
          
        default:
          rollbackResults.push({
            success: false,
            operation: 'unknown',
            message: `Cannot rollback unknown operation type: ${operation.type}`
          });
      }
    } catch (error) {
      rollbackErrors.push({
        operation: operation.type,
        objectId: operation.objectId,
        error: error.message
      });
    }
  }
  
  return {
    success: rollbackErrors.length === 0,
    message: rollbackErrors.length === 0 ? 
      `Successfully rolled back ${rollbackResults.length} operations` :
      `Partial rollback: ${rollbackResults.length} succeeded, ${rollbackErrors.length} failed`,
    rollbackResults: rollbackResults,
    rollbackErrors: rollbackErrors
  };
}

/**
 * Executes a single AI function call on the canvas
 * @param {Object} functionCall - AI-generated function call
 * @param {Object} canvasContext - Canvas state and functions
 * @param {Object} user - Current user context
 * @returns {Promise<Object>} - Execution result
 */
export async function executeCommand(functionCall, canvasContext, user) {
  const { name, arguments: args } = functionCall;
  
  try {
    switch (name) {
      case 'create_shape':
        return await executeCreateShape(args, canvasContext, user);
      
      case 'modify_shape':
        return await executeModifyShape(args, canvasContext, user);
      
      case 'delete_shape':
        return await executeDeleteShape(args, canvasContext, user);
      
      case 'arrange_shapes':
        return await executeArrangeShapes(args, canvasContext, user);
      
      case 'create_layout_template':
        return await executeCreateLayoutTemplate(args, canvasContext, user);
      
      case 'multi_step_command':
        return await executeMultiStepCommand(args, canvasContext, user);
      
      default:
        return {
          success: false,
          message: `Unknown function: ${name}`,
          type: 'error'
        };
    }
  } catch (error) {
    console.error(`Error executing ${name}:`, error);
    return {
      success: false,
      message: `Failed to execute ${name}: ${error.message}`,
      type: 'error',
      error: error
    };
  }
}

/**
 * Executes multiple AI function calls in sequence with enhanced error handling
 * @param {Array} functionCalls - Array of AI-generated function calls
 * @param {Object} canvasContext - Canvas state and functions
 * @param {Object} user - Current user context
 * @returns {Promise<Object>} - Execution results with detailed error information
 */
export async function executeCommands(functionCalls, canvasContext, user) {
  const results = [];
  const errors = [];
  const successfulCommands = [];
  const failedCommands = [];
  const partialSuccessCommands = [];
  
  for (let i = 0; i < functionCalls.length; i++) {
    const functionCall = functionCalls[i];
    
    try {
      const result = await executeCommand(functionCall, canvasContext, user);
      results.push({
        ...result,
        commandIndex: i,
        functionName: functionCall.name,
        functionArgs: functionCall.arguments
      });
      
      if (result.success) {
        successfulCommands.push({
          index: i,
          name: functionCall.name,
          message: result.message,
          result: result
        });
      } else if (result.type === 'partial_success') {
        partialSuccessCommands.push({
          index: i,
          name: functionCall.name,
          message: result.message,
          result: result
        });
        errors.push(result); // Partial success is still considered an error for overall status
      } else {
        failedCommands.push({
          index: i,
          name: functionCall.name,
          message: result.message,
          error: result.error,
          result: result
        });
        errors.push(result);
      }
    } catch (error) {
      const errorResult = {
        success: false,
        message: `Unexpected error executing ${functionCall.name}: ${error.message}`,
        type: 'error',
        error: error,
        commandIndex: i,
        functionName: functionCall.name,
        functionArgs: functionCall.arguments
      };
      
      results.push(errorResult);
      errors.push(errorResult);
      failedCommands.push({
        index: i,
        name: functionCall.name,
        message: errorResult.message,
        error: error,
        result: errorResult
      });
    }
  }
  
  // Determine overall execution status
  const totalCommands = functionCalls.length;
  const successCount = successfulCommands.length;
  const partialCount = partialSuccessCommands.length;
  const failureCount = failedCommands.length;
  
  let overallSuccess = false;
  let overallMessage = '';
  let overallType = 'error';
  
  if (failureCount === 0 && partialCount === 0) {
    // All commands succeeded
    overallSuccess = true;
    overallMessage = `All ${successCount} commands executed successfully`;
    overallType = 'success';
  } else if (successCount > 0 || partialCount > 0) {
    // Some commands succeeded or partially succeeded
    overallSuccess = false;
    overallMessage = `Partial execution: ${successCount} succeeded, ${partialCount} partial, ${failureCount} failed`;
    overallType = 'partial_success';
  } else {
    // All commands failed
    overallSuccess = false;
    overallMessage = `All ${failureCount} commands failed`;
    overallType = 'error';
  }
  
  return {
    success: overallSuccess,
    message: overallMessage,
    type: overallType,
    results: results,
    errors: errors,
    executedCount: totalCommands,
    successCount: successCount,
    partialCount: partialCount,
    errorCount: failureCount,
    successfulCommands: successfulCommands,
    partialSuccessCommands: partialSuccessCommands,
    failedCommands: failedCommands,
    summary: {
      total: totalCommands,
      successful: successCount,
      partial: partialCount,
      failed: failureCount,
      successRate: totalCommands > 0 ? (successCount / totalCommands) * 100 : 0
    }
  };
}

/**
 * Executes multi-step command (array of function calls)
 * @param {Object} args - Function arguments containing steps array
 * @param {Object} canvasContext - Canvas state and functions
 * @param {Object} user - Current user context
 * @returns {Promise<Object>} - Execution result
 */
async function executeMultiStepCommand(args, canvasContext, user) {
  const { steps } = args;
  
  // Validate required arguments
  if (!steps || !Array.isArray(steps) || steps.length === 0) {
    return {
      success: false,
      message: 'Missing or invalid steps array for multi-step command',
      type: 'error'
    };
  }
  
  // Validate each step
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (!step.name || !step.arguments) {
      return {
        success: false,
        message: `Invalid step ${i + 1}: missing name or arguments`,
        type: 'error'
      };
    }
    
    // Validate step function name
    if (!['create_shape', 'modify_shape', 'delete_shape', 'arrange_shapes'].includes(step.name)) {
      return {
        success: false,
        message: `Invalid step ${i + 1}: unknown function '${step.name}'`,
        type: 'error'
      };
    }
  }
  
  try {
    // Use the existing executeCommands function to handle the array of steps
    const result = await executeCommands(steps, canvasContext, user);
    
    // Enhance the result message for multi-step operations
    if (result.success) {
      result.message = `Successfully executed ${result.successCount} of ${result.executedCount} steps`;
    } else if (result.type === 'partial_success') {
      result.message = `Partially executed multi-step command: ${result.successCount} succeeded, ${result.errorCount} failed`;
    } else {
      result.message = `Multi-step command failed: ${result.errorCount} of ${result.executedCount} steps failed`;
    }
    
    return result;
  } catch (error) {
    return {
      success: false,
      message: `Failed to execute multi-step command: ${error.message}`,
      type: 'error',
      error: error
    };
  }
}

/**
 * Executes create_shape function call
 * @param {Object} args - Function arguments
 * @param {Object} canvasContext - Canvas state and functions
 * @param {Object} user - Current user context
 * @returns {Promise<Object>} - Execution result
 */
async function executeCreateShape(args, canvasContext, user) {
  console.log('🎨 executeCreateShape called with args:', args);
  console.log('🎨 canvasContext:', canvasContext);
  
  const { addObject } = canvasContext;
  
  // Validate required arguments
  if (!args.type || args.x === undefined || args.y === undefined || 
      args.width === undefined || args.height === undefined || !args.fill) {
    console.log('❌ Validation failed - missing required arguments');
    return {
      success: false,
      message: 'Missing required arguments: type, x, y, width, height, fill',
      type: 'error'
    };
  }
  
  console.log('✅ Validation passed');
  
  // Validate object type
  if (!['rectangle', 'circle', 'text'].includes(args.type)) {
    console.log('❌ Invalid object type:', args.type);
    return {
      success: false,
      message: `Invalid object type: ${args.type}. Must be rectangle, circle, or text`,
      type: 'error'
    };
  }
  
  console.log('✅ Object type validation passed');
  
  // Create object with validation
  const newObject = {
    type: args.type,
    x: Math.max(0, args.x),
    y: Math.max(0, args.y),
    width: Math.max(10, args.width),
    height: Math.max(10, args.height),
    fill: args.fill,
    stroke: args.stroke || args.fill,
    strokeWidth: args.strokeWidth || 2,
    opacity: Math.max(0, Math.min(1, args.opacity || 1)),
    rotation: args.rotation || 0
  };
  
  console.log('🎨 Created new object:', newObject);
  
  // Add type-specific properties
  if (args.type === 'text') {
    newObject.text = args.text_content || 'New Text';
    newObject.fontSize = Math.max(8, Math.min(72, args.fontSize || 16));
    newObject.fontFamily = args.fontFamily || 'Arial';
  }
  
  // Ensure circles are square
  if (args.type === 'circle') {
    newObject.height = newObject.width;
  }
  
  try {
    console.log('🎨 Calling addObject with:', newObject);
    const objectId = await addObject(newObject);
    console.log('🎨 addObject returned ID:', objectId);
    
    const result = {
      success: true,
      message: `Created ${args.type} at (${newObject.x}, ${newObject.y})`,
      type: 'success',
      objectId: objectId,
      object: newObject
    };
    
    console.log('🎨 executeCreateShape success result:', result);
    return result;
  } catch (error) {
    console.log('❌ executeCreateShape error:', error);
    return {
      success: false,
      message: `Failed to create ${args.type}: ${error.message}`,
      type: 'error',
      error: error
    };
  }
}

/**
 * Executes modify_shape function call
 * @param {Object} args - Function arguments
 * @param {Object} canvasContext - Canvas state and functions
 * @param {Object} user - Current user context
 * @returns {Promise<Object>} - Execution result
 */
async function executeModifyShape(args, canvasContext, user) {
  const { updateObject, objects } = canvasContext;
  
  // Validate required arguments
  if (!args.id || !args.updates) {
    return {
      success: false,
      message: 'Missing required arguments: id, updates',
      type: 'error'
    };
  }
  
  // Find the object to modify
  const object = objects.find(obj => obj.id === args.id);
  if (!object) {
    return {
      success: false,
      message: `Object with id ${args.id} not found`,
      type: 'error'
    };
  }
  
  // Validate and prepare updates
  const updates = {};
  
  // Position updates
  if (args.updates.x !== undefined) {
    updates.x = Math.max(0, args.updates.x);
  }
  if (args.updates.y !== undefined) {
    updates.y = Math.max(0, args.updates.y);
  }
  
  // Size updates
  if (args.updates.width !== undefined) {
    updates.width = Math.max(10, args.updates.width);
  }
  if (args.updates.height !== undefined) {
    updates.height = Math.max(10, args.updates.height);
  }
  
  // Ensure circles remain square
  if (object.type === 'circle' && updates.width !== undefined) {
    updates.height = updates.width;
  }
  
  // Styling updates
  if (args.updates.fill !== undefined) {
    updates.fill = args.updates.fill;
  }
  if (args.updates.stroke !== undefined) {
    updates.stroke = args.updates.stroke;
  }
  if (args.updates.strokeWidth !== undefined) {
    updates.strokeWidth = Math.max(0, args.updates.strokeWidth);
  }
  if (args.updates.opacity !== undefined) {
    updates.opacity = Math.max(0, Math.min(1, args.updates.opacity));
  }
  if (args.updates.rotation !== undefined) {
    updates.rotation = args.updates.rotation % 360;
    if (updates.rotation < 0) updates.rotation += 360;
  }
  
  // Text-specific updates
  if (object.type === 'text') {
    if (args.updates.text !== undefined) {
      updates.text = args.updates.text;
    }
    if (args.updates.fontSize !== undefined) {
      updates.fontSize = Math.max(8, Math.min(72, args.updates.fontSize));
    }
    if (args.updates.fontFamily !== undefined) {
      updates.fontFamily = args.updates.fontFamily;
    }
  }
  
  try {
    await updateObject(args.id, updates);
    
    return {
      success: true,
      message: `Modified ${object.type} ${args.id}`,
      type: 'success',
      objectId: args.id,
      updates: updates
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to modify ${object.type} ${args.id}: ${error.message}`,
      type: 'error',
      error: error
    };
  }
}

/**
 * Executes delete_shape function call
 * @param {Object} args - Function arguments
 * @param {Object} canvasContext - Canvas state and functions
 * @param {Object} user - Current user context
 * @returns {Promise<Object>} - Execution result
 */
async function executeDeleteShape(args, canvasContext, user) {
  const { removeObject, objects } = canvasContext;
  
  // Validate required arguments
  if (!args.id) {
    return {
      success: false,
      message: 'Missing required argument: id',
      type: 'error'
    };
  }
  
  // Find the object to delete
  const object = objects.find(obj => obj.id === args.id);
  if (!object) {
    return {
      success: false,
      message: `Object with id ${args.id} not found`,
      type: 'error'
    };
  }
  
  try {
    await removeObject(args.id);
    
    return {
      success: true,
      message: `Deleted ${object.type} ${args.id}`,
      type: 'success',
      objectId: args.id,
      object: object
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to delete ${object.type} ${args.id}: ${error.message}`,
      type: 'error',
      error: error
    };
  }
}

/**
 * Executes arrange_shapes function call
 * @param {Object} args - Function arguments
 * @param {Object} canvasContext - Canvas state and functions
 * @param {Object} user - Current user context
 * @returns {Promise<Object>} - Execution result
 */
async function executeArrangeShapes(args, canvasContext, user) {
  console.log('🔄 executeArrangeShapes called with args:', args);
  console.log('🔄 canvasContext:', canvasContext);
  
  const { updateObject, objects, getSelectedObjects } = canvasContext;
  
  // If no IDs provided, use selected objects
  let objectIds = args.ids;
  if (!objectIds || objectIds.length === 0) {
    const selectedObjects = getSelectedObjects();
    if (selectedObjects && selectedObjects.length > 0) {
      objectIds = selectedObjects.map(obj => obj.id);
      console.log('🎯 Using selected objects as default:', objectIds);
    } else {
      console.log('❌ No IDs provided and no objects selected');
      return {
        success: false,
        message: 'No objects specified and no objects selected. Please select objects first or specify which objects to arrange.',
        type: 'error'
      };
    }
  }
  
  // Validate required arguments
  if (!objectIds || !Array.isArray(objectIds) || objectIds.length === 0) {
    console.log('❌ Missing or invalid ids array');
    return {
      success: false,
      message: 'Missing or invalid ids array',
      type: 'error'
    };
  }
  
  if (!args.layout || !['row', 'column', 'grid', 'distribute_h', 'distribute_v', 'circle', 'spiral', 'flow', 'hexagon', 'diamond', 'wave', 'zigzag', 'radial', 'fibonacci'].includes(args.layout)) {
    console.log('❌ Invalid layout:', args.layout);
    return {
      success: false,
      message: `Invalid layout: ${args.layout}. Must be one of: row, column, grid, distribute_h, distribute_v, circle, spiral, flow, hexagon, diamond, wave, zigzag, radial, fibonacci`,
      type: 'error'
    };
  }
  
  // Find all objects to arrange
  const objectsToArrange = objectIds.map(id => objects.find(obj => obj.id === id)).filter(Boolean);
  console.log('🔄 Objects to arrange:', objectsToArrange);
  
  if (objectsToArrange.length === 0) {
    console.log('❌ No valid objects found to arrange');
    return {
      success: false,
      message: 'No valid objects found to arrange',
      type: 'error'
    };
  }
  
  if (objectsToArrange.length !== objectIds.length) {
    console.log('❌ Only found', objectsToArrange.length, 'of', objectIds.length, 'objects');
    return {
      success: false,
      message: `Only found ${objectsToArrange.length} of ${objectIds.length} objects`,
      type: 'error'
    };
  }
  
  try {
    // Calculate new positions based on layout
    console.log('🔄 Calculating layout positions for layout:', args.layout);
    const newPositions = calculateLayoutPositions(objectsToArrange, args.layout, args.options || {});
    console.log('🔄 New positions calculated:', newPositions);
    
    // Update all objects with individual error handling
    const updateResults = [];
    const successfulUpdates = [];
    const failedUpdates = [];
    
    for (let i = 0; i < objectsToArrange.length; i++) {
      const obj = objectsToArrange[i];
      const newPos = newPositions[i];
      
      console.log(`🔄 Updating object ${i}:`, {
        id: obj.id,
        type: obj.type,
        originalPosition: { x: obj.x, y: obj.y },
        newPosition: newPos,
        originalSize: { width: obj.width, height: obj.height }
      });
      
      try {
        const updateData = { x: newPos.x, y: newPos.y };
        console.log('🔄 Calling updateObject with:', updateData);
        await updateObject(obj.id, updateData);
        
        successfulUpdates.push({
          objectId: obj.id,
          objectType: obj.type,
          newPosition: newPos
        });
        updateResults.push({
          success: true,
          objectId: obj.id,
          message: `Updated ${obj.type} position to (${newPos.x}, ${newPos.y})`
        });
        
        console.log('✅ Successfully updated object:', obj.id);
      } catch (error) {
        console.log('❌ Failed to update object:', obj.id, error);
        failedUpdates.push({
          objectId: obj.id,
          objectType: obj.type,
          error: error.message,
          originalPosition: { x: obj.x, y: obj.y }
        });
        updateResults.push({
          success: false,
          objectId: obj.id,
          message: `Failed to update ${obj.type}: ${error.message}`,
          error: error
        });
      }
    }
    
    // Determine overall success
    const allSuccessful = failedUpdates.length === 0;
    const partialSuccess = successfulUpdates.length > 0 && failedUpdates.length > 0;
    
    if (allSuccessful) {
      return {
        success: true,
        message: `Successfully arranged ${successfulUpdates.length} objects in ${args.layout} layout`,
        type: 'success',
        objectIds: args.ids,
        layout: args.layout,
        positions: newPositions,
        updateResults: updateResults
      };
    } else if (partialSuccess) {
      return {
        success: false,
        message: `Partially arranged objects: ${successfulUpdates.length} succeeded, ${failedUpdates.length} failed`,
        type: 'partial_success',
        objectIds: args.ids,
        layout: args.layout,
        successfulUpdates: successfulUpdates,
        failedUpdates: failedUpdates,
        updateResults: updateResults,
        error: `Partial failure: ${failedUpdates.map(f => f.error).join(', ')}`
      };
    } else {
      return {
        success: false,
        message: `Failed to arrange any objects in ${args.layout} layout`,
        type: 'error',
        objectIds: args.ids,
        layout: args.layout,
        failedUpdates: failedUpdates,
        updateResults: updateResults,
        error: `All updates failed: ${failedUpdates.map(f => f.error).join(', ')}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to arrange objects: ${error.message}`,
      type: 'error',
      error: error,
      objectIds: args.ids,
      layout: args.layout
    };
  }
}

/**
 * Calculates new positions for objects based on layout
 * @param {Array} objects - Objects to arrange
 * @param {string} layout - Layout type
 * @param {Object} options - Layout options
 * @returns {Array} - Array of new positions
 */
/**
 * Enhanced layout calculation with sophisticated algorithms
 * @param {Array} objects - Objects to arrange
 * @param {string} layout - Layout type
 * @param {Object} options - Layout options
 * @returns {Array} - Array of new positions
 */
function calculateLayoutPositions(objects, layout, options = {}) {
  const spacing = Math.max(0, options.spacing || 20);
  
  // Calculate default start position from current object positions
  let startX, startY;
  if (options.startX !== undefined) {
    startX = options.startX;
  } else if (objects.length === 1) {
    // For single object, use its current position
    startX = objects[0].x;
  } else {
    // For multiple objects, use average position
    startX = objects.reduce((sum, obj) => sum + obj.x, 0) / objects.length;
  }
  
  if (options.startY !== undefined) {
    startY = options.startY;
  } else if (objects.length === 1) {
    // For single object, use its current position
    startY = objects[0].y;
  } else {
    // For multiple objects, use average position
    startY = objects.reduce((sum, obj) => sum + obj.y, 0) / objects.length;
  }
  
  const columns = Math.max(1, options.columns || Math.ceil(Math.sqrt(objects.length)));
  const alignment = options.alignment || 'start'; // start, center, end
  const justify = options.justify || 'start'; // start, center, end, space-between, space-around
  
  switch (layout) {
    case 'row':
      return arrangeInRow(objects, spacing, startX, startY, alignment, justify);
    
    case 'column':
      return arrangeInColumn(objects, spacing, startX, startY, alignment, justify);
    
    case 'grid':
      return arrangeInGrid(objects, spacing, startX, startY, columns, alignment, justify);
    
    case 'distribute_h':
      return distributeHorizontally(objects, startX, startY, options);
    
    case 'distribute_v':
      return distributeVertically(objects, startX, startY, options);
    
    case 'circle':
      return arrangeInCircle(objects, spacing, startX, startY, options);
    
    case 'spiral':
      return arrangeInSpiral(objects, spacing, startX, startY, options);
    
    case 'flow':
      return arrangeInFlow(objects, spacing, startX, startY, options);
    
    // Advanced layout algorithms
    case 'hexagon':
      return arrangeInHexagon(objects, spacing, startX, startY, options);
    
    case 'diamond':
      return arrangeInDiamond(objects, spacing, startX, startY, options);
    
    case 'wave':
      return arrangeInWave(objects, spacing, startX, startY, options);
    
    case 'zigzag':
      return arrangeInZigzag(objects, spacing, startX, startY, options);
    
    case 'radial':
      return arrangeInRadial(objects, spacing, startX, startY, options);
    
    case 'fibonacci':
      return arrangeInFibonacci(objects, spacing, startX, startY, options);
    
    default:
      throw new Error(`Unknown layout: ${layout}`);
  }
}

/**
 * Enhanced row arrangement with alignment and justification options
 * @param {Array} objects - Objects to arrange
 * @param {number} spacing - Spacing between objects
 * @param {number} startX - Starting X position
 * @param {number} startY - Starting Y position
 * @param {string} alignment - Vertical alignment (start, center, end)
 * @param {string} justify - Horizontal justification (start, center, end, space-between, space-around)
 * @returns {Array} - Array of positions
 */
function arrangeInRow(objects, spacing, startX, startY, alignment = 'start', justify = 'start') {
  if (objects.length === 0) return [];
  
  // Use Euclidean distance for consistent spacing
  const positions = calculateEuclideanPositions(objects, startX, startY, spacing, 'horizontal');
  
  // Apply vertical alignment to all positions
  return positions.map((pos, index) => {
    const obj = objects[index];
    let y = pos.y;
    
    if (alignment === 'center') {
      y = startY - obj.height / 2;
    } else if (alignment === 'end') {
      y = startY - obj.height;
    } else {
      y = startY;
    }
    
    return { x: pos.x, y: y };
  });
}

/**
 * Enhanced column arrangement with alignment and justification options
 * @param {Array} objects - Objects to arrange
 * @param {number} spacing - Spacing between objects
 * @param {number} startX - Starting X position
 * @param {number} startY - Starting Y position
 * @param {string} alignment - Horizontal alignment (start, center, end)
 * @param {string} justify - Vertical justification (start, center, end, space-between, space-around)
 * @returns {Array} - Array of positions
 */
function arrangeInColumn(objects, spacing, startX, startY, alignment = 'start', justify = 'start') {
  if (objects.length === 0) return [];
  
  // Use Euclidean distance for consistent spacing
  const positions = calculateEuclideanPositions(objects, startX, startY, spacing, 'vertical');
  
  // Apply horizontal alignment to all positions
  return positions.map((pos, index) => {
    const obj = objects[index];
    let x = pos.x;
    
    if (alignment === 'center') {
      x = startX - obj.width / 2;
    } else if (alignment === 'end') {
      x = startX - obj.width;
    } else {
      x = startX;
    }
    
    return { x: x, y: pos.y };
  });
}

/**
 * Enhanced grid arrangement with alignment and justification options
 * @param {Array} objects - Objects to arrange
 * @param {number} spacing - Spacing between objects
 * @param {number} startX - Starting X position
 * @param {number} startY - Starting Y position
 * @param {number} columns - Number of columns
 * @param {string} alignment - Alignment (start, center, end)
 * @param {string} justify - Justification (start, center, end, space-between, space-around)
 * @returns {Array} - Array of positions
 */
function arrangeInGrid(objects, spacing, startX, startY, columns = 3, alignment = 'start', justify = 'start') {
  if (objects.length === 0) return [];
  
  const rows = Math.ceil(objects.length / columns);
  
  // Calculate grid dimensions
  const maxWidth = Math.max(...objects.map(obj => obj.width));
  const maxHeight = Math.max(...objects.map(obj => obj.height));
  
  const gridWidth = columns * maxWidth + (columns - 1) * spacing;
  const gridHeight = rows * maxHeight + (rows - 1) * spacing;
  
  // Calculate starting position based on alignment and justification
  let gridStartX = startX;
  let gridStartY = startY;
  
  if (alignment === 'center') {
    gridStartX = startX - gridWidth / 2;
  } else if (alignment === 'end') {
    gridStartX = startX - gridWidth;
  }
  
  if (justify === 'center') {
    gridStartY = startY - gridHeight / 2;
  } else if (justify === 'end') {
    gridStartY = startY - gridHeight;
  }
  
  return objects.map((obj, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    
    // Center each object within its grid cell
    const cellX = gridStartX + col * (maxWidth + spacing);
    const cellY = gridStartY + row * (maxHeight + spacing);
    
    const x = cellX + (maxWidth - obj.width) / 2;
    const y = cellY + (maxHeight - obj.height) / 2;
    
    return { x: x, y: y };
  });
}

/**
 * Calculate Euclidean distance between two points
 * @param {number} x1 - First point x
 * @param {number} y1 - First point y
 * @param {number} x2 - Second point x
 * @param {number} y2 - Second point y
 * @returns {number} - Euclidean distance
 */
function calculateDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Calculate positions with equal Euclidean distance spacing
 * @param {Array} objects - Objects to distribute
 * @param {number} startX - Starting X position
 * @param {number} startY - Starting Y position
 * @param {number} targetDistance - Target Euclidean distance between objects
 * @param {string} direction - Direction vector (e.g., 'horizontal', 'vertical', 'diagonal')
 * @returns {Array} - Array of positions
 */
function calculateEuclideanPositions(objects, startX, startY, targetDistance, direction = 'horizontal') {
  if (objects.length <= 1) {
    return objects.map(obj => ({ x: startX, y: startY }));
  }
  
  const positions = [];
  let currentX = startX;
  let currentY = startY;
  
  // Calculate direction vector based on direction type
  let deltaX = 0;
  let deltaY = 0;
  
  switch (direction) {
    case 'horizontal':
      deltaX = 1;
      deltaY = 0;
      break;
    case 'vertical':
      deltaX = 0;
      deltaY = 1;
      break;
    case 'diagonal':
      deltaX = Math.sqrt(2) / 2;
      deltaY = Math.sqrt(2) / 2;
      break;
    case 'diagonal-up':
      deltaX = Math.sqrt(2) / 2;
      deltaY = -Math.sqrt(2) / 2;
      break;
    default:
      deltaX = 1;
      deltaY = 0;
  }
  
  // Normalize the direction vector
  const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  deltaX = deltaX / magnitude;
  deltaY = deltaY / magnitude;
  
  // Place first object at starting position
  positions.push({ x: currentX, y: currentY });
  
  // Calculate positions for remaining objects
  for (let i = 1; i < objects.length; i++) {
    // Move by target distance in the specified direction
    currentX += deltaX * targetDistance;
    currentY += deltaY * targetDistance;
    
    positions.push({ x: currentX, y: currentY });
  }
  
  return positions;
}

/**
 * Enhanced horizontal distribution with equal spacing
 * @param {Array} objects - Objects to distribute
 * @param {number} startX - Starting X position
 * @param {number} startY - Starting Y position
 * @param {Object} options - Distribution options
 * @returns {Array} - Array of positions
 */
function distributeHorizontally(objects, startX, startY, options = {}) {
  if (objects.length <= 1) {
    return objects.map(obj => ({ x: startX, y: startY }));
  }
  
  const spacing = options.spacing || 20;
  const alignment = options.alignment || 'start';
  const distributionType = options.distributionType || 'equal'; // equal, space-between, space-around
  const useEuclideanDistance = options.useEuclideanDistance !== false; // Default to true
  
  if (useEuclideanDistance) {
    // Use Euclidean distance for orientation-independent spacing
    return calculateEuclideanPositions(objects, startX, startY, spacing, 'horizontal');
  }
  
  // Fallback to original linear spacing logic
  const totalObjectWidth = objects.reduce((sum, obj) => sum + obj.width, 0);
  
  let actualSpacing = spacing;
  let currentX = startX;
  let totalWidth = totalObjectWidth + (objects.length - 1) * spacing;
  
  // Adjust spacing and positioning based on distribution type
  if (distributionType === 'space-between') {
    // Distribute space evenly between objects (no space at ends)
    // Calculate the total space available for distribution
    const availableSpace = Math.max(0, totalWidth - totalObjectWidth);
    actualSpacing = objects.length > 1 ? availableSpace / (objects.length - 1) : 0;
    totalWidth = totalObjectWidth + (objects.length - 1) * actualSpacing;
  } else if (distributionType === 'space-around') {
    // Distribute space around objects (equal space around each object)
    const availableSpace = Math.max(0, totalWidth - totalObjectWidth);
    actualSpacing = availableSpace / (objects.length + 1);
    currentX = startX + actualSpacing;
    totalWidth = totalObjectWidth + (objects.length + 1) * actualSpacing;
  }
  
  // Calculate starting X based on alignment
  if (alignment === 'center') {
    currentX = startX - totalWidth / 2;
  } else if (alignment === 'end') {
    currentX = startX - totalWidth;
  }
  
  return objects.map(obj => {
    const y = startY;
    const position = { x: currentX, y: y };
    currentX += obj.width + actualSpacing;
    return position;
  });
}

/**
 * Enhanced vertical distribution with equal spacing
 * @param {Array} objects - Objects to distribute
 * @param {number} startX - Starting X position
 * @param {number} startY - Starting Y position
 * @param {Object} options - Distribution options
 * @returns {Array} - Array of positions
 */
function distributeVertically(objects, startX, startY, options = {}) {
  if (objects.length <= 1) {
    return objects.map(obj => ({ x: startX, y: startY }));
  }
  
  const spacing = options.spacing || 20;
  const alignment = options.alignment || 'start';
  const distributionType = options.distributionType || 'equal'; // equal, space-between, space-around
  const useEuclideanDistance = options.useEuclideanDistance !== false; // Default to true
  
  if (useEuclideanDistance) {
    // Use Euclidean distance for orientation-independent spacing
    return calculateEuclideanPositions(objects, startX, startY, spacing, 'vertical');
  }
  
  // Fallback to original linear spacing logic
  const totalObjectHeight = objects.reduce((sum, obj) => sum + obj.height, 0);
  
  let actualSpacing = spacing;
  let currentY = startY;
  let totalHeight = totalObjectHeight + (objects.length - 1) * spacing;
  
  // Adjust spacing and positioning based on distribution type
  if (distributionType === 'space-between') {
    // Distribute space evenly between objects (no space at ends)
    // Calculate the total space available for distribution
    const availableSpace = Math.max(0, totalHeight - totalObjectHeight);
    actualSpacing = objects.length > 1 ? availableSpace / (objects.length - 1) : 0;
    totalHeight = totalObjectHeight + (objects.length - 1) * actualSpacing;
  } else if (distributionType === 'space-around') {
    // Distribute space around objects (equal space around each object)
    const availableSpace = Math.max(0, totalHeight - totalObjectHeight);
    actualSpacing = availableSpace / (objects.length + 1);
    currentY = startY + actualSpacing;
    totalHeight = totalObjectHeight + (objects.length + 1) * actualSpacing;
  }
  
  // Calculate starting Y based on alignment
  if (alignment === 'center') {
    currentY = startY - totalHeight / 2;
  } else if (alignment === 'end') {
    currentY = startY - totalHeight;
  }
  
  return objects.map(obj => {
    const x = startX;
    const position = { x: x, y: currentY };
    currentY += obj.height + actualSpacing;
    return position;
  });
}

/**
 * Arranges objects in a circular pattern
 * @param {Array} objects - Objects to arrange
 * @param {number} spacing - Spacing between objects
 * @param {number} startX - Center X position
 * @param {number} startY - Center Y position
 * @param {Object} options - Circle options
 * @returns {Array} - Array of positions
 */
function arrangeInCircle(objects, spacing, startX, startY, options = {}) {
  if (objects.length === 0) return [];
  if (objects.length === 1) return [{ x: startX, y: startY }];
  
  const radius = options.radius || Math.max(100, objects.length * 20);
  const startAngle = options.startAngle || 0; // Start angle in radians
  
  return objects.map((obj, index) => {
    const angle = startAngle + (2 * Math.PI * index) / objects.length;
    const x = startX + radius * Math.cos(angle) - obj.width / 2;
    const y = startY + radius * Math.sin(angle) - obj.height / 2;
    
    return { x: x, y: y };
  });
}

/**
 * Arranges objects in a spiral pattern
 * @param {Array} objects - Objects to arrange
 * @param {number} spacing - Spacing between objects
 * @param {number} startX - Center X position
 * @param {number} startY - Center Y position
 * @param {Object} options - Spiral options
 * @returns {Array} - Array of positions
 */
function arrangeInSpiral(objects, spacing, startX, startY, options = {}) {
  if (objects.length === 0) return [];
  if (objects.length === 1) return [{ x: startX, y: startY }];
  
  const spiralTightness = options.spiralTightness || 0.1;
  const spiralRadius = options.spiralRadius || 50;
  
  return objects.map((obj, index) => {
    const angle = spiralTightness * index;
    const radius = spiralRadius + spacing * index;
    const x = startX + radius * Math.cos(angle) - obj.width / 2;
    const y = startY + radius * Math.sin(angle) - obj.height / 2;
    
    return { x: x, y: y };
  });
}

/**
 * Arranges objects in a flowing, organic pattern
 * @param {Array} objects - Objects to arrange
 * @param {number} spacing - Spacing between objects
 * @param {number} startX - Starting X position
 * @param {number} startY - Starting Y position
 * @param {Object} options - Flow options
 * @returns {Array} - Array of positions
 */
function arrangeInFlow(objects, spacing, startX, startY, options = {}) {
  if (objects.length === 0) return [];
  
  const flowDirection = options.flowDirection || 'right'; // right, left, down, up
  const flowCurve = options.flowCurve || 0.3; // How much the flow curves
  const flowVariation = options.flowVariation || 0.2; // Random variation
  
  return objects.map((obj, index) => {
    let x = startX;
    let y = startY;
    
    // Calculate base position based on flow direction
    switch (flowDirection) {
      case 'right':
        x += index * (obj.width + spacing);
        y += Math.sin(index * flowCurve) * spacing * flowVariation;
        break;
      case 'left':
        x -= index * (obj.width + spacing);
        y += Math.sin(index * flowCurve) * spacing * flowVariation;
        break;
      case 'down':
        y += index * (obj.height + spacing);
        x += Math.sin(index * flowCurve) * spacing * flowVariation;
        break;
      case 'up':
        y -= index * (obj.height + spacing);
        x += Math.sin(index * flowCurve) * spacing * flowVariation;
        break;
    }
    
    // Add some random variation for organic feel
    const randomX = (Math.random() - 0.5) * spacing * flowVariation;
    const randomY = (Math.random() - 0.5) * spacing * flowVariation;
    
    return { x: x + randomX, y: y + randomY };
  });
}

/**
 * Advanced Layout Algorithms
 * Additional sophisticated layout patterns for complex arrangements
 */

/**
 * Arranges objects in a hexagonal pattern
 * @param {Array} objects - Objects to arrange
 * @param {number} spacing - Spacing between objects
 * @param {number} startX - Center X position
 * @param {number} startY - Center Y position
 * @param {Object} options - Hexagon options
 * @returns {Array} - Array of positions
 */
function arrangeInHexagon(objects, spacing, startX, startY, options = {}) {
  if (objects.length === 0) return [];
  if (objects.length === 1) return [{ x: startX, y: startY }];
  
  const radius = options.radius || Math.max(100, objects.length * 15);
  const startAngle = options.startAngle || 0;
  
  return objects.map((obj, index) => {
    // Calculate which ring the object belongs to
    const ring = Math.ceil((Math.sqrt(12 * index + 9) - 3) / 6);
    const positionInRing = index - (3 * ring * ring - 3 * ring + 1);
    const objectsInRing = ring === 0 ? 1 : 6 * ring;
    
    let angle, distance;
    
    if (ring === 0) {
      angle = startAngle;
      distance = 0;
    } else {
      const angleStep = (2 * Math.PI) / objectsInRing;
      angle = startAngle + positionInRing * angleStep;
      distance = radius * ring;
    }
    
    const x = startX + distance * Math.cos(angle) - obj.width / 2;
    const y = startY + distance * Math.sin(angle) - obj.height / 2;
    
    return { x: x, y: y };
  });
}

/**
 * Arranges objects in a diamond pattern
 * @param {Array} objects - Objects to arrange
 * @param {number} spacing - Spacing between objects
 * @param {number} startX - Center X position
 * @param {number} startY - Center Y position
 * @param {Object} options - Diamond options
 * @returns {Array} - Array of positions
 */
function arrangeInDiamond(objects, spacing, startX, startY, options = {}) {
  if (objects.length === 0) return [];
  if (objects.length === 1) return [{ x: startX, y: startY }];
  
  const size = options.size || Math.max(100, objects.length * 20);
  const maxObjectsPerSide = Math.ceil(Math.sqrt(objects.length));
  
  return objects.map((obj, index) => {
    // Calculate diamond position
    const side = Math.floor(index / maxObjectsPerSide);
    const positionInSide = index % maxObjectsPerSide;
    
    let x, y;
    const step = size / (maxObjectsPerSide - 1);
    
    switch (side) {
      case 0: // Top side
        x = startX - size/2 + positionInSide * step;
        y = startY - size/2;
        break;
      case 1: // Right side
        x = startX + size/2;
        y = startY - size/2 + positionInSide * step;
        break;
      case 2: // Bottom side
        x = startX + size/2 - positionInSide * step;
        y = startY + size/2;
        break;
      case 3: // Left side
        x = startX - size/2;
        y = startY + size/2 - positionInSide * step;
        break;
      default:
        // Center for remaining objects
        x = startX + (Math.random() - 0.5) * size * 0.5;
        y = startY + (Math.random() - 0.5) * size * 0.5;
    }
    
    return { x: x - obj.width / 2, y: y - obj.height / 2 };
  });
}

/**
 * Arranges objects in a wave pattern
 * @param {Array} objects - Objects to arrange
 * @param {number} spacing - Spacing between objects
 * @param {number} startX - Starting X position
 * @param {number} startY - Starting Y position
 * @param {Object} options - Wave options
 * @returns {Array} - Array of positions
 */
function arrangeInWave(objects, spacing, startX, startY, options = {}) {
  if (objects.length === 0) return [];
  
  const amplitude = options.amplitude || 50;
  const frequency = options.frequency || 0.1;
  const direction = options.direction || 'horizontal'; // horizontal, vertical
  const phase = options.phase || 0;
  
  return objects.map((obj, index) => {
    let x, y;
    
    if (direction === 'horizontal') {
      x = startX + index * spacing;
      y = startY + amplitude * Math.sin(frequency * index + phase);
    } else {
      x = startX + amplitude * Math.sin(frequency * index + phase);
      y = startY + index * spacing;
    }
    
    return { x: x - obj.width / 2, y: y - obj.height / 2 };
  });
}

/**
 * Arranges objects in a zigzag pattern
 * @param {Array} objects - Objects to arrange
 * @param {number} spacing - Spacing between objects
 * @param {number} startX - Starting X position
 * @param {number} startY - Starting Y position
 * @param {Object} options - Zigzag options
 * @returns {Array} - Array of positions
 */
function arrangeInZigzag(objects, spacing, startX, startY, options = {}) {
  if (objects.length === 0) return [];
  
  const zigzagHeight = options.zigzagHeight || 50;
  const direction = options.direction || 'horizontal'; // horizontal, vertical
  
  return objects.map((obj, index) => {
    let x, y;
    
    if (direction === 'horizontal') {
      x = startX + index * spacing;
      y = startY + (index % 2 === 0 ? 0 : zigzagHeight);
    } else {
      x = startX + (index % 2 === 0 ? 0 : zigzagHeight);
      y = startY + index * spacing;
    }
    
    return { x: x - obj.width / 2, y: y - obj.height / 2 };
  });
}

/**
 * Arranges objects in a radial pattern (like spokes of a wheel)
 * @param {Array} objects - Objects to arrange
 * @param {number} spacing - Spacing between objects
 * @param {number} startX - Center X position
 * @param {number} startY - Center Y position
 * @param {Object} options - Radial options
 * @returns {Array} - Array of positions
 */
function arrangeInRadial(objects, spacing, startX, startY, options = {}) {
  if (objects.length === 0) return [];
  if (objects.length === 1) return [{ x: startX, y: startY }];
  
  const radius = options.radius || Math.max(100, objects.length * 15);
  const startAngle = options.startAngle || 0;
  const endAngle = options.endAngle || 2 * Math.PI;
  
  return objects.map((obj, index) => {
    const angle = startAngle + (endAngle - startAngle) * index / (objects.length - 1);
    const x = startX + radius * Math.cos(angle) - obj.width / 2;
    const y = startY + radius * Math.sin(angle) - obj.height / 2;
    
    return { x: x, y: y };
  });
}

/**
 * Arranges objects in a Fibonacci spiral pattern
 * @param {Array} objects - Objects to arrange
 * @param {number} spacing - Spacing between objects
 * @param {number} startX - Center X position
 * @param {number} startY - Center Y position
 * @param {Object} options - Fibonacci options
 * @returns {Array} - Array of positions
 */
function arrangeInFibonacci(objects, spacing, startX, startY, options = {}) {
  if (objects.length === 0) return [];
  if (objects.length === 1) return [{ x: startX, y: startY }];
  
  const goldenRatio = 1.618;
  const scale = options.scale || 20;
  const startAngle = options.startAngle || 0;
  
  return objects.map((obj, index) => {
    const angle = startAngle + index * goldenRatio * Math.PI;
    const radius = scale * Math.sqrt(index);
    
    const x = startX + radius * Math.cos(angle) - obj.width / 2;
    const y = startY + radius * Math.sin(angle) - obj.height / 2;
    
    return { x: x, y: y };
  });
}

/**
 * Executes create_layout_template function call
 * @param {Object} args - Function arguments
 * @param {Object} canvasContext - Canvas context
 * @param {Object} user - Current user
 * @returns {Promise<Object>} - Execution result
 */
async function executeCreateLayoutTemplate(args, canvasContext, user) {
  const { template_type, start_x, start_y, size, color_scheme, spacing, options } = args;
  
  // Validate required arguments
  if (!template_type) {
    return {
      success: false,
      message: 'Missing template_type argument',
      type: 'error'
    };
  }
  
  if (start_x === undefined || start_y === undefined) {
    return {
      success: false,
      message: 'Missing start_x or start_y arguments',
      type: 'error'
    };
  }
  
  // Validate template type
  const validTemplateTypes = ['login_form', 'card_layout', 'navigation_bar', 'dashboard', 'hero_section'];
  if (!validTemplateTypes.includes(template_type)) {
    return {
      success: false,
      message: `Invalid template_type: ${template_type}. Must be one of: ${validTemplateTypes.join(', ')}`,
      type: 'error'
    };
  }
  
  // Validate coordinates
  if (start_x < 0 || start_x > 2000 || start_y < 0 || start_y > 1500) {
    return {
      success: false,
      message: 'Start coordinates must be within canvas bounds (0-2000 for x, 0-1500 for y)',
      type: 'error'
    };
  }
  
  try {
    // Prepare options for layout template
    const templateOptions = {
      startX: start_x,
      startY: start_y,
      size: size || 'medium',
      colorScheme: color_scheme || 'modern',
      spacing: spacing || 'normal',
      ...options
    };
    
    // Create the layout template
    const result = await createLayoutTemplate(template_type, canvasContext, templateOptions, user);
    
    if (result.success) {
      return {
        success: true,
        message: result.message,
        type: 'template_created',
        templateType: template_type,
        elementsCreated: result.elementsCreated || 0,
        results: result.results
      };
    } else {
      return {
        success: false,
        message: result.message || 'Failed to create layout template',
        type: 'error'
      };
    }
  } catch (error) {
    console.error(`Error creating layout template ${template_type}:`, error);
    return {
      success: false,
      message: `Failed to create ${template_type} template: ${error.message}`,
      type: 'error',
      error: error
    };
  }
}

/**
 * Enhanced object resolution system for natural language descriptions
 * Supports finding objects by color, position, size, content, and relationships
 */

/**
 * Color mapping for better color recognition
 */
const COLOR_MAPPINGS = {
  // Basic colors
  'red': ['#ff0000', '#ff6b6b', '#e74c3c', '#c0392b', '#dc2626', '#ef4444'],
  'blue': ['#0000ff', '#3498db', '#2980b9', '#3b82f6', '#2563eb', '#1d4ed8'],
  'green': ['#00ff00', '#2ecc71', '#27ae60', '#22c55e', '#16a34a', '#15803d'],
  'yellow': ['#ffff00', '#f1c40f', '#e67e22', '#eab308', '#ca8a04', '#a16207'],
  'orange': ['#ffa500', '#e67e22', '#f97316', '#ea580c', '#c2410c'],
  'purple': ['#800080', '#9b59b6', '#8b5cf6', '#7c3aed', '#6d28d9'],
  'pink': ['#ffc0cb', '#e91e63', '#ec4899', '#db2777', '#be185d'],
  'brown': ['#8b4513', '#a0522d', '#d2691e', '#cd853f'],
  'gray': ['#808080', '#95a5a6', '#6b7280', '#4b5563', '#374151'],
  'black': ['#000000', '#2c3e50', '#1f2937', '#111827'],
  'white': ['#ffffff', '#f8f9fa', '#e5e7eb', '#d1d5db'],
  
  // Extended colors
  'navy': ['#000080', '#1e3a8a', '#1e40af'],
  'crimson': ['#dc143c', '#e74c3c'],
  'emerald': ['#50c878', '#2ecc71'],
  'turquoise': ['#40e0d0', '#1abc9c'],
  'gold': ['#ffd700', '#f1c40f'],
  'silver': ['#c0c0c0', '#95a5a6']
};

/**
 * Size categories for object matching
 */
const SIZE_CATEGORIES = {
  'tiny': { min: 0, max: 30 },
  'small': { min: 30, max: 60 },
  'medium': { min: 60, max: 120 },
  'large': { min: 120, max: 200 },
  'huge': { min: 200, max: Infinity }
};

/**
 * Finds objects by comprehensive natural language description
 * @param {string} description - Object description
 * @param {Array} objects - Available objects
 * @param {Object} canvasDimensions - Canvas dimensions for position calculations
 * @returns {Array} - Matching objects with confidence scores
 */
export function findObjectsByDescription(description, objects, canvasDimensions = { width: 1920, height: 1080 }) {
  const lowerDesc = description.toLowerCase().trim();
  
  // If description is empty or too short, return empty array
  if (lowerDesc.length < 2) {
    return [];
  }
  
  const matches = [];
  
  objects.forEach(obj => {
    let score = 0;
    const reasons = [];
    
    // Type matching
    if (lowerDesc.includes(obj.type)) {
      score += 10;
      reasons.push(`type: ${obj.type}`);
    }
    
    // Color matching (enhanced)
    const colorMatch = findColorMatch(lowerDesc, obj.fill);
    if (colorMatch.matched) {
      score += colorMatch.score;
      reasons.push(`color: ${colorMatch.color}`);
    }
    
    // Position matching (enhanced)
    const positionMatch = findPositionMatch(lowerDesc, obj, canvasDimensions);
    if (positionMatch.matched) {
      score += positionMatch.score;
      reasons.push(`position: ${positionMatch.position}`);
    }
    
    // Size matching
    const sizeMatch = findSizeMatch(lowerDesc, obj);
    if (sizeMatch.matched) {
      score += sizeMatch.score;
      reasons.push(`size: ${sizeMatch.size}`);
    }
    
    // Content matching (for text objects)
    if (obj.type === 'text' && obj.text) {
      const contentMatch = findContentMatch(lowerDesc, obj.text);
      if (contentMatch.matched) {
        score += contentMatch.score;
        reasons.push(`content: ${contentMatch.content}`);
      }
    }
    
    // Relationship matching
    const relationshipMatch = findRelationshipMatch(lowerDesc, obj, objects);
    if (relationshipMatch.matched) {
      score += relationshipMatch.score;
      reasons.push(`relationship: ${relationshipMatch.relationship}`);
    }
    
    // Special descriptors
    const specialMatch = findSpecialDescriptors(lowerDesc, obj, objects);
    if (specialMatch.matched) {
      score += specialMatch.score;
      reasons.push(`special: ${specialMatch.descriptor}`);
    }
    
    if (score > 0) {
      matches.push({
        object: obj,
        score: score,
        reasons: reasons,
        confidence: Math.min(score / 20, 1) // Normalize to 0-1
      });
    }
  });
  
  // Sort by score (highest first)
  matches.sort((a, b) => b.score - a.score);
  
  return matches.map(match => match.object);
}

/**
 * Enhanced color matching with synonyms and hex support
 */
function findColorMatch(description, objectColor) {
  const objColorLower = objectColor.toLowerCase();
  
  // Direct hex match
  if (description.includes(objectColor.toLowerCase())) {
    return { matched: true, score: 15, color: objectColor };
  }
  
  // Color name matching
  for (const [colorName, hexValues] of Object.entries(COLOR_MAPPINGS)) {
    if (description.includes(colorName)) {
      // Check if object color matches any of the hex values for this color
      const isMatch = hexValues.some(hex => 
        objColorLower.includes(hex.toLowerCase()) ||
        isColorSimilar(objectColor, hex)
      );
      
      if (isMatch) {
        return { matched: true, score: 12, color: colorName };
      }
    }
  }
  
  return { matched: false, score: 0 };
}

/**
 * Enhanced position matching
 */
function findPositionMatch(description, obj, canvasDimensions) {
  const { width: canvasWidth, height: canvasHeight } = canvasDimensions;
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  
  // Left/Right matching
  if (description.includes('left') || description.includes('leftmost')) {
    const isLeft = obj.x < centerX;
    if (isLeft) {
      return { matched: true, score: 8, position: 'left' };
    }
  }
  
  if (description.includes('right') || description.includes('rightmost')) {
    const isRight = obj.x > centerX;
    if (isRight) {
      return { matched: true, score: 8, position: 'right' };
    }
  }
  
  // Top/Bottom matching
  if (description.includes('top') || description.includes('topmost')) {
    const isTop = obj.y < centerY;
    if (isTop) {
      return { matched: true, score: 8, position: 'top' };
    }
  }
  
  if (description.includes('bottom') || description.includes('bottommost')) {
    const isBottom = obj.y > centerY;
    if (isBottom) {
      return { matched: true, score: 8, position: 'bottom' };
    }
  }
  
  // Center matching
  if (description.includes('center') || description.includes('middle')) {
    const distanceFromCenter = Math.sqrt(
      Math.pow(obj.x - centerX, 2) + Math.pow(obj.y - centerY, 2)
    );
    const maxDistance = Math.min(canvasWidth, canvasHeight) * 0.2; // Within 20% of canvas size
    
    if (distanceFromCenter < maxDistance) {
      return { matched: true, score: 10, position: 'center' };
    }
  }
  
  return { matched: false, score: 0 };
}

/**
 * Size matching based on object dimensions
 */
function findSizeMatch(description, obj) {
  const area = obj.width * obj.height;
  
  for (const [sizeName, range] of Object.entries(SIZE_CATEGORIES)) {
    if (description.includes(sizeName)) {
      if (area >= range.min && area < range.max) {
        return { matched: true, score: 6, size: sizeName };
      }
    }
  }
  
  // Largest/smallest matching
  if (description.includes('largest') || description.includes('biggest')) {
    return { matched: true, score: 5, size: 'largest' };
  }
  
  if (description.includes('smallest') || description.includes('tiny')) {
    return { matched: true, score: 5, size: 'smallest' };
  }
  
  return { matched: false, score: 0 };
}

/**
 * Content matching for text objects
 */
function findContentMatch(description, textContent) {
  const textLower = textContent.toLowerCase();
  
  // Direct text match
  if (description.includes(textLower)) {
    return { matched: true, score: 15, content: textContent };
  }
  
  // Partial text match
  const words = description.split(' ');
  for (const word of words) {
    if (word.length > 2 && textLower.includes(word)) {
      return { matched: true, score: 8, content: word };
    }
  }
  
  // Semantic matching for common text types
  const semanticMatches = {
    'title': ['title', 'heading', 'header', 'h1', 'h2'],
    'label': ['label', 'text', 'caption', 'description'],
    'button': ['button', 'btn', 'click', 'submit'],
    'input': ['input', 'field', 'textbox', 'text box']
  };
  
  for (const [semantic, keywords] of Object.entries(semanticMatches)) {
    if (description.includes(semantic)) {
      const hasKeyword = keywords.some(keyword => textLower.includes(keyword));
      if (hasKeyword) {
        return { matched: true, score: 6, content: semantic };
      }
    }
  }
  
  return { matched: false, score: 0 };
}

/**
 * Relationship matching (relative to other objects)
 */
function findRelationshipMatch(description, obj, allObjects) {
  // "above", "below", "next to", "near" relationships
  if (description.includes('above') || description.includes('over')) {
    // Find objects below this one
    const objectsBelow = allObjects.filter(other => 
      other.id !== obj.id && 
      other.y > obj.y && 
      Math.abs(other.x - obj.x) < Math.max(obj.width, other.width)
    );
    
    if (objectsBelow.length > 0) {
      return { matched: true, score: 7, relationship: 'above' };
    }
  }
  
  if (description.includes('below') || description.includes('under')) {
    // Find objects above this one
    const objectsAbove = allObjects.filter(other => 
      other.id !== obj.id && 
      other.y < obj.y && 
      Math.abs(other.x - obj.x) < Math.max(obj.width, other.width)
    );
    
    if (objectsAbove.length > 0) {
      return { matched: true, score: 7, relationship: 'below' };
    }
  }
  
  return { matched: false, score: 0 };
}

/**
 * Special descriptors (first, last, selected, etc.)
 */
function findSpecialDescriptors(description, obj, allObjects) {
  // "first" - typically the leftmost or topmost
  if (description.includes('first')) {
    const isFirst = obj.x === Math.min(...allObjects.map(o => o.x)) ||
                   obj.y === Math.min(...allObjects.map(o => o.y));
    if (isFirst) {
      return { matched: true, score: 5, descriptor: 'first' };
    }
  }
  
  // "last" - typically the rightmost or bottommost
  if (description.includes('last')) {
    const isLast = obj.x === Math.max(...allObjects.map(o => o.x)) ||
                  obj.y === Math.max(...allObjects.map(o => o.y));
    if (isLast) {
      return { matched: true, score: 5, descriptor: 'last' };
    }
  }
  
  return { matched: false, score: 0 };
}

/**
 * Simple color similarity check
 */
function isColorSimilar(color1, color2) {
  // Convert hex to RGB and calculate distance
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return false;
  
  const distance = Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
  
  return distance < 50; // Threshold for color similarity
}

/**
 * Legacy function for backward compatibility
 */
export function findObjectsByDescriptionLegacy(description, objects) {
  const lowerDesc = description.toLowerCase();
  
  return objects.filter(obj => {
    // Check by type
    if (lowerDesc.includes(obj.type)) return true;
    
    // Check by color
    if (lowerDesc.includes('red') && obj.fill.toLowerCase().includes('red')) return true;
    if (lowerDesc.includes('blue') && obj.fill.toLowerCase().includes('blue')) return true;
    if (lowerDesc.includes('green') && obj.fill.toLowerCase().includes('green')) return true;
    if (lowerDesc.includes('yellow') && obj.fill.toLowerCase().includes('yellow')) return true;
    
    // Check by text content
    if (obj.type === 'text' && obj.text && lowerDesc.includes(obj.text.toLowerCase())) return true;
    
    // Check by position
    if (lowerDesc.includes('left') && obj.x < 200) return true;
    if (lowerDesc.includes('right') && obj.x > 400) return true;
    if (lowerDesc.includes('top') && obj.y < 200) return true;
    if (lowerDesc.includes('bottom') && obj.y > 400) return true;
    
    return false;
  });
}

/**
 * Enhanced Relative Positioning System
 * Handles natural language positioning commands like "next to", "below", "center"
 */

/**
 * Resolves relative positioning commands to absolute coordinates
 * @param {string} positionCommand - Natural language position command
 * @param {Array} objects - Current canvas objects
 * @param {Object} canvasDimensions - Canvas dimensions
 * @param {Object} targetObject - Object being positioned (optional)
 * @param {Object} referenceObject - Reference object for relative positioning (optional)
 * @returns {Object} - Resolved position {x, y} or null if cannot resolve
 */
export function resolveRelativePosition(positionCommand, objects, canvasDimensions, targetObject = null, referenceObject = null) {
  const command = positionCommand.toLowerCase().trim();
  const { width: canvasWidth, height: canvasHeight } = canvasDimensions;
  
  // Handle canvas-relative positioning
  if (command.includes('center') || command.includes('middle')) {
    return resolveCenterPosition(command, canvasDimensions, targetObject);
  }
  
  // Handle quadrant positioning
  if (command.includes('top-left') || command.includes('top left')) {
    return resolveQuadrantPosition('top-left', canvasDimensions, targetObject);
  }
  if (command.includes('top-right') || command.includes('top right')) {
    return resolveQuadrantPosition('top-right', canvasDimensions, targetObject);
  }
  if (command.includes('bottom-left') || command.includes('bottom left')) {
    return resolveQuadrantPosition('bottom-left', canvasDimensions, targetObject);
  }
  if (command.includes('bottom-right') || command.includes('bottom right')) {
    return resolveQuadrantPosition('bottom-right', canvasDimensions, targetObject);
  }
  
  // Handle edge positioning
  if (command.includes('top')) {
    return resolveEdgePosition('top', canvasDimensions, targetObject);
  }
  if (command.includes('bottom')) {
    return resolveEdgePosition('bottom', canvasDimensions, targetObject);
  }
  if (command.includes('left')) {
    return resolveEdgePosition('left', canvasDimensions, targetObject);
  }
  if (command.includes('right')) {
    return resolveEdgePosition('right', canvasDimensions, targetObject);
  }
  
  // Handle object-relative positioning
  if (referenceObject) {
    if (command.includes('next to') || command.includes('beside')) {
      return resolveNextToPosition(referenceObject, targetObject, objects, canvasDimensions);
    }
    if (command.includes('below') || command.includes('under')) {
      return resolveBelowPosition(referenceObject, targetObject, objects, canvasDimensions);
    }
    if (command.includes('above') || command.includes('over')) {
      return resolveAbovePosition(referenceObject, targetObject, objects, canvasDimensions);
    }
    if (command.includes('to the left') || command.includes('left of')) {
      return resolveLeftOfPosition(referenceObject, targetObject, objects, canvasDimensions);
    }
    if (command.includes('to the right') || command.includes('right of')) {
      return resolveRightOfPosition(referenceObject, targetObject, objects, canvasDimensions);
    }
  }
  
  // Handle automatic positioning based on existing objects
  if (command.includes('near') || command.includes('close to')) {
    return resolveNearPosition(objects, canvasDimensions, targetObject);
  }
  
  return null;
}

/**
 * Resolves center positioning
 */
function resolveCenterPosition(command, canvasDimensions, targetObject) {
  const { width: canvasWidth, height: canvasHeight } = canvasDimensions;
  const targetWidth = targetObject?.width || 100;
  const targetHeight = targetObject?.height || 60;
  
  return {
    x: canvasWidth / 2 - targetWidth / 2,
    y: canvasHeight / 2 - targetHeight / 2
  };
}

/**
 * Resolves quadrant positioning
 */
function resolveQuadrantPosition(quadrant, canvasDimensions, targetObject) {
  const { width: canvasWidth, height: canvasHeight } = canvasDimensions;
  const targetWidth = targetObject?.width || 100;
  const targetHeight = targetObject?.height || 60;
  
  const margin = 50; // Distance from edges
  
  switch (quadrant) {
    case 'top-left':
      return { x: margin, y: margin };
    case 'top-right':
      return { x: canvasWidth - targetWidth - margin, y: margin };
    case 'bottom-left':
      return { x: margin, y: canvasHeight - targetHeight - margin };
    case 'bottom-right':
      return { x: canvasWidth - targetWidth - margin, y: canvasHeight - targetHeight - margin };
    default:
      return null;
  }
}

/**
 * Resolves edge positioning
 */
function resolveEdgePosition(edge, canvasDimensions, targetObject) {
  const { width: canvasWidth, height: canvasHeight } = canvasDimensions;
  const targetWidth = targetObject?.width || 100;
  const targetHeight = targetObject?.height || 60;
  
  const margin = 50;
  
  switch (edge) {
    case 'top':
      return { x: canvasWidth / 2 - targetWidth / 2, y: margin };
    case 'bottom':
      return { x: canvasWidth / 2 - targetWidth / 2, y: canvasHeight - targetHeight - margin };
    case 'left':
      return { x: margin, y: canvasHeight / 2 - targetHeight / 2 };
    case 'right':
      return { x: canvasWidth - targetWidth - margin, y: canvasHeight / 2 - targetHeight / 2 };
    default:
      return null;
  }
}

/**
 * Resolves "next to" positioning with collision detection
 */
function resolveNextToPosition(referenceObject, targetObject, allObjects, canvasDimensions) {
  const targetWidth = targetObject?.width || 100;
  const targetHeight = targetObject?.height || 60;
  const spacing = 20;
  
  // Try right side first
  let position = {
    x: referenceObject.x + referenceObject.width + spacing,
    y: referenceObject.y
  };
  
  if (!isPositionOccupied(position, targetWidth, targetHeight, allObjects, canvasDimensions)) {
    return position;
  }
  
  // Try left side
  position = {
    x: referenceObject.x - targetWidth - spacing,
    y: referenceObject.y
  };
  
  if (!isPositionOccupied(position, targetWidth, targetHeight, allObjects, canvasDimensions)) {
    return position;
  }
  
  // Try below
  position = {
    x: referenceObject.x,
    y: referenceObject.y + referenceObject.height + spacing
  };
  
  if (!isPositionOccupied(position, targetWidth, targetHeight, allObjects, canvasDimensions)) {
    return position;
  }
  
  // Try above
  position = {
    x: referenceObject.x,
    y: referenceObject.y - targetHeight - spacing
  };
  
  if (!isPositionOccupied(position, targetWidth, targetHeight, allObjects, canvasDimensions)) {
    return position;
  }
  
  // Fallback: find nearest empty space
  return findNearestEmptySpace(referenceObject, targetWidth, targetHeight, allObjects, canvasDimensions);
}

/**
 * Resolves "below" positioning
 */
function resolveBelowPosition(referenceObject, targetObject, allObjects, canvasDimensions) {
  const targetWidth = targetObject?.width || 100;
  const targetHeight = targetObject?.height || 60;
  const spacing = 20;
  
  // Try directly below
  let position = {
    x: referenceObject.x,
    y: referenceObject.y + referenceObject.height + spacing
  };
  
  if (!isPositionOccupied(position, targetWidth, targetHeight, allObjects, canvasDimensions)) {
    return position;
  }
  
  // Try below and centered
  position = {
    x: referenceObject.x + referenceObject.width / 2 - targetWidth / 2,
    y: referenceObject.y + referenceObject.height + spacing
  };
  
  if (!isPositionOccupied(position, targetWidth, targetHeight, allObjects, canvasDimensions)) {
    return position;
  }
  
  // Fallback: find space below
  return findSpaceBelow(referenceObject, targetWidth, targetHeight, allObjects, canvasDimensions);
}

/**
 * Resolves "above" positioning
 */
function resolveAbovePosition(referenceObject, targetObject, allObjects, canvasDimensions) {
  const targetWidth = targetObject?.width || 100;
  const targetHeight = targetObject?.height || 60;
  const spacing = 20;
  
  // Try directly above
  let position = {
    x: referenceObject.x,
    y: referenceObject.y - targetHeight - spacing
  };
  
  if (!isPositionOccupied(position, targetWidth, targetHeight, allObjects, canvasDimensions)) {
    return position;
  }
  
  // Try above and centered
  position = {
    x: referenceObject.x + referenceObject.width / 2 - targetWidth / 2,
    y: referenceObject.y - targetHeight - spacing
  };
  
  if (!isPositionOccupied(position, targetWidth, targetHeight, allObjects, canvasDimensions)) {
    return position;
  }
  
  // Fallback: find space above
  return findSpaceAbove(referenceObject, targetWidth, targetHeight, allObjects, canvasDimensions);
}

/**
 * Resolves "left of" positioning
 */
function resolveLeftOfPosition(referenceObject, targetObject, allObjects, canvasDimensions) {
  const targetWidth = targetObject?.width || 100;
  const targetHeight = targetObject?.height || 60;
  const spacing = 20;
  
  let position = {
    x: referenceObject.x - targetWidth - spacing,
    y: referenceObject.y
  };
  
  if (!isPositionOccupied(position, targetWidth, targetHeight, allObjects, canvasDimensions)) {
    return position;
  }
  
  // Try left and centered vertically
  position = {
    x: referenceObject.x - targetWidth - spacing,
    y: referenceObject.y + referenceObject.height / 2 - targetHeight / 2
  };
  
  if (!isPositionOccupied(position, targetWidth, targetHeight, allObjects, canvasDimensions)) {
    return position;
  }
  
  return findSpaceLeftOf(referenceObject, targetWidth, targetHeight, allObjects, canvasDimensions);
}

/**
 * Resolves "right of" positioning
 */
function resolveRightOfPosition(referenceObject, targetObject, allObjects, canvasDimensions) {
  const targetWidth = targetObject?.width || 100;
  const targetHeight = targetObject?.height || 60;
  const spacing = 20;
  
  let position = {
    x: referenceObject.x + referenceObject.width + spacing,
    y: referenceObject.y
  };
  
  if (!isPositionOccupied(position, targetWidth, targetHeight, allObjects, canvasDimensions)) {
    return position;
  }
  
  // Try right and centered vertically
  position = {
    x: referenceObject.x + referenceObject.width + spacing,
    y: referenceObject.y + referenceObject.height / 2 - targetHeight / 2
  };
  
  if (!isPositionOccupied(position, targetWidth, targetHeight, allObjects, canvasDimensions)) {
    return position;
  }
  
  return findSpaceRightOf(referenceObject, targetWidth, targetHeight, allObjects, canvasDimensions);
}

/**
 * Resolves "near" positioning
 */
function resolveNearPosition(allObjects, canvasDimensions, targetObject) {
  const targetWidth = targetObject?.width || 100;
  const targetHeight = targetObject?.height || 60;
  
  if (allObjects.length === 0) {
    return resolveCenterPosition('center', canvasDimensions, targetObject);
  }
  
  // Find the object closest to center
  const centerX = canvasDimensions.width / 2;
  const centerY = canvasDimensions.height / 2;
  
  let closestObject = allObjects[0];
  let minDistance = Math.sqrt(
    Math.pow(closestObject.x - centerX, 2) + Math.pow(closestObject.y - centerY, 2)
  );
  
  for (const obj of allObjects) {
    const distance = Math.sqrt(
      Math.pow(obj.x - centerX, 2) + Math.pow(obj.y - centerY, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestObject = obj;
    }
  }
  
  return resolveNextToPosition(closestObject, targetObject, allObjects, canvasDimensions);
}

/**
 * Checks if a position is occupied by existing objects
 */
function isPositionOccupied(position, width, height, allObjects, canvasDimensions) {
  const { x, y } = position;
  
  // Check canvas bounds
  if (x < 0 || y < 0 || x + width > canvasDimensions.width || y + height > canvasDimensions.height) {
    return true;
  }
  
  // Check collision with existing objects
  return allObjects.some(obj => {
    return !(x + width <= obj.x || x >= obj.x + obj.width || y + height <= obj.y || y >= obj.y + obj.height);
  });
}

/**
 * Finds the nearest empty space to a reference object
 */
function findNearestEmptySpace(referenceObject, targetWidth, targetHeight, allObjects, canvasDimensions) {
  const spacing = 20;
  const maxDistance = 200;
  
  // Try positions in expanding circles around the reference object
  for (let distance = spacing; distance <= maxDistance; distance += spacing) {
    const positions = [
      { x: referenceObject.x + distance, y: referenceObject.y }, // Right
      { x: referenceObject.x - targetWidth - distance, y: referenceObject.y }, // Left
      { x: referenceObject.x, y: referenceObject.y + distance }, // Below
      { x: referenceObject.x, y: referenceObject.y - targetHeight - distance }, // Above
      { x: referenceObject.x + distance, y: referenceObject.y + distance }, // Bottom-right
      { x: referenceObject.x - targetWidth - distance, y: referenceObject.y + distance }, // Bottom-left
      { x: referenceObject.x + distance, y: referenceObject.y - targetHeight - distance }, // Top-right
      { x: referenceObject.x - targetWidth - distance, y: referenceObject.y - targetHeight - distance } // Top-left
    ];
    
    for (const position of positions) {
      if (!isPositionOccupied(position, targetWidth, targetHeight, allObjects, canvasDimensions)) {
        return position;
      }
    }
  }
  
  // Fallback to center
  return resolveCenterPosition('center', canvasDimensions, { width: targetWidth, height: targetHeight });
}

/**
 * Helper functions for finding space in specific directions
 */
function findSpaceBelow(referenceObject, targetWidth, targetHeight, allObjects, canvasDimensions) {
  const spacing = 20;
  let y = referenceObject.y + referenceObject.height + spacing;
  
  while (y + targetHeight <= canvasDimensions.height) {
    const position = { x: referenceObject.x, y: y };
    if (!isPositionOccupied(position, targetWidth, targetHeight, allObjects, canvasDimensions)) {
      return position;
    }
    y += spacing;
  }
  
  return findNearestEmptySpace(referenceObject, targetWidth, targetHeight, allObjects, canvasDimensions);
}

function findSpaceAbove(referenceObject, targetWidth, targetHeight, allObjects, canvasDimensions) {
  const spacing = 20;
  let y = referenceObject.y - targetHeight - spacing;
  
  while (y >= 0) {
    const position = { x: referenceObject.x, y: y };
    if (!isPositionOccupied(position, targetWidth, targetHeight, allObjects, canvasDimensions)) {
      return position;
    }
    y -= spacing;
  }
  
  return findNearestEmptySpace(referenceObject, targetWidth, targetHeight, allObjects, canvasDimensions);
}

function findSpaceLeftOf(referenceObject, targetWidth, targetHeight, allObjects, canvasDimensions) {
  const spacing = 20;
  let x = referenceObject.x - targetWidth - spacing;
  
  while (x >= 0) {
    const position = { x: x, y: referenceObject.y };
    if (!isPositionOccupied(position, targetWidth, targetHeight, allObjects, canvasDimensions)) {
      return position;
    }
    x -= spacing;
  }
  
  return findNearestEmptySpace(referenceObject, targetWidth, targetHeight, allObjects, canvasDimensions);
}

function findSpaceRightOf(referenceObject, targetWidth, targetHeight, allObjects, canvasDimensions) {
  const spacing = 20;
  let x = referenceObject.x + referenceObject.width + spacing;
  
  while (x + targetWidth <= canvasDimensions.width) {
    const position = { x: x, y: referenceObject.y };
    if (!isPositionOccupied(position, targetWidth, targetHeight, allObjects, canvasDimensions)) {
      return position;
    }
    x += spacing;
  }
  
  return findNearestEmptySpace(referenceObject, targetWidth, targetHeight, allObjects, canvasDimensions);
}

/**
 * Gets selected objects for AI operations
 * @param {Object} canvasContext - Canvas state and functions
 * @returns {Array} - Selected objects
 */
export function getSelectedObjectsForAI(canvasContext) {
  const { getSelectedObjects } = canvasContext;
  return getSelectedObjects();
}

/**
 * Resolves object IDs for AI operations, using selected objects when no specific IDs provided
 * @param {Array|string|null} objectIds - Specific object IDs, or null/empty to use selected objects
 * @param {Object} canvasContext - Canvas state and functions
 * @returns {Array} - Resolved object IDs
 */
export function resolveObjectIds(objectIds, canvasContext) {
  const { getSelectedObjects } = canvasContext;
  
  // If no specific IDs provided, use selected objects
  if (!objectIds || (Array.isArray(objectIds) && objectIds.length === 0)) {
    const selectedObjects = getSelectedObjects();
    return selectedObjects.map(obj => obj.id);
  }
  
  // If single ID provided, convert to array
  if (typeof objectIds === 'string') {
    return [objectIds];
  }
  
  // If array provided, return as-is
  if (Array.isArray(objectIds)) {
    return objectIds;
  }
  
  // Fallback to selected objects
  const selectedObjects = getSelectedObjects();
  return selectedObjects.map(obj => obj.id);
}

/**
 * Enhanced object resolution that considers selected objects
 * @param {string} description - Object description
 * @param {Object} canvasContext - Canvas state and functions
 * @param {Array|string|null} fallbackIds - Fallback object IDs if description doesn't match
 * @returns {Array} - Matching objects
 */
export function findObjectsByDescriptionWithSelection(description, canvasContext, fallbackIds = null) {
  const { objects } = canvasContext;
  
  // First try to find by description
  const describedObjects = findObjectsByDescription(description, objects);
  
  if (describedObjects.length > 0) {
    return describedObjects;
  }
  
  // If no objects found by description, use fallback IDs or selected objects
  const resolvedIds = resolveObjectIds(fallbackIds, canvasContext);
  return objects.filter(obj => resolvedIds.includes(obj.id));
}

/**
 * Validates function call arguments
 * @param {Object} functionCall - Function call to validate
 * @returns {Object} - Validation result
 */
export function validateFunctionCall(functionCall) {
  const { name, arguments: args } = functionCall;
  
  if (!name) {
    return { valid: false, error: 'Function name is required' };
  }
  
  if (!args) {
    return { valid: false, error: 'Function arguments are required' };
  }
  
  switch (name) {
    case 'create_shape':
      if (!args.type || args.x === undefined || args.y === undefined || 
          args.width === undefined || args.height === undefined || !args.fill) {
        return { valid: false, error: 'Missing required arguments for create_shape' };
      }
      break;
    
    case 'modify_shape':
      if (!args.id || !args.updates) {
        return { valid: false, error: 'Missing required arguments for modify_shape' };
      }
      break;
    
    case 'delete_shape':
      if (!args.id) {
        return { valid: false, error: 'Missing required argument for delete_shape' };
      }
      break;
    
    case 'arrange_shapes':
      if (!args.ids || !Array.isArray(args.ids) || !args.layout) {
        return { valid: false, error: 'Missing required arguments for arrange_shapes' };
      }
      break;
    
    case 'create_layout_template':
      if (!args.template_type || args.start_x === undefined || args.start_y === undefined) {
        return { valid: false, error: 'Missing required arguments for create_layout_template' };
      }
      break;
    
    case 'multi_step_command':
      if (!args.steps || !Array.isArray(args.steps) || args.steps.length === 0) {
        return { valid: false, error: 'Missing or invalid steps array for multi_step_command' };
      }
      break;
    
    default:
      return { valid: false, error: `Unknown function: ${name}` };
  }
  
  return { valid: true };
}

export {
  calculateLayoutPositions
};
