# AI Agent Feature Test Tasks

## Feature: Successful AI Agent Function
**Goal**: Ensure the AI agent can successfully process and execute all command types with high accuracy and reliability.

---

## **Core Command Type Testing**

### **1. Creation Commands (3 types)**

#### **1.1 Rectangle Creation**
- [x] **Basic rectangle creation**
  - Test: "Create a red rectangle"
  - Expected: Creates rectangle with red fill, smart default size/position
  - Success criteria: Rectangle appears on canvas with correct color

- [x] **Positioned rectangle creation**
  - Test: "Add a blue rectangle at the center"
  - Expected: Creates rectangle at canvas center
  - Success criteria: Rectangle positioned at center coordinates

- [x] **Sized rectangle creation**
  - Test: "Make a green rectangle with width 200 and height 100"
  - Expected: Creates rectangle with exact specified dimensions
  - Success criteria: Rectangle has correct width/height

#### **1.2 Circle Creation**
- [x] **Basic circle creation**
  - Test: "Create a blue circle"
  - Expected: Creates circle with blue fill, smart default size/position
  - Success criteria: Circle appears on canvas with correct color

- [x] **Radius-based circle creation**
  - Test: "Add a red circle with radius 50"
  - Expected: Creates circle with diameter 100 (radius * 2)
  - Success criteria: Circle has correct diameter

- [x] **Positioned circle creation**
  - Test: "Make a green circle at position 300, 400"
  - Expected: Creates circle at exact coordinates
  - Success criteria: Circle positioned at specified coordinates

#### **1.3 Text Creation**
- [x] **Basic text creation**
  - Test: "Create a text box with 'Hello World'"
  - Expected: Creates text element with specified content
  - Success criteria: Text appears with correct content

- [x] **Positioned text creation**
  - Test: "Add a text element saying 'Welcome'"
  - Expected: Creates text with smart positioning
  - Success criteria: Text appears with correct content and positioning

- [x] **Centered text creation**
  - Test: "Make a text box with 'Button' in the center"
  - Expected: Creates text at canvas center
  - Success criteria: Text positioned at center

### **2. Manipulation Commands (3 types)**

#### **2.1 Position Changes**
- [x] **Relative position changes**
  - Test: "Move the red rectangle to the center"
  - Expected: Moves rectangle to canvas center
  - Success criteria: Rectangle repositioned to center

- [x] **Absolute position changes**
  - Test: "Move the blue circle to 500, 300"
  - Expected: Moves circle to exact coordinates
  - Success criteria: Circle positioned at specified coordinates

- [x] **Edge position changes**
  - Test: "Move the text box to the top-left"
  - Expected: Moves text to top-left corner
  - Success criteria: Text positioned at top-left

#### **2.2 Size Changes**
- [ ] **Proportional size changes**
  - Test: "Make the red rectangle bigger"
  - Expected: Increases rectangle size by ~20%
  - Success criteria: Rectangle size increased proportionally

- [x] **Exact size changes**
  - Test: "Resize the blue circle to 120x120"
  - Expected: Changes circle to exact dimensions
  - Success criteria: Circle has exact specified dimensions

- [x] **Size reduction**
  - Test: "Make the text box smaller"
  - Expected: Decreases text box size
  - Success criteria: Text box size reduced

#### **2.3 Color Changes**
- [x] **Basic color changes**
  - Test: "Change the red rectangle to green"
  - Expected: Changes rectangle fill color to green
  - Success criteria: Rectangle color changed to green

- [ ] **Color name variations**
  - Test: "Make the blue circle purple"
  - Expected: Changes circle color to purple
  - Success criteria: Circle color changed to purple

- [x] **Text color changes**
  - Test: "Change the text color to black"
  - Expected: Changes text fill color to black
  - Success criteria: Text color changed to black

### **3. Layout Commands (2 types)**

#### **3.1 Basic Layouts**
- [x] **Row arrangement**
  - Test: "Arrange the shapes in a row"
  - Expected: Arranges all shapes horizontally
  - Success criteria: Shapes arranged in horizontal line

- [x] **Column arrangement**
  - Test: "Put the shapes in a column"
  - Expected: Arranges all shapes vertically
  - Success criteria: Shapes arranged in vertical line

- [x] **Grid arrangement**
  - Test: "Arrange the shapes in a 2-column grid"
  - Expected: Arranges shapes in 2-column grid
  - Success criteria: Shapes arranged in grid pattern

- [ ] **Distribution**
  - Test: "Distribute the shapes evenly horizontally"
  - Expected: Distributes shapes with equal spacing
  - Success criteria: Shapes distributed with equal spacing

### **4. Complex Commands (2 types)**

#### **4.1 Layout Templates**
- [ ] **Login form creation**
  - Test: "Create a login form"
  - Expected: Creates complete login form with fields and button
  - Success criteria: Login form with username, password, submit button

- [ ] **Card layout creation**
  - Test: "Make a card layout with 3 cards"
  - Expected: Creates 3-card layout with titles and content
  - Success criteria: 3 cards with proper structure

- [ ] **Navigation bar creation**
  - Test: "Create a navigation bar"
  - Expected: Creates horizontal navigation with menu items
  - Success criteria: Navigation bar with menu items

- [ ] **Dashboard layout creation**
  - Test: "Build a dashboard layout"
  - Expected: Creates dashboard with multiple sections
  - Success criteria: Dashboard with multiple components

#### **4.2 Multi-Step Commands**
- [ ] **Complex login form**
  - Test: "Create a login form with username field, password field, and submit button"
  - Expected: Creates form with 3 components in sequence
  - Success criteria: All 3 components created and positioned

- [ ] **Complex card layout**
  - Test: "Make a card layout with title, content, and action button"
  - Expected: Creates card with 3 elements
  - Success criteria: Card with all specified elements

- [ ] **Complex navigation**
  - Test: "Create a navigation bar with menu items"
  - Expected: Creates navigation with multiple menu items
  - Success criteria: Navigation with multiple items

---

## **Advanced Feature Testing**

### **5. Object Reference Resolution**

#### **5.1 Color-Based References**
- [ ] **Single color match**
  - Test: "Move the red rectangle" (when only one red object exists)
  - Expected: Moves the correct red rectangle
  - Success criteria: Correct object moved

- [ ] **Multiple color matches**
  - Test: "Move the red rectangle" (when multiple red objects exist)
  - Expected: Asks for clarification with numbered options
  - Success criteria: Clarification prompt with options

#### **5.2 Position-Based References**
- [ ] **Top/bottom references**
  - Test: "Move the top shape down"
  - Expected: Moves shape with lowest y coordinate
  - Success criteria: Correct top shape moved

- [ ] **Left/right references**
  - Test: "Delete the leftmost rectangle"
  - Expected: Deletes rectangle with lowest x coordinate
  - Success criteria: Correct leftmost rectangle deleted

#### **5.3 Size-Based References**
- [ ] **Largest/smallest references**
  - Test: "Change the largest shape to green"
  - Expected: Changes shape with largest area
  - Success criteria: Correct largest shape changed

### **6. Relative Positioning**

#### **6.1 Object-Relative Positioning**
- [ ] **Next to positioning**
  - Test: "Create a blue circle next to the red rectangle"
  - Expected: Creates circle adjacent to rectangle
  - Success criteria: Circle positioned next to rectangle

- [ ] **Below positioning**
  - Test: "Add a text box below the title"
  - Expected: Creates text box below reference object
  - Success criteria: Text box positioned below title

- [ ] **Above positioning**
  - Test: "Create a circle above the largest shape"
  - Expected: Creates circle above reference object
  - Success criteria: Circle positioned above largest shape

#### **6.2 Canvas-Relative Positioning**
- [ ] **Center positioning**
  - Test: "Create a rectangle in the center"
  - Expected: Creates rectangle at canvas center
  - Success criteria: Rectangle at canvas center

- [ ] **Corner positioning**
  - Test: "Move the shape to the top-left"
  - Expected: Moves shape to top-left corner
  - Success criteria: Shape at top-left corner

### **7. Ambiguity Handling**

#### **7.1 Multiple Matches**
- [ ] **Color ambiguity**
  - Test: "Change the blue shape" (when multiple blue shapes exist)
  - Expected: Lists all blue shapes with descriptions
  - Success criteria: Clear numbered options provided

- [ ] **Type ambiguity**
  - Test: "Delete the rectangle" (when multiple rectangles exist)
  - Expected: Lists all rectangles with descriptions
  - Success criteria: Clear numbered options provided

#### **7.2 No Matches**
- [ ] **Non-existent objects**
  - Test: "Move the green triangle" (when no green triangles exist)
  - Expected: Suggests available objects
  - Success criteria: Helpful suggestions provided

- [ ] **Empty canvas**
  - Test: "Move the shape" (when no objects exist)
  - Expected: Suggests creating objects first
  - Success criteria: Creation suggestions provided

### **8. Error Handling**

#### **8.1 Invalid Parameters**
- [ ] **Negative dimensions**
  - Test: "Create a circle with radius -10"
  - Expected: Uses minimum valid size
  - Success criteria: Circle created with minimum size

- [ ] **Out-of-bounds positions**
  - Test: "Move the rectangle to -100, -50"
  - Expected: Clamps to canvas bounds
  - Success criteria: Rectangle positioned within bounds

#### **8.2 API Errors**
- [ ] **Network failures**
  - Test: Commands when API is unavailable
  - Expected: Graceful error message
  - Success criteria: User-friendly error message

- [ ] **Rate limiting**
  - Test: Rapid successive commands
  - Expected: Rate limit message
  - Success criteria: Rate limit notification

### **9. Performance Testing**

#### **9.1 Response Time**
- [ ] **Simple commands**
  - Test: Basic creation commands
  - Expected: Response within 2 seconds
  - Success criteria: <2 second response time

- [ ] **Complex commands**
  - Test: Multi-step commands
  - Expected: Response within 3 seconds
  - Success criteria: <3 second response time

#### **9.2 Large Canvas Handling**
- [ ] **Many objects**
  - Test: Commands on canvas with 50+ objects
  - Expected: Maintains performance
  - Success criteria: No significant slowdown

### **10. Multi-User Scenarios**

#### **10.1 Concurrent Commands**
- [ ] **Simultaneous operations**
  - Test: Multiple users issuing commands simultaneously
  - Expected: All commands processed correctly
  - Success criteria: No conflicts or data corruption

#### **10.2 User Isolation**
- [ ] **User-specific operations**
  - Test: Commands from different users
  - Expected: Proper user context maintained
  - Success criteria: User context preserved

---

## **Success Criteria**

### **Overall Success Metrics:**
- [ ] **90%+ accuracy rate** for all command types
- [ ] **<2 second response time** for simple commands
- [ ] **<3 second response time** for complex commands
- [ ] **Zero data corruption** in multi-user scenarios
- [ ] **Graceful error handling** for all error cases
- [ ] **Clear clarification prompts** for ambiguous commands
- [ ] **Consistent object reference resolution**
- [ ] **Reliable relative positioning**

### **Test Completion Checklist:**
- [ ] All 10+ command types tested and working
- [ ] Object reference resolution working correctly
- [ ] Relative positioning functioning properly
- [ ] Ambiguity handling providing helpful prompts
- [ ] Error handling graceful and informative
- [ ] Performance within acceptable limits
- [ ] Multi-user scenarios working correctly
- [ ] Edge cases handled appropriately

---

## **Notes**

- **Test Environment**: Use realistic canvas states with multiple object types
- **Test Data**: Include various colors, sizes, and positions
- **Edge Cases**: Test with empty canvas, single objects, and many objects
- **User Experience**: Focus on clarity and helpfulness of responses
- **Performance**: Monitor response times and resource usage
- **Reliability**: Ensure consistent behavior across multiple test runs
