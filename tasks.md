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
- [x] Initialize React app with Create React App or Vite
  - **Files:** All base files in structure above
  
- [x] Install core dependencies
  - **Command:** `npm install firebase react-konva konva`
  - **Command:** `npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest jsdom`
  - **Files:** `package.json`, `package-lock.json`

- [x] Setup Firebase project in console
  - Create new Firebase project
  - Enable Firestore Database
  - Enable Authentication (Email/Password)
  - Get Firebase config credentials

- [x] Configure Firebase in project
  - **Files Created:** `src/services/firebase.js`, `.env`, `.env.example`
  - **Content:** Firebase initialization, config from environment variables

- [x] Create basic app structure
  - **Files Created:** `src/App.jsx`, `src/App.css`, `src/index.js`
  - **Content:** Simple "Hello World" component

- [x] Setup environment variables
  - **Files Created:** `.env` (gitignored), `.env.example`
  - **Content:** Firebase API keys and config

- [x] Configure .gitignore
  - **Files:** `.gitignore`
  - **Content:** Add `/node_modules`, `.env`, build folders

- [x] Deploy to hosting platform
  - Choose: Vercel, Firebase Hosting, or AWS
  - Test public URL works
  - **Files:** May need `vercel.json` or `firebase.json`

- [x] Update README with setup instructions
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
- [x] Create auth service functions
  - **Files Created:** `src/services/auth.js`
  - **Functions:** `signUp(email, password, displayName)`, `signIn(email, password)`, `signOut()`, `getCurrentUser()`

- [x] **🧪 UNIT TEST: Auth service functions**
  - **Files Created:** `src/__tests__/services/auth.test.js`
  - **Tests:**
    - Mock Firebase auth methods
    - Test `signUp()` creates user with correct data
    - Test `signIn()` returns user object
    - Test `signOut()` clears session
    - Test `getCurrentUser()` returns null when not logged in
    - Test error handling for invalid credentials
  - **Why:** Auth is critical and pure functions are easy to test

- [x] Create auth context/hook
  - **Files Created:** `src/hooks/useAuth.js`
  - **Content:** Custom hook for auth state, user object, loading state

- [x] Build Signup component
  - **Files Created:** `src/components/Auth/Signup.jsx`
  - **Content:** Email, password, optional display name inputs, error handling
  
- [x] Build Login component
  - **Files Created:** `src/components/Auth/Login.jsx`
  - **Content:** Email, password inputs, error handling

- [x] Create auth form wrapper
  - **Files Created:** `src/components/Auth/AuthForm.jsx`
  - **Content:** Switch between login/signup, styling

- [x] Update App.jsx with auth routing
  - **Files Modified:** `src/App.jsx`
  - **Content:** Show auth forms if not logged in, show canvas if logged in

- [x] Store user profile in Firestore
  - **Files Modified:** `src/services/firestore.js`
  - **Content:** Create user document with `{ id, email, displayName, createdAt }`

- [x] Test authentication flow
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
- [ ] Create constants file
  - **Files Created:** `src/utils/constants.js`
  - **Content:** `CANVAS_WIDTH = 4000`, `CANVAS_HEIGHT = 4000`, `INITIAL_ZOOM = 1`

- [ ] **🧪 UNIT TEST: Constants**
  - **Files Created:** `src/__tests__/utils/constants.test.js`
  - **Tests:**
    - Verify canvas dimensions are correct
    - Verify zoom limits are reasonable
    - Test all constants are exported
  - **Why:** Simple validation, ensures no typos

- [ ] Build main Canvas component
  - **Files Created:** `src/components/Canvas/Canvas.jsx`
  - **Content:** Konva Stage and Layer setup, 4000x4000 workspace

- [ ] Implement pan functionality
  - **Files Modified:** `src/components/Canvas/Canvas.jsx`
  - **Content:** Drag Stage to pan, track stage position

- [ ] Implement zoom functionality
  - **Files Modified:** `src/components/Canvas/Canvas.jsx`
  - **Content:** Mouse wheel to zoom, pinch to zoom, limit zoom levels (0.1x to 5x)

- [ ] Add canvas state hook
  - **Files Created:** `src/hooks/useCanvas.js`
  - **Content:** Manage canvas state (objects array, selected object, zoom, pan position)

- [ ] Create canvas helpers
  - **Files Created:** `src/utils/canvasHelpers.js`
  - **Content:** Helper functions for coordinate transformations, bounds checking

- [ ] **🧪 UNIT TEST: Canvas helpers**
  - **Files Created:** `src/__tests__/utils/canvasHelpers.test.js`
  - **Tests:**
    - Test coordinate transformation (screen to canvas)
    - Test bounds checking (is point in canvas?)
    - Test zoom calculations
    - Test edge cases (negative coords, out of bounds)
  - **Why:** Math-heavy pure functions, prone to off-by-one errors

- [ ] Style canvas container
  - **Files Modified:** `src/App.css`
  - **Content:** Full-screen canvas, no scrollbars, cursor styles

- [ ] Add canvas to App
  - **Files Modified:** `src/App.jsx`
  - **Content:** Render Canvas component when user is authenticated

- [ ] Test pan and zoom performance
  - Verify 60 FPS during pan/zoom
  - Test on trackpad and mouse
  - Test zoom limits work

**PR Checklist:**
- [ ] Canvas renders at 4000x4000
- [ ] Smooth panning with mouse drag
- [ ] Smooth zooming with wheel/pinch
- [ ] Zoom limits prevent extreme zoom levels
- [ ] No visible boundaries (feels infinite)
- [ ] 60 FPS maintained during interactions
- [ ] ✅ All unit tests pass for canvas helpers

---

### PR #4: Cursor Sync (First Real-Time Feature!)
**Goal:** See other users' cursors moving in real-time  
**Time Estimate:** 3-4 hours  
**Testing:** ✅ Unit tests for cursor hook and color generation + Integration test for sync

#### Tasks:
- [ ] Setup Firestore presence system
  - **Files Modified:** `src/services/firestore.js`
  - **Content:** Functions to update/read user presence, heartbeat system

- [ ] Create color generation utility
  - **Files Created:** `src/utils/colors.js`
  - **Content:** `generateRandomColor()` function for cursor colors

- [ ] **🧪 UNIT TEST: Color generation**
  - **Files Created:** `src/__tests__/utils/colors.test.js`
  - **Tests:**
    - Test `generateRandomColor()` returns valid hex color
    - Test colors are sufficiently distinct (no white/black)
    - Test color format is correct (#RRGGBB)
    - Test randomness (call 10 times, get different results)
  - **Why:** Pure function, easy to test, critical for UX

- [ ] Assign cursor color when joining canvas
  - **Files Modified:** `src/hooks/usePresence.js` or `src/services/firestore.js`
  - **Content:** Generate and assign random color when user first joins canvas, store in presence document

- [ ] Create cursor tracking hook
  - **Files Created:** `src/hooks/useCursor.js`
  - **Content:** Track local cursor position, throttle updates to 60 FPS

- [ ] **🧪 UNIT TEST: Cursor throttling**
  - **Files Created:** `src/__tests__/hooks/useCursor.test.js`
  - **Tests:**
    - Mock timers to test throttling works
    - Test cursor updates are limited to 60 FPS (16ms intervals)
    - Test cursor position updates correctly
    - Test cleanup on unmount
  - **Why:** Throttling is critical for performance, easy to test with mocks

- [ ] Create presence hook
  - **Files Created:** `src/hooks/usePresence.js`
  - **Content:** Track online users, listen for presence changes

- [ ] Build Cursor component
  - **Files Created:** `src/components/Collaboration/Cursor.jsx`
  - **Content:** Render single cursor with name label, colored cursor icon

- [ ] Build CursorLayer component
  - **Files Created:** `src/components/Collaboration/CursorLayer.jsx`
  - **Content:** Render all other users' cursors on canvas

- [ ] Setup realtime cursor sync
  - **Files Created:** `src/services/realtime.js`
  - **Content:** Broadcast cursor position, listen to others' positions

- [ ] Integrate cursor layer into Canvas
  - **Files Modified:** `src/components/Canvas/Canvas.jsx`
  - **Content:** Add CursorLayer above canvas objects

- [ ] Throttle cursor updates
  - **Files Modified:** `src/hooks/useCursor.js`
  - **Content:** Use requestAnimationFrame or lodash throttle (16ms)

- [ ] Hide name label on own cursor
  - **Files Modified:** `src/components/Collaboration/Cursor.jsx`
  - **Content:** Conditional rendering - no label if cursor is current user

- [ ] Test with multiple browser windows
  - Open 2-3 browser windows
  - Log in as different users
  - Verify cursors sync smoothly

- [ ] **🧪 INTEGRATION TEST: Cursor sync**
  - **Files Created:** `src/__tests__/integration/cursor-sync.test.js`
  - **Tests:**
    - Mock Firebase listeners
    - Simulate two users moving cursors
    - Verify cursor positions update in both "windows"
    - Test that own cursor doesn't show name label
    - Test cursor color assignment
  - **Why:** Critical feature, validates real-time sync logic without manual testing

**PR Checklist:**
- [ ] Can see other users' cursors in real-time
- [ ] Cursor positions update smoothly (<50ms delay)
- [ ] Name labels show on others' cursors only
- [ ] Own cursor visible but no name label
- [ ] Cursor colors are distinct per user (assigned on canvas join)
- [ ] Cursors update at ~60 FPS
- [ ] No lag or jitter in cursor movement
- [ ] ✅ Unit tests pass for cursor throttling and color generation
- [ ] ✅ Integration test passes for cursor sync

---

### PR #5: Presence Awareness
**Goal:** See who's online and when users join/leave  
**Time Estimate:** 1-2 hours  
**Testing:** ✅ Unit test for PresenceList component

#### Tasks:
- [ ] Build PresenceList component
  - **Files Created:** `src/components/Collaboration/PresenceList.jsx`
  - **Content:** Display list of online users (names only)

- [ ] **🧪 UNIT TEST: PresenceList component**
  - **Files Created:** `src/__tests__/components/PresenceList.test.jsx`
  - **Tests:**
    - Render with empty user list (shows "No users online")
    - Render with multiple users (shows all names)
    - Test user count displays correctly
    - Test correct user is highlighted (current user)
    - Test sorting (alphabetical or by join time)
  - **Why:** UI component, easy to test rendering logic

- [ ] Update presence on login
  - **Files Modified:** `src/services/auth.js`
  - **Content:** Set user as "online" in Firestore on login

- [ ] Update presence on logout
  - **Files Modified:** `src/services/auth.js`
  - **Content:** Set user as "offline" on logout

- [ ] Handle disconnect/tab close
  - **Files Modified:** `src/hooks/usePresence.js`
  - **Content:** Use Firebase onDisconnect() to cleanup presence

- [ ] Implement heartbeat system
  - **Files Modified:** `src/hooks/usePresence.js`
  - **Content:** Update "lastSeen" timestamp every 30 seconds

- [ ] Listen for presence changes
  - **Files Modified:** `src/hooks/usePresence.js`
  - **Content:** Real-time listener for users collection, filter online users

- [ ] Add PresenceList to UI
  - **Files Modified:** `src/App.jsx` or create `src/components/Layout/Header.jsx`
  - **Content:** Show presence list in header or sidebar

- [ ] Style presence list
  - **Files Modified:** `src/App.css`
  - **Content:** Clean design, show user count, list of names

- [ ] Test presence detection
  - Open multiple browsers
  - Verify users appear when they join
  - Close tab and verify user removed
  - Test reconnection

**PR Checklist:**
- [ ] Online users list shows all active users
- [ ] Users appear when they log in
- [ ] Users disappear when they log out or close tab
- [ ] User count is accurate
- [ ] Presence persists through page refresh
- [ ] Handles disconnects gracefully
- [ ] ✅ Unit tests pass for PresenceList component

---

### PR #6: Rectangle Creation
**Goal:** Users can drag-to-create rectangles  
**Time Estimate:** 2-3 hours  
**Testing:** ✅ Unit test for Rectangle component

#### Tasks:
- [ ] Create Rectangle component
  - **Files Created:** `src/components/Canvas/Rectangle.jsx`
  - **Content:** Konva Rect with props for position, size, color

- [ ] **🧪 UNIT TEST: Rectangle component**
  - **Files Created:** `src/__tests__/components/Rectangle.test.jsx`
  - **Tests:**
    - Render rectangle with correct dimensions
    - Test rectangle color matches props
    - Test position is correct
    - Test rectangle is visible
    - Mock Konva to avoid canvas issues in tests
  - **Why:** Core visual element, validates props are applied correctly

- [ ] Create CanvasObjects component
  - **Files Created:** `src/components/Canvas/CanvasObjects.jsx`
  - **Content:** Map over objects array and render Rectangle components

- [ ] Add rectangle creation to Canvas
  - **Files Modified:** `src/components/Canvas/Canvas.jsx`
  - **Content:** Mouse down/move/up handlers for drag-to-create

- [ ] Implement drag-to-create logic
  - **Files Modified:** `src/hooks/useCanvas.js`
  - **Content:** Track drag start, calculate width/height during drag, create object on mouse up

- [ ] Generate rectangle with user's cursor color
  - **Files Modified:** `src/hooks/useCanvas.js`
  - **Content:** Use current user's cursor color (from presence) for new rectangle

- [ ] Add rectangle to local state
  - **Files Modified:** `src/hooks/useCanvas.js`
  - **Content:** Add new rectangle to objects array

- [ ] Create Firestore write functions
  - **Files Modified:** `src/services/firestore.js`
  - **Content:** `createObject(canvasId, object)`, `updateObject(objectId, updates)`

- [ ] Save rectangle to Firestore
  - **Files Modified:** `src/hooks/useCanvas.js`
  - **Content:** After creating rectangle locally, save to Firestore

- [ ] Test rectangle creation
  - Drag on canvas to create rectangles
  - Verify size matches drag distance
  - Verify color matches user's cursor color
  - Check Firestore to confirm data saved

**PR Checklist:**
- [ ] Can create rectangles by dragging
- [ ] Rectangle size matches drag distance
- [ ] Rectangle color matches user's cursor color (from presence)
- [ ] Rectangles save to Firestore
- [ ] Can create multiple rectangles
- [ ] No errors in console
- [ ] ✅ Unit tests pass for Rectangle component

---

### PR #7: Rectangle Sync (Critical!)
**Goal:** All users see rectangles created by anyone in real-time  
**Time Estimate:** 2-3 hours  
**Testing:** ✅ Integration test for rectangle sync

#### Tasks:
- [ ] Create realtime sync hook
  - **Files Created:** `src/hooks/useRealtime.js`
  - **Content:** Listen to Firestore changes, sync local state with database

- [ ] Setup Firestore listener for objects
  - **Files Modified:** `src/hooks/useRealtime.js`
  - **Content:** `onSnapshot` listener for canvas objects collection

- [ ] Update local state on remote changes
  - **Files Modified:** `src/hooks/useCanvas.js`
  - **Content:** When Firestore updates, merge changes into local state

- [ ] Handle create events
  - **Files Modified:** `src/hooks/useRealtime.js`
  - **Content:** When new object created remotely, add to local canvas

- [ ] Handle update events
  - **Files Modified:** `src/hooks/useRealtime.js`
  - **Content:** When object updated remotely, update local version

- [ ] Prevent sync loops
  - **Files Modified:** `src/hooks/useCanvas.js`
  - **Content:** Don't sync back changes that came from Firestore

- [ ] Implement "last write wins" conflict resolution
  - **Files Modified:** `src/services/firestore.js`
  - **Content:** Use timestamps, later timestamp wins

- [ ] Test rectangle sync
  - Open 2 browser windows
  - Create rectangle in window 1
  - Verify appears in window 2
  - Create rectangle in window 2
  - Verify appears in window 1

- [ ] **🧪 INTEGRATION TEST: Rectangle sync**
  - **Files Created:** `src/__tests__/integration/rectangle-sync.test.js`
  - **Tests:**
    - Mock Firestore listeners
    - Simulate user 1 creating rectangle
    - Verify rectangle appears in user 2's state
    - Test simultaneous creation (no duplicates)
    - Test "last write wins" conflict resolution
    - Verify sync prevents infinite loops
  - **Why:** Most critical feature, validates core collaboration logic

**PR Checklist:**
- [ ] Rectangles created by one user appear for all users
- [ ] Sync happens in <100ms (feels instant)
- [ ] No duplicate rectangles
- [ ] No sync loops or infinite updates
- [ ] Handles simultaneous creation gracefully
- [ ] Tested with 2+ users
- [ ] ✅ Integration test passes for rectangle sync

---

### PR #8: Rectangle Movement & Selection
**Goal:** Select and move rectangles, synced across users  
**Time Estimate:** 2-3 hours  
**Testing:** ✅ Unit test for canvas state management

#### Tasks:
- [ ] Add selection to Rectangle component
  - **Files Modified:** `src/components/Canvas/Rectangle.jsx`
  - **Content:** Click handler to select rectangle, visual indication when selected

- [ ] Track selected object in state
  - **Files Modified:** `src/hooks/useCanvas.js`
  - **Content:** Add `selectedObjectId` to state

- [ ] **🧪 UNIT TEST: Canvas state management**
  - **Files Created:** `src/__tests__/hooks/useCanvas.test.js`
  - **Tests:**
    - Test object selection updates state
    - Test object movement updates position
    - Test deselection clears selected object
    - Test multiple objects tracked correctly
    - Mock Firestore to avoid real database calls
  - **Why:** Complex state logic, prone to bugs, critical for UX

- [ ] Implement rectangle dragging
  - **Files Modified:** `src/components/Canvas/Rectangle.jsx`
  - **Content:** Konva drag handlers, update position on drag

- [ ] Update local position during drag
  - **Files Modified:** `src/hooks/useCanvas.js`
  - **Content:** Optimistically update local state while dragging

- [ ] Debounce Firestore updates during drag
  - **Files Modified:** `src/hooks/useCanvas.js`
  - **Content:** Only save to Firestore on drag end, not during drag

- [ ] Save final position to Firestore
  - **Files Modified:** `src/hooks/useCanvas.js`
  - **Content:** On drag end, save new position to database

- [ ] Sync position updates to other users
  - **Files Modified:** `src/hooks/useRealtime.js`
  - **Content:** Listen for position updates, update local rectangles

- [ ] Handle deselection
  - **Files Modified:** `src/hooks/useCanvas.js`
  - **Content:** Click on empty canvas to deselect

- [ ] Test movement sync
  - Open 2 browser windows
  - Move rectangle in window 1
  - Verify movement appears in window 2
  - Test simultaneous movement (last write wins)

**PR Checklist:**
- [ ] Can select rectangles by clicking
- [ ] Can move rectangles by dragging
- [ ] Movement syncs to other users
- [ ] No lag during dragging (optimistic updates)
- [ ] Position saves correctly on drag end
- [ ] Handles simultaneous moves gracefully
- [ ] Can deselect by clicking empty space
- [ ] ✅ Unit tests pass for canvas state management

---

### PR #9: State Persistence & Auto-Save
**Goal:** Canvas state persists and auto-saves every 3-5 seconds  
**Time Estimate:** 1-2 hours  
**Testing:** ✅ Unit test for Firestore service functions

#### Tasks:
- [ ] Setup canvas document in Firestore
  - **Files Modified:** `src/services/firestore.js`
  - **Content:** Create/get canvas document, structure: `{ id, objects: [], lastUpdated }`

- [ ] **🧪 UNIT TEST: Firestore operations**
  - **Files Created:** `src/__tests__/services/firestore.test.js`
  - **Tests:**
    - Mock Firestore SDK
    - Test `createObject()` writes correctly
    - Test `updateObject()` updates fields
    - Test `deleteObject()` removes object
    - Test batch operations work correctly
    - Test error handling for failed writes
  - **Why:** Database operations are critical, mocks prevent real DB calls in tests

- [ ] Load canvas state on mount
  - **Files Modified:** `src/hooks/useCanvas.js`
  - **Content:** Fetch canvas state from Firestore when app loads

- [ ] Implement auto-save interval
  - **Files Modified:** `src/hooks/useCanvas.js`
  - **Content:** `setInterval` to save canvas state every 3-5 seconds

- [ ] Batch updates for auto-save
  - **Files Modified:** `src/services/firestore.js`
  - **Content:** Batch write all object changes to reduce Firestore calls

- [ ] Save on unmount/tab close
  - **Files Modified:** `src/hooks/useCanvas.js`
  - **Content:** Save state on component unmount or `beforeunload` event

- [ ] Handle page refresh
  - **Files Modified:** `src/hooks/useCanvas.js`
  - **Content:** Load persisted state after refresh, no data loss

- [ ] Add loading state
  - **Files Modified:** `src/components/Canvas/Canvas.jsx`
  - **Content:** Show loading indicator while fetching canvas state

- [ ] Test persistence
  - Create rectangles
  - Refresh page
  - Verify rectangles still there
  - Close all tabs, reopen
  - Verify data persists

**PR Checklist:**
- [ ] Canvas state auto-saves every 3-5 seconds
- [ ] State persists through page refresh
- [ ] State persists when all users disconnect
- [ ] Loading state shows while fetching data
- [ ] No data loss in any scenario
- [ ] Firestore usage is efficient (batched writes)
- [ ] ✅ Unit tests pass for Firestore operations

---

### PR #10: Polish & Testing
**Goal:** Fix bugs, improve UX, ensure production-ready  
**Time Estimate:** 2-3 hours  
**Testing:** Manual verification + run full test suite

#### Tasks:
- [ ] Add loading states
  - **Files Modified:** `src/App.jsx`, `src/components/Canvas/Canvas.jsx`
  - **Content:** Spinners or skeletons while loading

- [ ] Add error boundaries
  - **Files Created:** `src/components/ErrorBoundary.jsx`
  - **Content:** Catch React errors, show friendly message

- [ ] Improve error handling
  - **Files Modified:** All service files
  - **Content:** Try/catch blocks, user-friendly error messages

- [ ] Add visual feedback
  - **Files Modified:** `src/components/Canvas/Rectangle.jsx`
  - **Content:** Hover effects, selection outlines, cursor changes

- [ ] Optimize performance
  - **Files Modified:** `src/hooks/useCanvas.js`, `src/hooks/useCursor.js`
  - **Content:** Memoization, throttling, debouncing where needed

- [ ] Test with 5+ concurrent users
  - Open 5+ browser windows
  - Create and move rectangles simultaneously
  - Verify no degradation

- [ ] Test on slow network
  - Use Chrome DevTools to throttle to 3G
  - Verify sync still works, just slower

- [ ] Cross-browser testing
  - Test on Chrome, Firefox, Safari
  - Test on mobile if time allows

- [ ] Accessibility improvements
  - **Files Modified:** Various components
  - **Content:** Add aria labels, keyboard navigation basics

- [ ] Update README
  - **Files Modified:** `README.md`
  - **Content:** Add screenshots, features list, known issues

- [ ] Final deployment
  - Deploy latest version
  - Test deployed URL with multiple users
  - Verify all features work in production

- [ ] **🧪 RUN FULL TEST SUITE**
  - **Command:** `npm test`
  - **Verify:**
    - All unit tests pass (utils, services, hooks, components)
    - All integration tests pass (cursor sync, rectangle sync)
    - Test coverage is reasonable (>50% for critical paths)
    - No skipped or failing tests
  - **Why:** Final validation before submitting MVP

**PR Checklist:**
- [ ] No console errors or warnings
- [ ] Handles errors gracefully with user feedback
- [ ] Loading states during async operations
- [ ] 60 FPS maintained in all scenarios
- [ ] Works with 5+ concurrent users
- [ ] Cross-browser compatible
- [ ] README is complete and accurate
- [ ] Production deployment is stable
- [ ] ✅ **ALL TESTS PASS** (unit + integration)

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