# 🚨 URGENT: Add Live-Deletions to RTDB Rules

**Error:** `PERMISSION_DENIED: Permission denied` for `/live-deletions/main/...`

## 🔧 **Quick Fix (1 minute):**

### **Firebase Console Method:**
1. **Go to:** https://console.firebase.google.com
2. **Select your project**
3. **Click:** "Realtime Database" → "Rules" tab
4. **Replace entire rules** with this:

```json
{
  "rules": {
    "presence": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid == $uid"
      }
    },
    "cursors": {
      "$canvasId": {
        "$userId": {
          ".read": "auth != null", 
          ".write": "auth != null && auth.uid == $userId"
        }
      }
    },
    "deletion-intents": {
      "$canvasId": {
        ".read": "auth != null",
        ".write": "auth != null",
        "$intentId": {
          ".read": "auth != null",
          ".write": "auth != null"
        }
      }
    },
    "live-deletions": {
      "$canvasId": {
        ".read": "auth != null",
        ".write": "auth != null",
        "$objectId": {
          ".read": "auth != null",
          ".write": "auth != null"
        }
      }
    }
  }
}
```

5. **Click "Publish"**
6. **Refresh your app** - deletions should work immediately!

## ✅ **After Publishing:**
- Objects will delete **immediately** across all users
- No more permission errors 
- Real-time deletion propagation working

## 🧪 **Test Immediately:**
1. Create object in Window 1
2. Delete it
3. Should disappear instantly in Window 2! ✨
