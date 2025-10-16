# Multi-User Cursor Sync Testing Guide

## 🎯 Task 4.13: Manual Testing with Multiple Browser Windows

### Prerequisites
- ✅ Development server running (`npm run dev`)
- ✅ Firebase project configured with valid credentials
- ✅ Multiple browser windows/tabs available
- ✅ Different user accounts for testing

---

## 🧪 Testing Protocol

### Step 1: Prepare Test Environment
1. **Start Development Server**
   ```bash
   npm run dev
   ```
   - Server should start on `http://localhost:5173` (or similar)
   - Verify no console errors on startup

2. **Open Multiple Browser Windows**
   - **Window 1**: Primary browser (Chrome/Firefox/Safari)
   - **Window 2**: Same browser, new window/incognito
   - **Window 3**: Different browser (optional, for cross-browser testing)

### Step 2: User Authentication Setup
1. **Window 1 - User A**
   - Navigate to `http://localhost:5173`
   - Sign up/Login as "Alice" with email: `alice@test.com`
   - Note: Use a real email format but can be fake

2. **Window 2 - User B**  
   - Navigate to `http://localhost:5173`
   - Sign up/Login as "Bob" with email: `bob@test.com`
   - Use incognito/private mode to avoid session conflicts

3. **Window 3 - User C (Optional)**
   - Navigate to `http://localhost:5173`
   - Sign up/Login as "Charlie" with email: `charlie@test.com`

---

## ✅ Testing Checklist

### Initial Load & Presence
- [ ] **User A**: Can see canvas with their own cursor color in debug info
- [ ] **User B**: Joins successfully, gets different cursor color
- [ ] **Debug Info**: Both users show "Online Users: 2"
- [ ] **Debug Info**: Each user shows "Other Cursors: 1"

### Real-Time Cursor Sync
- [ ] **User A moves mouse**: User B sees cursor appear in real-time
- [ ] **User B moves mouse**: User A sees cursor appear in real-time  
- [ ] **Cursor Colors**: Each user has distinct, vibrant colors
- [ ] **Name Labels**: Each user sees the OTHER user's name on their cursor
- [ ] **Smooth Movement**: Cursors move smoothly, no jitter or lag
- [ ] **Update Rate**: Cursor movement feels responsive (<100ms delay)

### Performance & Stability
- [ ] **60 FPS Local**: Local cursor movement is smooth and responsive
- [ ] **No Console Errors**: No JavaScript errors in any browser console
- [ ] **Memory Usage**: No excessive memory growth during extended use
- [ ] **Network Activity**: Reasonable Firebase network requests (not excessive)

### Edge Cases
- [ ] **Zoom Test**: Cursor positions sync correctly at different zoom levels
- [ ] **Pan Test**: Cursor positions remain accurate when canvas is panned
- [ ] **Rapid Movement**: Fast mouse movements don't break sync
- [ ] **Canvas Bounds**: Cursors work correctly at canvas edges

### Connection Handling
- [ ] **User Disconnect**: When User B closes tab, User A no longer sees their cursor
- [ ] **User Reconnect**: When User B returns, cursor reappears for User A
- [ ] **Network Issues**: Cursors handle brief network interruptions gracefully
- [ ] **Simultaneous Movement**: Multiple users moving simultaneously works correctly

---

## 🐛 Common Issues to Watch For

### Cursor Sync Problems
- **Cursors not appearing**: Check Firebase connection status
- **Lag/jitter**: Verify throttling is working (should be ~60 FPS local)
- **Wrong positions**: Check coordinate transformation between users
- **Duplicate cursors**: Verify user filtering is working correctly

### Authentication Issues  
- **Login conflicts**: Use incognito/private browsing for different users
- **Session persistence**: Users should stay logged in on refresh
- **User colors**: Each user should get a unique, distinct color

### Performance Issues
- **Slow responses**: Check network tab for excessive Firebase calls  
- **Memory leaks**: Monitor memory usage during extended testing
- **Browser crashes**: May indicate infinite loops or memory issues

---

## 📊 Expected Results

### What You Should See (Per User)
```
Debug Panel:
- Canvas: 4000 × 4000
- Zoom: 100%  
- Position: x:0, y:0
- Cursor: x:250, y:300 (tracking)
- State: Idle
- Presence: ✅ | Sync: connected
- Online Users: 2 (or 3)
- Other Cursors: 1 (or 2)  
- My Color: ● #FF6B6B (unique per user)
```

### Visual Experience
- **Own cursor**: Normal system cursor (no special rendering yet)
- **Other cursors**: Colored arrow with name label
- **Smooth movement**: All cursors move fluidly without stuttering
- **Distinct colors**: Each user has a different, vibrant color
- **Responsive tracking**: <100ms delay between mouse movement and sync

---

## 🚨 Failure Scenarios

### Critical Failures (Must Fix)
- No cursors appear for other users
- Cursors appear but don't move
- Console errors preventing app functionality
- Users can't authenticate or join canvas

### Minor Issues (Document for Later)
- Slight lag in cursor movement (>100ms but <500ms)
- Occasional cursor position jumps
- Visual styling issues (colors, labels)

---

## 📝 Testing Report Template

**Date**: [Current Date]
**Tester**: [Your Name]  
**Browsers Tested**: [List browsers and versions]
**Users Tested**: [Number of simultaneous users]

### Results Summary
- [ ] ✅ **PASS**: Real-time cursor sync working
- [ ] ⚠️ **PARTIAL**: Working with minor issues  
- [ ] ❌ **FAIL**: Major functionality broken

### Detailed Findings
1. **Cursor Appearance**: [Working/Not Working/Issues]
2. **Real-time Sync**: [Delay measurements, smoothness]
3. **Color Assignment**: [Distinct colors per user]
4. **Name Labels**: [Visible on other users' cursors]
5. **Performance**: [60 FPS local, network efficiency]
6. **Stability**: [No crashes, memory usage]

### Issues Found
- **Issue 1**: [Description and severity]
- **Issue 2**: [Description and severity]
- **Issue 3**: [Description and severity]

### Recommendations
- [Priority fixes needed]
- [Performance improvements]
- [UI/UX enhancements]

---

## 🎉 Success Criteria

**Task 4.13 is COMPLETE when:**
- ✅ 2-3 users can see each other's cursors in real-time
- ✅ Cursor movement is smooth and responsive (<100ms delay)
- ✅ Each user has a distinct cursor color
- ✅ Name labels appear on other users' cursors
- ✅ No critical console errors or crashes
- ✅ Performance remains stable during extended use

**Ready for Task 4.14**: Integration testing with mocked Firebase listeners
