import OpenAI from 'openai';
import { Client } from 'langsmith';

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

// System prompt template
const SYSTEM_PROMPT = `You are an AI assistant that helps users manipulate a collaborative canvas through natural language commands.

Your role:
- Understand user commands for canvas manipulation
- Convert natural language to structured function calls
- Provide helpful responses and suggestions
- Handle errors gracefully

Available canvas operations:
1. create_shape(type, x, y, width, height, fill, text_content?) - Create rectangles, circles, or text elements
2. modify_shape(id, updates) - Change properties of existing shapes
3. delete_shape(id) - Remove shapes from the canvas
4. arrange_shapes(ids, layout, options?) - Organize multiple shapes (row, column, grid, distribute_h, distribute_v)

Guidelines:
- Be concise but helpful in responses
- Ask for clarification when commands are ambiguous
- Suggest alternatives when operations aren't possible
- When you generate a function call, provide a clear summary of what will be executed
- Do NOT ask for confirmation - the system will show a preview automatically
- If a user says "yes", "no", "approve", "reject", etc., treat it as a new command (the system handles preview approval separately)
- For circles: if user specifies radius, convert to width/height (diameter = radius * 2)
- For colors: accept both color names (green, blue, red) and hex codes (#00FF00)
- If information is missing, make reasonable assumptions (default size, position, etc.)

Important: When you want to execute a canvas operation, call the appropriate function immediately. The system will show a preview to the user automatically. Do not ask "Shall I proceed?" or similar confirmation questions.

Current canvas state will be provided with each request.`;

/**
 * Rate limiting: 4 commands per minute per user
 * @param {string} userId - User identifier
 * @returns {boolean} - Whether request is allowed
 */
function checkRateLimit(userId) {
  const now = Date.now();
  const userRequests = rateLimitStore.get(userId) || [];
  
  // Remove requests older than 1 minute
  const recentRequests = userRequests.filter(timestamp => now - timestamp < 60000);
  
  if (recentRequests.length >= 4) {
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

    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: `Canvas State: ${JSON.stringify(canvasState)}\n\nUser Command: ${command}`
      }
    ];

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.1, // Low temperature for consistent responses
      max_tokens: 1000,
      functions: [
        {
          name: 'create_shape',
          description: 'Create a new shape on the canvas',
          parameters: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['rectangle', 'circle', 'text'],
                description: 'Type of shape to create'
              },
              x: {
                type: 'number',
                description: 'X position on canvas'
              },
              y: {
                type: 'number',
                description: 'Y position on canvas'
              },
              width: {
                type: 'number',
                description: 'Width of the shape'
              },
              height: {
                type: 'number',
                description: 'Height of the shape'
              },
              fill: {
                type: 'string',
                description: 'Fill color of the shape (hex code or color name)'
              },
              text_content: {
                type: 'string',
                description: 'Text content (only for text shapes)'
              }
            },
            required: ['type', 'x', 'y', 'width', 'height', 'fill']
          }
        },
        {
          name: 'modify_shape',
          description: 'Modify properties of an existing shape',
          parameters: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'ID of the shape to modify'
              },
              updates: {
                type: 'object',
                description: 'Properties to update',
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                  width: { type: 'number' },
                  height: { type: 'number' },
                  fill: { type: 'string' },
                  stroke: { type: 'string' },
                  strokeWidth: { type: 'number' },
                  opacity: { type: 'number' },
                  rotation: { type: 'number' },
                  text_content: { type: 'string' },
                  fontSize: { type: 'number' },
                  fontFamily: { type: 'string' }
                }
              }
            },
            required: ['id', 'updates']
          }
        },
        {
          name: 'delete_shape',
          description: 'Delete a shape from the canvas',
          parameters: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'ID of the shape to delete'
              }
            },
            required: ['id']
          }
        },
        {
          name: 'arrange_shapes',
          description: 'Arrange multiple shapes (align, distribute, etc.)',
          parameters: {
            type: 'object',
            properties: {
              ids: {
                type: 'array',
                items: { type: 'string' },
                description: 'IDs of shapes to arrange'
              },
              layout: {
                type: 'string',
                enum: ['row', 'column', 'grid', 'distribute_h', 'distribute_v'],
                description: 'Type of layout arrangement'
              },
              options: {
                type: 'object',
                description: 'Additional options for the layout',
                properties: {
                  spacing: { type: 'number' },
                  columns: { type: 'number' },
                  startX: { type: 'number' },
                  startY: { type: 'number' }
                }
              }
            },
            required: ['ids', 'layout']
          }
        }
      ],
      function_call: 'auto'
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Process the response
    const choice = response.choices[0];
    const message = choice.message;

    let result;
    if (message.function_call) {
      // AI wants to call a function
      result = {
        success: true,
        type: 'function_call',
        functionCall: {
          name: message.function_call.name,
          arguments: JSON.parse(message.function_call.arguments)
        },
        responseTime: responseTime,
        message: `Executing: ${message.function_call.name}`
      };
    } else {
      // AI provided a text response
      result = {
        success: true,
        type: 'message',
        message: message.content,
        responseTime: responseTime
      };
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
    requestsRemaining: Math.max(0, 4 - recentRequests.length),
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
