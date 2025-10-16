# 🔑 How to Get Your Firebase Configuration

## 🎯 Step-by-Step Guide to Get Firebase Credentials

### 1️⃣ Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com)
2. Sign in with your Google account
3. Select your **CollabCanvas** project (or create one if it doesn't exist)

### 2️⃣ Create/Find Your Web App
1. In the Firebase Console, click on the **⚙️ Project Settings** (gear icon)
2. Scroll down to **"Your apps"** section
3. If you see a web app (🌐), click on it
4. If no web app exists, click **"Add app"** → **"Web"** (🌐)
   - App nickname: `CollabCanvas Web`
   - ✅ Check "Set up Firebase Hosting" (optional)
   - Click **"Register app"**

### 3️⃣ Copy Your Configuration
You'll see a code block like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBdKxyz123456789abcdefghijklmnopqr",
  authDomain: "collabcanvas-12345.firebaseapp.com",
  projectId: "collabcanvas-12345",
  storageBucket: "collabcanvas-12345.appspot.com", 
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012345"
};
```

### 4️⃣ Update .env.local File
Replace the placeholder values in `.env.local`:

```bash
# Replace with YOUR actual values:
VITE_FIREBASE_API_KEY=AIzaSyBdKxyz123456789abcdefghijklmnopqr
VITE_FIREBASE_AUTH_DOMAIN=collabcanvas-12345.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=collabcanvas-12345
VITE_FIREBASE_STORAGE_BUCKET=collabcanvas-12345.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456789012345
```

### 5️⃣ Enable Required Services
In Firebase Console, enable:

**Authentication:**
1. **Authentication** → **Sign-in method**
2. Enable **Email/Password** provider
3. Click **"Save"**

**Firestore Database:**
1. **Firestore Database** → **"Create database"**
2. Choose **"Start in test mode"**
3. Select region closest to you
4. Click **"Done"**

**Realtime Database:**
1. **Realtime Database** → **"Create Database"**  
2. Choose **"Start in locked mode"**
3. Select same region as Firestore
4. Click **"Done"**

### 6️⃣ Apply Security Rules
Copy the rules from these files:
- `firestore.rules` → **Firestore Database** → **Rules** tab → **Publish**
- `database.rules.json` → **Realtime Database** → **Rules** tab → **Publish**

---

## ✅ Verification Checklist
- [ ] Firebase project created
- [ ] Web app registered  
- [ ] Configuration copied to `.env.local`
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore Database created
- [ ] Realtime Database created
- [ ] Security rules applied to both databases

**🎉 Once complete, restart your dev server:**
```bash
npm run dev
```

**Your cursor sync should now work perfectly!** 🎯✨
