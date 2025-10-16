// Authentication service functions
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { generateRandomColor } from '../utils/colors';
// Note: Color generation moved to canvas entry phase

/**
 * Sign up a new user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {string} displayName - User's display name (optional)
 * @returns {Promise<Object>} User object with profile data
 */
export async function signUp(email, password, displayName = null) {
  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Generate display name if not provided
    const finalDisplayName = displayName || `User_${Date.now()}`;

    // Update user profile with display name
    await updateProfile(user, {
      displayName: finalDisplayName
    });

    // Create user document in Firestore with basic profile data
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: finalDisplayName,
      createdAt: new Date().toISOString(),
      isOnline: true,
      lastSeen: new Date().toISOString()
      // Note: cursorColor will be assigned when user enters canvas
    });

    console.log('✅ User signed up successfully:', finalDisplayName);
    
    return {
      uid: user.uid,
      email: user.email,
      displayName: finalDisplayName
      // Note: cursorColor will be added when user enters canvas
    };

  } catch (error) {
    console.error('❌ Sign up error:', error.message);
    throw new Error(error.message);
  }
}

/**
 * Sign in existing user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password  
 * @returns {Promise<Object>} User object
 */
export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user's online status in Firestore (non-blocking)
    updateUserStatus(user.uid, true);

    console.log('✅ User signed in successfully:', user.displayName || user.email);
    
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email
      // Note: cursorColor will be assigned when user enters canvas
    };

  } catch (error) {
    console.error('❌ Sign in error:', error.message);
    throw new Error(error.message);
  }
}

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
export async function signOut() {
  try {
    // Update user's offline status in Firestore before signing out
    const currentUser = auth.currentUser;
    if (currentUser) {
      await updateUserStatus(currentUser.uid, false);
    }

    // Sign out from Firebase Auth
    await firebaseSignOut(auth);
    console.log('✅ User signed out successfully');

  } catch (error) {
    console.error('❌ Sign out error:', error.message);
    
    // If it's a permissions error, try to provide more context
    if (error.code === 'permission-denied') {
      console.error('🚨 Permission denied during sign out. This might be a Firestore security rules issue.');
    }
    
    throw new Error(error.message);
  }
}

/**
 * Update user's online status in Firestore (separate from auth operations)
 * @param {string} uid - User ID
 * @param {boolean} isOnline - Online status
 * @returns {Promise<void>}
 */
export async function updateUserStatus(uid, isOnline) {
  try {
    await setDoc(doc(db, 'users', uid), {
      isOnline,
      lastSeen: new Date().toISOString()
    }, { merge: true });
    
    console.log(`✅ Updated user status: ${isOnline ? 'online' : 'offline'}`);
  } catch (error) {
    console.warn(`⚠️ Could not update user status:`, error.message);
    // Don't throw error - this shouldn't block auth operations
  }
}

/**
 * Get current authenticated user
 * @returns {Object|null} Current user object or null if not authenticated
 */
export function getCurrentUser() {
  const user = auth.currentUser;
  
  if (user) {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email
    };
  }
  
  return null;
}

/**
 * Listen to authentication state changes
 * @param {Function} callback - Callback function to handle auth state changes
 * @returns {Function} Unsubscribe function
 */
export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get user profile data from Firestore
 * @param {string} uid - User ID
 * @returns {Promise<Object>} User profile data
 */
export async function getUserProfile(uid) {
  try {
    console.log('🔍 Fetching user profile for UID:', uid);
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const profileData = docSnap.data();
      console.log('📄 Raw profile data:', profileData);
      
      // Ensure cursor color exists - if not, assign one
      if (!profileData.cursorColor) {
        console.log('⚠️ No cursor color found, assigning one...');
        const newColor = generateRandomColor();
        
        // Update the user document with cursor color
        await setDoc(docRef, {
          cursorColor: newColor
        }, { merge: true });
        
        profileData.cursorColor = newColor;
        console.log('🎨 Assigned new cursor color:', newColor);
      }
      
      return profileData;
    } else {
      console.log('❌ User profile document not found for UID:', uid);
      throw new Error('User profile not found');
    }
  } catch (error) {
    console.error('❌ Error fetching user profile:', error.message);
    throw new Error(error.message);
  }
}

/**
 * Ensure user has a cursor color assigned (for existing users)
 * @param {string} uid - User ID
 * @returns {Promise<string>} Cursor color
 */
export async function ensureCursorColor(uid) {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      if (data.cursorColor) {
        console.log('✅ User already has cursor color:', data.cursorColor);
        return data.cursorColor;
      }
    }
    
    // User doesn't have a cursor color, assign one
    const cursorColor = generateRandomColor();
    console.log('🎨 Assigning cursor color to existing user:', cursorColor);
    
    await setDoc(docRef, {
      cursorColor: cursorColor,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    return cursorColor;
  } catch (error) {
    console.error('❌ Error ensuring cursor color:', error.message);
    
    // Handle permission errors specifically
    if (error.code === 'permission-denied') {
      console.error('🚨 Firestore permission denied. Please check your security rules.');
      console.error('💡 Make sure authenticated users can write to /users/{userId} collection');
      throw new Error('Permission denied: Check Firestore security rules');
    }
    
    throw new Error(error.message);
  }
}

// Note: generateRandomColor is now imported from colors.js utility
