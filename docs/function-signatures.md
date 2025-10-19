# Function Signatures for AI Agent Command Executor

## Overview
This document provides detailed function signatures for the core canvas operations that the AI Agent will use to execute commands.

## Core Canvas Functions

### 1. `addObject(newObject)`
**Purpose**: Creates a new object on the canvas
**Source**: `useCanvas.js` → `addObject` function
**AI Command**: `create_shape`

#### Signature
```javascript
async function addObject(newObject) → Promise<string>
```

#### Parameters
```javascript
newObject: {
  type: 'rectangle' | 'circle' | 'text',    // Required: Object type
  x: number,                                 // Required: X coordinate
  y: number,                                 // Required: Y coordinate
  width: number,                             // Required: Width in pixels
  height: number,                            // Required: Height in pixels
  fill: string,                              // Required: Fill color (hex, rgb, named)
  stroke?: string,                           // Optional: Border color
  strokeWidth?: number,                     // Optional: Border width (default: 2)
  opacity?: number,                          // Optional: Transparency 0-1 (default: 1)
  rotation?: number,                         // Optional: Rotation in degrees (default: 0)
  
  // Text-specific properties
  text?: string,                             // Optional: Text content (for text objects)
  fontSize?: number,                        // Optional: Font size (for text objects)
  fontFamily?: string,                      // Optional: Font family (for text objects)
  
  // Metadata (auto-generated)
  id?: string,                              // Auto-generated if not provided
  createdBy?: string,                       // Auto-set from user context
  createdAt?: number,                       // Auto-set timestamp
  updatedAt?: number                        // Auto-set timestamp
}
```

#### Returns
- `Promise<string>` - Object ID of the created object

#### Example Usage
```javascript
// Create a red rectangle
const rectangleId = await addObject({
  type: 'rectangle',
  x: 100,
  y: 100,
  width: 200,
  height: 150,
  fill: 'red',
  stroke: 'darkred',
  strokeWidth: 2
});

// Create a blue circle
const circleId = await addObject({
  type: 'circle',
  x: 300,
  y: 200,
  width: 100,  // diameter
  height: 100, // diameter
  fill: 'blue'
});

// Create text
const textId = await addObject({
  type: 'text',
  x: 50,
  y: 50,
  width: 200,
  height: 30,
  fill: 'black',
  text: 'Hello World',
  fontSize: 16,
  fontFamily: 'Arial'
});
```

#### Error Handling
- Throws error if `canvasId` is not available
- Falls back to local-only mode if Firestore fails
- Sets `syncError` state on failure

---

### 2. `updateObject(objectId, updates, options = {})`
**Purpose**: Updates an existing object's properties
**Source**: `useCanvas.js` → `updateObject` function
**AI Command**: `modify_shape`

#### Signature
```javascript
async function updateObject(objectId, updates, options = {}) → Promise<void>
```

#### Parameters
```javascript
objectId: string,                           // Required: ID of object to update

updates: {
  // Position updates
  x?: number,                               // New X coordinate
  y?: number,                               // New Y coordinate
  
  // Size updates
  width?: number,                           // New width
  height?: number,                          // New height
  
  // Styling updates
  fill?: string,                            // New fill color
  stroke?: string,                          // New border color
  strokeWidth?: number,                    // New border width
  opacity?: number,                         // New opacity (0-1)
  rotation?: number,                       // New rotation in degrees
  
  // Text-specific updates
  text?: string,                           // New text content
  fontSize?: number,                      // New font size
  fontFamily?: string,                    // New font family
  
  // Metadata (auto-updated)
  updatedAt?: number,                      // Auto-set timestamp
  lastModifiedBy?: string,                // Auto-set from user context
  lastModifiedByName?: string             // Auto-set from user context
}

options: {
  // Additional options for update behavior
  immediate?: boolean,                     // Skip debouncing for immediate sync
  skipConflictCheck?: boolean             // Skip deletion conflict check
}
```

#### Returns
- `Promise<void>`

#### Update Behavior
- **Optimistic Updates**: Local state updated immediately for UI responsiveness
- **Debounced Sync**: Non-critical updates are debounced (200ms) to prevent rapid Firestore writes
- **Immediate Sync**: Rotation operations sync immediately
- **Conflict Resolution**: Uses "last-write-wins" strategy with floating-point tolerance

#### Example Usage
```javascript
// Move object to new position
await updateObject('rect_123', {
  x: 200,
  y: 150
});

// Change object color and size
await updateObject('circle_456', {
  fill: 'green',
  width: 150,
  height: 150
});

// Update text content and styling
await updateObject('text_789', {
  text: 'Updated text',
  fontSize: 20,
  fill: 'blue'
});

// Rotate object (immediate sync)
await updateObject('rect_123', {
  rotation: 45
});
```

#### Error Handling
- Rolls back optimistic updates on failure
- Sets `syncError` state on Firestore failure
- Continues with local updates if Firestore unavailable

---

### 3. `removeObject(objectId)`
**Purpose**: Deletes an object from the canvas
**Source**: `useCanvas.js` → `removeObject` function
**AI Command**: `delete_shape`

#### Signature
```javascript
async function removeObject(objectId) → Promise<void>
```

#### Parameters
```javascript
objectId: string                            // Required: ID of object to delete
```

#### Returns
- `Promise<void>`

#### Deletion Process
1. **Optimistic Deletion**: Object removed from local state immediately
2. **Live Broadcast**: Deletion broadcast via RTDB for other users
3. **Firestore Deletion**: Object deleted from Firestore
4. **Selection Cleanup**: Object removed from selection if selected
5. **Rollback**: Object restored if any step fails

#### Example Usage
```javascript
// Delete a specific object
await removeObject('rect_123');

// Delete multiple objects (call for each)
await removeObject('circle_456');
await removeObject('text_789');
```

#### Error Handling
- Rolls back deletion on failure
- Restores object to local state
- Restores selection if object was selected
- Sets `syncError` state on failure

---

## Selection Management Functions

### 4. `getSelectedObjects()`
**Purpose**: Returns array of currently selected objects
**Source**: `useCanvas.js` → `getSelectedObjects` function
**AI Usage**: For operations on selected objects

#### Signature
```javascript
function getSelectedObjects() → Array<Object>
```

#### Returns
- `Array<Object>` - Array of selected object objects with full properties

#### Example Usage
```javascript
const selectedObjects = getSelectedObjects();
console.log(`Found ${selectedObjects.length} selected objects`);

// Use selected objects for AI operations
selectedObjects.forEach(obj => {
  console.log(`Selected: ${obj.type} at (${obj.x}, ${obj.y})`);
});
```

---

### 5. `selectObject(objectId, multiSelect = false)`
**Purpose**: Selects one or more objects
**Source**: `useCanvas.js` → `selectObject` function
**AI Usage**: For selecting objects before manipulation

#### Signature
```javascript
function selectObject(objectId, multiSelect = false) → void
```

#### Parameters
```javascript
objectId: string,                           // Required: ID of object to select
multiSelect: boolean = false                // Optional: Add to existing selection
```

#### Example Usage
```javascript
// Select single object
selectObject('rect_123');

// Add to selection
selectObject('circle_456', true);

// Select multiple objects
selectObject('rect_123');
selectObject('circle_456', true);
selectObject('text_789', true);
```

---

### 6. `deselectObject(objectId = null)`
**Purpose**: Deselects objects
**Source**: `useCanvas.js` → `deselectObject` function
**AI Usage**: For clearing selection after operations

#### Signature
```javascript
function deselectObject(objectId = null) → void
```

#### Parameters
```javascript
objectId: string | null = null              // Optional: Specific object to deselect
```

#### Example Usage
```javascript
// Deselect all objects
deselectObject();

// Deselect specific object
deselectObject('rect_123');
```

---

## Object Resolution Functions

### 7. `findObjectById(objectId)`
**Purpose**: Finds an object by its ID
**Source**: `useCanvas.js` → `objects.find()`
**AI Usage**: For object resolution in commands

#### Signature
```javascript
function findObjectById(objectId) → Object | undefined
```

#### Parameters
```javascript
objectId: string                            // Required: ID of object to find
```

#### Returns
- `Object | undefined` - Object if found, undefined if not found

#### Example Usage
```javascript
const object = findObjectById('rect_123');
if (object) {
  console.log(`Found ${object.type} at (${object.x}, ${object.y})`);
}
```

---

### 8. `findObjectsByProperty(property, value)`
**Purpose**: Finds objects by a specific property value
**Source**: `useCanvas.js` → `objects.filter()`
**AI Usage**: For object resolution by description

#### Signature
```javascript
function findObjectsByProperty(property, value) → Array<Object>
```

#### Parameters
```javascript
property: string,                           // Required: Property name to search
value: any                                  // Required: Value to match
```

#### Returns
- `Array<Object>` - Array of matching objects

#### Example Usage
```javascript
// Find all red objects
const redObjects = findObjectsByProperty('fill', 'red');

// Find all rectangles
const rectangles = findObjectsByProperty('type', 'rectangle');

// Find objects at specific position
const objectsAt100 = findObjectsByProperty('x', 100);
```

---

## Coordinate System Functions

### 9. `screenToCanvas(screenPoint, stageRef)`
**Purpose**: Converts screen coordinates to canvas coordinates
**Source**: `useCanvas.js` → `convertScreenToCanvas` function
**AI Usage**: For coordinate conversion

#### Signature
```javascript
function screenToCanvas(screenPoint, stageRef) → { x: number, y: number }
```

#### Parameters
```javascript
screenPoint: { x: number, y: number },     // Required: Screen coordinates
stageRef: React.RefObject                  // Required: Stage reference
```

#### Returns
- `{ x: number, y: number }` - Canvas coordinates

---

### 10. `canvasToScreen(canvasPoint, stageRef)`
**Purpose**: Converts canvas coordinates to screen coordinates
**Source**: `useCanvas.js` → `convertCanvasToScreen` function
**AI Usage**: For coordinate conversion

#### Signature
```javascript
function canvasToScreen(canvasPoint, stageRef) → { x: number, y: number }
```

#### Parameters
```javascript
canvasPoint: { x: number, y: number },     // Required: Canvas coordinates
stageRef: React.RefObject                  // Required: Stage reference
```

#### Returns
- `{ x: number, y: number }` - Screen coordinates

---

## AI Agent Integration Notes

### Function Call Mapping
1. **`create_shape`** → `addObject(newObject)`
2. **`modify_shape`** → `updateObject(objectId, updates)`
3. **`delete_shape`** → `removeObject(objectId)`
4. **`arrange_shapes`** → Multiple `updateObject` calls with calculated positions

### Object Resolution Strategy
1. **By ID**: Use `findObjectById(objectId)` for exact matches
2. **By Description**: Use `findObjectsByProperty(property, value)` for fuzzy matches
3. **By Selection**: Use `getSelectedObjects()` for selected objects
4. **By Position**: Use `findObjectsByProperty('x', value)` for position-based queries

### Error Handling Strategy
1. **Optimistic Updates**: All operations update local state immediately
2. **Rollback on Failure**: Failed operations restore previous state
3. **Error Reporting**: Errors stored in `syncError` state
4. **Fallback Mode**: Operations continue locally if Firestore unavailable

### Performance Considerations
1. **Debouncing**: Non-critical updates debounced to prevent rapid Firestore writes
2. **Immediate Sync**: Critical operations (rotation) sync immediately
3. **Batch Operations**: Multiple updates can be batched for efficiency
4. **Conflict Resolution**: Floating-point tolerance for transform operations

### Coordinate System
- **Origin**: Top-left corner (0, 0)
- **Units**: Pixels
- **X-axis**: Left to right (increasing)
- **Y-axis**: Top to bottom (increasing)
- **Absolute Coordinates**: AI operates in absolute canvas coordinates
