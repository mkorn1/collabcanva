// Firestore operations for presence, canvas objects, and real-time sync
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp,
  writeBatch,
  orderBy
} from 'firebase/firestore';
import { onDisconnect, ref, set, remove, push, onValue, off, update, getDatabase } from 'firebase/database';
import { db, auth } from './firebase';
import { generateRandomColor } from '../utils/colors';
import { HEARTBEAT_INTERVAL_MS } from '../utils/constants.js';

// Firestore collections
const PRESENCE_COLLECTION = 'presence';
const CANVAS_COLLECTION = 'canvases';
const OBJECTS_COLLECTION = 'objects';

// =============================================================================
// PRESENCE SYSTEM
// =============================================================================

/**
 * Handles user joining the canvas - assigns cursor color and sets up presence
 * @param {string} userId - The user's ID
 * @param {Object} userData - User data (displayName, email, etc.)
 * @returns {Promise<string>} The user's cursor color
 */
export async function joinCanvas(userId, userData) {
  try {
    console.log('🎨 User joining canvas:', userId);
    
    // Check if user already has a cursor color in their profile
    let cursorColor = userData.cursorColor;
    
    if (!cursorColor) {
      // Generate a new cursor color
      cursorColor = generateRandomColor();
      console.log('🎨 Generated new cursor color for user:', userId, cursorColor);
      
      // Save cursor color to user profile for persistence
      const userProfileRef = doc(db, 'users', userId);
      await setDoc(userProfileRef, {
        cursorColor: cursorColor,
        lastColorAssigned: serverTimestamp()
      }, { merge: true });
    }
    
    // Update user presence with cursor color
    await updateUserPresence(userId, userData, cursorColor);
    
    // Setup disconnect cleanup
    await setupDisconnectCleanup(userId);
    
    console.log('✅ User successfully joined canvas with color:', cursorColor);
    return cursorColor;
    
  } catch (error) {
    console.error('❌ Error joining canvas:', error);
    throw error;
  }
}

/**
 * Updates user presence in Realtime Database with auto-disconnect cleanup
 * @param {string} userId - The user's ID
 * @param {Object} userData - User data (displayName, email, etc.)
 * @param {string} cursorColor - The user's cursor color
 * @returns {Promise<void>}
 */
export async function updateUserPresence(userId, userData, cursorColor) {
  try {
    // Verify user is authenticated
    if (!auth.currentUser) {
      console.error('❌ User not authenticated, cannot update presence');
      throw new Error('User must be authenticated to update presence');
    }

    // Verify the userId matches the authenticated user
    if (auth.currentUser.uid !== userId) {
      console.error('❌ User ID mismatch in presence update');
      throw new Error('Unauthorized presence update attempt');
    }

    // Create presence data for RTDB
    const presenceData = {
      id: userId,
      displayName: userData.displayName || userData.email || 'Anonymous',
      email: userData.email,
      cursorColor: cursorColor,
      isOnline: true,
      lastSeen: Date.now(),
      joinedAt: Date.now(),
      cursorPosition: { x: 0, y: 0 }, // Initial cursor position
    };

    // Get Realtime Database instance
    const rtdb = getDatabase();
    
    // Set presence in Realtime Database
    const presenceRef = ref(rtdb, `presence/${userId}`);
    await set(presenceRef, presenceData);

    // Setup automatic cleanup on disconnect
    onDisconnect(presenceRef).remove();

    console.log('✅ User presence updated in RTDB with disconnect cleanup:', userId);
  } catch (error) {
    console.error('❌ Error updating user presence in RTDB:', error);
    throw error;
  }
}

/**
 * Updates user's cursor position in real-time using Realtime Database
 * @param {string} userId - The user's ID
 * @param {Object} position - Cursor position { x, y }
 * @returns {Promise<void>}
 */
export async function updateCursorPosition(userId, position) {
  try {
    // Verify user is authenticated
    if (!auth.currentUser) {
      console.warn('⚠️ User not authenticated, skipping cursor update');
      return;
    }

    // Verify the userId matches the authenticated user
    if (auth.currentUser.uid !== userId) {
      console.error('❌ User ID mismatch in cursor update');
      throw new Error('Unauthorized cursor update attempt');
    }

    // Get Realtime Database instance
    const rtdb = getDatabase();
    
    // Use Realtime Database for cursor positions (much faster!)
    // Update only cursor position and lastSeen to preserve other presence data
    const updates = {
      [`presence/${userId}/cursorPosition`]: position,
      [`presence/${userId}/lastSeen`]: Date.now(),
      [`presence/${userId}/isOnline`]: true
    };
    
    await update(ref(rtdb), updates);
    
    // console.log('✅ Cursor position updated in RTDB');
  } catch (error) {
    console.error('❌ Error updating cursor position in RTDB:', error);
    console.error('🔍 Error details:', {
      code: error.code,
      message: error.message,
      userId,
      authState: auth.currentUser ? 'authenticated' : 'not authenticated',
      authUid: auth.currentUser?.uid,
      rtdbPath: `presence/${userId}`
    });
    throw error;
  }
}

/**
 * Gets all online users from Realtime Database
 * @returns {Promise<Array>} Array of online users
 */
export async function getOnlineUsers() {
  return new Promise((resolve, reject) => {
    try {
      const presenceRef = ref(rtdb, 'presence');
      
      onValue(presenceRef, (snapshot) => {
        const presenceData = snapshot.val();
        
        if (!presenceData) {
          resolve([]);
          return;
        }
        
        // Convert object to array and filter online users
        const users = Object.entries(presenceData)
          .map(([userId, userData]) => ({
            id: userId,
            ...userData
          }))
          .filter(user => user.isOnline)
          .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
        
        console.log('✅ Online users fetched from RTDB:', users.length);
        resolve(users);
      }, {
        onlyOnce: true // Only get data once, not listen continuously
      });
    } catch (error) {
      console.error('❌ Error fetching online users from RTDB:', error);
      reject(error);
    }
  });
}

/**
 * Listens to presence changes in real-time using Realtime Database
 * @param {Function} callback - Callback function to handle presence updates
 * @returns {Function} Unsubscribe function
 */
export function listenToPresence(callback) {
  try {
    // Get Realtime Database instance
    const rtdb = getDatabase();
    const presenceRef = ref(rtdb, 'presence');
    
    const handlePresenceUpdate = (snapshot) => {
      // console.log('📡 RTDB Presence snapshot received. Exists:', snapshot.exists());
      const presenceData = snapshot.val();
      
      if (!presenceData) {
        // console.log('📡 No presence data found in RTDB');
        callback([]);
        return;
      }
      
      // console.log('📡 Raw presence data from RTDB:', presenceData);
      
      // Convert object to array and filter online users
      const users = Object.entries(presenceData)
        .map(([userId, userData]) => ({
          id: userId,
          ...userData
        }))
        .filter(user => user.isOnline)
        .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
      
      // console.log('👥 RTDB Presence update:', users.length, 'online users:', users.map(u => u.displayName));
      callback(users);
    };
    
    // Listen for changes with error handler
    onValue(presenceRef, handlePresenceUpdate, (error) => {
      console.error('❌ RTDB Presence listener error:', error);
    });
    
    // console.log('👂 RTDB Presence listener started');
    
    // Return unsubscribe function
    return () => {
      off(presenceRef, 'value', handlePresenceUpdate);
      console.log('🔇 Presence listener unsubscribed');
    };
  } catch (error) {
    console.error('❌ Error setting up RTDB presence listener:', error);
    throw error;
  }
}

/**
 * Sets user as offline in RTDB
 * @param {string} userId - The user's ID
 * @returns {Promise<void>}
 */
export async function setUserOffline(userId) {
  try {
    // Get Realtime Database instance
    const rtdb = getDatabase();
    const presenceRef = ref(rtdb, `presence/${userId}`);
    
    await remove(presenceRef);
    
    // console.log('✅ User removed from RTDB presence:', userId);
  } catch (error) {
    console.error('❌ Error removing user from RTDB presence:', error);
    throw error;
  }
}

/**
 * Removes user from presence (complete cleanup) in RTDB
 * @param {string} userId - The user's ID
 * @returns {Promise<void>}
 */
export async function removeUserPresence(userId) {
  try {
    // Get Realtime Database instance
    const rtdb = getDatabase();
    const presenceRef = ref(rtdb, `presence/${userId}`);
    await remove(presenceRef);
    console.log('✅ User presence removed from RTDB:', userId);
  } catch (error) {
    console.error('❌ Error removing user presence from RTDB:', error);
    throw error;
  }
}

// =============================================================================
// HEARTBEAT SYSTEM
// =============================================================================

/**
 * Updates user's heartbeat (last seen timestamp) in RTDB
 * @param {string} userId - The user's ID
 * @returns {Promise<void>}
 */
export async function updateHeartbeat(userId) {
  try {
    // Get Realtime Database instance
    const rtdb = getDatabase();
    const presenceRef = ref(rtdb, `presence/${userId}/lastSeen`);
    await set(presenceRef, Date.now());
  } catch (error) {
    console.error('❌ Error updating heartbeat in RTDB:', error);
    // Don't throw on heartbeat errors to avoid disrupting the app
  }
}

/**
 * Starts heartbeat interval for a user
 * @param {string} userId - The user's ID
 * @param {number} intervalMs - Heartbeat interval in milliseconds (default: 30s)
 * @returns {number} Interval ID for cleanup
 */
export function startHeartbeat(userId, intervalMs = HEARTBEAT_INTERVAL_MS) {
  console.log('🫀 Starting heartbeat for user:', userId);
  
  const intervalId = setInterval(() => {
    updateHeartbeat(userId);
  }, intervalMs);
  
  return intervalId;
}

/**
 * Stops heartbeat interval
 * @param {number} intervalId - The interval ID returned by startHeartbeat
 */
export function stopHeartbeat(intervalId) {
  if (intervalId) {
    clearInterval(intervalId);
    console.log('🫀 Heartbeat stopped');
  }
}

/**
 * Sets up disconnect cleanup for a user (removes presence on disconnect)
 * This uses Firebase Realtime Database for reliable disconnect detection
 * @param {string} userId - The user's ID
 * @returns {Promise<void>}
 */
export async function setupDisconnectCleanup(userId) {
  try {
    // Note: The main presence cleanup is already handled in updateUserPresence()
    // This function is for additional cleanup if needed
    
    console.log('✅ Disconnect cleanup setup for user (handled in updateUserPresence):', userId);
  } catch (error) {
    console.error('❌ Error setting up disconnect cleanup:', error);
    throw error;
  }
}

// =============================================================================
// CANVAS OBJECTS (for future PRs)
// =============================================================================

/**
 * Creates a new canvas object
 * @param {string} canvasId - The canvas ID
 * @param {Object} objectData - Object data (type, position, size, color, rotation, scaleX, scaleY, etc.)
 * @returns {Promise<string>} The created object's ID
 */
export async function createObject(canvasId, objectData) {
  try {
    const objectsRef = collection(db, CANVAS_COLLECTION, canvasId, OBJECTS_COLLECTION);
    const objectDoc = doc(objectsRef);
    
    // Get current user info from auth
    const currentUser = auth.currentUser;
    const userId = currentUser?.uid || null;
    const userName = currentUser?.displayName || currentUser?.email || 'Anonymous';
    
    const objectWithMeta = {
      ...objectData,
      id: objectDoc.id,
      canvasId,
      // Transform properties
      rotation: objectData.rotation || 0,
      scaleX: objectData.scaleX || 1,
      scaleY: objectData.scaleY || 1,
      // Creation timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Conflict resolution metadata
      lastModified: serverTimestamp(),
      lastModifiedBy: userId,
      lastModifiedByName: userName,
      version: 1 // Optional: version counter for additional safety
    };
    
    await setDoc(objectDoc, objectWithMeta);
    console.log('✅ Object created with conflict resolution metadata:', objectDoc.id);
    
    return objectDoc.id;
  } catch (error) {
    console.error('❌ Error creating object:', error);
    throw error;
  }
}

/**
 * Updates an existing canvas object with conflict resolution metadata
 * @param {string} canvasId - The canvas ID
 * @param {string} objectId - The object ID to update
 * @param {Object} updates - Updates to apply (position, size, color, rotation, scaleX, scaleY, etc.)
 * @param {Object} options - Additional options
 * @returns {Promise<void>}
 */
export async function updateObject(canvasId, objectId, updates, options = {}) {
  try {
    console.log('🔧 FIRESTORE UPDATE:', objectId, 'updates:', updates);
    const objectRef = doc(db, CANVAS_COLLECTION, canvasId, OBJECTS_COLLECTION, objectId);
    
    // Get current user info from auth
    const currentUser = auth.currentUser;
    const userId = currentUser?.uid || null;
    const userName = currentUser?.displayName || currentUser?.email || 'Anonymous';
    
    const updateData = {
      ...updates,
      // Standard update timestamp
      updatedAt: serverTimestamp(),
      // Conflict resolution metadata
      lastModified: serverTimestamp(),
      lastModifiedBy: userId,
      lastModifiedByName: userName
    };
    
    // Add transform-specific metadata if rotation properties are being updated
    const isRotationUpdate = updates.rotation !== undefined;
    
    if (isRotationUpdate) {
      updateData.lastTransformBy = userId;
      updateData.lastTransformByName = userName;
      updateData.lastTransformAt = serverTimestamp();
    }
    
    // Optionally increment version counter
    if (options.incrementVersion) {
      updateData.version = (updates.version || 0) + 1;
    }
    
    await updateDoc(objectRef, updateData);
    console.log('✅ Object updated with conflict resolution metadata:', objectId, 'by:', userName);
  } catch (error) {
    console.error('❌ Error updating object:', error);
    throw error;
  }
}

/**
 * Deletes a canvas object
 * @param {string} canvasId - The canvas ID
 * @param {string} objectId - The object ID
 * @returns {Promise<void>}
 */
export async function deleteObject(canvasId, objectId) {
  try {
    const objectRef = doc(db, CANVAS_COLLECTION, canvasId, OBJECTS_COLLECTION, objectId);
    await deleteDoc(objectRef);
    console.log('✅ Object deleted:', objectId);
  } catch (error) {
    console.error('❌ Error deleting object:', error);
    throw error;
  }
}

/**
 * Listens to canvas objects changes in real-time
 * @param {string} canvasId - The canvas ID
 * @param {Function} callback - Callback function to handle object updates
 * @returns {Function} Unsubscribe function
 */
export function listenToObjects(canvasId, callback) {
  try {
    const objectsQuery = query(
      collection(db, CANVAS_COLLECTION, canvasId, OBJECTS_COLLECTION),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(objectsQuery, (snapshot) => {
      const objects = [];
      snapshot.forEach((doc) => {
        objects.push({ id: doc.id, ...doc.data() });
      });
      callback(objects);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Error listening to objects:', error);
    throw error;
  }
}
