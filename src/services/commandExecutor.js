/**
 * Command Executor Service
 * Executes AI-generated function calls on the canvas
 * Bridges AI Agent commands with actual canvas operations
 * Enhanced with comprehensive error handling for partial failures
 */

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
 * Executes create_shape function call
 * @param {Object} args - Function arguments
 * @param {Object} canvasContext - Canvas state and functions
 * @param {Object} user - Current user context
 * @returns {Promise<Object>} - Execution result
 */
async function executeCreateShape(args, canvasContext, user) {
  const { addObject } = canvasContext;
  
  // Validate required arguments
  if (!args.type || !args.x !== undefined || !args.y !== undefined || 
      !args.width !== undefined || !args.height !== undefined || !args.fill) {
    return {
      success: false,
      message: 'Missing required arguments: type, x, y, width, height, fill',
      type: 'error'
    };
  }
  
  // Validate object type
  if (!['rectangle', 'circle', 'text'].includes(args.type)) {
    return {
      success: false,
      message: `Invalid object type: ${args.type}. Must be rectangle, circle, or text`,
      type: 'error'
    };
  }
  
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
    const objectId = await addObject(newObject);
    
    return {
      success: true,
      message: `Created ${args.type} at (${newObject.x}, ${newObject.y})`,
      type: 'success',
      objectId: objectId,
      object: newObject
    };
  } catch (error) {
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
  const { updateObject, objects } = canvasContext;
  
  // Validate required arguments
  if (!args.ids || !Array.isArray(args.ids) || args.ids.length === 0) {
    return {
      success: false,
      message: 'Missing or invalid ids array',
      type: 'error'
    };
  }
  
  if (!args.layout || !['row', 'column', 'grid', 'distribute_h', 'distribute_v'].includes(args.layout)) {
    return {
      success: false,
      message: `Invalid layout: ${args.layout}. Must be row, column, grid, distribute_h, or distribute_v`,
      type: 'error'
    };
  }
  
  // Find all objects to arrange
  const objectsToArrange = args.ids.map(id => objects.find(obj => obj.id === id)).filter(Boolean);
  
  if (objectsToArrange.length === 0) {
    return {
      success: false,
      message: 'No valid objects found to arrange',
      type: 'error'
    };
  }
  
  if (objectsToArrange.length !== args.ids.length) {
    return {
      success: false,
      message: `Only found ${objectsToArrange.length} of ${args.ids.length} objects`,
      type: 'error'
    };
  }
  
  try {
    // Calculate new positions based on layout
    const newPositions = calculateLayoutPositions(objectsToArrange, args.layout, args.options || {});
    
    // Update all objects with individual error handling
    const updateResults = [];
    const successfulUpdates = [];
    const failedUpdates = [];
    
    for (let i = 0; i < objectsToArrange.length; i++) {
      const obj = objectsToArrange[i];
      const newPos = newPositions[i];
      
      try {
        await updateObject(obj.id, { x: newPos.x, y: newPos.y });
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
      } catch (error) {
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
function calculateLayoutPositions(objects, layout, options = {}) {
  const spacing = options.spacing || 20;
  const startX = options.startX || 100;
  const startY = options.startY || 100;
  
  switch (layout) {
    case 'row':
      return arrangeInRow(objects, spacing, startX, startY);
    
    case 'column':
      return arrangeInColumn(objects, spacing, startX, startY);
    
    case 'grid':
      return arrangeInGrid(objects, spacing, startX, startY, options.columns);
    
    case 'distribute_h':
      return distributeHorizontally(objects, startX, startY);
    
    case 'distribute_v':
      return distributeVertically(objects, startX, startY);
    
    default:
      throw new Error(`Unknown layout: ${layout}`);
  }
}

/**
 * Arranges objects in a horizontal row
 */
function arrangeInRow(objects, spacing, startX, startY) {
  let currentX = startX;
  
  return objects.map(obj => {
    const position = { x: currentX, y: startY };
    currentX += obj.width + spacing;
    return position;
  });
}

/**
 * Arranges objects in a vertical column
 */
function arrangeInColumn(objects, spacing, startX, startY) {
  let currentY = startY;
  
  return objects.map(obj => {
    const position = { x: startX, y: currentY };
    currentY += obj.height + spacing;
    return position;
  });
}

/**
 * Arranges objects in a grid
 */
function arrangeInGrid(objects, spacing, startX, startY, columns = 3) {
  const positions = [];
  let currentX = startX;
  let currentY = startY;
  let colCount = 0;
  
  for (const obj of objects) {
    positions.push({ x: currentX, y: currentY });
    
    colCount++;
    if (colCount >= columns) {
      colCount = 0;
      currentX = startX;
      currentY += obj.height + spacing;
    } else {
      currentX += obj.width + spacing;
    }
  }
  
  return positions;
}

/**
 * Distributes objects horizontally with equal spacing
 */
function distributeHorizontally(objects, startX, startY) {
  if (objects.length <= 1) {
    return objects.map(() => ({ x: startX, y: startY }));
  }
  
  const totalWidth = objects.reduce((sum, obj) => sum + obj.width, 0);
  const totalSpacing = (objects.length - 1) * 20; // 20px spacing
  const availableWidth = 800; // Canvas width
  const spacing = (availableWidth - totalWidth) / (objects.length - 1);
  
  let currentX = startX;
  
  return objects.map(obj => {
    const position = { x: currentX, y: startY };
    currentX += obj.width + spacing;
    return position;
  });
}

/**
 * Distributes objects vertically with equal spacing
 */
function distributeVertically(objects, startX, startY) {
  if (objects.length <= 1) {
    return objects.map(() => ({ x: startX, y: startY }));
  }
  
  const totalHeight = objects.reduce((sum, obj) => sum + obj.height, 0);
  const totalSpacing = (objects.length - 1) * 20; // 20px spacing
  const availableHeight = 600; // Canvas height
  const spacing = (availableHeight - totalHeight) / (objects.length - 1);
  
  let currentY = startY;
  
  return objects.map(obj => {
    const position = { x: startX, y: currentY };
    currentY += obj.height + spacing;
    return position;
  });
}

/**
 * Finds objects by description (for object resolution)
 * @param {string} description - Object description
 * @param {Array} objects - Available objects
 * @returns {Array} - Matching objects
 */
export function findObjectsByDescription(description, objects) {
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
    
    default:
      return { valid: false, error: `Unknown function: ${name}` };
  }
  
  return { valid: true };
}

export default {
  executeCommand,
  executeCommands,
  findObjectsByDescription,
  getSelectedObjectsForAI,
  validateFunctionCall
};
