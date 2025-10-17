# Task List: Transform Operations (Resize & Rotate)

Based on the PRD: `prd-transform-operations.md`

## Relevant Files

- `src/components/Canvas/Rectangle.jsx` - Add Konva Transformer component for resize and rotate functionality
- `src/components/Canvas/Circle.jsx` - Add Konva Transformer component for resize and rotate functionality  
- `src/components/Canvas/Text.jsx` - Enhance existing Transformer to include rotation capability
- `src/hooks/useCanvas.js` - Extend canvas hook to handle transform operations and multi-object transforms
- `src/services/firestore.js` - Extend object schema to include rotation, scaleX, scaleY properties
- `src/utils/debounce.js` - Extend ConflictResolver to handle transform operation conflicts
- `src/components/Canvas/Canvas.jsx` - Add handleMultiObjectTransform function following existing patterns

### Notes

- Transform operations will follow existing `onMultiMove` pattern for consistency
- All transform operations must maintain sub-100ms sync performance
- Transform handles will be visible to all users for real-time collaboration
- Existing conflict resolution and debouncing patterns will be extended for transforms

## Tasks

- [x] 1.0 Extend Object Data Model for Transform Properties
  - [x] 1.1 Add rotation, scaleX, scaleY properties to object schema in firestore.js
  - [x] 1.2 Update createObject function to include default transform values (rotation: 0, scaleX: 1, scaleY: 1)
  - [x] 1.3 Update updateObject function to handle transform property updates with metadata
  - [x] 1.4 Add transform metadata fields (lastTransformBy, lastTransformByName, lastTransformAt) to object schema
  - [x] 1.5 Update object type definitions to include new transform properties

- [x] 2.0 Implement Konva Transformer Integration
  - [x] 2.1 Add Konva Transformer import and setup to Rectangle.jsx component
  - [x] 2.2 Configure Transformer for Rectangle with corner handles and rotation handle
  - [x] 2.3 Add transform event handlers (onTransformEnd) to Rectangle component
  - [x] 2.4 Add Konva Transformer import and setup to Circle.jsx component
  - [x] 2.5 Configure Transformer for Circle with corner handles and rotation handle
  - [x] 2.6 Add transform event handlers (onTransformEnd) to Circle component
  - [x] 2.7 Enhance existing Transformer in Text.jsx to enable rotation handle
  - [x] 2.8 Update Text component transform handlers to include rotation support
  - [x] 2.9 Add minimum size constraints to all Transformer configurations
  - [x] 2.10 Implement rotation snap-to-grid (15-degree increments) for all components

- [ ] 3.0 Add Multi-Object Transform Operations
  - [ ] 3.1 Create handleMultiObjectTransform function in Canvas.jsx following onMultiMove pattern
  - [ ] 3.2 Add onMultiTransform prop to Rectangle, Circle, and Text components
  - [ ] 3.3 Implement coordinated transform operations for multiple selected objects
  - [ ] 3.4 Add transform operation debouncing using existing WriteQueue (50ms)
  - [ ] 3.5 Implement optimistic updates for real-time transform feedback
  - [ ] 3.6 Add transform operation batching for multi-object operations
  - [ ] 3.7 Ensure transform operations work with existing multi-select system

- [ ] 4.0 Implement Transform Conflict Resolution
  - [ ] 4.1 Extend ConflictResolver in debounce.js to handle transform conflicts
  - [ ] 4.2 Add transform conflict detection logic for simultaneous operations
  - [ ] 4.3 Implement transform operation timestamp comparison for last-write-wins
  - [ ] 4.4 Add transform conflict visual feedback (colored border indication)
  - [ ] 4.5 Handle transform vs move conflicts using existing conflict resolution
  - [ ] 4.6 Handle transform vs delete conflicts with proper cleanup
  - [ ] 4.7 Add transform operation rollback on conflict resolution failure

- [ ] 5.0 Add Transform Visual Feedback and UX Enhancements
  - [ ] 5.1 Add "last transformed by" tooltip to all shape components
  - [ ] 5.2 Implement live transform preview visible to all users
  - [ ] 5.3 Add transform state visual indicators (resizing vs rotating)
  - [ ] 5.4 Implement Shift+drag aspect ratio preservation for rectangles
  - [ ] 5.5 Add transform operation integration with existing undo system
  - [ ] 5.6 Ensure transform handles are visible to all users when objects are selected
  - [ ] 5.7 Add transform operation performance monitoring (60 FPS requirement)
  - [ ] 5.8 Test transform operations don't interfere with canvas panning
