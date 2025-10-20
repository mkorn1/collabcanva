import OpenAI from 'openai';
import { Client } from 'langsmith';
import { findObjectsByDescription, resolveRelativePosition } from './commandExecutor.js';
import { generateSmartDefaults, extractUserIntent } from './smartDefaults.js';
import { createLayoutTemplate, LAYOUT_TEMPLATES } from './layoutTemplates.js';

/**
 * AI Agent Service
 * Handles OpenAI API integration for canvas manipulation commands
 * Provides natural language processing and function calling capabilities
 * Includes LangSmith monitoring and debugging
 */

// Initialize OpenAI client (only if API key is available)
let openai = null;
const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (openaiApiKey) {
  try {
    openai = new OpenAI({
      apiKey: openaiApiKey,
      dangerouslyAllowBrowser: true // Required for browser usage
    });
    console.log('✅ OpenAI client initialized');
  } catch (error) {
    console.warn('⚠️ OpenAI initialization failed:', error.message);
  }
} else {
  console.warn('⚠️ OpenAI API key not found. AI Agent features will be disabled.');
}

// Initialize LangSmith client (optional)
let langsmithClient = null;
const langsmithApiKey = import.meta.env.VITE_LANGSMITH_API_KEY;
if (langsmithApiKey) {
  try {
    langsmithClient = new Client({
      apiKey: langsmithApiKey,
      apiUrl: import.meta.env.VITE_LANGSMITH_ENDPOINT || 'https://api.smith.langchain.com'
    });
    console.log('✅ LangSmith client initialized');
  } catch (error) {
    console.warn('⚠️ LangSmith initialization failed:', error.message);
  }
}

// Rate limiting storage (in-memory for now)
const rateLimitStore = new Map();

// System prompt template - Optimized for token efficiency
const SYSTEM_PROMPT = `You are an AI assistant that helps users manipulate a collaborative canvas through natural language commands.

## Your Role
- Convert natural language to structured function calls
- Provide helpful responses and handle errors gracefully
- Make intelligent decisions based on canvas context

## Available Operations
1. create_shape(type, x, y, width, height, fill, text_content?) - Create rectangles, circles, or text
2. modify_shape(id, updates) - Change properties of existing shapes
3. delete_shape(id) - Remove shapes from canvas
4. arrange_shapes(ids, layout, options?) - Organize shapes (row, column, grid, distribute_h, distribute_v, circle, spiral, flow, hexagon, diamond, wave, zigzag, radial, fibonacci)
5. create_layout_template(template_type, start_x, start_y, size?, color_scheme?, spacing?, options?) - Create complex UI layouts
6. multi_step_command(steps) - Execute multiple commands in sequence

## Canvas Context
You receive canvas state with each request: objects array, selectedObjects, dimensions (width, height)

## Object Resolution
When users refer to shapes without IDs, use these strategies:
- **By Description**: "red circle" → Find circle with red fill
- **By Position**: "top shape" → Lowest y coordinate, "leftmost" → Lowest x coordinate
- **By Selection**: "this shape" → Use selected objects
- **By Content**: "title" → Text containing "title"
- **Default**: When no objects specified, use currently selected objects

## Smart Defaults
You have access to intelligent defaults for colors, sizes, positions, and spacing. Use these when users don't specify exact parameters.

## Command Processing
- Execute operations immediately (no confirmation needed)
- Handle errors gracefully with helpful suggestions
- Ask clarifying questions when commands are ambiguous
- Use specific, descriptive language for object identification

## Multiple Shape Creation
- When user requests MULTIPLE shapes (numbers, grids, arrays), use multi_step_command
- Examples: "3 circles", "grid of 3x3", "5 rectangles", "create 4 text boxes"
- Each shape gets its own create_shape step with calculated positions
- For grids: calculate positions systematically (row by row, left to right)

## Key Conversions
- Circles: radius → diameter (radius * 2)
- Colors: Accept names (red, blue) and hex codes (#FF0000)
- Positions: Convert relative terms ("next to", "below") to coordinates
- Sizes: Convert descriptive terms ("small", "large") to pixels

## Command Examples

### Single Shape Creation
- "create a red circle" → create_shape("circle", 400, 300, 80, 80, "#e74c3c")
- "add blue rectangle at center" → create_shape("rectangle", 960, 540, 100, 60, "#3498db")
- "make text box below title" → create_shape("text", x, y, 200, 40, "#2c3e50", "New Text", null, null, null, "below", "title")

### Multiple Shape Creation (Use multi_step_command)
- "create 3 circles" → multi_step_command with 3 create_shape steps
- "make a grid of 3x3 squares" → multi_step_command with 9 create_shape steps
- "create 5 rectangles in a row" → multi_step_command with 5 create_shape steps
- "add 4 text boxes" → multi_step_command with 4 create_shape steps

### Manipulation
- "move red circle to 500, 400" → modify_shape("circle_id", {x: 500, y: 400})
- "make circle bigger" → modify_shape("circle_id", {width: 120, height: 120})
- "change circle to green" → modify_shape("circle_id", {fill: "#2ecc71"})

### Layout
- "arrange in row" → arrange_shapes(["selected_id1", "selected_id2"], "row") // Uses selected objects when none specified
- "arrange shapes in row" → arrange_shapes(["id1", "id2"], "row") // Uses current positions as starting point
- "distribute evenly horizontally" → arrange_shapes(["selected_id1", "selected_id2"], "distribute_h", {distributionType: "space-between"}) // Uses selected objects
- "distribute evenly vertically" → arrange_shapes(["selected_id1", "selected_id2"], "distribute_v", {distributionType: "space-between"}) // Uses selected objects
- "create login form" → create_layout_template("login_form", x, y, "medium", "modern")

### Error Handling
- Multiple matches: "I found 3 blue shapes. Which one? 1. blue circle (small) on left, 2. blue rectangle (medium) center, 3. blue text (large) right"
- No matches: "No objects match 'rectangle'. Available: red circle, green text. Try 'the red circle'"
- Empty canvas: "No objects yet. Try 'Create a red circle' or 'Add a blue rectangle'"

Remember: Be helpful, concise, and action-oriented.`;

/**
 * Resolves object references and relative positioning in function call arguments
 * Converts natural language descriptions to actual object IDs and positions
 * @param {Object} functionCall - Function call with potential object references
 * @param {Object} canvasState - Current canvas state
 * @returns {Object} - Function call with resolved object IDs and positions
 */
function resolveObjectReferences(functionCall, canvasState) {
  const { name, arguments: args } = functionCall;
  const resolvedArgs = { ...args };
  
  // Handle different function types that might have object references
  switch (name) {
    case 'create_shape':
      // Resolve relative positioning
      if (args.position && typeof args.position === 'string') {
        const resolvedPosition = resolveRelativePosition(
          args.position, 
          canvasState.objects, 
          canvasState.dimensions,
          { width: args.width, height: args.height }
        );
        
        if (resolvedPosition) {
          resolvedArgs.x = resolvedPosition.x;
          resolvedArgs.y = resolvedPosition.y;
          console.log(`📍 Resolved position "${args.position}" to (${resolvedPosition.x}, ${resolvedPosition.y})`);
          delete resolvedArgs.position; // Remove the position string
        }
      }
      
      // Resolve reference object for relative positioning
      if (args.referenceObject && typeof args.referenceObject === 'string') {
        const matches = findObjectsByDescription(args.referenceObject, canvasState.objects, canvasState.dimensions);
        if (matches.length > 0) {
          const referenceObject = matches[0];
          const resolvedPosition = resolveRelativePosition(
            args.position || 'next to', 
            canvasState.objects, 
            canvasState.dimensions,
            { width: args.width, height: args.height },
            referenceObject
          );
          
          if (resolvedPosition) {
            resolvedArgs.x = resolvedPosition.x;
            resolvedArgs.y = resolvedPosition.y;
            console.log(`📍 Resolved relative position "${args.position}" relative to "${args.referenceObject}" to (${resolvedPosition.x}, ${resolvedPosition.y})`);
            delete resolvedArgs.position;
            delete resolvedArgs.referenceObject;
          }
        }
      }
      break;
      
    case 'modify_shape':
    case 'delete_shape':
      // Resolve object ID from description
      if (args.id && typeof args.id === 'string' && !args.id.match(/^[a-zA-Z0-9_-]+$/)) {
        // This looks like a description rather than an ID
        const matches = findObjectsByDescription(args.id, canvasState.objects, canvasState.dimensions);
        if (matches.length > 0) {
          resolvedArgs.id = matches[0].id;
          console.log(`🔍 Resolved object reference "${args.id}" to ID: ${matches[0].id}`);
        } else {
          console.warn(`⚠️ Could not resolve object reference: "${args.id}"`);
        }
      }
      
      // Resolve relative positioning in updates
      if (args.updates && args.updates.position && typeof args.updates.position === 'string') {
        const objectId = resolvedArgs.id || args.id;
        const targetObject = canvasState.objects.find(obj => obj.id === objectId);
        
        if (targetObject) {
          const resolvedPosition = resolveRelativePosition(
            args.updates.position,
            canvasState.objects,
            canvasState.dimensions,
            targetObject
          );
          
          if (resolvedPosition) {
            resolvedArgs.updates = { ...resolvedArgs.updates };
            resolvedArgs.updates.x = resolvedPosition.x;
            resolvedArgs.updates.y = resolvedPosition.y;
            delete resolvedArgs.updates.position;
            console.log(`📍 Resolved move position "${args.updates.position}" to (${resolvedPosition.x}, ${resolvedPosition.y})`);
          }
        }
      }
      break;
      
    case 'arrange_shapes':
      // Resolve array of object IDs from descriptions
      if (args.ids && Array.isArray(args.ids)) {
        const resolvedIds = [];
        for (const idOrDesc of args.ids) {
          if (typeof idOrDesc === 'string') {
            if (idOrDesc.match(/^[a-zA-Z0-9_-]+$/)) {
              // This looks like an actual ID
              resolvedIds.push(idOrDesc);
            } else {
              // This looks like a description
              const matches = findObjectsByDescription(idOrDesc, canvasState.objects, canvasState.dimensions);
              if (matches.length > 0) {
                resolvedIds.push(matches[0].id);
                console.log(`🔍 Resolved object reference "${idOrDesc}" to ID: ${matches[0].id}`);
              } else {
                console.warn(`⚠️ Could not resolve object reference: "${idOrDesc}"`);
              }
            }
          }
        }
        resolvedArgs.ids = resolvedIds;
      } else if (!args.ids || args.ids.length === 0) {
        // No objects specified - use selected objects as default
        if (canvasState.selectedObjects && canvasState.selectedObjects.length > 0) {
          resolvedArgs.ids = canvasState.selectedObjects.map(obj => obj.id);
          console.log(`🎯 Using selected objects as default: ${resolvedArgs.ids.join(', ')}`);
        } else {
          console.warn(`⚠️ No objects specified and no objects selected`);
        }
      }
      break;
      
    case 'multi_step_command':
      // Resolve object references in each step
      if (args.steps && Array.isArray(args.steps)) {
        resolvedArgs.steps = args.steps.map(step => 
          resolveObjectReferences(step, canvasState)
        );
      }
      break;
  }
  
  return {
    name: functionCall.name,
    arguments: resolvedArgs
  };
}

/**
 * Enhanced Ambiguity Detection and Clarification System
 * Provides intelligent ambiguity detection and user-friendly clarification prompts
 */

/**
 * Detects ambiguous object references in function calls
 * @param {Object} functionCall - Function call to analyze
 * @param {Object} canvasState - Current canvas state
 * @returns {Object} - Ambiguity analysis result
 */
function detectObjectAmbiguity(functionCall, canvasState) {
  const { name, arguments: args } = functionCall;
  const ambiguities = [];
  
  // Check for ambiguous object references
  if (name === 'modify_shape' || name === 'delete_shape') {
    if (args.id && typeof args.id === 'string' && !args.id.match(/^[a-zA-Z0-9_-]+$/)) {
      // This looks like a description rather than an ID
      const matches = findObjectsByDescription(args.id, canvasState.objects, canvasState.dimensions);
      
      if (matches.length === 0) {
        ambiguities.push({
          type: 'object_not_found',
          field: 'id',
          value: args.id,
          message: `I couldn't find any objects matching "${args.id}".`,
          suggestions: generateObjectSuggestions(canvasState.objects)
        });
      } else if (matches.length > 1) {
        ambiguities.push({
          type: 'multiple_matches',
          field: 'id',
          value: args.id,
          matches: matches,
          message: `I found ${matches.length} objects matching "${args.id}". Which one did you mean?`,
          suggestions: matches.map((obj, index) => ({
            id: obj.id,
            description: describeObject(obj, canvasState.dimensions),
            index: index + 1
          }))
        });
      }
    }
  }
  
  // Check for ambiguous arrange_shapes references
  if (name === 'arrange_shapes' && args.ids) {
    const ambiguousIds = [];
    const resolvedIds = [];
    
    for (const idOrDesc of args.ids) {
      if (typeof idOrDesc === 'string' && !idOrDesc.match(/^[a-zA-Z0-9_-]+$/)) {
        const matches = findObjectsByDescription(idOrDesc, canvasState.objects, canvasState.dimensions);
        if (matches.length === 0) {
          ambiguousIds.push({
            original: idOrDesc,
            type: 'not_found',
            message: `No objects found matching "${idOrDesc}"`
          });
        } else if (matches.length > 1) {
          ambiguousIds.push({
            original: idOrDesc,
            type: 'multiple_matches',
            matches: matches,
            message: `Multiple objects found matching "${idOrDesc}"`
          });
        } else {
          resolvedIds.push(matches[0].id);
        }
      } else {
        resolvedIds.push(idOrDesc);
      }
    }
    
    if (ambiguousIds.length > 0) {
      ambiguities.push({
        type: 'arrange_ambiguity',
        field: 'ids',
        ambiguousIds: ambiguousIds,
        resolvedIds: resolvedIds,
        message: `I found some ambiguous object references in your arrange command.`
      });
    }
  }
  
  return {
    hasAmbiguity: ambiguities.length > 0,
    ambiguities: ambiguities
  };
}

/**
 * Generates helpful suggestions for object references
 * @param {Array} objects - Available objects
 * @returns {Array} - Array of suggestion objects
 */
function generateObjectSuggestions(objects) {
  if (objects.length === 0) {
    return [{
      type: 'no_objects',
      message: 'There are no objects on the canvas yet. Try creating some shapes first!',
      suggestions: [
        'Create a red circle',
        'Add a blue rectangle',
        'Make a text box'
      ]
    }];
  }
  
  const suggestions = [];
  
  // Group objects by type
  const byType = objects.reduce((acc, obj) => {
    if (!acc[obj.type]) acc[obj.type] = [];
    acc[obj.type].push(obj);
    return acc;
  }, {});
  
  // Add type-based suggestions
  Object.entries(byType).forEach(([type, typeObjects]) => {
    if (typeObjects.length === 1) {
      suggestions.push({
        type: 'single_type',
        description: `the ${type}`,
        object: typeObjects[0]
      });
    } else {
      suggestions.push({
        type: 'multiple_type',
        description: `one of the ${typeObjects.length} ${type}s`,
        count: typeObjects.length,
        objects: typeObjects
      });
    }
  });
  
  // Add color-based suggestions
  const byColor = objects.reduce((acc, obj) => {
    const color = extractColorName(obj.fill);
    if (!acc[color]) acc[color] = [];
    acc[color].push(obj);
    return acc;
  }, {});
  
  Object.entries(byColor).forEach(([color, colorObjects]) => {
    if (colorObjects.length === 1) {
      suggestions.push({
        type: 'single_color',
        description: `the ${color} ${colorObjects[0].type}`,
        object: colorObjects[0]
      });
    } else {
      suggestions.push({
        type: 'multiple_color',
        description: `one of the ${colorObjects.length} ${color} objects`,
        count: colorObjects.length,
        objects: colorObjects
      });
    }
  });
  
  // Add position-based suggestions
  const centerX = 1000; // Approximate canvas center
  const centerY = 750;
  
  const leftObjects = objects.filter(obj => obj.x < centerX);
  const rightObjects = objects.filter(obj => obj.x >= centerX);
  const topObjects = objects.filter(obj => obj.y < centerY);
  const bottomObjects = objects.filter(obj => obj.y >= centerY);
  
  if (leftObjects.length === 1) {
    suggestions.push({
      type: 'position',
      description: 'the object on the left',
      object: leftObjects[0]
    });
  }
  
  if (rightObjects.length === 1) {
    suggestions.push({
      type: 'position',
      description: 'the object on the right',
      object: rightObjects[0]
    });
  }
  
  if (topObjects.length === 1) {
    suggestions.push({
      type: 'position',
      description: 'the object at the top',
      object: topObjects[0]
    });
  }
  
  if (bottomObjects.length === 1) {
    suggestions.push({
      type: 'position',
      description: 'the object at the bottom',
      object: bottomObjects[0]
    });
  }
  
  return suggestions;
}

/**
 * Describes an object in a user-friendly way
 * @param {Object} obj - Object to describe
 * @param {Object} canvasDimensions - Canvas dimensions
 * @returns {string} - Human-readable description
 */
function describeObject(obj, canvasDimensions) {
  const color = extractColorName(obj.fill);
  const size = getObjectSizeDescription(obj.width, obj.height);
  const position = getPositionDescription(obj, canvasDimensions);
  
  return `${color} ${obj.type} (${size}) ${position}`;
}

/**
 * Extracts color name from hex or color value
 * @param {string} colorValue - Color value (hex or name)
 * @returns {string} - Color name
 */
function extractColorName(colorValue) {
  if (!colorValue) return 'default';
  
  const colorMap = {
    '#e74c3c': 'red',
    '#3498db': 'blue',
    '#2ecc71': 'green',
    '#f39c12': 'orange',
    '#9b59b6': 'purple',
    '#e91e63': 'pink',
    '#795548': 'brown',
    '#607d8b': 'gray',
    '#000000': 'black',
    '#ffffff': 'white',
    '#ff0000': 'red',
    '#00ff00': 'green',
    '#0000ff': 'blue'
  };
  
  return colorMap[colorValue.toLowerCase()] || 'colored';
}

/**
 * Gets size description for an object
 * @param {number} width - Object width
 * @param {number} height - Object height
 * @returns {string} - Size description
 */
function getObjectSizeDescription(width, height) {
  const area = width * height;
  
  if (area < 1000) return 'small';
  if (area < 5000) return 'medium';
  if (area < 15000) return 'large';
  return 'huge';
}

/**
 * Gets position description for an object
 * @param {Object} obj - Object
 * @param {Object} canvasDimensions - Canvas dimensions
 * @returns {string} - Position description
 */
function getPositionDescription(obj, canvasDimensions) {
  const centerX = canvasDimensions.width / 2;
  const centerY = canvasDimensions.height / 2;
  
  let position = '';
  
  if (obj.x < centerX * 0.3) position += 'on the left';
  else if (obj.x > centerX * 1.7) position += 'on the right';
  else position += 'in the center horizontally';
  
  if (obj.y < centerY * 0.3) position += ' at the top';
  else if (obj.y > centerY * 1.7) position += ' at the bottom';
  else position += ' vertically';
  
  return position;
}

/**
 * Generates clarification prompts for ambiguous commands
 * @param {Object} ambiguityAnalysis - Result from detectObjectAmbiguity
 * @param {Object} canvasState - Current canvas state
 * @returns {Object} - Clarification prompt response
 */
function generateClarificationPrompt(ambiguityAnalysis, canvasState) {
  if (!ambiguityAnalysis.hasAmbiguity) {
    return null;
  }
  
  const { ambiguities } = ambiguityAnalysis;
  const primaryAmbiguity = ambiguities[0];
  
  let clarificationMessage = '';
  let suggestions = [];
  
  switch (primaryAmbiguity.type) {
    case 'object_not_found':
      clarificationMessage = primaryAmbiguity.message;
      suggestions = primaryAmbiguity.suggestions.map(suggestion => {
        if (suggestion.type === 'no_objects') {
          return suggestion.message;
        } else if (suggestion.type === 'single_type' || suggestion.type === 'single_color' || suggestion.type === 'position') {
          return `Try referring to "${suggestion.description}"`;
        } else {
          return `Try being more specific about which ${suggestion.description}`;
        }
      });
      break;
      
    case 'multiple_matches':
      clarificationMessage = primaryAmbiguity.message;
      suggestions = primaryAmbiguity.suggestions.map(suggestion => 
        `${suggestion.index}. ${suggestion.description}`
      );
      break;
      
    case 'arrange_ambiguity':
      clarificationMessage = primaryAmbiguity.message;
      primaryAmbiguity.ambiguousIds.forEach(ambiguous => {
        if (ambiguous.type === 'not_found') {
          suggestions.push(`"${ambiguous.original}" - ${ambiguous.message}`);
        } else if (ambiguous.type === 'multiple_matches') {
          suggestions.push(`"${ambiguous.original}" - ${ambiguous.message}`);
        }
      });
      break;
  }
  
  return {
    success: false,
    type: 'clarification_needed',
    message: clarificationMessage,
    suggestions: suggestions,
    ambiguities: ambiguities,
    canvasState: canvasState
  };
}

/**
 * Generates fallback strategies for unclear or impossible requests
 * @param {string} command - Original user command
 * @param {Object} canvasState - Current canvas state
 * @param {Object} errorContext - Context about what went wrong
 * @returns {Object} - Fallback response with suggestions
 */
function generateFallbackStrategies(command, canvasState, errorContext) {
  const lowerCommand = command.toLowerCase();
  const suggestions = [];
  
  // Analyze the command to understand user intent
  if (lowerCommand.includes('move') || lowerCommand.includes('delete') || lowerCommand.includes('modify')) {
    if (canvasState.objects.length === 0) {
      return {
        success: false,
        type: 'fallback_suggestion',
        message: 'There are no objects on the canvas to work with. Here are some things you can try:',
        suggestions: [
          'Create a red circle',
          'Add a blue rectangle',
          'Make a text box',
          'Create a login form',
          'Build a card layout'
        ],
        fallbackType: 'no_objects'
      };
    }
    
    // Suggest specific objects that exist
    const objectSuggestions = canvasState.objects.slice(0, 3).map(obj => {
      const color = extractColorName(obj.fill);
      const size = getObjectSizeDescription(obj.width, obj.height);
      return `${color} ${obj.type} (${size})`;
    });
    
    suggestions.push(`Try being more specific about which object. Available objects include: ${objectSuggestions.join(', ')}`);
  }
  
  if (lowerCommand.includes('arrange') || lowerCommand.includes('layout')) {
    if (canvasState.objects.length < 2) {
      return {
        success: false,
        type: 'fallback_suggestion',
        message: 'You need at least 2 objects to arrange them. Here are some suggestions:',
        suggestions: [
          'Create more shapes first',
          'Try "create a red circle and a blue rectangle"',
          'Use "create a login form" for a complete layout'
        ],
        fallbackType: 'insufficient_objects'
      };
    }
    
    suggestions.push('Try specifying which objects to arrange, like "arrange the red circle and blue rectangle in a row"');
  }
  
  if (lowerCommand.includes('create') || lowerCommand.includes('add') || lowerCommand.includes('make')) {
    suggestions.push('Try being more specific about what to create, like "create a red circle" or "add a blue rectangle"');
  }
  
  // General fallback suggestions
  if (suggestions.length === 0) {
    suggestions.push(
      'Try being more specific about what you want to do',
      'Use commands like "create a red circle" or "move the blue rectangle"',
      'Check the available objects on the canvas'
    );
  }
  
  return {
    success: false,
    type: 'fallback_suggestion',
    message: 'I\'m not sure exactly what you want to do. Here are some suggestions:',
    suggestions: suggestions,
    fallbackType: 'general_confusion',
    originalCommand: command
  };
}

/**
 * Creates smart defaults context for AI consumption
 * @param {Object} userIntent - Extracted user intent
 * @param {Object} smartDefaults - Generated smart defaults
 * @returns {string} - Formatted smart defaults context
 */
function createSmartDefaultsContext(userIntent, smartDefaults) {
  let context = `## Smart Defaults Analysis\n`;
  
  // User Intent Summary
  context += `**Detected User Intent:**\n`;
  if (userIntent.action) context += `- Action: ${userIntent.action}\n`;
  if (userIntent.shape) context += `- Shape Type: ${userIntent.shape}\n`;
  if (userIntent.color) context += `- Color Intent: ${userIntent.color}\n`;
  if (userIntent.size) context += `- Size Intent: ${userIntent.size}\n`;
  if (userIntent.position) context += `- Position Intent: ${userIntent.position}\n`;
  if (userIntent.spacing) context += `- Spacing Intent: ${userIntent.spacing}px\n`;
  if (userIntent.quantity) context += `- Quantity Intent: ${userIntent.quantity}\n`;
  if (userIntent.style) context += `- Style Intent: ${userIntent.style}\n`;
  context += `- Confidence Score: ${(userIntent.confidence * 100).toFixed(1)}%\n\n`;
  
  // Smart Defaults Recommendations
  context += `**Recommended Smart Defaults:**\n`;
  context += `- Color: ${smartDefaults.color} (${getColorDescription(smartDefaults.color)})\n`;
  context += `- Size: ${smartDefaults.size.width}×${smartDefaults.size.height}px (${getSmartDefaultsSizeDescription(smartDefaults.size)})\n`;
  context += `- Position: (${smartDefaults.position.x}, ${smartDefaults.position.y}) (${getSmartDefaultsPositionDescription(smartDefaults.position)})\n`;
  context += `- Spacing: ${smartDefaults.spacing}px (${getSpacingDescription(smartDefaults.spacing)})\n\n`;
  
  // Usage Instructions
  context += `**Usage Instructions:**\n`;
  context += `- Use these smart defaults when the user doesn't specify exact parameters\n`;
  context += `- Prioritize user-specified values over smart defaults\n`;
  context += `- Apply smart defaults to create visually harmonious layouts\n`;
  context += `- Use confidence scores to determine how much to rely on extracted intent\n\n`;
  
  return context;
}

/**
 * Gets a human-readable description of a color
 * @param {string} color - Color hex value or name
 * @returns {string} - Color description
 */
function getColorDescription(color) {
  const colorDescriptions = {
    '#e74c3c': 'vibrant red',
    '#3498db': 'bright blue', 
    '#2ecc71': 'fresh green',
    '#f1c40f': 'sunny yellow',
    '#f39c12': 'warm orange',
    '#9b59b6': 'rich purple',
    '#e91e63': 'bold pink',
    '#2c3e50': 'dark charcoal',
    '#ecf0f1': 'light gray',
    '#95a5a6': 'medium gray'
  };
  
  return colorDescriptions[color] || 'custom color';
}

/**
 * Gets a human-readable description of a size
 * @param {Object} size - Size object with width and height
 * @returns {string} - Size description
 */
function getSmartDefaultsSizeDescription(size) {
  const area = size.width * size.height;
  if (area < 1000) return 'tiny';
  if (area < 5000) return 'small';
  if (area < 15000) return 'medium';
  if (area < 30000) return 'large';
  return 'huge';
}

/**
 * Gets a human-readable description of a position
 * @param {Object} position - Position object with x and y
 * @returns {string} - Position description
 */
function getSmartDefaultsPositionDescription(position) {
  const { x, y } = position;
  if (x < 200 && y < 200) return 'top-left area';
  if (x > 1720 && y < 200) return 'top-right area';
  if (x < 200 && y > 880) return 'bottom-left area';
  if (x > 1720 && y > 880) return 'bottom-right area';
  if (x > 760 && x < 1160 && y > 440 && y < 640) return 'center area';
  return 'custom position';
}

/**
 * Gets a human-readable description of spacing
 * @param {number} spacing - Spacing value in pixels
 * @returns {string} - Spacing description
 */
function getSpacingDescription(spacing) {
  if (spacing < 15) return 'tight spacing';
  if (spacing < 30) return 'normal spacing';
  if (spacing < 60) return 'loose spacing';
  return 'wide spacing';
}

/**
 * Applies smart defaults to function call arguments
 * @param {Object} functionCall - Original function call
 * @param {Object} userIntent - Extracted user intent
 * @param {Object} smartDefaults - Generated smart defaults
 * @param {Object} canvasState - Current canvas state
 * @returns {Object} - Enhanced function call with smart defaults applied
 */
function applySmartDefaultsToFunctionCall(functionCall, userIntent, smartDefaults, canvasState) {
  const { name, arguments: args } = functionCall;
  let enhancedArgs = { ...args };
  
  // Apply smart defaults based on function type
  switch (name) {
    case 'create_shape':
      enhancedArgs = applySmartDefaultsToCreateShape(enhancedArgs, userIntent, smartDefaults, canvasState);
      break;
      
    case 'modify_shape':
      enhancedArgs = applySmartDefaultsToModifyShape(enhancedArgs, userIntent, smartDefaults, canvasState);
      break;
      
    case 'arrange_shapes':
      enhancedArgs = applySmartDefaultsToArrangeShapes(enhancedArgs, userIntent, smartDefaults, canvasState);
      break;
      
    // delete_shape doesn't need smart defaults
    default:
      break;
  }
  
  return {
    name: functionCall.name,
    arguments: enhancedArgs
  };
}

/**
 * Applies smart defaults to create_shape function call
 * @param {Object} args - Function arguments
 * @param {Object} userIntent - User intent
 * @param {Object} smartDefaults - Smart defaults
 * @param {Object} canvasState - Canvas state
 * @returns {Object} - Enhanced arguments
 */
function applySmartDefaultsToCreateShape(args, userIntent, smartDefaults, canvasState) {
  const enhanced = { ...args };
  
  // Apply color defaults
  if (!enhanced.fill && userIntent.color) {
    enhanced.fill = smartDefaults.color;
  } else if (!enhanced.fill) {
    enhanced.fill = smartDefaults.color;
  }
  
  // Apply size defaults
  if (enhanced.width === undefined && userIntent.size) {
    enhanced.width = smartDefaults.size.width;
  } else if (enhanced.width === undefined) {
    enhanced.width = smartDefaults.size.width;
  }
  
  if (enhanced.height === undefined && userIntent.size) {
    enhanced.height = smartDefaults.size.height;
  } else if (enhanced.height === undefined) {
    enhanced.height = smartDefaults.size.height;
  }
  
  // Apply position defaults
  if (enhanced.x === undefined && userIntent.position) {
    enhanced.x = smartDefaults.position.x;
  } else if (enhanced.x === undefined) {
    enhanced.x = smartDefaults.position.x;
  }
  
  if (enhanced.y === undefined && userIntent.position) {
    enhanced.y = smartDefaults.position.y;
  } else if (enhanced.y === undefined) {
    enhanced.y = smartDefaults.position.y;
  }
  
  // Apply type defaults
  if (!enhanced.type && userIntent.shape) {
    enhanced.type = userIntent.shape;
  }
  
  // Apply text content defaults
  if (enhanced.type === 'text' && !enhanced.text_content) {
    enhanced.text_content = 'New Text';
  }
  
  return enhanced;
}

/**
 * Applies smart defaults to modify_shape function call
 * @param {Object} args - Function arguments
 * @param {Object} userIntent - User intent
 * @param {Object} smartDefaults - Smart defaults
 * @param {Object} canvasState - Canvas state
 * @returns {Object} - Enhanced arguments
 */
function applySmartDefaultsToModifyShape(args, userIntent, smartDefaults, canvasState) {
  const enhanced = { ...args };
  
  // Ensure updates object exists
  if (!enhanced.updates) {
    enhanced.updates = {};
  }
  
  // Apply color defaults to updates
  if (userIntent.color && !enhanced.updates.fill) {
    enhanced.updates.fill = smartDefaults.color;
  }
  
  // Apply size defaults to updates
  if (userIntent.size && !enhanced.updates.width) {
    enhanced.updates.width = smartDefaults.size.width;
  }
  
  if (userIntent.size && !enhanced.updates.height) {
    enhanced.updates.height = smartDefaults.size.height;
  }
  
  // Apply position defaults to updates
  if (userIntent.position && !enhanced.updates.x) {
    enhanced.updates.x = smartDefaults.position.x;
  }
  
  if (userIntent.position && !enhanced.updates.y) {
    enhanced.updates.y = smartDefaults.position.y;
  }
  
  return enhanced;
}

/**
 * Applies smart defaults to arrange_shapes function call
 * @param {Object} args - Function arguments
 * @param {Object} userIntent - User intent
 * @param {Object} smartDefaults - Smart defaults
 * @param {Object} canvasState - Canvas state
 * @returns {Object} - Enhanced arguments
 */
function applySmartDefaultsToArrangeShapes(args, userIntent, smartDefaults, canvasState) {
  const enhanced = { ...args };
  
  // Apply spacing defaults
  if (!enhanced.options) {
    enhanced.options = {};
  }
  
  if (userIntent.spacing && !enhanced.options.spacing) {
    enhanced.options.spacing = userIntent.spacing;
  } else if (!enhanced.options.spacing) {
    enhanced.options.spacing = smartDefaults.spacing;
  }
  
  // Apply layout defaults
  if (!enhanced.layout && userIntent.action === 'arrange') {
    enhanced.layout = 'row'; // Default layout
  }
  
  return enhanced;
}

/**
 * Formats canvas state for AI consumption with better context
 * @param {Object} canvasState - Current canvas state
 * @returns {string} - Formatted canvas context string
 */
function formatCanvasStateForAI(canvasState) {
  const { objects = [], selectedObjects = [], dimensions = { width: 1920, height: 1080 } } = canvasState;
  
  let context = `## Canvas State\n`;
  context += `Canvas dimensions: ${dimensions.width}×${dimensions.height} pixels\n\n`;
  
  if (objects.length === 0) {
    context += `Canvas is empty - no shapes present.\n`;
  } else {
    context += `Canvas contains ${objects.length} shape(s):\n\n`;
    
    // Group objects by type for better organization
    const rectangles = objects.filter(obj => obj.type === 'rectangle');
    const circles = objects.filter(obj => obj.type === 'circle');
    const texts = objects.filter(obj => obj.type === 'text');
    
    if (rectangles.length > 0) {
      context += `**Rectangles (${rectangles.length}):**\n`;
      rectangles.forEach(obj => {
        context += `- ID: ${obj.id}, Position: (${obj.x}, ${obj.y}), Size: ${obj.width}×${obj.height}, Color: ${obj.fill}\n`;
      });
      context += `\n`;
    }
    
    if (circles.length > 0) {
      context += `**Circles (${circles.length}):**\n`;
      circles.forEach(obj => {
        context += `- ID: ${obj.id}, Position: (${obj.x}, ${obj.y}), Diameter: ${obj.width}, Color: ${obj.fill}\n`;
      });
      context += `\n`;
    }
    
    if (texts.length > 0) {
      context += `**Text Elements (${texts.length}):**\n`;
      texts.forEach(obj => {
        context += `- ID: ${obj.id}, Position: (${obj.x}, ${obj.y}), Size: ${obj.width}×${obj.height}, Text: "${obj.text || obj.text_content || 'New Text'}", Color: ${obj.fill}\n`;
      });
      context += `\n`;
    }
    
    // Add selected objects context
    if (selectedObjects && selectedObjects.length > 0) {
      context += `**Currently Selected (${selectedObjects.length}):**\n`;
      selectedObjects.forEach(obj => {
        context += `- ${obj.type} (ID: ${obj.id}) at (${obj.x}, ${obj.y})\n`;
      });
      context += `\n`;
    } else {
      context += `**No objects currently selected.**\n\n`;
    }
    
    // Add spatial context
    const bounds = calculateCanvasBounds(objects);
    if (bounds) {
      context += `**Spatial Context:**\n`;
      context += `- Leftmost shape at x=${bounds.minX}, rightmost at x=${bounds.maxX}\n`;
      context += `- Topmost shape at y=${bounds.minY}, bottommost at y=${bounds.maxY}\n`;
      context += `- Canvas center: (${dimensions.width/2}, ${dimensions.height/2})\n\n`;
    }
  }
  
  return context;
}

/**
 * Calculates spatial bounds of all objects on canvas
 * @param {Array} objects - Canvas objects
 * @returns {Object|null} - Bounds object or null if no objects
 */
function calculateCanvasBounds(objects) {
  if (!objects || objects.length === 0) return null;
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  objects.forEach(obj => {
    minX = Math.min(minX, obj.x);
    minY = Math.min(minY, obj.y);
    maxX = Math.max(maxX, obj.x + obj.width);
    maxY = Math.max(maxY, obj.y + obj.height);
  });
  
  return { minX, minY, maxX, maxY };
}

/**
 * Rate limiting: 10 commands per minute per user
 * @param {string} userId - User identifier
 * @returns {boolean} - Whether request is allowed
 */
function checkRateLimit(userId) {
  const now = Date.now();
  const userRequests = rateLimitStore.get(userId) || [];
  
  // Remove requests older than 1 minute
  const recentRequests = userRequests.filter(timestamp => now - timestamp < 60000);
  
  if (recentRequests.length >= 10) {
    return false; // Rate limit exceeded
  }
  
  // Add current request
  recentRequests.push(now);
  rateLimitStore.set(userId, recentRequests);
  return true;
}

/**
 * Process a natural language command
 * @param {string} command - User's natural language command
 * @param {Object} canvasState - Current canvas state
 * @param {string} userId - User identifier for rate limiting
 * @returns {Promise<Object>} - AI response with function calls or message
 */
export async function processCommand(command, canvasState = {}, userId = 'default') {
  // Check if OpenAI is initialized
  if (!openai) {
    return {
      success: false,
      message: 'AI Agent is not available. Please configure your OpenAI API key in the .env file.',
      type: 'error'
    };
  }

  // Start LangSmith trace (with better error handling)
  let trace = null;
  if (langsmithClient) {
    try {
      const projectName = import.meta.env.VITE_LANGSMITH_PROJECT || 'CollabCanvas-AI-Agent';
      
      // Try to create the run, but handle project not found gracefully
      trace = await langsmithClient.createRun({
        name: 'canvas-ai-command',
        runType: 'chain',
        inputs: {
          command: command,
          canvasState: canvasState,
          userId: userId
        },
        projectName: projectName
      });
      
      console.log('✅ LangSmith trace created successfully');
    } catch (error) {
      // Handle specific LangSmith errors
      if (error.status === 404) {
        console.warn(`⚠️ LangSmith project '${import.meta.env.VITE_LANGSMITH_PROJECT || 'CollabCanvas-AI-Agent'}' not found. Please create the project in LangSmith dashboard or disable LangSmith monitoring.`);
      } else {
        console.warn('⚠️ LangSmith trace creation failed:', error.message);
      }
      // Continue without tracing - don't fail the entire operation
      trace = null;
    }
  }

  try {
    // Check rate limit
    if (!checkRateLimit(userId)) {
      const errorResult = {
        success: false,
        message: 'Rate limit exceeded. Please wait a moment before sending another command.',
        type: 'error'
      };
      
      if (trace) {
        await langsmithClient.updateRun(trace.id, {
          outputs: errorResult,
          error: 'Rate limit exceeded'
        });
      }
      
      return errorResult;
    }

    const startTime = Date.now();

            // Prepare enhanced canvas state context
            const canvasContext = formatCanvasStateForAI(canvasState);
            
            // Extract user intent and generate smart defaults
            const userIntent = extractUserIntent(command);
            const smartDefaults = generateSmartDefaults(canvasState, userIntent.shape || 'rectangle', userIntent);
            
            // Create smart defaults context for AI
            const smartDefaultsContext = createSmartDefaultsContext(userIntent, smartDefaults);
            
            // Prepare messages for OpenAI
            const messages = [
              {
                role: 'system',
                content: SYSTEM_PROMPT
              },
              {
                role: 'user',
                content: `${canvasContext}\n\n${smartDefaultsContext}\n\nUser Command: ${command}`
              }
            ];

    // Log the input data being sent to OpenAI
    console.log('📤 Sending to OpenAI:', {
      command: command,
      canvasState: canvasState,
      userIntent: userIntent,
      smartDefaults: smartDefaults,
      messages: messages
    });

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.1, // Low temperature for consistent responses
      max_tokens: 1000,
      functions: [
        {
          name: 'multi_step_command',
          description: 'Execute multiple canvas operations in sequence. Use this when the user wants to create MULTIPLE shapes (e.g., "create 3 circles", "make a grid of 3x3 squares", "create 5 rectangles"). Each shape should be a separate create_shape step.',
          parameters: {
            type: 'object',
            properties: {
              steps: {
                type: 'array',
                description: 'Array of function calls to execute in sequence',
                items: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      enum: ['create_shape', 'modify_shape', 'delete_shape', 'arrange_shapes'],
                      description: 'Function name to execute'
                    },
                    arguments: {
                      type: 'object',
                      description: 'Arguments for the function call'
                    }
                  },
                  required: ['name', 'arguments']
                },
                minItems: 1,
                maxItems: 10
              }
            },
            required: ['steps']
          }
        },
        {
          name: 'create_shape',
          description: 'Create a new shape (rectangle, circle, or text) on the canvas. For circles, width and height should be equal (diameter). For text, width/height define the text box size.',
          parameters: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['rectangle', 'circle', 'text'],
                description: 'Type of shape to create: rectangle (rectangular shape), circle (circular shape), text (text element)'
              },
              x: {
                type: 'number',
                minimum: 0,
                maximum: 2000,
                description: 'X position on canvas (left edge). Must be within canvas bounds (0-2000)'
              },
              y: {
                type: 'number',
                minimum: 0,
                maximum: 1500,
                description: 'Y position on canvas (top edge). Must be within canvas bounds (0-1500)'
              },
              width: {
                type: 'number',
                minimum: 10,
                maximum: 500,
                description: 'Width of the shape in pixels. For circles, this becomes the diameter. Minimum 10px, maximum 500px'
              },
              height: {
                type: 'number',
                minimum: 10,
                maximum: 500,
                description: 'Height of the shape in pixels. For circles, this becomes the diameter. Minimum 10px, maximum 500px'
              },
              fill: {
                type: 'string',
                description: 'Fill color of the shape. Accepts color names (red, blue, green, yellow, etc.) or hex codes (#FF0000, #00FF00, etc.)'
              },
              stroke: {
                type: 'string',
                description: 'Stroke/border color of the shape. Optional. Accepts color names or hex codes'
              },
              strokeWidth: {
                type: 'number',
                minimum: 0,
                maximum: 10,
                description: 'Width of the stroke/border in pixels. Optional, defaults to 2px'
              },
              opacity: {
                type: 'number',
                minimum: 0,
                maximum: 1,
                description: 'Opacity of the shape (0 = transparent, 1 = opaque). Optional, defaults to 1'
              },
              rotation: {
                type: 'number',
                minimum: 0,
                maximum: 360,
                description: 'Rotation angle in degrees (0-360). Optional, defaults to 0'
              },
              text_content: {
                type: 'string',
                maxLength: 200,
                description: 'Text content for text shapes. Optional, defaults to "New Text". Maximum 200 characters'
              },
              fontSize: {
                type: 'number',
                minimum: 8,
                maximum: 72,
                description: 'Font size in pixels for text shapes. Optional, defaults to 16px'
              },
              fontFamily: {
                type: 'string',
                description: 'Font family for text shapes. Optional, defaults to "Arial". Common options: Arial, Helvetica, Times New Roman, Courier'
              },
              position: {
                type: 'string',
                description: 'Relative position command for smart positioning. Options: "center", "top-left", "top-right", "bottom-left", "bottom-right", "top", "bottom", "left", "right", "next to", "below", "above", "to the left", "to the right", "near". When using relative positioning, x and y will be automatically calculated.'
              },
              referenceObject: {
                type: 'string',
                description: 'Description of reference object for relative positioning (e.g., "red rectangle", "blue circle", "title text"). Used with position parameter for object-relative positioning.'
              }
            },
            required: ['type', 'width', 'height', 'fill']
          }
        },
        {
          name: 'modify_shape',
          description: 'Modify properties of an existing shape on the canvas. You can update position, size, colors, rotation, and text properties. Only include the properties you want to change.',
          parameters: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Unique ID of the shape to modify. Must be an existing shape ID from the canvas state'
              },
              updates: {
                type: 'object',
                description: 'Object containing only the properties you want to update. All properties are optional.',
                properties: {
                  x: { 
                    type: 'number',
                    minimum: 0,
                    maximum: 2000,
                    description: 'New X position (left edge). Must be within canvas bounds'
                  },
                  y: { 
                    type: 'number',
                    minimum: 0,
                    maximum: 1500,
                    description: 'New Y position (top edge). Must be within canvas bounds'
                  },
                  width: { 
                    type: 'number',
                    minimum: 10,
                    maximum: 500,
                    description: 'New width in pixels. For circles, this becomes the diameter'
                  },
                  height: { 
                    type: 'number',
                    minimum: 10,
                    maximum: 500,
                    description: 'New height in pixels. For circles, this becomes the diameter'
                  },
                  fill: { 
                    type: 'string',
                    description: 'New fill color. Accepts color names or hex codes'
                  },
                  stroke: { 
                    type: 'string',
                    description: 'New stroke/border color. Accepts color names or hex codes'
                  },
                  strokeWidth: { 
                    type: 'number',
                    minimum: 0,
                    maximum: 10,
                    description: 'New stroke width in pixels'
                  },
                  opacity: { 
                    type: 'number',
                    minimum: 0,
                    maximum: 1,
                    description: 'New opacity (0 = transparent, 1 = opaque)'
                  },
                  rotation: { 
                    type: 'number',
                    minimum: 0,
                    maximum: 360,
                    description: 'New rotation angle in degrees'
                  },
                  text_content: { 
                    type: 'string',
                    maxLength: 200,
                    description: 'New text content (only for text shapes)'
                  },
                  fontSize: { 
                    type: 'number',
                    minimum: 8,
                    maximum: 72,
                    description: 'New font size in pixels (only for text shapes)'
                  },
                  fontFamily: { 
                    type: 'string',
                    description: 'New font family (only for text shapes)'
                  },
                  position: {
                    type: 'string',
                    description: 'Relative position command for moving the shape. Options: "center", "top-left", "top-right", "bottom-left", "bottom-right", "top", "bottom", "left", "right", "next to", "below", "above", "to the left", "to the right", "near". When using relative positioning, x and y will be automatically calculated.'
                  }
                }
              }
            },
            required: ['id', 'updates']
          }
        },
        {
          name: 'delete_shape',
          description: 'Delete a shape from the canvas permanently. This action cannot be undone. Use with caution.',
          parameters: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Unique ID of the shape to delete. Must be an existing shape ID from the canvas state'
              }
            },
            required: ['id']
          }
        },
        {
          name: 'arrange_shapes',
          description: 'Arrange multiple shapes in various layouts. This is useful for organizing shapes into rows, columns, grids, or distributing them evenly.',
          parameters: {
            type: 'object',
            properties: {
              ids: {
                type: 'array',
                items: { type: 'string' },
                minItems: 1,
                maxItems: 20,
                description: 'Array of shape IDs to arrange. If not provided, uses currently selected objects. Must contain at least 1 shape and at most 20 shapes. All IDs must exist on the canvas'
              },
              layout: {
                type: 'string',
                enum: ['row', 'column', 'grid', 'distribute_h', 'distribute_v'],
                description: 'Layout type: row (horizontal line), column (vertical line), grid (2D grid), distribute_h (horizontal distribution), distribute_v (vertical distribution)'
              },
              options: {
                type: 'object',
                description: 'Additional layout options. All properties are optional.',
                properties: {
                  spacing: { 
                    type: 'number',
                    minimum: 0,
                    maximum: 100,
                    description: 'Spacing between shapes in pixels. Default: 20px'
                  },
                  columns: { 
                    type: 'number',
                    minimum: 1,
                    maximum: 10,
                    description: 'Number of columns for grid layout. Default: calculated automatically'
                  },
                  startX: { 
                    type: 'number',
                    minimum: 0,
                    maximum: 2000,
                    description: 'Starting X position for the arrangement. Default: current position of single object or average X of multiple objects'
                  },
                  startY: { 
                    type: 'number',
                    minimum: 0,
                    maximum: 1500,
                    description: 'Starting Y position for the arrangement. Default: current position of single object or average Y of multiple objects'
                  }
                }
              }
            },
            required: ['layout']
          }
        },
        {
          name: 'create_layout_template',
          description: 'Create a complex layout template (login form, card layout, navigation bar, dashboard, hero section). This creates multiple related shapes that form a complete UI layout.',
          parameters: {
            type: 'object',
            properties: {
              template_type: {
                type: 'string',
                enum: ['login_form', 'card_layout', 'navigation_bar', 'dashboard', 'hero_section'],
                description: 'Type of layout template to create: login_form (login form with fields and button), card_layout (multiple cards in a row), navigation_bar (horizontal navigation with menu items), dashboard (sidebar and main content), hero_section (large banner with title and CTA)'
              },
              start_x: {
                type: 'number',
                minimum: 0,
                maximum: 2000,
                description: 'Starting X position for the layout template. Must be within canvas bounds (0-2000)'
              },
              start_y: {
                type: 'number',
                minimum: 0,
                maximum: 1500,
                description: 'Starting Y position for the layout template. Must be within canvas bounds (0-1500)'
              },
              size: {
                type: 'string',
                enum: ['small', 'medium', 'large', 'xlarge'],
                description: 'Size preset for the template: small (300x200), medium (500x400), large (800x600), xlarge (1200x800)'
              },
              color_scheme: {
                type: 'string',
                enum: ['modern', 'dark', 'vibrant', 'minimal'],
                description: 'Color scheme for the template: modern (blue/gray), dark (dark theme), vibrant (colorful), minimal (clean grays)'
              },
              spacing: {
                type: 'string',
                enum: ['tight', 'normal', 'loose', 'spacious'],
                description: 'Spacing between elements: tight (10px), normal (20px), loose (40px), spacious (60px)'
              },
              options: {
                type: 'object',
                description: 'Additional options specific to the template type. For card_layout: {cardCount: number}. For navigation_bar: {navItems: string[]}',
                properties: {
                  cardCount: {
                    type: 'number',
                    minimum: 2,
                    maximum: 6,
                    description: 'Number of cards to create (for card_layout template)'
                  },
                  navItems: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Navigation menu items (for navigation_bar template)'
                  }
                }
              }
            },
            required: ['template_type', 'start_x', 'start_y']
          }
        }
      ],
      function_call: 'auto'
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Log the complete OpenAI API response
    console.log('🤖 OpenAI API Response:', {
      model: response.model,
      usage: response.usage,
      responseTime: responseTime,
      choice: response.choices[0],
      message: response.choices[0].message
    });

    // Process the response
    const choice = response.choices[0];
    const message = choice.message;

    let result;
    if (message.function_call) {
      // AI wants to call a function - enhance with smart defaults
      const functionCall = {
        name: message.function_call.name,
        arguments: JSON.parse(message.function_call.arguments)
      };
      
      console.log('🔧 Raw Function Call from AI:', functionCall);
      
      // Apply smart defaults to function call arguments
      const enhancedFunctionCall = applySmartDefaultsToFunctionCall(functionCall, userIntent, smartDefaults, canvasState);
      
      console.log('✨ Enhanced Function Call (after smart defaults):', enhancedFunctionCall);
      
      // Resolve object references (convert descriptions to IDs)
      const resolvedFunctionCall = resolveObjectReferences(enhancedFunctionCall, canvasState);
      
      console.log('🎯 Final Resolved Function Call:', resolvedFunctionCall);
      
      // Check for ambiguities before execution
      const ambiguityAnalysis = detectObjectAmbiguity(resolvedFunctionCall, canvasState);
      
      if (ambiguityAnalysis.hasAmbiguity) {
        // Return clarification prompt instead of executing
        const clarificationPrompt = generateClarificationPrompt(ambiguityAnalysis, canvasState);
        if (clarificationPrompt) {
          return clarificationPrompt;
        }
      }
      
      result = {
        success: true,
        type: 'function_call',
        functionCall: resolvedFunctionCall,
        responseTime: responseTime,
        message: `Executing: ${resolvedFunctionCall.name} with smart defaults and object resolution applied`,
        smartDefaultsApplied: true,
        objectResolutionApplied: true
      };
    } else {
      // AI provided a text response - check if it needs clarification or fallback
      const responseText = message.content.toLowerCase();
      
      // Check if the AI is asking for clarification or if the response is unclear
      if (responseText.includes('which') || responseText.includes('clarify') || 
          responseText.includes('specify') || responseText.includes('ambiguous') ||
          responseText.includes('not sure') || responseText.includes('unclear')) {
        
        // This is likely a clarification request from the AI
        result = {
          success: false,
          type: 'clarification_needed',
          message: message.content,
          responseTime: responseTime
        };
      } else {
        // Regular text response
        result = {
          success: true,
          type: 'message',
          message: message.content,
          responseTime: responseTime
        };
      }
    }

    // Update LangSmith trace with success
    if (trace) {
      try {
        await langsmithClient.updateRun(trace.id, {
          outputs: result,
          metadata: {
            responseTime: responseTime,
            model: 'gpt-4o-mini',
            tokensUsed: response.usage?.total_tokens || 0
          }
        });
      } catch (error) {
        console.warn('LangSmith trace update failed:', error.message);
      }
    }

    return result;

  } catch (error) {
    console.error('AI Agent Error:', error);
    
    // Handle different types of errors
    let errorResult;
    if (error.code === 'insufficient_quota') {
      errorResult = {
        success: false,
        message: 'OpenAI API quota exceeded. Please check your billing.',
        type: 'error'
      };
    } else if (error.code === 'invalid_api_key') {
      errorResult = {
        success: false,
        message: 'Invalid OpenAI API key. Please check your configuration.',
        type: 'error'
      };
    } else if (error.code === 'rate_limit_exceeded') {
      errorResult = {
        success: false,
        message: 'OpenAI API rate limit exceeded. Please try again in a moment.',
        type: 'error'
      };
    } else {
      errorResult = {
        success: false,
        message: 'Failed to process command. Please try again.',
        type: 'error'
      };
    }

    // Update LangSmith trace with error
    if (trace) {
      try {
        await langsmithClient.updateRun(trace.id, {
          outputs: errorResult,
          error: error.message,
          metadata: {
            errorCode: error.code,
            errorType: error.name
          }
        });
      } catch (traceError) {
        console.warn('LangSmith error trace update failed:', traceError.message);
      }
    }

    return errorResult;
  }
}

/**
 * Test the AI Agent connection
 * @returns {Promise<Object>} - Test result
 */
export async function testConnection() {
  if (!openai) {
    return {
      success: false,
      message: 'AI Agent is not available. Please configure your OpenAI API key in the .env file.',
      error: 'OpenAI client not initialized'
    };
  }

  try {
    const response = await processCommand('Hello, can you help me?', {}, 'test-user');
    return {
      success: true,
      message: 'AI Agent connection successful',
      response: response
    };
  } catch (error) {
    return {
      success: false,
      message: 'AI Agent connection failed',
      error: error.message
    };
  }
}

/**
 * Get rate limit status for a user
 * @param {string} userId - User identifier
 * @returns {Object} - Rate limit status
 */
export function getRateLimitStatus(userId) {
  const now = Date.now();
  const userRequests = rateLimitStore.get(userId) || [];
  const recentRequests = userRequests.filter(timestamp => now - timestamp < 60000);
  
  return {
    requestsUsed: recentRequests.length,
    requestsRemaining: Math.max(0, 10 - recentRequests.length),
    resetTime: recentRequests.length > 0 ? Math.ceil((recentRequests[0] + 60000 - now) / 1000) : 0
  };
}

/**
 * Get LangSmith monitoring status
 * @returns {Object} - LangSmith status
 */
export function getLangSmithStatus() {
  return {
    enabled: !!langsmithClient,
    configured: !!import.meta.env.VITE_LANGSMITH_API_KEY,
    project: import.meta.env.VITE_LANGSMITH_PROJECT || 'CollabCanvas-AI-Agent',
    openaiAvailable: !!openai
  };
}

export default {
  processCommand,
  testConnection,
  getRateLimitStatus,
  getLangSmithStatus
};
