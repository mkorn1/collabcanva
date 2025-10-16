# 🔐 Fix Firebase Realtime Database Permission Error

## Problem
```
❌ PERMISSION_DENIED: Permission denied
❌ permission_denied at /presence: Client doesn't have permission to access the desired data
```

## Root Cause
Firebase Realtime Database security rules are blocking authenticated users from accessing the `/presence` path.

---

## ✅ Solution: Update Security Rules

### Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **"Realtime Database"** (not Firestore!)
4. Click on the **"Rules"** tab

### Step 2: Replace Current Rules
**Replace ALL existing rules with:**

```json
{
  "rules": {
    "presence": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid == $uid"
      }
    },
    "test": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid"
      }
    }
  }
}
```

### Step 3: Publish Rules
1. Click **"Publish"** button
2. Confirm the rule update

### Step 4: Verify (Optional)
The rules simulator should show:
- **Path**: `/presence/someUserId`
- **Auth**: Authenticated user
- **Read**: ✅ Allowed
- **Write**: ✅ Allowed (if userId matches auth.uid)

---

## 🎯 What These Rules Do

### `/presence` Path
```json
"presence": {
  "$uid": {
    ".read": "auth != null",           // Any authenticated user can read all presence
    ".write": "auth != null && auth.uid == $uid"  // Users can only write their own presence
  }
}
```

**Explanation:**
- **Read**: Any logged-in user can see who's online (needed for cursor sync)
- **Write**: Users can only update their own presence data (security)

### `/test` Path  
```json
"test": {
  "$uid": {
    ".read": "auth != null && auth.uid == $uid",   // Users can only read their own test data
    ".write": "auth != null && auth.uid == $uid"   // Users can only write their own test data
  }
}
```

**Explanation:**
- Used by diagnostics to test permissions
- More restrictive than presence (users can only access their own test data)

---

## 🚨 Current Default Rules (The Problem)

Your current rules are likely:
```json
{
  "rules": {
    ".read": false,
    ".write": false
  }
}
```

This blocks **all access** to the database, which is why you're getting permission errors.

---

## ⚡ Quick Test

After updating rules, refresh your browser. You should see:
```
✅ RTDBCONNECTION: Connected
✅ PERMISSIONTEST: Read/Write OK  
✅ PRESENCETEST: Listener working
```

---

## 🔒 Security Notes

These rules are secure because:
1. **Authentication required**: Only logged-in users can access data
2. **User isolation**: Users can only modify their own presence
3. **Read access controlled**: Only presence data is publicly readable (needed for multiplayer)
4. **No anonymous access**: All operations require authentication

Perfect for a collaborative canvas application! 🎨
