# Object Properties and Constraints Documentation

## Overview
This document provides comprehensive documentation of object properties, constraints, and validation rules for the AI Agent to understand proper object manipulation.

## Object Type Definitions

### 1. Rectangle Objects

#### Properties
```javascript
{
  id: string,                               // Unique identifier
  type: 'rectangle',                        // Object type (required)
  x: number,                                // X coordinate (top-left corner)
  y: number,                                // Y coordinate (top-left corner)
  width: number,                            // Width in pixels
  height: number,                           // Height in pixels
  fill: string,                             // Fill color
  stroke: string,                           // Border color
  strokeWidth: number,                      // Border width in pixels
  opacity: number,                          // Transparency (0-1)
  rotation: number,                         // Rotation in degrees
  createdBy: string,                        // User ID who created it
  createdAt: number,                        // Creation timestamp
  updatedAt: number,                        // Last update timestamp
  lastModifiedBy: string,                   // User ID who last modified it
  lastModifiedByName: string               // Display name of last modifier
}
```

#### Constraints
- **Position**: `x >= 0`, `y >= 0` (cannot be negative)
- **Size**: `width > 0`, `height > 0` (must be positive)
- **Minimum Size**: `width >= 10`, `height >= 10` (MIN_RECTANGLE_SIZE)
- **Opacity**: `0 <= opacity <= 1` (clamped to valid range)
- **Rotation**: `0 <= rotation < 360` (degrees, normalized)
- **Stroke Width**: `strokeWidth >= 0` (can be 0 for no border)

#### Validation Rules
```javascript
// Position validation
if (x < 0) x = 0;
if (y < 0) y = 0;

// Size validation
if (width < 10) width = 10;
if (height < 10) height = 10;

// Opacity validation
if (opacity < 0) opacity = 0;
if (opacity > 1) opacity = 1;

// Rotation validation
rotation = rotation % 360;
if (rotation < 0) rotation += 360;
```

---

### 2. Circle Objects

#### Properties
```javascript
{
  id: string,                               // Unique identifier
  type: 'circle',                          // Object type (required)
  x: number,                                // X coordinate (center)
  y: number,                                // Y coordinate (center)
  width: number,                            // Diameter (width)
  height: number,                           // Diameter (height) - same as width
  fill: string,                             // Fill color
  stroke: string,                           // Border color
  strokeWidth: number,                      // Border width in pixels
  opacity: number,                          // Transparency (0-1)
  rotation: number,                         // Rotation in degrees
  createdBy: string,                        // User ID who created it
  createdAt: number,                        // Creation timestamp
  updatedAt: number,                        // Last update timestamp
  lastModifiedBy: string,                   // User ID who last modified it
  lastModifiedByName: string               // Display name of last modifier
}
```

#### Constraints
- **Position**: `x >= 0`, `y >= 0` (cannot be negative)
- **Size**: `width > 0`, `height > 0` (must be positive)
- **Minimum Size**: `width >= 10`, `height >= 10` (MIN_CIRCLE_SIZE)
- **Symmetry**: `width === height` (circles are always round)
- **Opacity**: `0 <= opacity <= 1` (clamped to valid range)
- **Rotation**: `0 <= rotation < 360` (degrees, normalized)
- **Stroke Width**: `strokeWidth >= 0` (can be 0 for no border)

#### Validation Rules
```javascript
// Position validation
if (x < 0) x = 0;
if (y < 0) y = 0;

// Size validation (circles must be square)
if (width < 10) width = 10;
if (height < 10) height = 10;
// Ensure width and height are equal for circles
height = width;

// Opacity validation
if (opacity < 0) opacity = 0;
if (opacity > 1) opacity = 1;

// Rotation validation
rotation = rotation % 360;
if (rotation < 0) rotation += 360;
```

---

### 3. Text Objects

#### Properties
```javascript
{
  id: string,                               // Unique identifier
  type: 'text',                            // Object type (required)
  x: number,                                // X coordinate (left edge)
  y: number,                                // Y coordinate (top edge)
  width: number,                            // Width in pixels (for bounding box)
  height: number,                           // Height in pixels (for bounding box)
  text: string,                             // Text content
  fontSize: number,                        // Font size in pixels
  fontFamily: string,                      // Font family name
  fill: string,                             // Text color
  stroke: string,                           // Text outline color
  strokeWidth: number,                      // Text outline width
  opacity: number,                          // Transparency (0-1)
  rotation: number,                         // Rotation in degrees
  createdBy: string,                        // User ID who created it
  createdAt: number,                        // Creation timestamp
  updatedAt: number,                        // Last update timestamp
  lastModifiedBy: string,                   // User ID who last modified it
  lastModifiedByName: string               // Display name of last modifier
}
```

#### Constraints
- **Position**: `x >= 0`, `y >= 0` (cannot be negative)
- **Size**: `width > 0`, `height > 0` (must be positive)
- **Minimum Size**: `width >= 20`, `height >= 12` (minimum for text visibility)
- **Font Size**: `8 <= fontSize <= 72` (reasonable font size range)
- **Text Content**: `text.length >= 0` (can be empty)
- **Opacity**: `0 <= opacity <= 1` (clamped to valid range)
- **Rotation**: `0 <= rotation < 360` (degrees, normalized)
- **Stroke Width**: `strokeWidth >= 0` (can be 0 for no outline)

#### Validation Rules
```javascript
// Position validation
if (x < 0) x = 0;
if (y < 0) y = 0;

// Size validation
if (width < 20) width = 20;
if (height < 12) height = 12;

// Font size validation
if (fontSize < 8) fontSize = 8;
if (fontSize > 72) fontSize = 72;

// Text content validation
if (text === null || text === undefined) text = '';

// Opacity validation
if (opacity < 0) opacity = 0;
if (opacity > 1) opacity = 1;

// Rotation validation
rotation = rotation % 360;
if (rotation < 0) rotation += 360;
```

---

## Color System

### Color Formats
The canvas supports multiple color formats:

#### 1. Named Colors
```javascript
const namedColors = [
  'red', 'blue', 'green', 'yellow', 'orange', 'purple',
  'pink', 'brown', 'black', 'white', 'gray', 'grey',
  'cyan', 'magenta', 'lime', 'navy', 'maroon', 'olive',
  'teal', 'silver', 'gold', 'coral', 'salmon', 'turquoise'
];
```

#### 2. Hex Colors
```javascript
const hexColors = [
  '#FF0000',  // Red
  '#00FF00',  // Green
  '#0000FF',  // Blue
  '#FFFF00',  // Yellow
  '#FF00FF',  // Magenta
  '#00FFFF',  // Cyan
  '#000000',  // Black
  '#FFFFFF'   // White
];
```

#### 3. RGB Colors
```javascript
const rgbColors = [
  'rgb(255, 0, 0)',    // Red
  'rgb(0, 255, 0)',    // Green
  'rgb(0, 0, 255)',    // Blue
  'rgb(255, 255, 0)',  // Yellow
  'rgb(255, 0, 255)',  // Magenta
  'rgb(0, 255, 255)'   // Cyan
];
```

#### 4. RGBA Colors
```javascript
const rgbaColors = [
  'rgba(255, 0, 0, 0.5)',    // Semi-transparent red
  'rgba(0, 255, 0, 0.8)',    // Semi-transparent green
  'rgba(0, 0, 255, 0.3)'     // Semi-transparent blue
];
```

### Color Validation
```javascript
function isValidColor(color) {
  // Check for named colors
  if (namedColors.includes(color.toLowerCase())) return true;
  
  // Check for hex colors
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) return true;
  if (/^#[0-9A-Fa-f]{3}$/.test(color)) return true;
  
  // Check for rgb colors
  if (/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/.test(color)) return true;
  
  // Check for rgba colors
  if (/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/.test(color)) return true;
  
  return false;
}
```

---

## Coordinate System

### Canvas Coordinates
- **Origin**: Top-left corner (0, 0)
- **Units**: Pixels
- **X-axis**: Left to right (increasing)
- **Y-axis**: Top to bottom (increasing)
- **Range**: No maximum bounds (infinite canvas)

### Coordinate Constraints
```javascript
// Position constraints
const MIN_X = 0;
const MIN_Y = 0;
const MAX_X = Infinity;  // No upper limit
const MAX_Y = Infinity;  // No upper limit

// Validation function
function validatePosition(x, y) {
  return {
    x: Math.max(MIN_X, x),
    y: Math.max(MIN_Y, y)
  };
}
```

### Coordinate Conversion
```javascript
// Screen to Canvas conversion
function screenToCanvas(screenPoint, stageRef) {
  const stage = stageRef.current;
  const scale = stage.scaleX();
  const x = (screenPoint.x - stage.x()) / scale;
  const y = (screenPoint.y - stage.y()) / scale;
  return { x, y };
}

// Canvas to Screen conversion
function canvasToScreen(canvasPoint, stageRef) {
  const stage = stageRef.current;
  const scale = stage.scaleX();
  const x = canvasPoint.x * scale + stage.x();
  const y = canvasPoint.y * scale + stage.y();
  return { x, y };
}
```

---

## Size Constraints

### Minimum Sizes
```javascript
const MIN_SIZES = {
  rectangle: { width: 10, height: 10 },
  circle: { width: 10, height: 10 },
  text: { width: 20, height: 12 }
};
```

### Maximum Sizes
```javascript
const MAX_SIZES = {
  rectangle: { width: 2000, height: 2000 },
  circle: { width: 2000, height: 2000 },
  text: { width: 1000, height: 500 }
};
```

### Size Validation
```javascript
function validateSize(type, width, height) {
  const minSize = MIN_SIZES[type];
  const maxSize = MAX_SIZES[type];
  
  return {
    width: Math.max(minSize.width, Math.min(maxSize.width, width)),
    height: Math.max(minSize.height, Math.min(maxSize.height, height))
  };
}
```

---

## Styling Constraints

### Opacity Constraints
```javascript
const OPACITY_CONSTRAINTS = {
  min: 0.0,
  max: 1.0,
  default: 1.0
};

function validateOpacity(opacity) {
  return Math.max(OPACITY_CONSTRAINTS.min, 
                 Math.min(OPACITY_CONSTRAINTS.max, opacity));
}
```

### Stroke Width Constraints
```javascript
const STROKE_WIDTH_CONSTRAINTS = {
  min: 0,
  max: 20,
  default: 2
};

function validateStrokeWidth(strokeWidth) {
  return Math.max(STROKE_WIDTH_CONSTRAINTS.min, 
                 Math.min(STROKE_WIDTH_CONSTRAINTS.max, strokeWidth));
}
```

### Rotation Constraints
```javascript
const ROTATION_CONSTRAINTS = {
  min: 0,
  max: 360,
  default: 0
};

function validateRotation(rotation) {
  let normalized = rotation % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}
```

---

## Font Constraints

### Font Size Constraints
```javascript
const FONT_SIZE_CONSTRAINTS = {
  min: 8,
  max: 72,
  default: 16
};

function validateFontSize(fontSize) {
  return Math.max(FONT_SIZE_CONSTRAINTS.min, 
                 Math.min(FONT_SIZE_CONSTRAINTS.max, fontSize));
}
```

### Font Family Constraints
```javascript
const VALID_FONT_FAMILIES = [
  'Arial', 'Helvetica', 'Times New Roman', 'Courier New',
  'Verdana', 'Georgia', 'Palatino', 'Garamond',
  'Trebuchet MS', 'Arial Black', 'Comic Sans MS',
  'Impact', 'Lucida Console', 'Tahoma', 'Geneva'
];

function validateFontFamily(fontFamily) {
  return VALID_FONT_FAMILIES.includes(fontFamily) ? fontFamily : 'Arial';
}
```

---

## AI Agent Integration Rules

### Object Creation Rules
1. **Required Properties**: `type`, `x`, `y`, `width`, `height`, `fill`
2. **Auto-generated Properties**: `id`, `createdBy`, `createdAt`, `updatedAt`
3. **Default Values**: `opacity: 1`, `strokeWidth: 2`, `rotation: 0`
4. **Validation**: All properties must pass validation before creation

### Object Update Rules
1. **Partial Updates**: Only update specified properties
2. **Validation**: All updated properties must pass validation
3. **Auto-update**: `updatedAt`, `lastModifiedBy`, `lastModifiedByName`
4. **Conflict Resolution**: Use "last-write-wins" strategy

### Object Deletion Rules
1. **Immediate Deletion**: Object removed from local state immediately
2. **Live Broadcast**: Deletion broadcast to other users
3. **Firestore Sync**: Object deleted from Firestore
4. **Rollback**: Object restored if any step fails

### Error Handling Rules
1. **Validation Errors**: Return specific error messages
2. **Constraint Violations**: Apply constraints and continue
3. **Network Errors**: Fall back to local operations
4. **Conflict Errors**: Use conflict resolution strategy

---

## Performance Considerations

### Debouncing Rules
1. **Resize Operations**: 200ms debounce for width/height changes
2. **Rotation Operations**: Immediate sync for rotation changes
3. **Other Operations**: 200ms debounce for other property changes
4. **Batch Operations**: Multiple updates can be batched

### Memory Management
1. **Object Limits**: No hard limit on object count
2. **Property Limits**: No hard limit on property count
3. **Cleanup**: Objects cleaned up on deletion
4. **Optimization**: Use object pooling for frequent operations

### Conflict Resolution
1. **Floating-point Tolerance**: 0.01 pixels for position, 5 pixels for size
2. **Last-write-wins**: Most recent update wins
3. **User Attribution**: Track who made changes
4. **Rollback Support**: Failed operations can be rolled back

---

## Validation Functions

### Complete Object Validation
```javascript
function validateObject(object) {
  const errors = [];
  
  // Type validation
  if (!['rectangle', 'circle', 'text'].includes(object.type)) {
    errors.push('Invalid object type');
  }
  
  // Position validation
  if (object.x < 0) errors.push('X coordinate cannot be negative');
  if (object.y < 0) errors.push('Y coordinate cannot be negative');
  
  // Size validation
  const minSize = MIN_SIZES[object.type];
  if (object.width < minSize.width) errors.push('Width too small');
  if (object.height < minSize.height) errors.push('Height too small');
  
  // Color validation
  if (!isValidColor(object.fill)) errors.push('Invalid fill color');
  if (object.stroke && !isValidColor(object.stroke)) {
    errors.push('Invalid stroke color');
  }
  
  // Opacity validation
  if (object.opacity < 0 || object.opacity > 1) {
    errors.push('Opacity must be between 0 and 1');
  }
  
  // Text-specific validation
  if (object.type === 'text') {
    if (object.fontSize < 8 || object.fontSize > 72) {
      errors.push('Font size must be between 8 and 72');
    }
    if (!VALID_FONT_FAMILIES.includes(object.fontFamily)) {
      errors.push('Invalid font family');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}
```

This comprehensive documentation provides the AI Agent with all the necessary information to properly validate, create, and manipulate canvas objects while respecting all constraints and validation rules.
