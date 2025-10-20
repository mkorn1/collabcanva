# Task List: Layer Management Implementation

## Relevant Files

- `src/components/Canvas/Canvas.jsx` - Main canvas component that handles object rendering and sorting
- `src/components/Canvas/Canvas.test.jsx` - Unit tests for Canvas component
- `src/hooks/useCanvas.js` - Canvas state management hook
- `src/hooks/useCanvas.test.js` - Unit tests for useCanvas hook
- `src/services/firestore.js` - Firestore service for object data persistence
- `src/services/firestore.test.js` - Unit tests for firestore service
- `src/services/aiAgent.js` - AI agent service for layer position integration
- `src/services/aiAgent.test.js` - Unit tests for AI agent service
- `src/components/Canvas/ContextMenu.jsx` - Right-click context menu component (to be created)
- `src/components/Canvas/ContextMenu.test.jsx` - Unit tests for ContextMenu component
- `src/components/Canvas/LayerPositionDialog.jsx` - Layer position input dialog component (to be created)
- `src/components/Canvas/LayerPositionDialog.test.jsx` - Unit tests for LayerPositionDialog component
- `src/utils/canvasHelpers.js` - Canvas utility functions for layer position sorting
- `src/utils/canvasHelpers.test.js` - Unit tests for canvas helpers

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.jsx` and `MyComponent.test.jsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [ ] 1.0 Implement Core Layer Position Data Structure
- [ ] 2.0 Add Layer Position Rendering and Sorting Logic
- [ ] 3.0 Create Right-Click Context Menu for Layer Position Editing
- [ ] 4.0 Implement Layer Position Input Dialog
- [ ] 5.0 Integrate Layer Position with AI Agent Functions
