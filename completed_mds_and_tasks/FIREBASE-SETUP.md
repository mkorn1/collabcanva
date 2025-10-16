# 🔥 Firebase Setup for Real-Time Cursor Sync

## 🎯 Required Firebase Configuration

Our cursor sync system uses:
- **Firestore Database** (for presence & user data)
- **Firebase Realtime Database** (for disconnect cleanup)
- **Firebase Authentication** (for user management)

---

## 1️⃣ Firestore Security Rules

### Current Collections Used:
- `presence/{userId}` - User presence and cursor positions
- `users/{userId}` - User profiles and persistent cursor colors

### Required Security Rules (`firestore.rules`):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null; // Allow reading other users for display names
    }
    
    // Presence collection - real-time cursor positions
    match /presence/{userId} {
      allow read: if request.auth != null; // All authenticated users can read presence
      allow write: if request.auth != null && request.auth.uid == userId; // Users can only update their own presence
      allow delete: if request.auth != null && request.auth.uid == userId; // Users can delete their own presence
    }
    
    // Canvas objects (for future use)
    match /canvases/{canvasId} {
      allow read, write: if request.auth != null;
      
      match /objects/{objectId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

---

## 2️⃣ Firebase Realtime Database Rules

### Required Database Rules (`database.rules.json`):

```json
{
  "rules": {
    "presence": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid == $uid"
      }
    }
  }
}
```

---

## 3️⃣ Firebase Console Setup Steps

### A. Enable Firestore Database
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **CollabCanvas**
3. Navigate to **"Firestore Database"**
4. Click **"Create database"**
5. Choose **"Start in test mode"** (we'll add rules later)
6. Select your preferred region
7. Click **"Done"**

### B. Enable Firebase Realtime Database  
1. In Firebase Console, navigate to **"Realtime Database"**
2. Click **"Create Database"**
3. Choose **"Start in test mode"**
4. Select your preferred region
5. Click **"Done"**

### C. Update Security Rules
1. **Firestore Rules:**
   - Go to **Firestore Database** → **Rules** tab
   - Replace default rules with the rules above
   - Click **"Publish"**

2. **Realtime Database Rules:**
   - Go to **Realtime Database** → **Rules** tab  
   - Replace default rules with the JSON above
   - Click **"Publish"**

---

## 4️⃣ Initialize Database Collections

### Option A: Auto-Creation (Recommended)
The collections will be automatically created when the first user joins the canvas. No manual setup needed!

### Option B: Manual Creation (Optional)
If you want to pre-create collections:

1. Go to **Firestore Database** → **Data** tab
2. Click **"Start collection"**
3. Collection ID: `presence`
4. Add a sample document:
   ```json
   Document ID: "sample"
   Fields:
   - id: "sample"
   - displayName: "Sample User"  
   - isOnline: false
   - cursorPosition: {x: 0, y: 0}
   ```
5. Repeat for `users` collection

---

## 5️⃣ Verify Configuration

### Quick Test Script
Create `test-firebase-setup.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getDatabase, ref, set } from 'firebase/database';

// Your Firebase config
const firebaseConfig = {
  // ... your config
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const rtdb = getDatabase(app);

async function testFirebaseSetup() {
  try {
    console.log('🧪 Testing Firestore write...');
    await setDoc(doc(db, 'test', 'setup'), {
      message: 'Firebase setup test',
      timestamp: new Date()
    });
    
    console.log('🧪 Testing Firestore read...');
    const docSnap = await getDoc(doc(db, 'test', 'setup'));
    console.log('✅ Firestore working:', docSnap.exists());
    
    console.log('🧪 Testing Realtime Database...');
    await set(ref(rtdb, 'test/setup'), {
      message: 'Realtime DB test',
      timestamp: Date.now()
    });
    console.log('✅ Realtime Database working');
    
    console.log('🎉 All Firebase services configured correctly!');
  } catch (error) {
    console.error('❌ Firebase setup error:', error);
  }
}

testFirebaseSetup();
```

---

## 6️⃣ Expected Database Structure

After users join, your Firestore should look like:

```
📁 presence/
  📄 user123abc
    ├── id: "user123abc"
    ├── displayName: "Alice"
    ├── email: "alice@test.com"
    ├── cursorColor: "#FF6B6B"
    ├── isOnline: true
    ├── lastSeen: 2024-01-15T10:30:00Z
    ├── joinedAt: 2024-01-15T10:25:00Z
    └── cursorPosition: {x: 250, y: 300}
    
  📄 user456def
    ├── id: "user456def"
    ├── displayName: "Bob"
    ├── email: "bob@test.com"
    ├── cursorColor: "#4ECDC4"
    ├── isOnline: true
    ├── lastSeen: 2024-01-15T10:31:00Z
    ├── joinedAt: 2024-01-15T10:28:00Z
    └── cursorPosition: {x: 400, y: 150}

📁 users/
  📄 user123abc
    ├── cursorColor: "#FF6B6B"
    ├── lastColorAssigned: 2024-01-15T10:25:00Z
    └── email: "alice@test.com"
    
  📄 user456def
    ├── cursorColor: "#4ECDC4"
    ├── lastColorAssigned: 2024-01-15T10:28:00Z
    └── email: "bob@test.com"
```

---

## 7️⃣ Common Setup Errors

### Error: "Missing or insufficient permissions"
**Solution:** Check Firestore security rules allow authenticated users to read/write

### Error: "PERMISSION_DENIED: Permission denied"
**Solution:** Ensure user is authenticated and rules match collection structure

### Error: "Firebase app not initialized"
**Solution:** Check `firebase.js` configuration and API keys

### Error: "Quota exceeded"
**Solution:** Check Firebase pricing plan and usage limits

---

## 8️⃣ Production Considerations

### Security Rules (Production)
```javascript
// More restrictive rules for production
match /presence/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null 
    && request.auth.uid == userId
    && request.auth.token.email_verified == true;
}
```

### Performance Optimization
- Add composite indexes for presence queries
- Implement pagination for large user lists
- Set up offline persistence for better UX

### Monitoring
- Enable Firebase Performance Monitoring
- Set up error reporting with Firebase Crashlytics
- Monitor usage with Firebase Analytics

---

## ✅ Setup Checklist

- [ ] **Firestore Database**: Created and configured
- [ ] **Realtime Database**: Created and configured  
- [ ] **Security Rules**: Updated for both databases
- [ ] **Collections**: Auto-created or manually initialized
- [ ] **Authentication**: Working and verified
- [ ] **Test Script**: Run and passed
- [ ] **Permissions**: Verified with test users

**🎉 Once complete, your cursor sync should work perfectly!**
