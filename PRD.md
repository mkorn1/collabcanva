# CollabCanvas MVP - Product Requirements Document

**Project Timeline:** 24 Hours to MVP  
**Target:** Real-time collaborative canvas with multiplayer functionality  
**Project Type:** School Project MVP  
**Success Criteria:** Solid foundation for collaboration, not feature richness

---

## Executive Summary

CollabCanvas MVP is a real-time collaborative design canvas that allows multiple users to simultaneously create, move, and manipulate simple shapes on a single shared global canvas while seeing each other's cursors and presence. This school project focuses on bulletproof multiplayer infrastructure rather than advanced features, with an extensible object model for future shape types.

---

## User Stories

### Primary User: Design Collaborator
- **As a designer**, I want to see other users' cursors in real-time with their names displayed so I know where they're working
- **As a designer**, I want to see my own cursor without a name label so I can distinguish it from others
- **As a designer**, I want to create rectangles by dragging to define size so I can quickly add shapes
- **As a designer**, I want to move objects around the canvas so I can arrange my design
- **As a designer**, I want to pan and zoom the canvas so I can navigate large workspaces
- **As a designer**, I want my work to persist automatically so I don't lose progress
- **As a designer**, I want to see who else is online (by name) so I know who I'm collaborating with
- **As a designer**, I want to access the same global shared canvas as my collaborators so we can work together

### System Requirements
- **As the system**, I must sync object changes so collaboration feels instant
- **As the system**, I must sync cursor positions so movements feel natural
- **As the system**, I must maintain 60 FPS during all interactions so the experience is smooth

---

## Core Features (MVP - 24 Hours)

### 1. Canvas Functionality
- **Canvas Workspace**
  - 4000x4000px workspace (no visible boundaries)
  - Smooth panning via mouse drag or trackpad
  - Zoom in/out with mouse wheel or pinch gestures

- **Rectangle Creation**
  - Drag to create rectangles (user defines size)
  - Default color: matches user's cursor color
  - No color picker needed for MVP

- **Object Manipulation**
  - Select rectangles by clicking
  - Move selected rectangles by dragging
  - No resize/rotate for MVP

### 2. Real-Time Collaboration (Critical)
- **Multiplayer Cursors**
  - Show all connected users' cursor positions
  - Display name labels ONLY on other users' cursors (not your own)
  - Assign random cursor colors to each user
  - Update positions smoothly

- **Object Synchronization**
  - Broadcast rectangle creation/updates to all users on the global shared canvas
  - Changes appear for everyone instantly
  - "Last write wins" conflict resolution (simple approach for MVP)
  - All users see the same shared global canvas state

- **Presence Awareness**
  - Display list of currently online users (names only)
  - Show when users join/leave
  - Active user count

### 3. User Authentication
- **Account System**
  - Email/password signup (no password reset needed for MVP)
  - Users can choose their own display name or get auto-generated name
  - Persistent user identity across sessions
  - Each user gets assigned a random cursor color

### 4. State Persistence
- **Global Shared Canvas State**
  - Single global shared canvas that all collaborators access
  - Canvas state auto-saves every few seconds (e.g., every 3-5 seconds)
  - Rectangles persist when users disconnect
  - State restored when users return
  - Handle refresh without data loss
  - Object model designed to be extensible for future shape types

### 5. Deployment
- **Public Access**
  - Deployed to public URL
  - Accessible from any browser
  - Support for school project demonstration needs
  - Deployment platform TBD (Vercel, Firebase Hosting, or AWS)

---

## Technical Stack Recommendations

### Backend Options

#### Option 1: Firebase (Recommended for Speed)
**Pros:**
- Firestore/Realtime Database handles sync out-of-box
- Firebase Auth is drop-in authentication
- Built-in presence detection
- Easy deployment with Firebase Hosting
- Generous free tier

**Cons:**
- Vendor lock-in (not a concern for school project)
- Less control over sync logic
- Can get expensive at scale (not a concern for MVP)
- Learning curve if unfamiliar

**Best for:** Fastest path to working multiplayer

---

#### Option 2: Supabase (Recommended for Flexibility)
**Pros:**
- PostgreSQL with real-time subscriptions
- Built-in auth and row-level security
- Open source (can self-host)
- Great developer experience
- Generous free tier

**Cons:**
- Real-time can be tricky to optimize
- Slightly more setup than Firebase
- Need to handle presence manually

**Best for:** Balance of speed and control

---

#### Option 3: Custom WebSocket Server
**Pros:**
- Full control over sync logic
- Can optimize for performance
- No vendor lock-in
- Great learning experience

**Cons:**
- Most time-consuming to build
- Must handle auth, persistence, presence yourself
- Need separate database (PostgreSQL, MongoDB)
- More deployment complexity

**Best for:** If you're experienced with WebSockets

---

### Frontend Options

#### Canvas Library
- **Konva.js** - React-friendly, good documentation, handles transforms well
- **Fabric.js** - Feature-rich, mature, excellent object manipulation
- **PixiJS** - Best performance, game engine, steeper learning curve
- **HTML5 Canvas** - Full control, most work, best for learning

**Recommendation:** Konva.js for React, Fabric.js for vanilla JS

#### Framework
- **React** - Most familiar, great ecosystem, Konva integration
- **Vue** - Cleaner syntax, good reactivity model
- **Svelte** - Least boilerplate, excellent performance
- **Vanilla JS** - Maximum control, no framework overhead

**Recommendation:** Use what you know best (likely React)

---

### Deployment Recommendations
- **Vercel** - Best for React/Next.js, instant deployments, great DX
- **Firebase Hosting** - Natural fit with Firebase backend, simple setup
- **AWS** - More complex but powerful, good for learning cloud infrastructure

**Recommendation:** Start with Vercel or Firebase Hosting for speed, can migrate later if needed

---

## Out of Scope (Not in MVP)

### Features Explicitly Excluded
- ❌ Multiple shape types (only rectangles for MVP)
- ❌ Color picker (shapes match user's cursor color)
- ❌ Resize or rotate operations
- ❌ Advanced styling (gradients, borders, shadows)
- ❌ Layer management/z-index control
- ❌ Selection of multiple objects
- ❌ Undo/redo functionality
- ❌ Copy/paste or duplicate
- ❌ Export or save to file
- ❌ Keyboard shortcuts (nice-to-have feature for later)
- ❌ Snap-to-grid or alignment guides (nice-to-have feature for later)
- ❌ Comments or annotations
- ❌ Version history (not needed for single global canvas)
- ❌ Password reset functionality (MVP simplification)
- ❌ AI features (Phase 2 - out of scope for school project)
- ❌ Multiple canvases (single global canvas approach)
- ❌ Permissions/access control (future enhancement)
- ❌ Mobile-specific features (focus on desktop browser experience)

### Why These Are Out
The MVP is about **proving your multiplayer infrastructure works** for a school project demonstration. Every feature you add increases the surface area for bugs. A simple canvas with rock-solid sync beats a feature-rich canvas with broken collaboration.

---

## Technical Pitfalls & Considerations

### Common Mistakes
1. **Starting with features instead of sync** - Build multiplayer FIRST
2. **Not testing with multiple users early** - Test with 2+ browsers from day one
3. **Optimizing too early** - Get it working, then make it fast
4. **Complex conflict resolution** - "Last write wins" is fine for MVP
5. **Over-engineering auth** - Use Firebase/Supabase auth, don't roll your own

### Critical Success Factors
- **Start with cursor sync** - Simplest real-time feature, proves your stack works
- **Test continuously** - Multiple browser windows open at all times
- **Keep state simple** - Flat array of objects is fine
- **Deploy early** - Deploy in first 6 hours to catch deployment issues
- **Throttle updates** - Don't broadcast every cursor movement, throttle to 60 FPS

### Performance Considerations
- Cursor updates: Throttle to 16ms (60 FPS)
- Object updates: Can be slower (100ms), but debounce rapid changes
- Use requestAnimationFrame for canvas rendering
- Keep object count reasonable for MVP (Firebase free tier friendly)

### Testing Strategy
1. **Two browsers, side-by-side** - Your primary testing method
2. **Refresh test** - One user refreshes mid-edit
3. **Disconnect test** - Close browser, reopen, verify state
4. **Rapid creation test** - Create 10 objects quickly, check sync
5. **Network throttling** - Test on slow 3G to ensure it still works

---

## Architecture Recommendations

### Minimal Viable Architecture

```
Frontend (React + Konva.js)
    ↓
Real-time Layer (Firebase/Supabase/WebSocket)
    ↓
Persistence (Firestore/PostgreSQL/MongoDB)
    ↓
Auth (Firebase Auth/Supabase Auth/Custom)
```

### Data Models

**User:**
```javascript
{
  id: string,
  name: string,
  color: string, // for cursor
  isOnline: boolean,
  lastSeen: timestamp
}
```

**Canvas Object (Rectangle) - Extensible Design:**
```javascript
{
  id: string,
  type: 'rectangle', // Extensible for future shape types
  x: number,
  y: number,
  width: number,
  height: number,
  color: string, // matches creator's cursor color
  createdBy: userId,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Global Shared Canvas:**
```javascript
{
  canvasId: 'global', // Single shared canvas for all users
  objects: [CanvasObject], // array of rectangles
  lastUpdated: timestamp
}
```

**Cursor Position:**
```javascript
{
  userId: string,
  x: number,
  y: number,
  timestamp: number
}
```

---

## Success Metrics

### Hard Requirements (Must Pass)
- ✅ 2+ users can edit simultaneously
- ✅ Multiplayer cursors with names on others' cursors only (not your own)
- ✅ Rectangle creation and movement works
- ✅ Pan and zoom functional on 4000x4000px canvas
- ✅ State persists through refresh
- ✅ Presence awareness (who's online by name)
- ✅ User authentication with email/password
- ✅ All users see the same shared global canvas
- ✅ Publicly deployed and accessible for school project demonstration

### Performance Targets (Nice-to-Have)
- 60 FPS during interactions
- Fast object sync (aim for <100ms)
- Smooth cursor movement (aim for <50ms updates)
- Supports school project demonstration needs (no specific user load requirements)

---

## Timeline Breakdown (24 Hours)

### Hours 0-6: Foundation
- Setup project and deploy "Hello World"
- Implement auth (Firebase/Supabase)
- Basic canvas rendering (empty canvas with pan/zoom)

### Hours 6-12: Core Multiplayer
- Cursor sync between users
- Presence detection (who's online)
- Display other users' cursors with names

### Hours 12-18: Rectangle Sync
- Implement drag-to-create rectangles
- Sync rectangle creation across users
- Rectangle movement functionality
- Auto-save state every 3-5 seconds

### Hours 18-24: Polish & Testing
- Test with multiple users
- Fix sync bugs
- Handle edge cases (disconnect, refresh)
- Ensure deployment works under load
- Document setup in README

---

## Next Steps

1. **Choose your backend** - Firebase (fastest), Supabase (flexible), or Custom (control)
2. **Setup development environment** - Initialize repo, deploy "Hello World"
3. **Build cursor sync first** - Proves your real-time stack works
4. **Test with 2 browsers continuously** - Don't wait until the end
5. **Keep it simple** - Resist adding features until multiplayer is solid

**Remember:** A simple canvas with bulletproof multiplayer beats a feature-rich canvas with broken sync. Perfect for demonstrating technical competency in a school project setting.

---

**Questions for Review:**
1. ✅ Backend: Firebase (chosen)
2. ✅ Frontend: React + Konva.js (chosen)
3. ✅ Shape type: Rectangles only (chosen)
4. ✅ Canvas size: 4000x4000px (chosen)
5. ✅ Object creation: Drag-to-create (chosen)
6. ✅ Color: Matches user's cursor color (chosen)
7. ✅ Auth: Email/password, optional display name (chosen)
8. Deployment: TBD (Vercel, Firebase Hosting, or AWS)

**Key Decisions Made:**
- Own cursor visible but no name label
- Other users' cursors show name labels
- Random cursor color assignment
- Single global shared canvas for all collaborators
- Auto-save every 3-5 seconds
- Object model extensible for future shape types
- Performance targets are goals, not gates (school project focus)
