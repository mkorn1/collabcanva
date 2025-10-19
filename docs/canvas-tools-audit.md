# Canvas Tools Audit - useCanvasTools.js

## Overview
This document provides a comprehensive audit of the canvas tools and manipulation functions available in `useCanvasTools.js` for AI Agent integration.

## Core Tools Management Functions

### 1. `handleToolSelect(toolId)`
**Purpose**: Selects a tool from the toolbox and sets creation mode
**Source**: `useCanvasTools.js` → `handleToolSelect` function
**AI Usage**: For programmatic tool selection

#### Signature
```javascript
function handleToolSelect(toolId) → void
```

#### Parameters
```javascript
toolId: 'select' | 'marquee' | 'rectangle' | 'circle' | 'text'
```

#### Tool Types
- **`'select'`**: Selection tool for moving and resizing objects
- **`'marquee'`**: Marquee selection tool for selecting multiple objects
- **`'rectangle'`**: Rectangle creation tool
- **`'circle'`**: Circle creation tool
- **`'text'`**: Text creation tool

#### Behavior
- Sets `selectedTool` state
- Sets `creationMode` based on tool type:
  - `'rectangle'` → `creationMode: 'rectangle'`
  - `'circle'` → `creationMode: 'circle'`
  - `'text'` → `creationMode: 'text'`
  - `'select'` or `'marquee'` → `creationMode: null`

#### Example Usage
```javascript
// Select rectangle tool
handleToolSelect('rectangle');

// Select selection tool
handleToolSelect('select');

// Select marquee tool
handleToolSelect('marquee');
```

---

### 2. `getCursorStyle(isDragging, selectedTool)`
**Purpose**: Returns appropriate cursor style based on current tool and state
**Source**: `useCanvasTools.js` → `getCursorStyle` function
**AI Usage**: For UI cursor management

#### Signature
```javascript
function getCursorStyle(isDragging, selectedTool) → string
```

#### Parameters
```javascript
isDragging: boolean,                        // Whether canvas is being dragged
selectedTool: string                        // Currently selected tool
```

#### Returns
- `string` - CSS cursor style value

#### Cursor Styles
- **`'crosshair'`**: For rectangle, circle, and marquee tools
- **`'text'`**: For text tool
- **`'grabbing'`**: When dragging canvas
- **`'grab'`**: Default selection tool

#### Example Usage
```javascript
const cursorStyle = getCursorStyle(false, 'rectangle');
// Returns: 'crosshair'

const cursorStyle = getCursorStyle(true, 'select');
// Returns: 'grabbing'
```

---

## Keyboard Shortcuts

### 3. Keyboard Shortcut Handler
**Purpose**: Handles keyboard shortcuts for tool selection
**Source**: `useCanvasTools.js` → `useEffect` with keydown listener
**AI Usage**: For understanding user input patterns

#### Supported Shortcuts
- **`V`**: Select tool (`'select'`)
- **`M`**: Marquee tool (`'marquee'`)
- **`R`**: Rectangle tool (`'rectangle'`)
- **`C`**: Circle tool (`'circle'`)
- **`T`**: Text tool (`'text'`)
- **`Escape`**: Cancel creation and return to select tool

#### Behavior
- Shortcuts are ignored when user is typing in input/textarea elements
- Escape key cancels any ongoing shape creation
- All shortcuts set the appropriate tool and creation mode

#### Example Usage
```javascript
// User presses 'R' key
// → handleToolSelect('rectangle') is called
// → selectedTool becomes 'rectangle'
// → creationMode becomes 'rectangle'
```

---

## State Management

### 4. Tool State
**Purpose**: Manages current tool selection and creation mode
**Source**: `useCanvasTools.js` → State variables
**AI Usage**: For understanding current tool context

#### State Variables
```javascript
selectedTool: string,                       // Currently selected tool
creationMode: string | null                 // Current creation mode
```

#### State Values
- **`selectedTool`**: `'select' | 'marquee' | 'rectangle' | 'circle' | 'text'`
- **`creationMode`**: `'rectangle' | 'circle' | 'text' | null`

#### State Updates
- Updated via `handleToolSelect(toolId)`
- Used by `getCursorStyle()` for cursor management
- Used by keyboard shortcuts for tool switching

---

## AI Agent Integration Notes

### Tool Selection for AI Operations
The AI Agent can use these tools for different types of operations:

1. **`'select'`**: For moving, resizing, and manipulating existing objects
2. **`'marquee'`**: For selecting multiple objects for bulk operations
3. **`'rectangle'`**: For creating rectangular shapes
4. **`'circle'`**: For creating circular shapes
5. **`'text'`**: For creating text objects

### Tool Context Awareness
The AI Agent should be aware of the current tool context when executing commands:

- **Creation Commands**: Should set appropriate tool before creating shapes
- **Manipulation Commands**: Should use select tool for object manipulation
- **Bulk Operations**: Should use marquee tool for multi-object selection

### Tool State Integration
The AI Agent can integrate with tool state for better user experience:

```javascript
// Before creating a rectangle
handleToolSelect('rectangle');

// Before manipulating objects
handleToolSelect('select');

// Before selecting multiple objects
handleToolSelect('marquee');
```

---

## Dependencies and Integration

### Required Props
The `useCanvasTools` hook requires these props from the parent component:

```javascript
{
  isCreatingRectangle: boolean,             // Whether rectangle is being created
  isCreatingCircle: boolean,               // Whether circle is being created
  isCreatingText: boolean,                 // Whether text is being created
  cancelCreatingShape: function            // Function to cancel shape creation
}
```

### Integration with useCanvas
The tools hook integrates with the main canvas hook:

- **Creation State**: Uses creation state from `useCanvas`
- **Cancellation**: Calls `cancelCreatingShape` from `useCanvas`
- **Tool Context**: Provides tool context for canvas operations

---

## Limitations and Considerations

### Current Limitations
1. **No Advanced Tools**: Only basic creation and selection tools
2. **No Custom Tools**: No support for custom tool types
3. **No Tool Persistence**: Tool selection doesn't persist across sessions
4. **No Tool History**: No undo/redo for tool selections

### AI Agent Considerations
1. **Tool Context**: AI should respect current tool selection
2. **Creation Mode**: AI should set appropriate creation mode for shape creation
3. **User Experience**: AI should not interfere with user's tool selection
4. **Keyboard Shortcuts**: AI should be aware of keyboard shortcuts

---

## Future Enhancements

### Potential Improvements
1. **Advanced Tools**: Add more sophisticated tools (pen, eraser, etc.)
2. **Tool Customization**: Allow custom tool configurations
3. **Tool Persistence**: Remember tool selection across sessions
4. **Tool History**: Add tool selection history
5. **AI Tool Integration**: Special AI-specific tools for complex operations

### AI Agent Enhancements
1. **Smart Tool Selection**: AI automatically selects appropriate tools
2. **Tool Context Awareness**: AI understands tool context for better operations
3. **Tool State Management**: AI manages tool state for complex workflows
4. **Tool Optimization**: AI optimizes tool usage for efficiency

---

## Summary

The `useCanvasTools` hook provides basic tool management functionality for the canvas application. While it's relatively simple, it provides the foundation for tool-based operations that the AI Agent can leverage.

### Key Functions for AI Agent:
1. **`handleToolSelect(toolId)`**: For programmatic tool selection
2. **`getCursorStyle(isDragging, selectedTool)`**: For UI cursor management
3. **Tool State**: For understanding current tool context
4. **Keyboard Shortcuts**: For understanding user input patterns

### Integration Strategy:
1. **Respect Tool Context**: AI should be aware of current tool selection
2. **Set Appropriate Tools**: AI should set correct tools for operations
3. **Maintain User Experience**: AI should not interfere with user tool selection
4. **Leverage Tool State**: AI can use tool state for better operation context
