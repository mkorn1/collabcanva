# Testing Conflict Resolution System

## 🚀 **Manual Testing (Do This Now!)**

Your app is running on `localhost:5175` - let's test the conflict resolution immediately:

### **Scenario 1: Dual Browser Test** 
**Test simultaneous edits and last-write-wins**

1. **Open two browser windows:**
   ```bash
   # Window 1: Chrome
   open -a "Google Chrome" http://localhost:5175
   
   # Window 2: Safari (or Chrome Incognito)
   open -a Safari http://localhost:5175
   ```

2. **Login as different users** in each window
3. **Create a rectangle** in one window
4. **Select the same rectangle** in both windows
5. **Simultaneously drag** the rectangle in different directions
   - Window 1: Drag left
   - Window 2: Drag right
6. **Expected Result:** Both windows show the rectangle at the final position of whichever drag finished last

### **Scenario 2: Visual Feedback Test**
**Test colored borders and tooltips**

1. With both windows open, **edit an object** in Window 1
2. **Look at Window 2** - you should see:
   - ✅ **Colored dashed border** around the object
   - ✅ **Tooltip** saying "Last edited by [User Name]"
   - ✅ **Auto-fade** after 3 seconds

### **Scenario 3: Rapid Edit Storm Test** 
**Test debouncing (10+ changes/sec)**

1. **Select a rectangle** 
2. **Rapidly drag it around** (move mouse quickly while dragging)
3. **Expected Results:**
   - ✅ **Smooth dragging** with no lag
   - ✅ **No duplicate objects**
   - ✅ **Position updates correctly** in other windows
   - ✅ **Console shows batched writes** (check DevTools)

### **Scenario 4: Network Disconnection Test**

1. **Start editing** an object
2. **Disable network** (turn off WiFi or use DevTools → Network → Offline)
3. **Continue editing** locally
4. **Re-enable network**
5. **Expected Result:** Changes sync when connection restored

### **Scenario 5: Delete vs Edit Race**

1. **Window 1:** Select and start dragging a rectangle
2. **Window 2:** Press Delete key on the same rectangle
3. **Expected Result:** Either the rectangle moves OR gets deleted (no ghost objects)

---

## 🧪 **Automated Testing**

### **Run Existing Tests**
```bash
cd /Users/michaelkorn/Documents/Coding/Projects/Gauntlet/CollabCanvas
npm test -- --run src/__tests__/utils/debounce.test.js
npm test -- --run src/__tests__/integration/conflictResolution.test.js
```

### **Manual Test Commands**
```bash
# Test write queue performance
npm test -- --run --testNamePattern="debounce"

# Test conflict resolver
npm test -- --run --testNamePattern="ConflictResolver"

# Test Rectangle component with visual feedback
npm test -- --run src/__tests__/components/Rectangle.test.jsx
```

---

## 🔍 **Verification Checklist**

### **✅ Visual Indicators Working**
- [ ] Colored borders appear when object edited by another user
- [ ] Borders use correct user cursor color
- [ ] Dashed animation shows during conflicts
- [ ] Tooltips show "Last edited by [Name]"
- [ ] Visual feedback fades after 3 seconds
- [ ] Hover shows conflict details

### **✅ Performance Requirements Met**
- [ ] Handles 15+ rapid changes per second
- [ ] Debounce delay ≤ 100ms (actually 50ms)
- [ ] No lag during rapid editing
- [ ] Console shows batched Firestore writes
- [ ] Memory usage stays stable during stress test

### **✅ Conflict Resolution Working**
- [ ] Last-write-wins logic functions correctly
- [ ] Both users see consistent final state
- [ ] No duplicate or ghost objects
- [ ] Timestamps resolve conflicts properly
- [ ] Network reconnection syncs correctly

### **✅ Data Integrity**
- [ ] Objects have lastModified timestamps
- [ ] Objects have lastModifiedBy user info
- [ ] Server timestamps prevent clock skew issues
- [ ] Atomic updates prevent corruption

---

## 🎮 **Interactive Testing Script**

**Copy-paste this into your browser console:**

```javascript
// Test rapid updates (simulates 20 changes/second)
let testObj = { id: 'test-conflict', x: 100, y: 100 };
let updateCount = 0;

const rapidTest = setInterval(() => {
  testObj.x += Math.random() * 10 - 5;
  testObj.y += Math.random() * 10 - 5;
  updateCount++;
  
  console.log(`Update ${updateCount}: x=${testObj.x}, y=${testObj.y}`);
  
  if (updateCount >= 50) {
    clearInterval(rapidTest);
    console.log('✅ Rapid test complete - check Firestore for batched writes');
  }
}, 50); // 20 updates per second
```

---

## 📊 **Performance Monitoring**

### **Check Firestore Writes** (Firebase Console)
1. Open Firebase Console → Firestore → Usage tab
2. Monitor write operations during testing
3. **Expected:** Significant reduction in writes during rapid editing

### **Check Browser DevTools**
```javascript
// Monitor conflict resolution in console
localStorage.setItem('debug-conflicts', 'true');

// Watch for these log messages:
// "🔄 Conflict resolution: local=X, remote=Y"  
// "✅ Remote object wins (newer timestamp)"
// "✅ Flushed N batched updates"
```

### **Memory Usage Test**
1. Open DevTools → Performance tab
2. Start recording
3. Perform rapid edits for 30 seconds
4. Stop recording
5. **Check:** Memory usage should remain stable (no memory leaks)

---

## 🚨 **Common Issues to Watch For**

### **❌ Red Flags**
- Objects jumping between positions (conflict loop)
- Multiple objects with same ID (duplication)
- Visual feedback not appearing (event listeners broken)
- Lag during rapid editing (debouncing failed)
- Console errors about timestamps

### **✅ Success Indicators**
- Smooth editing in both windows
- Consistent final states after conflicts
- Visual feedback appears and fades correctly
- Console shows "Flushed N batched updates"
- No duplicate objects or ghost states

---

## 🔧 **Debug Mode**

**Enable detailed logging:**

```javascript
// Add to localStorage in browser console
localStorage.setItem('debug-conflicts', 'true');
localStorage.setItem('debug-write-queue', 'true');
localStorage.setItem('debug-timestamps', 'true');

// Reload the page to see detailed logs
location.reload();
```

**Watch for these debug messages:**
```
✅ Object updated with conflict resolution metadata: rect_123 by: John Doe
🔄 Conflict resolution: local=1634567890123, remote=1634567890456  
✅ Remote object wins (newer timestamp)
✅ Flushed 5 batched updates
```

---

## 🎯 **Success Criteria**

**Your conflict resolution system passes if:**

1. **Consistency**: All users see same final state after conflicts
2. **Performance**: Handles 15+ rapid edits without lag  
3. **Visual Feedback**: Clear indication of recent edits
4. **Data Integrity**: No corruption, duplicates, or ghost objects
5. **Network Resilience**: Graceful handling of disconnections

**Ready to test?** Start with Scenario 1 (Dual Browser Test) - it's the most dramatic way to see the conflict resolution in action! 🚀
