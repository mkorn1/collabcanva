# Canvas Functions Audit - useCanvas.js

## Overview
This document provides a comprehensive audit of the canvas functions available in `useCanvas.js` for AI Agent integration.

## Core Object Management Functions

### 1. `addObject(newObject)`
**Purpose**: Creates a new object on the canvas
**Parameters**:
- `newObject` (Object): Object to create with properties:
  - `type`: 'rectangle' | 'circle' | 'text'
  - `x`, `y`: Position coordinates
  - `width`, `height`: Dimensions
  - `fill`: Color (string)
  - `stroke`: Border color (string)
  - `strokeWidth`: Border width (number)
  - `opacity`: Transparency (0-1)
  - `text`: Text content (for text objects)
  - `fontSize`: Font size (for text objects)
  - `fontFamily`: Font family (for text objects)
  - `rotation`: Rotation angle in degrees

**Returns**: `Promise<string>` - Object ID
**Firestore Integration**: Yes - saves to Firestore with real-time sync
**AI Agent Usage**: Primary function for `create_shape` command

### 2. `updateObject(objectId, updates, options = {})`
**Purpose**: Updates an existing object's properties
**Parameters**:
- `objectId` (string): ID of object to update
- `updates` (Object): Properties to update (partial object)
- `options` (Object): Additional options

**Returns**: `Promise<void>`
**Firestore Integration**: Yes - with conflict resolution and debouncing
**AI Agent Usage**: Primary function for `modify_shape` command

**Update Types**:
- **Position**: `{ x: number, y: number }`
- **Size**: `{ width: number, height: number }` (rectangles), `{ width: number, height: number }` (circles)
- **Styling**: `{ fill: string, stroke: string, strokeWidth: number, opacity: number }`
- **Text**: `{ text: string, fontSize: number, fontFamily: string }`
- **Rotation**: `{ rotation: number }`

### 3. `removeObject(objectId)`
**Purpose**: Deletes an object from the canvas
**Parameters**:
- `objectId` (string): ID of object to delete

**Returns**: `Promise<void>`
**Firestore Integration**: Yes - with immediate propagation and conflict resolution
**AI Agent Usage**: Primary function for `delete_shape` command

## Selection Management Functions

### 4. `selectObject(objectId, multiSelect = false)`
**Purpose**: Selects one or more objects
**Parameters**:
- `objectId` (string): ID of object to select
- `multiSelect` (boolean): Whether to add to existing selection

**Returns**: `void`
**AI Agent Usage**: For selecting objects before manipulation

### 5. `deselectObject(objectId = null)`
**Purpose**: Deselects objects
**Parameters**:
- `objectId` (string, optional): Specific object to deselect, or null to deselect all

**Returns**: `void`
**AI Agent Usage**: For clearing selection after operations

### 6. `selectAll()`
**Purpose**: Selects all objects on the canvas
**Returns**: `void`
**AI Agent Usage**: For bulk operations

### 7. `getSelectedObjects()`
**Purpose**: Returns array of currently selected objects
**Returns**: `Array<Object>` - Array of selected object objects
**AI Agent Usage**: For getting selected objects for manipulation

### 8. `isObjectSelected(objectId)`
**Purpose**: Checks if an object is selected
**Parameters**:
- `objectId` (string): ID of object to check
**Returns**: `boolean`
**AI Agent Usage**: For checking selection state

## Shape Creation Functions

### 9. `startCreatingShape(shapeType, startPoint, options = {})`
**Purpose**: Starts creating a new shape
**Parameters**:
- `shapeType` (string): 'rectangle' | 'circle' | 'text'
- `startPoint` (Object): `{ x: number, y: number }` - Starting position
- `options` (Object): `{ userColor: string }` - Creation options

**Returns**: `string | void` - Object ID for text, void for others
**AI Agent Usage**: For programmatic shape creation

### 10. `updateCreatingShape(currentPoint)`
**Purpose**: Updates shape during creation (for rectangles and circles)
**Parameters**:
- `currentPoint` (Object): `{ x: number, y: number }` - Current mouse position

**Returns**: `void`
**AI Agent Usage**: For interactive shape creation

### 11. `finishCreatingShape(options = {})`
**Purpose**: Finalizes shape creation
**Parameters**:
- `options` (Object): `{ userColor: string, userId: string }`

**Returns**: `string | null` - Object ID or null
**AI Agent Usage**: For completing shape creation

### 12. `cancelCreatingShape()`
**Purpose**: Cancels ongoing shape creation
**Returns**: `void`
**AI Agent Usage**: For canceling creation operations

## Object Properties and Constraints

### Rectangle Objects
```javascript
{
  id: string,
  type: 'rectangle',
  x: number,           // Top-left X coordinate
  y: number,           // Top-left Y coordinate
  width: number,       // Width in pixels
  height: number,      // Height in pixels
  fill: string,        // Fill color (hex, rgb, named)
  stroke: string,      // Border color
  strokeWidth: number, // Border width
  opacity: number,     // 0-1 transparency
  rotation: number,    // Rotation in degrees
  createdBy: string,   // User ID who created it
  createdAt: number,   // Timestamp
  updatedAt: number    // Last update timestamp
}
```

### Circle Objects
```javascript
{
  id: string,
  type: 'circle',
  x: number,           // Center X coordinate
  y: number,           // Center Y coordinate
  width: number,       // Diameter (width)
  height: number,      // Diameter (height) - same as width
  fill: string,        // Fill color
  stroke: string,      // Border color
  strokeWidth: number, // Border width
  opacity: number,     // 0-1 transparency
  rotation: number,    // Rotation in degrees
  createdBy: string,   // User ID who created it
  createdAt: number,   // Timestamp
  updatedAt: number    // Last update timestamp
}
```

### Text Objects
```javascript
{
  id: string,
  type: 'text',
  x: number,           // Left X coordinate
  y: number,           // Top Y coordinate
  text: string,        // Text content
  fontSize: number,    // Font size in pixels
  fontFamily: string,  // Font family name
  fill: string,        // Text color
  stroke: string,      // Text outline color
  strokeWidth: number, // Text outline width
  opacity: number,     // 0-1 transparency
  rotation: number,    // Rotation in degrees
  createdBy: string,   // User ID who created it
  createdAt: number,   // Timestamp
  updatedAt: number    // Last update timestamp
}
```

## Coordinate System

### Canvas Coordinates
- **Origin**: Top-left corner (0, 0)
- **Units**: Pixels
- **X-axis**: Left to right (increasing)
- **Y-axis**: Top to bottom (increasing)

### Coordinate Conversion Functions
- `screenToCanvas(screenPoint, stageRef)`: Converts screen coordinates to canvas coordinates
- `canvasToScreen(canvasPoint, stageRef)`: Converts canvas coordinates to screen coordinates

## Viewport Management

### 13. `updateZoom(newZoom, pointer = null)`
**Purpose**: Updates canvas zoom level
**Parameters**:
- `newZoom` (number): New zoom level
- `pointer` (Object, optional): `{ x: number, y: number }` - Zoom center point

**Returns**: `void`
**AI Agent Usage**: For zoom operations

### 14. `updatePanPosition(position)`
**Purpose**: Updates canvas pan position
**Parameters**:
- `position` (Object): `{ x: number, y: number }` - New pan position

**Returns**: `void`
**AI Agent Usage**: For pan operations

### 15. `resetViewport()`
**Purpose**: Resets zoom and pan to default values
**Returns**: `void`
**AI Agent Usage**: For resetting view

## State Access

### Canvas State
- `objects`: Array of all canvas objects
- `selectedObjectIds`: Array of selected object IDs
- `zoom`: Current zoom level
- `panPosition`: Current pan position
- `isDragging`: Whether canvas is being dragged
- `isCreating`: Whether a shape is being created

### Sync State
- `isLoading`: Whether canvas is loading
- `syncError`: Any sync error message

## AI Agent Integration Notes

### Function Call Mapping
1. **`create_shape`** → `addObject(newObject)`
2. **`modify_shape`** → `updateObject(objectId, updates)`
3. **`delete_shape`** → `removeObject(objectId)`
4. **`arrange_shapes`** → Multiple `updateObject` calls with calculated positions

### Object Resolution
- Objects can be found by ID using `objects.find(obj => obj.id === objectId)`
- Objects can be found by properties using `objects.filter(obj => obj.property === value)`
- Selected objects available via `getSelectedObjects()`

### Conflict Resolution
- Uses "last-write-wins" strategy
- Optimistic updates for immediate UI feedback
- Firestore real-time sync with conflict resolution
- Deletion conflict resolution with user warnings

### Performance Considerations
- Write queue with debouncing for rapid updates
- Different update strategies for different operations:
  - Rotation: Immediate sync
  - Resize: Debounced sync (200ms)
  - Other: Debounced sync (200ms)

## Error Handling
- All functions include try-catch blocks
- Fallback to local state if Firestore fails
- Error messages stored in `syncError` state
- Optimistic updates rolled back on error

## Dependencies
- Firestore for persistence
- Real-time database for live updates
- Conflict resolution utilities
- Canvas helper functions for coordinate conversion
