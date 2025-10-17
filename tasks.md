**PR Checklist:**
- [ ] Can# CollabCanvas MVP - Task List

**Project Structure:** React + Firebase + Konva.js  
**Timeline:** 24 hours to MVP  
**Strategy:** Each PR builds on the previous, test continuously

---

## Project File Structure

```
collabcanvas/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── AuthForm.jsx
│   │   ├── Canvas/
│   │   │   ├── Canvas.jsx              # Main canvas component
│   │   │   ├── CanvasObjects.jsx       # Renders all rectangles
│   │   │   ├── Rectangle.jsx           # Individual rectangle
│   │   │   └── CanvasControls.jsx      # Pan/zoom controls
│   │   ├── Collaboration/
│   │   │   ├── Cursor.jsx              # Other users' cursors
│   │   │   ├── CursorLayer.jsx         # Manages all cursors
│   │   │   └── PresenceList.jsx        # Online users list
│   │   └── Layout/
│   │       ├── Header.jsx              # App header with user info
│   │       └── Sidebar.jsx             # Optional: presence sidebar
│   ├── hooks/
│   │   ├── useAuth.js                  # Authentication hook
│   │   ├── useCanvas.js                # Canvas state management
│   │   ├── useRealtime.js              # Firebase realtime sync
│   │   ├── usePresence.js              # User presence detection
│   │   └── useCursor.js                # Cursor position tracking
│   ├── services/
│   │   ├── firebase.js                 # Firebase config & init
│   │   ├── auth.js                     # Auth service functions
│   │   ├── firestore.js                # Firestore operations
│   │   └── realtime.js                 # Realtime database operations
│   ├── utils/
│   │   ├── colors.js                   # Random color generator
│   │   ├── canvasHelpers.js            # Canvas utility functions
│   │   └── constants.js                # App constants (canvas size, etc)
│   ├── __tests__/                      # Test files
│   │   ├── utils/
│   │   │   ├── colors.test.js
│   │   │   ├── canvasHelpers.test.js
│   │   │   └── constants.test.js
│   │   ├── services/
│   │   │   ├── auth.test.js
│   │   │   └── firestore.test.js
│   │   ├── hooks/
│   │   │   ├── useCanvas.test.js
│   │   │   └── useCursor.test.js
│   │   ├── components/
│   │   │   ├── Rectangle.test.jsx
│   │   │   └── PresenceList.test.jsx
│   │   └── integration/
│   │       ├── cursor-sync.test.js
│   │       └── rectangle-sync.test.js
│   ├── setupTests.js                   # Jest/Vitest setup
│   ├── App.jsx                         # Main app component
│   ├── App.css                         # Global styles
│   ├── index.js                        # React entry point
│   └── index.css                       # Base styles
├── .env                                # Firebase config (gitignored)
├── .env.example                        # Example env variables
├── .gitignore
├── package.json
├── package-lock.json
├── jest.config.js                      # or vitest.config.js
└── README.md
```

---

## Pull Request Breakdown

### PR #1: Project Setup & Deployment
**Goal:** Get a "Hello World" app deployed with Firebase configured  
**Time Estimate:** 1-2 hours  
**Testing:** Manual verification only (no unit tests needed)

#### Tasks:
- [x] 1.1 Initialize React app with Create React App or Vite
  - **Files:** All base files in structure above
  
- [x] 1.2 Install core dependencies
  - **Command:** `npm install firebase react-konva konva`
  - **Command:** `npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest jsdom`
  - **Files:** `package.json`, `package-lock.json`

- [x] 1.3 Setup Firebase project in console
  - Create new Firebase project
  - Enable Firestore Database
  - Enable Authentication (Email/Password)
  - Get Firebase config credentials

- [x] 1.4 Configure Firebase in project
  - **Files Created:** `src/services/firebase.js`, `.env`, `.env.example`
  - **Content:** Firebase initialization, config from environment variables

- [x] 1.5 Create basic app structure
  - **Files Created:** `src/App.jsx`, `src/App.css`, `src/index.js`
  - **Content:** Simple "Hello World" component

- [x] 1.6 Setup environment variables
  - **Files Created:** `.env` (gitignored), `.env.example`
  - **Content:** Firebase API keys and config

- [x] 1.7 Configure .gitignore
  - **Files:** `.gitignore`
  - **Content:** Add `/node_modules`, `.env`, build folders

- [x] 1.8 Deploy to hosting platform
  - Choose: Vercel, Firebase Hosting, or AWS
  - Test public URL works
  - **Files:** May need `vercel.json` or `firebase.json`

- [x] 1.9 Update README with setup instructions
  - **Files:** `README.md`
  - **Content:** How to install, configure Firebase, run locally, run tests

**PR Checklist:**
- [x] App runs locally on `localhost:3000`
- [x] Firebase connection works (test with console.log)
- [x] Deployed URL is publicly accessible
- [x] README has clear setup instructions
- [x] All secrets in .env (not committed)

---

### PR #2: User Authentication
**Goal:** Users can sign up, log in, and persist sessions  
**Time Estimate:** 2-3 hours  
**Testing:** ✅ Unit tests for auth service functions

#### Tasks:
- [x] 2.1 Create auth service functions
  - **Files Created:** `src/services/auth.js`
  - **Functions:** `signUp(email, password, displayName)`, `signIn(email, password)`, `signOut()`, `getCurrentUser()`

- [x] 2.2 **🧪 UNIT TEST: Auth service functions**
  - **Files Created:** `src/__tests__/services/auth.test.js`
  - **Tests:**
    - Mock Firebase auth methods
    - Test `signUp()` creates user with correct data
    - Test `signIn()` returns user object
    - Test `signOut()` clears session
    - Test `getCurrentUser()` returns null when not logged in
    - Test error handling for invalid credentials
  - **Why:** Auth is critical and pure functions are easy to test

- [x] 2.3 Create auth context/hook
  - **Files Created:** `src/hooks/useAuth.js`
  - **Content:** Custom hook for auth state, user object, loading state

- [x] 2.4 Build Signup component
  - **Files Created:** `src/components/Auth/Signup.jsx`
  - **Content:** Email, password, optional display name inputs, error handling
  
- [x] 2.5 Build Login component
  - **Files Created:** `src/components/Auth/Login.jsx`
  - **Content:** Email, password inputs, error handling

- [x] 2.6 Create auth form wrapper
  - **Files Created:** `src/components/Auth/AuthForm.jsx`
  - **Content:** Switch between login/signup, styling

- [x] 2.7 Update App.jsx with auth routing
  - **Files Modified:** `src/App.jsx`
  - **Content:** Show auth forms if not logged in, show canvas if logged in

- [x] 2.8 Store user profile in Firestore
  - **Files Modified:** `src/services/firestore.js`
  - **Content:** Create user document with `{ id, email, displayName, createdAt }`

- [x] 2.9 Test authentication flow
  - Sign up new user
  - Log out
  - Log back in
  - Verify session persists on refresh

**PR Checklist:**
- [x] Can create new account
- [x] Can log in with existing account
- [x] Can log out
- [x] Session persists on page refresh
- [x] Display name stored (or auto-generated)
- [x] Error messages show for invalid inputs
- [x] ✅ All unit tests pass (`npm test`)

---

### PR #3: Basic Canvas with Pan & Zoom
**Goal:** Empty canvas with smooth pan/zoom controls  
**Time Estimate:** 2-3 hours  
**Testing:** ✅ Unit tests for canvas helper utilities

#### Tasks:
- [x] 3.1 Create constants file
  - **Files Created:** `src/utils/constants.js`
  - **Content:** `CANVAS_WIDTH = 4000`, `CANVAS_HEIGHT = 4000`, `INITIAL_ZOOM = 1`

- [x] 3.2 **🧪 UNIT TEST: Constants**
  - **Files Created:** `src/__tests__/utils/constants.test.js`
  - **Tests:**
    - Verify canvas dimensions are correct
    - Verify zoom limits are reasonable
    - Test all constants are exported
  - **Why:** Simple validation, ensures no typos

- [x] 3.3 Build main Canvas component
  - **Files Created:** `src/components/Canvas/Canvas.jsx`
  - **Content:** Konva Stage and Layer setup, 4000x4000 workspace

- [x] 3.4 Add canvas to App
  - **Files Modified:** `src/App.jsx`
  - **Content:** Render Canvas component when user is authenticated

- [x] 3.5 Implement pan functionality
  - **Files Modified:** `src/components/Canvas/Canvas.jsx`
  - **Content:** Drag Stage to pan, track stage position

- [x] 3.6 Implement zoom functionality
  - **Files Modified:** `src/components/Canvas/Canvas.jsx`
  - **Content:** Mouse wheel to zoom, pinch to zoom, limit zoom levels (0.1x to 5x)

- [x] 3.7 Add canvas state hook
  - **Files Created:** `src/hooks/useCanvas.js`
  - **Content:** Manage canvas state (objects array, selected object, zoom, pan position)

- [x] 3.8 Create canvas helpers
  - **Files Created:** `src/utils/canvasHelpers.js`
  - **Content:** Helper functions for coordinate transformations, bounds checking

- [x] 3.9 **🧪 UNIT TEST: Canvas helpers**
  - **Files Created:** `src/__tests__/utils/canvasHelpers.test.js`
  - **Tests:**
    - Test coordinate transformation (screen to canvas)
    - Test bounds checking (is point in canvas?)
    - Test zoom calculations
    - Test edge cases (negative coords, out of bounds)
  - **Why:** Math-heavy pure functions, prone to off-by-one errors

- [x] 3.10 Style canvas container
  - **Files Modified:** `src/App.css`
  - **Content:** Full-screen canvas, no scrollbars, cursor styles

- [x] 3.11 Test pan and zoom performance
  - Verify 60 FPS during pan/zoom
  - Test on trackpad and mouse
  - Test zoom limits work

**PR Checklist:**
- [x] Canvas renders at 4000x4000
- [x] Smooth panning with mouse drag
- [x] Smooth zooming with wheel/pinch
- [x] Zoom limits prevent extreme zoom levels
- [x] No visible boundaries (feels infinite)
- [x] 60 FPS maintained during interactions
- [x] ✅ All unit tests pass for canvas helpers

---

### PR #4: Cursor Sync (First Real-Time Feature!)
**Goal:** See other users' cursors moving in real-time  
**Time Estimate:** 3-4 hours  
**Testing:** ✅ Unit tests for cursor hook and color generation + Integration test for sync

#### Tasks:
- [x] 4.1 Setup Firestore presence system
  - **Files Modified:** `src/services/firestore.js`
  - **Content:** Functions to update/read user presence, heartbeat system

- [x] 4.2 Create color generation utility
  - **Files Created:** `src/utils/colors.js`
  - **Content:** `generateRandomColor()` function for cursor colors

- [x] 4.3 **🧪 UNIT TEST: Color generation**
  - **Files Created:** `src/__tests__/utils/colors.test.js`
  - **Tests:**
    - Test `generateRandomColor()` returns valid hex color
    - Test colors are sufficiently distinct (no white/black)
    - Test color format is correct (#RRGGBB)
    - Test randomness (call 10 times, get different results)
  - **Why:** Pure function, easy to test, critical for UX

- [x] 4.4 Assign cursor color when joining canvas
  - **Files Modified:** `src/hooks/usePresence.js` or `src/services/firestore.js`
  - **Content:** Generate and assign random color when user first joins canvas, store in presence document

- [x] 4.5 Create cursor tracking hook
  - **Files Created:** `src/hooks/useCursor.js`
  - **Content:** Track local cursor position, throttle updates to 60 FPS

- [x] 4.6 **🧪 UNIT TEST: Cursor throttling**
  - **Files Created:** `src/__tests__/hooks/useCursor.test.js`
  - **Tests:**
    - Mock timers to test throttling works
    - Test cursor updates are limited to 60 FPS (16ms intervals)
    - Test cursor position updates correctly
    - Test cleanup on unmount
  - **Why:** Throttling is critical for performance, easy to test with mocks

- [x] 4.7 Create presence hook
  - **Files Created:** `src/hooks/usePresence.js`
  - **Content:** Track online users, listen for presence changes

- [x] 4.8 Build Cursor component
  - **Files Created:** `src/components/Collaboration/Cursor.jsx`
  - **Content:** Render single cursor with name label, colored cursor icon

- [x] 4.9 Build CursorLayer component
  - **Files Created:** `src/components/Collaboration/CursorLayer.jsx`
  - **Content:** Render all other users' cursors on canvas

- [x] 4.10 Setup realtime cursor sync
  - **Files Created:** `src/services/realtime.js`
  - **Content:** Broadcast cursor position, listen to others' positions

- [x] 4.11 Integrate cursor layer into Canvas
  - **Files Modified:** `src/components/Canvas/Canvas.jsx`
  - **Content:** Add CursorLayer above canvas objects

- [x] 4.12 Throttle cursor updates
  - **Files Modified:** `src/hooks/useCursor.js`
  - **Content:** Use requestAnimationFrame or lodash throttle (16ms)

- [x] 4.13 Test with multiple browser windows
  - Open 2-3 browser windows
  - Log in as different users
  - Verify cursors sync smoothly

- [x] 4.14 **🧪 INTEGRATION TEST: Cursor sync**
  - **Files Created:** `src/__tests__/integration/cursor-sync.test.js`
  - **Tests:**
    - Mock Firebase listeners
    - Simulate two users moving cursors
    - Verify cursor positions update in both "windows"
    - Test that own cursor doesn't show name label
    - Test cursor color assignment
  - **Why:** Critical feature, validates real-time sync logic without manual testing

- [x] 4.15 Hide name label on own cursor
  - **Files Modified:** `src/components/Collaboration/Cursor.jsx`
  - **Content:** Conditional rendering - no label if cursor is current user

**PR Checklist:**
- [x] Can see other users' cursors in real-time
- [x] Cursor positions update smoothly (<50ms delay)
- [x] Name labels show on others' cursors only
- [x] Own cursor visible but no name label
- [x] Cursor colors are distinct per user (assigned on canvas join)
- [x] Cursors update at ~60 FPS
- [x] No lag or jitter in cursor movement
- [x] ✅ Unit tests pass for cursor throttling and color generation
- [x] ✅ Integration test passes for cursor sync

---

### PR #5: Presence Awareness
**Goal:** See who's online and when users join/leave  
**Time Estimate:** 1-2 hours  
**Testing:** ✅ Unit test for PresenceList component

#### Tasks:
- [x] 5.1 Build PresenceList component
  - **Files Created:** `src/components/Collaboration/PresenceList.jsx`
  - **Content:** Display list of online users (names only)

- [x] 5.2 **🧪 UNIT TEST: usePresence hook**
  - **Files Created:** `src/__tests__/hooks/usePresence.test.js`
  - **Tests:**
    - Initial state with and without user
    - Canvas joining success and error handling
    - Presence listener setup and updates
    - User filtering and computed values (otherUsers, counts)
    - Cleanup on unmount and user change
    - Manual leave canvas functionality
    - Edge cases (empty users, errors)
  - **Why:** Core presence functionality, state management logic, critical for multiplayer features

  All below currently working spectacularly without requiring the tasks.
<!-- 
- [ ] 5.3 Update presence on login
  - **Files Modified:** `src/services/auth.js`
  - **Content:** Set user as "online" in Firestore on login

- [ ] 5.4 Update presence on logout
  - **Files Modified:** `src/services/auth.js`
  - **Content:** Set user as "offline" on logout

- [ ] 5.5 Handle disconnect/tab close
  - **Files Modified:** `src/hooks/usePresence.js`
  - **Content:** Use Firebase onDisconnect() to cleanup presence

- [ ] 5.6 Implement heartbeat system
  - **Files Modified:** `src/hooks/usePresence.js`
  - **Content:** Update "lastSeen" timestamp every 30 seconds

- [ ] 5.7 Listen for presence changes
  - **Files Modified:** `src/hooks/usePresence.js`
  - **Content:** Real-time listener for users collection, filter online users

- [ ] 5.8 Add PresenceList to UI
  - **Files Modified:** `src/App.jsx` or create `src/components/Layout/Header.jsx`
  - **Content:** Show presence list in header or sidebar

- [ ] 5.9 Style presence list
  - **Files Modified:** `src/App.css`
  - **Content:** Clean design, show user count, list of names

- [ ] 5.10 Test presence detection
  - Open multiple browsers
  - Verify users appear when they join
  - Close tab and verify user removed
  - Test reconnection -->

**PR Checklist:**
- [x] Online users list shows all active users
- [x] Users appear when they log in
- [x] Users disappear when they log out or close tab
- [x] User count is accurate
- [x] Presence persists through page refresh
- [x] Handles disconnects gracefully
- [x] ✅ Unit tests pass for usePresence hook (18/18 tests passing)

---

### PR #6: Rectangle Creation
**Goal:** Users can create rectangles via toolbox and drag-to-create  
**Time Estimate:** 2-3 hours  
**Testing:** ✅ Unit test for Rectangle component

#### Tasks:
- [x] 6.1 Create Toolbox UI component
  - **Files Created:** `src/components/Canvas/Toolbox.jsx`, `src/components/Canvas/Toolbox.css`
  - **Content:** Modern floating toolbox with select/rectangle tools, keyboard shortcuts, accessibility

- [x] 6.2 Add toolbox to Canvas and handle creation mode
  - **Files Modified:** `src/components/Canvas/Canvas.jsx`
  - **Content:** Integrated toolbox with state management, keyboard shortcuts (V/R/ESC), cursor styles

- [x] 6.3 Implement drag-to-create rectangle logic with visual feedback
  - **Files Modified:** `src/hooks/useCanvas.js`, `src/components/Canvas/Canvas.jsx`
  - **Content:** Full rectangle creation system with preview, coordinate transformation, user colors

- [x] 6.4 Create Rectangle component for rendering & selection
  - **Files Created:** `src/components/Canvas/Rectangle.jsx`
  - **Content:** Full-featured component with click selection, drag movement, event handling, performance optimization

- [x] 6.5 Save created rectangles to Firestore with real-time sync
  - **Files Modified:** `src/hooks/useCanvas.js`, `src/components/Canvas/Canvas.jsx`, `src/App.css`
  - **Content:** Complete Firestore integration with real-time sync, loading states, error handling

- [ ] 6.6 **🧪 UNIT TEST: Rectangle component**
  - **Files Created:** `src/__tests__/components/Rectangle.test.jsx`  
  - **Tests:**
    - Render rectangle with correct dimensions
    - Test rectangle color matches props
    - Test position is correct
    - Test selection states and interactions
    - Mock Konva to avoid canvas issues in tests
  - **Why:** Core visual element, validates props are applied correctly

**PR Checklist:**
- [x] Can create rectangles by dragging with toolbox
- [x] Rectangle size matches drag distance
- [x] Rectangle color matches user's cursor color (from presence) 
- [x] Rectangles save to Firestore with real-time sync
- [x] Can create multiple rectangles
- [x] Can select rectangles by clicking (blue outline)
- [x] Can move rectangles by dragging selected ones
- [x] Multiplayer sync - rectangles appear instantly for all users
- [x] Loading states and error handling for sync issues
- [x] Professional UI with keyboard shortcuts (V/R/ESC)
- [x] Event handling prevents canvas pan when interacting with rectangles
- [ ] ✅ Unit tests pass for Rectangle component

---

# CollabCanvas - Rubric-Optimized Task List

**Current Status:** PRs 1-6 Complete (Auth, Canvas, Cursor Sync, Presence, Basic Rectangles)  
**Strategy:** Hybrid approach - Quick wins first (secure points), then critical infrastructure, then remaining features  
**Target Score:** 85-95/100 points

---

## Point Tracker by Section

| Section | Max Points | Strategy | Target |
|---------|-----------|----------|--------|
| Core Collaborative Infrastructure | 30 | Must complete all | 27-30 |
| Canvas Features & Performance | 20 | Complete all requirements | 18-20 |
| Advanced Figma Features | 15 | Strategic selection (3+2+1) | 13-15 |
| Technical Implementation | 10 | Already mostly done | 9-10 |
| Documentation & Submission | 5 | Final polish | 5 |
| **TOTAL** | **80** | - | **72-80** |
| Bonus Points | +5 | If time allows | +2-3 |

---

## Updated File Structure for Next Phase

```
collabcanvas/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Auth/ (✅ COMPLETE)
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── AuthForm.jsx
│   │   ├── Canvas/
│   │   │   ├── Canvas.jsx              # ✅ Main canvas component
│   │   │   ├── Rectangle.jsx           # ✅ Individual rectangle
│   │   │   ├── Circle.jsx              # 🔄 PR #7 - NEW
│   │   │   ├── Text.jsx                # 🔄 PR #7 - NEW
│   │   │   ├── Toolbox.jsx             # ✅ Pan/zoom controls
│   │   │   ├── ColorPicker.jsx         # 🔄 PR #8 - NEW
│   │   │   ├── ObjectControls.jsx      # 🔄 PR #11 - NEW
│   │   │   ├── LayersPanel.jsx         # 🔄 PR #11 - NEW
│   │   │   ├── AlignmentTools.jsx      # 🔄 PR #13 - NEW
│   │   │   └── VersionHistory.jsx      # 🔄 PR #14 - NEW
│   │   ├── Collaboration/ (✅ COMPLETE)
│   │   │   ├── Cursor.jsx              # ✅ Other users' cursors
│   │   │   ├── CursorLayer.jsx         # ✅ Manages all cursors
│   │   │   └── PresenceList.jsx        # ✅ Online users list
│   │   └── Layout/
│   │       ├── Header.jsx              # ✅ App header with user info
│   │       ├── ConnectionStatus.jsx    # 🔄 PR #10 - NEW
│   │       └── DarkModeToggle.jsx      # ✅ Existing
│   ├── hooks/
│   │   ├── useAuth.jsx                 # ✅ Authentication hook
│   │   ├── useCanvas.js                # ✅ Canvas state management
│   │   ├── useRealtime.js              # ✅ Firebase realtime sync (enhance PR #9)
│   │   ├── usePresence.js              # ✅ User presence detection
│   │   ├── useCursor.js                # ✅ Cursor position tracking
│   │   ├── useKeyboardShortcuts.js     # 🔄 PR #7 - NEW
│   │   └── useDarkMode.jsx             # ✅ Existing
│   ├── services/
│   │   ├── firebase.js                 # ✅ Firebase config & init
│   │   ├── auth.js                     # ✅ Auth service functions
│   │   ├── firestore.js                # ✅ Firestore operations (enhance PR #9)
│   │   ├── realtime.js                 # ✅ Realtime database operations
│   │   ├── offlineQueue.js             # 🔄 PR #10 - NEW
│   │   └── versionHistory.js           # 🔄 PR #14 - NEW
│   ├── utils/
│   │   ├── colors.js                   # ✅ Random color generator
│   │   ├── canvasHelpers.js            # ✅ Canvas utility functions
│   │   ├── constants.js                # ✅ App constants
│   │   ├── exportCanvas.js             # 🔄 PR #8 - NEW
│   │   ├── performanceMonitor.js       # 🔄 PR #12 - NEW
│   │   └── throttle.js                 # ✅ Existing
│   ├── docs/                           # 🔄 NEW DIRECTORY
│   │   ├── COLLAB_STRATEGIES.md        # 🔄 PR #9 - NEW
│   │   └── ARCHITECTURE.md             # 🔄 PR #16 - NEW
│   ├── __tests__/ (✅ MOSTLY COMPLETE)
│   │   └── [existing test structure]
│   ├── App.jsx                         # ✅ Main app component
│   └── [other existing files]
└── [config files]
```

**Legend:**
- ✅ COMPLETE - Already implemented
- 🔄 NEW/ENHANCE - To be added/enhanced in upcoming PRs

---

## ⚡ PHASE 1: Quick Wins & Foundation

### PR #7: Additional Shapes & Basic Figma Features
**Points Value:** Canvas Features (4pts) + Figma Tier 1 (4pts) = 8pts

#### Tasks:
- [x] 7.1 Add Circle shape component
  - **Files Created:** `src/components/Canvas/Circle.jsx`
  - **Content:** Konva Circle with same interaction patterns as Rectangle

- [x] 7.2 Add Text shape component with basic formatting
  - **Files Created:** `src/components/Canvas/Text.jsx`
  - **Content:** Konva Text with bold, italic, font size controls

- [x] 7.3 Update Toolbox to include Circle and Text tools
  - **Files Modified:** `src/components/Canvas/Toolbox.jsx`
  - **Content:** Add Circle (C) and Text (T) tool buttons with keyboard shortcuts

- [x] 7.4 **Tier 1 Feature: Keyboard shortcuts for common operations**
  - **Files Created:** `src/hooks/useKeyboardShortcuts.js`
  - **Content:** Delete (Del/Backspace), Duplicate (Cmd+D), Arrow keys to move selected, Copy (Cmd+C), Paste (Cmd+V)
  - **Figma Points:** +2pts

- [x] 7.5 **Tier 1 Feature: Copy/paste functionality**
  - **Files Modified:** `src/hooks/useKeyboardShortcuts.js`
  - **Content:** Cmd+C to copy, Cmd+V to paste (with offset), stores in clipboard state - IMPLEMENTED IN 7.4
  - **Figma Points:** +2pts

**PR Checklist:**
- [x] Can create circles and text shapes
- [x] Text has bold/italic/size controls
- [x] Delete key removes selected shapes
- [x] Cmd+D duplicates selected shape
- [x] Arrow keys move selected shape
- [x] Cmd+C/Cmd+V copies and pastes
- [x] All shortcuts work smoothly

**Points Earned:** 8pts

---

### PR #8: Color Picker & Export
**Points Value:** Figma Tier 1 (4pts)

#### Tasks:
- [x] 8.1 **Tier 1 Feature: Color picker with recent colors**
  - **Files Created:** `src/components/Canvas/ColorPicker.jsx`
  - **Content:** Color input, recent colors palette (stores last 8 colors in state)
  - **Figma Points:** +2pts

- [x] 8.2 Integrate color picker into shape properties
  - **Files Modified:** `src/components/Canvas/Canvas.jsx`
  - **Content:** Show color picker when shape selected, update fill color in Firestore

- [x] 8.3 **Tier 1 Feature: Export canvas as PNG**
  - **Files Created:** `src/utils/exportCanvas.js`
  - **Content:** Use Konva's `toDataURL()`, trigger download with current view
  - **Figma Points:** +2pts

- [x] 8.4 Add export button to UI
  - **Files Modified:** `src/components/Layout/Header.jsx`
  - **Content:** "Export PNG" button in header

**PR Checklist:**
- [x] Color picker opens when shape selected
- [x] Can change shape fill color
- [x] Recent colors show in palette
- [x] Export PNG button downloads current canvas view
- [x] Exported PNG has correct dimensions

**Points Earned:** 4pts

---

## 🔥 PHASE 2: Critical Infrastructure

### PR #9: Conflict Resolution System
**Points Value:** Conflict Resolution (8-9pts)

#### Tasks:
- [ ] 9.1 Create collaboration strategy document
  - **Files Created:** `docs/COLLAB_STRATEGIES.md`
  - **Content:** Document last-write-wins strategy, timestamp logic, conflict scenarios

- [ ] 9.2 Add timestamp to all object operations
  - **Files Modified:** `src/services/firestore.js`
  - **Content:** Every create/update includes `lastModified: serverTimestamp()` and `lastModifiedBy: userId`

- [ ] 9.3 Implement last-write-wins logic
  - **Files Modified:** `src/hooks/useRealtime.js`
  - **Content:** Compare timestamps on incoming updates, only apply if newer

- [ ] 9.4 Add visual feedback for "who last edited"
  - **Files Modified:** `src/components/Canvas/Rectangle.jsx`, `Circle.jsx`, `Text.jsx`
  - **Content:** Show colored border with editor's name on hover (fades after 3 seconds)

- [ ] 9.5 Handle rapid edit storms (10+ changes/sec)
  - **Files Modified:** `src/hooks/useCanvas.js`
  - **Content:** Debounce Firestore writes (100ms), batch updates

- [ ] 9.6 Test conflict scenarios
  - **Manual Testing:** See testing checklist below

**PR Checklist:**
- [ ] Two users edit same object → both see consistent final state
- [ ] Visual indicator shows who last edited (colored border)
- [ ] Rapid edits (10+ changes/sec) don't corrupt state
- [ ] No "ghost" objects or duplicates
- [ ] `COLLAB_STRATEGIES.md` clearly documents approach

**Points Earned:** 8-9pts

---

### PR #10: Persistence & Reconnection System
**Points Value:** Persistence & Reconnection (8-9pts)

#### Tasks:
- [ ] 10.1 Implement connection status indicator
  - **Files Created:** `src/components/Layout/ConnectionStatus.jsx`
  - **Content:** Green/yellow/red indicator, shows "Connected", "Reconnecting...", "Offline"

- [ ] 10.2 Handle page refresh mid-operation
  - **Files Modified:** `src/hooks/useCanvas.js`
  - **Content:** Save pending operations to localStorage before unmount, restore on mount

- [ ] 10.3 Implement offline operation queue
  - **Files Created:** `src/services/offlineQueue.js`
  - **Content:** Queue operations during disconnect, sync on reconnect

- [ ] 10.4 Test persistence scenarios
  - **Manual Testing:** See testing checklist below

**PR Checklist:**
- [ ] User refreshes mid-edit → returns to exact state
- [ ] All users disconnect → canvas persists fully
- [ ] Network drop (simulate offline) → auto-reconnects with complete state
- [ ] Operations during disconnect queue and sync on reconnect
- [ ] Connection status indicator shows current state

**Points Earned:** 8-9pts

---

## 🎨 PHASE 3: Canvas Features & Performance

### PR #11: Transform Operations & Layer Management
**Points Value:** Canvas Features (4pts) + Figma Tier 2 (3pts) = 7pts

#### Tasks:
- [ ] 11.1 Add resize handles to shapes
  - **Files Modified:** `src/components/Canvas/Rectangle.jsx`, `Circle.jsx`, `Text.jsx`
  - **Content:** Konva Transformer component with resize handles on all corners

- [ ] 11.2 Add rotation handle to shapes
  - **Files Modified:** (same as above)
  - **Content:** Rotation handle on Transformer, update rotation in Firestore

- [ ] 11.3 **Tier 2 Feature: Z-index management (bring to front/send to back)**
  - **Files Modified:** `src/hooks/useCanvas.js`
  - **Content:** Add `zIndex` field to objects, functions to reorder
  - **Figma Points:** +3pts

- [ ] 11.4 Add z-index UI controls
  - **Files Created:** `src/components/Canvas/ObjectControls.jsx`
  - **Content:** Buttons for "Bring to Front", "Send to Back" when shape selected

- [ ] 11.5 **Tier 2 Feature: Layers panel with drag-to-reorder**
  - **Files Created:** `src/components/Canvas/LayersPanel.jsx`
  - **Content:** Sidebar showing all objects, click to select, drag to reorder z-index
  - **Figma Points:** +3pts

**PR Checklist:**
- [ ] Can resize shapes with corner handles
- [ ] Can rotate shapes with rotation handle
- [ ] "Bring to Front" and "Send to Back" buttons work
- [ ] Layers panel shows all objects
- [ ] Click object in layers panel selects it on canvas
- [ ] Drag in layers panel reorders z-index

**Points Earned:** 7pts

---

### PR #12: Performance Optimization for 1000+ Objects
**Points Value:** Canvas Performance (4pts) + Scale Bonus (+1pt) = 5pts

#### Tasks:
- [ ] 12.1 Refactor to single Firestore document for all objects
  - **Files Modified:** `src/services/firestore.js`, `src/hooks/useRealtime.js`
  - **Content:** Store all objects in `canvas.objects` array instead of separate docs

- [ ] 12.2 Implement React.memo on shape components
  - **Files Modified:** `src/components/Canvas/Rectangle.jsx`, `Circle.jsx`, `Text.jsx`
  - **Content:** Wrap exports in `React.memo()`, prevent unnecessary re-renders

- [ ] 12.3 Add performance monitoring
  - **Files Created:** `src/utils/performanceMonitor.js`
  - **Content:** Track FPS, log warnings if drops below 60

- [ ] 12.4 Test with 1000+ objects
  - **Manual Testing:** Create 1000 rectangles, verify 60 FPS maintained

**PR Checklist:**
- [ ] Canvas loads with 1000+ objects in <2 seconds
- [ ] Pan/zoom maintains 60 FPS with 1000+ objects
- [ ] No lag when creating new shapes
- [ ] Memory usage stays reasonable

**Points Earned:** 5pts

---

## 🚀 PHASE 4: Remaining Figma Features

### PR #13: Alignment Tools & Snap-to-Grid
**Points Value:** Figma Tier 1 (2pts) + Tier 2 (3pts) = 5pts

#### Tasks:
- [ ] 13.1 **Tier 1 Feature: Snap-to-grid**
  - **Files Modified:** `src/hooks/useCanvas.js`
  - **Content:** Enable/disable snap-to-grid (10px grid), snap object position on drag
  - **Figma Points:** +2pts

- [ ] 13.2 Add snap-to-grid toggle button
  - **Files Modified:** `src/components/Canvas/Toolbox.jsx`
  - **Content:** Checkbox to enable/disable snap (keyboard shortcut Cmd+')

- [ ] 13.3 **Tier 2 Feature: Alignment tools**
  - **Files Created:** `src/components/Canvas/AlignmentTools.jsx`
  - **Content:** Buttons for align left/center/right/top/middle/bottom
  - **Figma Points:** +3pts

- [ ] 13.4 Implement alignment logic
  - **Files Modified:** `src/hooks/useCanvas.js`
  - **Content:** Calculate bounds of selected objects, align to min/max/center

**PR Checklist:**
- [ ] Snap-to-grid toggle works
- [ ] Objects snap to 10px grid when enabled
- [ ] Alignment tools align selected objects correctly
- [ ] All 6 alignment options work (left/center/right/top/middle/bottom)

**Points Earned:** 5pts

---

### PR #14: Version History (Tier 3 Feature)
**Points Value:** Figma Tier 3 (3pts)

#### Tasks:
- [ ] 14.1 **Tier 3 Feature: Version history with restore**
  - **Files Created:** `src/services/versionHistory.js`
  - **Content:** Save canvas snapshot every 5 minutes to Firestore `versions` collection
  - **Figma Points:** +3pts

- [ ] 14.2 Build version history UI
  - **Files Created:** `src/components/Canvas/VersionHistory.jsx`
  - **Content:** Modal showing list of versions (timestamp + thumbnail), click to restore

- [ ] 14.3 Implement restore functionality
  - **Files Modified:** `src/hooks/useCanvas.js`
  - **Content:** Load selected version, replace current canvas state

**PR Checklist:**
- [ ] Canvas auto-saves version snapshots every 5 minutes
- [ ] Version history modal shows list of past versions
- [ ] Can restore to previous version
- [ ] Restored version syncs to all users

**Points Earned:** 3pts

---

## 🐛 PHASE 5: Bug Fixes & Polish

### PR #15: Multi-Select Drag Fix & Real-Time Optimization
**Points Value:** Real-Time Sync Performance (2-3pts)

#### Tasks:
- [ ] 15.1 Fix multi-select drag bug
  - **Files Modified:** `src/components/Canvas/Canvas.jsx`, `src/hooks/useCanvas.js`
  - **Content:** Ensure all selected objects move simultaneously, not just most recent
  - **Issue:** First selected object moves on click release instead of immediately
  - **Solution:** Batch update positions for all selected objects in single state update

- [ ] 15.2 Optimize cursor sync to sub-50ms
  - **Files Modified:** `src/hooks/useCursor.js`
  - **Content:** Reduce throttle to 30ms (from 60ms), use WebSocket if available

- [ ] 15.3 Optimize object sync to sub-100ms
  - **Files Modified:** `src/hooks/useRealtime.js`
  - **Content:** Use Firestore's real-time listeners with local cache, enable persistence

**PR Checklist:**
- [ ] Multi-select drag moves all objects simultaneously
- [ ] Cursor sync measures <50ms delay (test with network tab)
- [ ] Object sync measures <100ms delay
- [ ] No visible lag during rapid edits

**Points Earned:** 2-3pts

---

## 📄 PHASE 6: Documentation & Final Polish

### PR #16: Documentation & Deployment
**Points Value:** Documentation (5pts) + Technical Implementation (bonus 1-2pts) = 6-7pts

#### Tasks:
- [ ] 16.1 Update README with comprehensive setup guide
  - **Files Modified:** `README.md`
  - **Content:** 
    - Clear setup instructions
    - Architecture overview
    - Feature list with screenshots
    - Known issues section
    - Deployment instructions

- [ ] 16.2 Create architecture documentation
  - **Files Created:** `docs/ARCHITECTURE.md`
  - **Content:** 
    - System design diagram
    - Data flow explanation
    - Technology stack rationale
    - Performance optimization strategies

- [ ] 16.3 Final deployment verification
  - **Tasks:**
    - Deploy to production
    - Test with 5 concurrent users
    - Verify all features work on deployed URL
    - Record demo video if needed

**PR Checklist:**
- [ ] README is comprehensive and clear
- [ ] Architecture is documented
- [ ] Deployment is stable
- [ ] Public URL supports 5+ concurrent users
- [ ] All features work in production

**Points Earned:** 5-7pts

---

## Manual Testing Checklist

### Conflict Resolution Tests (9 points)
Record screen for these scenarios:

**Test 1: Simultaneous Move**
- [ ] Open 2 browser windows (User A and User B)
- [ ] Both users select the same rectangle
- [ ] Both users drag it simultaneously to different positions
- [ ] **Expected:** Both see final position (last write wins), no duplicate rectangles
- [ ] **Verify:** Colored border shows who last edited

**Test 2: Rapid Edit Storm**
- [ ] User A rapidly resizes object (10+ times in 5 seconds)
- [ ] User B simultaneously changes its color rapidly
- [ ] User C simultaneously moves it rapidly
- [ ] **Expected:** All changes eventually converge to consistent state, no corruption

**Test 3: Delete vs Edit**
- [ ] User A starts editing an object (dragging)
- [ ] User B deletes the same object mid-drag
- [ ] **Expected:** Object disappears for both users, no ghost objects

**Test 4: Create Collision**
- [ ] User A and User B both create rectangles at nearly the same time
- [ ] **Expected:** Both rectangles appear, no duplicates, each has unique ID

---

### Persistence & Reconnection Tests (9 points)

**Test 5: Mid-Operation Refresh**
- [ ] User drags object halfway across canvas
- [ ] Press F5 (refresh) mid-drag
- [ ] **Expected:** Object position preserved at last saved state

**Test 6: Total Disconnect**
- [ ] Multiple users collaborate on canvas
- [ ] All users close browsers
- [ ] Wait 2 minutes
- [ ] All users reopen canvas
- [ ] **Expected:** Full canvas state intact, all objects present

**Test 7: Network Simulation**
- [ ] Open Chrome DevTools → Network tab → Set throttling to "Offline"
- [ ] Make 5 rapid edits while offline
- [ ] Restore network connection
- [ ] **Expected:** Canvas syncs without data loss, queued operations apply

**Test 8: Rapid Disconnect**
- [ ] User makes 5 rapid edits
- [ ] Immediately closes tab (don't wait)
- [ ] **Expected:** Other users see all 5 edits persist

---

### Real-Time Sync Tests (12 points)

**Test 9: Cursor Sync Speed**
- [ ] Open 2 browser windows
- [ ] Move cursor rapidly in User A window
- [ ] Observe User B window
- [ ] **Expected:** Cursor updates in <50ms (smooth, no jitter)

**Test 10: Object Sync Speed**
- [ ] User A creates rectangle
- [ ] Start timer
- [ ] **Expected:** Appears in User B window in <100ms

**Test 11: Rapid Multi-User Edits**
- [ ] 3+ users edit different objects simultaneously
- [ ] All users make rapid changes for 30 seconds
- [ ] **Expected:** Zero visible lag, all changes sync correctly

---

### Canvas Performance Tests (8 points)

**Test 12: 1000+ Objects at 60 FPS**
- [ ] Create 1000 rectangles on canvas (use script if needed)
- [ ] Open browser DevTools → Performance tab
- [ ] Pan and zoom canvas for 30 seconds
- [ ] **Expected:** FPS stays at 60, no dropped frames

**Test 13: Multi-Select & Transform**
- [ ] Create 10 objects
- [ ] Shift-click to select all 10
- [ ] Drag, resize, and rotate the selection
- [ ] **Expected:** All 10 objects transform simultaneously, smoothly

---

### Advanced Features Tests (15 points)

**Test 14: Keyboard Shortcuts**
- [ ] Create object, press Delete → object deletes
- [ ] Select object, press Cmd+D → duplicates
- [ ] Select object, press arrow keys → moves by 10px
- [ ] Select object, press Cmd+C then Cmd+V → copies and pastes

**Test 15: Color Picker & Export**
- [ ] Select object, open color picker, change color → color updates
- [ ] Change 3 different colors → recent colors palette shows last 3
- [ ] Click "Export PNG" → downloads current canvas view

**Test 16: Alignment & Snap**
- [ ] Enable snap-to-grid → objects snap to 10px grid
- [ ] Select 3 objects, click "Align Left" → all align to leftmost
- [ ] Select 3 objects, click "Distribute Evenly" → equal spacing

**Test 17: Layers & Z-Index**
- [ ] Create 3 overlapping rectangles
- [ ] Select bottom rectangle, click "Bring to Front" → moves to top
- [ ] Open layers panel → shows all 3 objects
- [ ] Click object in layers panel → selects on canvas

**Test 18: Version History**
- [ ] Create 5 objects, wait 5 minutes
- [ ] Delete all objects
- [ ] Open version history → shows previous version
- [ ] Click "Restore" → all 5 objects return

---

## Final Deliverables Checklist

- [ ] All PRs merged and tested
- [ ] Deployed to public URL
- [ ] `COLLAB_STRATEGIES.md` documents conflict resolution
- [ ] `ARCHITECTURE.md` documents system design
- [ ] README has screenshots and setup guide
- [ ] Manual testing checklist completed (18 tests)
- [ ] Screen recordings of critical tests (conflict resolution, persistence)
- [ ] Performance verified (1000+ objects, 60 FPS)
- [ ] 5+ concurrent users tested on deployed URL

---

## Next Steps

1. **Start with PR #7** (Shapes & Quick Wins)
2. **Test manually after each merge** - catch bugs early
3. **Record screen for Tests 1-8** - proof for rubric grading
4. **Deploy continuously** - don't leave deployment for last

**Let's ship it! 🚀**

---

## Testing Protocol (Run Before Each PR)

### Pre-Merge Checklist:
1. **Local Testing**
   - [ ] App runs without errors
   - [ ] New feature works as expected
   - [ ] No regressions in existing features
   - [ ] **✅ Run tests: `npm test` - all tests must pass**

2. **Multi-User Testing**
   - [ ] Open 2 browser windows
   - [ ] Test new feature in both windows
   - [ ] Verify sync works

3. **Code Quality**
   - [ ] No console.log statements (or commented out)
   - [ ] No commented-out code
   - [ ] Consistent formatting
   - [ ] Meaningful variable names
   - [ ] **✅ Tests added for new functionality (when applicable)**

4. **Documentation**
   - [ ] Update README if needed
   - [ ] Add comments for complex logic
   - [ ] Update .env.example if new env vars
   - [ ] **✅ Test files documented with clear test descriptions**

---

## Test Coverage Summary

### Unit Tests (8 test files):
1. ✅ **`colors.test.js`** - Color generation logic
2. ✅ **`canvasHelpers.test.js`** - Coordinate transformations
3. ✅ **`constants.test.js`** - Configuration validation
4. ✅ **`auth.test.js`** - Authentication functions
5. ✅ **`firestore.test.js`** - Database operations
6. ✅ **`useCursor.test.js`** - Cursor throttling
7. ✅ **`useCanvas.test.js`** - Canvas state management
8. ✅ **`Rectangle.test.jsx`** - Rectangle component rendering
9. ✅ **`PresenceList.test.jsx`** - Presence list rendering

### Integration Tests (2 test files):
1. ✅ **`cursor-sync.test.js`** - Real-time cursor synchronization
2. ✅ **`rectangle-sync.test.js`** - Real-time rectangle synchronization

### Why These Tests Matter:
- **Pure functions** (colors, canvas helpers) - Easy to test, catch edge cases
- **Critical services** (auth, firestore) - Prevent regressions in core functionality
- **Performance** (cursor throttling) - Validates 60 FPS requirement
- **State management** (useCanvas) - Complex logic prone to bugs
- **Real-time sync** (integration tests) - Most critical MVP feature, hardest to manually test
- **UI components** (Rectangle, PresenceList) - Validates props and rendering

### What's NOT Tested (Manual Only):
- End-to-end flows (login → create → move → logout)
- Visual styling and layout
- Browser compatibility
- Network throttling scenarios
- 5+ concurrent user load testing
- Pan/zoom smoothness (requires human eye test)

---

## Critical Success Factors

### Must Have by MVP (24 Hours):
✅ All 10 PRs merged and tested  
✅ Deployed to public URL  
✅ 2+ users can collaborate simultaneously  
✅ Multiplayer cursors with name labels (except own cursor)  
✅ Rectangle creation and movement  
✅ Real-time sync working  
✅ Presence awareness  
✅ State persistence  
✅ User authentication  

### If Running Behind:
**Prioritize in this order:**
1. PR #4 (Cursor Sync) - Proves real-time works
2. PR #6 & #7 (Rectangle creation & sync) - Core functionality
3. PR #8 (Movement) - Completes MVP features
4. Everything else - Can be simplified or skipped

**Potential Shortcuts:**
- Simplify UI styling (focus on functionality)
- Skip error handling polish (add try/catch basics)
- Reduce testing time (but test with 2 users minimum)
- Use Firebase Auth UI library (pre-built components)

---

## Next Steps

1. **Create GitHub repo** and push initial commit
2. **Start with PR #1** - Get deployed fast
3. **Test with 2 browsers** from PR #4 onward
4. **Deploy after each PR** to catch issues early
5. **Track time** - If a PR takes >3 hours, simplify

**Remember:** A working, simple app beats a broken, feature-rich app. Ship fast, test continuously, and don't over-engineer!

Ready to start coding? Begin with PR #1! 🚀