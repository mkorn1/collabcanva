# Tasks for AI Canvas Agent Feature

Based on: `prd-ai-canvas-agent.md`

## Relevant Files

- `src/components/AI/AIAgentPanel.jsx` - Main AI chat interface component
- `src/components/AI/AIAgentPanel.css` - Styling for AI panel
- `src/services/aiAgent.js` - OpenAI API integration and command processing
- `src/services/commandExecutor.js` - Executes AI function calls on canvas
- `src/services/langsmith.js` - Optional monitoring and analytics
- `src/hooks/useCanvas.js` - Canvas state management (existing, needs audit)
- `src/hooks/useCanvasTools.js` - Canvas manipulation functions (existing, needs audit)
- `src/__tests__/integration/aiAgent.test.js` - Integration tests for AI commands
- `src/__tests__/services/aiAgent.test.js` - Unit tests for AI service
- `src/__tests__/services/commandExecutor.test.js` - Unit tests for command executor

### Notes

- Unit tests should be placed alongside the code files they are testing
- Use `npx jest [optional/path/to/test/file]` to run tests
- Existing canvas functions need to be audited to understand exact signatures
- OpenAI API key required: `REACT_APP_OPENAI_API_KEY`

## Tasks

- [x] 1.0 AI Agent Panel UI Component
  - [x] 1.1 Create AI directory structure (`src/components/AI/`)
  - [x] 1.2 Build AIAgentPanel.jsx component with basic structure
  - [x] 1.3 Implement floating panel positioning (bottom-right, 400px × 600px)
  - [x] 1.4 Add minimize/maximize functionality with toggle button
  - [x] 1.5 Create message list container with scrollable area
  - [x] 1.6 Implement text input field with multiline support
  - [x] 1.7 Add send button and Enter/Shift+Enter keyboard handling
  - [x] 1.8 Style message bubbles (user messages right-aligned, AI messages left-aligned)
  - [x] 1.9 Add loading indicator component for API processing
  - [x] 1.10 Implement keyboard shortcut (Cmd+K) to open/close panel
  - [x] 1.11 Create AIAgentPanel.css with responsive styling
  - [x] 1.12 Add error message styling for system messages

- [x] 2.0 Infrastructure Setup and OpenAI Integration
  - [x] 2.1 Install OpenAI package (`npm install openai`)
  - [x] 2.2 Create OpenAI dashboard account and get API key
  - [x] 2.3 Set up environment variable `REACT_APP_OPENAI_API_KEY`
  - [x] 2.4 Create `src/services/aiAgent.js` service file
  - [x] 2.5 Implement basic OpenAI client initialization
  - [x] 2.6 Create `processCommand` function with basic API call
  - [x] 2.7 Add error handling for network failures and API errors
  - [x] 2.8 Implement rate limiting (4 commands per minute per user)
  - [x] 2.9 Add performance monitoring (timestamps for response time)
  - [x] 2.10 Create basic system prompt template
  - [x] 2.11 Test OpenAI integration with simple chat messages
  - [x] 2.12 Add LangSmith integration (optional monitoring)

- [ ] 3.0 Canvas Function Audit and Command Executor
  - [x] 3.1 Audit existing canvas functions in `useCanvas.js`
  - [x] 3.2 Document function signatures for createObject, updateObject, deleteObject
  - [x] 3.3 Audit canvas manipulation functions in `useCanvasTools.js`
  - [x] 3.4 Document object properties and constraints (position, size, styling)
  - [x] 3.5 Create `src/services/commandExecutor.js` file
  - [x] 3.6 Implement `executeCommands` function with function call mapping
  - [x] 3.7 Create `create_shape` execution logic
  - [x] 3.8 Create `modify_shape` execution logic
  - [x] 3.9 Create `delete_shape` execution logic
  - [x] 3.10 Implement object resolution logic (find objects by description)
  - [x] 3.11 Add selected object handling (use selected objects when not specified)
  - [x] 3.12 Create preview overlay UI component for command execution
  - [x] 3.13 Implement approve/reject functionality for preview mode
  - [x] 3.14 Add error handling for partial command failures

- [ ] 4.0 Command Processing and Function Schema
  - [ ] 4.1 Define OpenAI function schema for 4 core functions
  - [ ] 4.2 Enhance system prompt with canvas state context
  - [ ] 4.3 Add examples for all command categories (creation, manipulation, layout, complex)
  - [ ] 4.4 Implement canvas state serialization (objects, dimensions, selected objects)
  - [ ] 4.5 Create smart defaults for colors, sizes, and positioning
  - [ ] 4.6 Implement `arrange_shapes` execution logic
  - [ ] 4.7 Add complex layout templates (login form, card layout, navigation bar)
  - [ ] 4.8 Implement multi-step command execution (array of function calls)
  - [ ] 4.9 Add object reference resolution ("the blue rectangle" → object ID)
  - [ ] 4.10 Create relative positioning logic ("next to", "below", "center")
  - [ ] 4.11 Implement layout algorithms (row, column, grid, distribute)
  - [ ] 4.12 Add ambiguity handling and clarification prompts
  - [ ] 4.13 Optimize system prompt for token efficiency

- [ ] 5.0 Testing and Performance Optimization
  - [ ] 5.1 Create integration test suite (`src/__tests__/integration/aiAgent.test.js`)
  - [ ] 5.2 Test all 8+ command types (3 creation, 3 manipulation, 2 layout, 2 complex)
  - [ ] 5.3 Create unit tests for AI service (`src/__tests__/services/aiAgent.test.js`)
  - [ ] 5.4 Create unit tests for command executor (`src/__tests__/services/commandExecutor.test.js`)
  - [ ] 5.5 Implement performance measurement (response time <2 seconds)
  - [ ] 5.6 Test multiplayer scenarios (simultaneous AI commands)
  - [ ] 5.7 Verify real-time sync of AI operations across users
  - [ ] 5.8 Test error handling and recovery scenarios
  - [ ] 5.9 Measure accuracy rate (target 90%+ success rate)
  - [ ] 5.10 Test with large canvas state (100+ objects)
  - [ ] 5.11 Optimize system prompt for speed vs accuracy balance
  - [ ] 5.12 Add comprehensive error logging and monitoring
