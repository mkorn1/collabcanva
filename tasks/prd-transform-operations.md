# PRD: Transform Operations (Resize & Rotate)

## Introduction/Overview

This feature adds resize and rotate capabilities to all canvas objects (Rectangle, Circle, Text) in the CollabCanvas application. Currently, users can only move objects around the canvas, but cannot adjust their size or orientation. This limitation restricts the design capabilities of the collaborative canvas tool.

**Problem:** Users need to resize and rotate objects to create more sophisticated designs, but the current system only supports object movement.

**Goal:** Enable intuitive resize and rotate operations for all canvas objects while maintaining real-time multi-user collaboration and sub-100ms sync performance.

---

## Goals

1. **Universal Transform Support**: Enable resize and rotate operations for Rectangle, Circle, and Text objects
2. **Multi-User Real-Time Sync**: Transform operations sync across all users in real-time with visual feedback
3. **Multi-Object Transforms**: Support transforming multiple selected objects simultaneously
4. **Conflict Resolution**: Handle simultaneous transforms using existing last-write-wins strategy
5. **Performance Compliance**: Maintain sub-100ms sync performance for transform operations
6. **User Experience**: Provide intuitive visual feedback and undo support

---

## User Stories

### Primary User: Design Collaborator
- **As a designer**, I want to resize rectangles and circles by dragging corner handles so I can adjust object dimensions to fit my design needs
- **As a designer**, I want to rotate objects by dragging rotation handles so I can orient them correctly in my composition
- **As a designer**, I want to see other users' transform operations in real-time so I know what they're modifying and can coordinate my work
- **As a designer**, I want to transform multiple selected objects simultaneously so I can adjust groups of objects efficiently
- **As a designer**, I want to maintain aspect ratio while resizing (Shift+drag) so I can preserve object proportions when needed
- **As a designer**, I want to undo transform operations so I can revert unwanted changes
- **As a designer**, I want transform operations to respect minimum size constraints so objects remain usable and visible

### System Requirements
- **As the system**, I must sync transform changes in real-time so collaboration feels instant
- **As the system**, I must handle simultaneous transforms using conflict resolution so state remains consistent
- **As the system**, I must maintain 60 FPS during transform operations so the experience is smooth
- **As the system**, I must provide visual feedback during transforms so users see live updates

---

## Functional Requirements

1. **The system must allow users to resize rectangles by dragging corner handles**
2. **The system must allow users to resize circles by dragging corner handles**
3. **The system must allow users to resize text objects by dragging corner handles**
4. **The system must allow users to rotate all objects by dragging rotation handles**
5. **The system must maintain minimum size constraints to prevent unusable objects**
6. **The system must support Shift+drag to preserve aspect ratio for rectangles**
7. **The system must snap rotation to 15-degree increments for precision**
8. **The system must sync transform operations to all users in real-time**
9. **The system must show transform handles to all users when objects are selected**
10. **The system must provide live visual feedback during transform operations**
11. **The system must support transforming multiple selected objects simultaneously**
12. **The system must handle simultaneous transforms using existing conflict resolution**
13. **The system must include transform operations in the undo/redo functionality**
14. **The system must maintain sub-100ms sync performance for transform operations**
15. **The system must maintain 60 FPS during transform interactions**

---

## Non-Goals (Out of Scope)

### Features Explicitly Excluded
- ❌ Mobile/touch-specific transform gestures
- ❌ Custom transform handle designs (use Konva defaults)
- ❌ Transform animation/transitions
- ❌ Advanced transform constraints (beyond aspect ratio)
- ❌ Transform history beyond undo/redo
- ❌ Keyboard shortcuts for transform operations
- ❌ Transform presets or templates
- ❌ Non-uniform scaling (skew/distort)
- ❌ Custom rotation pivot points
- ❌ Transform operation batching beyond existing debouncing

### Why These Are Out
The focus is on core transform functionality that integrates seamlessly with existing multi-user architecture. Advanced features can be added in future iterations without affecting the core collaboration experience.

---

## Design Considerations

### UI/UX Requirements
- **Transform Handles**: Use Konva's default Transformer handles (corner resize + rotation handle)
- **Visual Feedback**: Blue selection outline + transform handles for selected objects
- **Live Preview**: Real-time visual updates during transform operations
- **Conflict Resolution**: Colored border indication when conflicts occur (following existing pattern)
- **Interaction Patterns**: Transform operations must not interfere with canvas panning

### Integration Points
- **Selection System**: Transform handles appear when objects are selected (existing behavior)
- **Multi-Select**: Transform operations apply to all selected objects (extend existing pattern)
- **Toolbox**: No new tools needed - transforms work with existing selection system
- **Color Picker**: Transform operations don't affect color picker integration

---

## Technical Considerations

### Architecture Integration
- **Existing Patterns**: Follow current `onMultiMove` pattern for `onMultiTransform` implementation
- **Firestore Sync**: Use existing `updateObject` function with transform properties
- **Conflict Resolution**: Extend existing `ConflictResolver` for transform conflicts
- **Debouncing**: Use existing `WriteQueue` for transform operation debouncing (50ms)

### Konva Transformer Configuration
- **Rectangle/Circle**: Full transform support with corner handles and rotation handle
- **Text**: Enhanced existing transformer to include rotation capability
- **Constraints**: Minimum size limits and rotation snap-to-grid functionality

### Data Model Extensions
- **Object Schema**: Add `rotation`, `scaleX`, `scaleY` properties to existing object structure
- **Metadata**: Include transform operation timestamps and user attribution
- **Version Control**: Extend existing version tracking for transform operations

### Performance Requirements
- **Sync Performance**: Maintain sub-100ms sync (same as existing movement operations)
- **Rendering Performance**: Maintain 60 FPS during transform operations
- **Multi-Object Performance**: Same performance characteristics as single object transforms
- **Conflict Resolution**: <50ms visual feedback for transform conflicts

---

## Success Metrics

### Hard Requirements (Must Pass)
- **Transform Functionality**: All objects (Rectangle, Circle, Text) support resize and rotate
- **Real-Time Sync**: Transform operations sync to all users in real-time
- **Multi-Object Support**: Multi-object transforms work with multiple selected objects
- **Performance**: Transform operations maintain sub-100ms sync performance
- **Conflict Resolution**: Transform conflicts resolve using existing last-write-wins strategy
- **Undo Support**: Transform operations are undoable
- **Visual Feedback**: Live transform preview visible to all users
- **Frame Rate**: Transform operations maintain 60 FPS during interaction

### User Experience Metrics
- **Intuitive Interaction**: Transform handles are easy to use and discover
- **Aspect Ratio**: Shift+drag preserves aspect ratio for rectangles
- **Rotation Precision**: Rotation snaps to 15-degree increments
- **Size Constraints**: Minimum size constraints prevent unusable objects
- **Canvas Integration**: Transform operations don't interfere with canvas panning

### Performance Metrics
- **Sync Latency**: <100ms transform operation sync
- **Rendering Performance**: 60 FPS maintained during transforms
- **Multi-Object Performance**: Same performance as single object transforms
- **Conflict Resolution**: <50ms visual feedback for conflicts

---

## Open Questions

1. **Transform Handle Visibility**: Should transform handles be visible to all users or only the user performing the transform?

2. **Transform Operation Granularity**: Should each transform step (during drag) sync in real-time, or only the final result?

3. **Rotation Center**: Should rotation use object center or allow custom rotation pivot points?

4. **Transform Constraints**: Should there be maximum size limits for objects, or only minimum constraints?

5. **Transform History**: Should transform operations be tracked separately from other object changes for more granular undo?

6. **Mobile Compatibility**: Should transform operations work on touch devices, or is desktop-only acceptable?

7. **Transform Performance**: Should transform operations be throttled differently than movement operations?

8. **Conflict Resolution**: Should transform conflicts be handled differently than movement conflicts?

---

## Dependencies

### External Dependencies
- **Konva.js**: Transformer component (already installed and used in Text component)
- **Firebase**: Existing Firestore and RTDB infrastructure
- **React**: Existing component architecture

### Internal Dependencies
- **useCanvas Hook**: Object management and sync functionality
- **Conflict Resolution**: Existing debounce and conflict resolution system
- **Selection System**: Existing multi-select functionality
- **Undo System**: Existing undo/redo infrastructure
- **Real-Time Sync**: Existing Firestore + RTDB sync patterns

### File Dependencies
- `src/components/Canvas/Rectangle.jsx` - Add Transformer component
- `src/components/Canvas/Circle.jsx` - Add Transformer component  
- `src/components/Canvas/Text.jsx` - Enhance existing Transformer
- `src/hooks/useCanvas.js` - Extend for transform operations
- `src/services/firestore.js` - Extend object schema
- `src/utils/debounce.js` - Extend ConflictResolver