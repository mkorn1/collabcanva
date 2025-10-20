# Task List: Layer Management Implementation

## Relevant Files

- `src/hooks/useCanvas.js` - Canvas state management hook (MODIFIED - added layerPosition property)
- `src/hooks/useCanvas.test.js` - Unit tests for useCanvas hook
- `src/services/firestore.js` - Firestore service for object data persistence (MODIFIED - added layerPosition to schema)
- `src/services/firestore.test.js` - Unit tests for firestore service
- `src/services/aiAgent.js` - AI agent service for layer position integration
- `src/services/aiAgent.test.js` - Unit tests for AI agent service
- `src/components/Canvas/Canvas.jsx` - Main canvas component that handles object rendering and sorting (MODIFIED - added layer position sorting)
- `src/components/Canvas/Canvas.test.jsx` - Unit tests for Canvas component
- `src/components/Canvas/ContextMenu.jsx` - Right-click context menu component (CREATED - full context menu with layer position options)
- `src/components/Canvas/ContextMenu.test.jsx` - Unit tests for ContextMenu component
- `src/components/Canvas/Rectangle.jsx` - Rectangle component (MODIFIED - added right-click support)
- `src/components/Canvas/Circle.jsx` - Circle component (MODIFIED - added right-click support)
- `src/components/Canvas/Text.jsx` - Text component (MODIFIED - added right-click support)
- `src/components/Canvas/LayerPositionDialog.jsx` - Layer position input dialog component (CREATED - complete dialog with validation and keyboard support)
- `src/components/Canvas/LayerPositionDialog.test.jsx` - Unit tests for LayerPositionDialog component
- `src/utils/canvasHelpers.js` - Canvas utility functions for layer position sorting (MODIFIED - added sorting functions)
- `src/utils/canvasHelpers.test.js` - Unit tests for canvas helpers

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.jsx` and `MyComponent.test.jsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [x] 1.0 Implement Core Layer Position Data Structure
  - [x] 1.1 Add `layerPosition` property to object model in `useCanvas.js` hook
  - [x] 1.2 Set default `layerPosition` value to 0 for all new objects
  - [x] 1.3 Update object creation functions to include `layerPosition` parameter
  - [x] 1.4 Add `layerPosition` to object validation and type checking
  - [x] 1.5 Update Firestore schema to persist `layerPosition` property
  - [x] 1.6 Add backward compatibility for existing objects without `layerPosition`

- [x] 2.0 Add Layer Position Rendering and Sorting Logic
  - [x] 2.1 Create `sortObjectsByLayerPosition` utility function in `canvasHelpers.js`
  - [x] 2.2 Update Canvas component to sort objects by `layerPosition` before rendering
  - [x] 2.3 Implement real-time layer position updates in rendering pipeline
  - [x] 2.4 Add performance optimization for layer position sorting
  - [x] 2.5 Test rendering order consistency across different layer positions

- [x] 3.0 Create Right-Click Context Menu for Layer Position Editing
  - [x] 3.1 Create `ContextMenu.jsx` component for right-click interactions
  - [x] 3.2 Add "Layer Position" option to context menu items
  - [x] 3.3 Implement context menu positioning and visibility logic
  - [x] 3.4 Add keyboard navigation support for context menu
  - [x] 3.5 Integrate context menu with Canvas component event handling
  - [x] 3.6 Add accessibility features (ARIA labels, keyboard support)

- [x] 4.0 Implement Layer Position Input Dialog
  - [x] 4.1 Create `LayerPositionDialog.jsx` component for number input
  - [x] 4.2 Implement input validation for positive integers only
  - [x] 4.3 Add error handling and user feedback for invalid inputs
  - [x] 4.4 Create modal overlay and positioning logic
  - [x] 4.5 Add keyboard shortcuts (Enter to confirm, Escape to cancel)
  - [x] 4.6 Implement dialog state management and cleanup
  - [x] 4.7 Connect dialog to context menu and object update logic

- [x] 5.0 Integrate Layer Position with AI Agent Functions
  - [x] 5.1 Add `layerPosition` parameter to AI agent object creation functions
  - [x] 5.2 Create `setLayerPosition` transformation function for AI agents
  - [x] 5.3 Update AI agent function definitions to include layer position options
  - [ ] 5.4 Implement smart layer position assignment for complex layouts
  - [ ] 5.5 Add layer position context to AI agent prompts and responses
  - [ ] 5.6 Test AI agent layer position functionality with various scenarios
