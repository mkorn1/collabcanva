/**
 * Deletion Intent System using Firebase Realtime Database
 * Provides smooth conflict resolution for object deletions
 */

import { getDatabase, ref, set, onValue, off, remove, serverTimestamp, push, get } from 'firebase/database';

// Constants
const DELETION_GRACE_PERIOD = 500; // 500ms grace period for conflict resolution
const DELETION_INTENTS_PATH = 'deletion-intents';

/**
 * Broadcast deletion intent to other users via RTDB
 * @param {string} canvasId - Canvas ID
 * @param {string} objectId - Object being deleted
 * @param {string} userId - User requesting deletion
 * @param {string} userName - User's display name
 * @returns {Promise<string>} Intent ID for tracking
 */
export async function broadcastDeletionIntent(canvasId, objectId, userId, userName) {
  try {
    const rtdb = getDatabase();
    const intentsRef = ref(rtdb, `${DELETION_INTENTS_PATH}/${canvasId}`);
    const intentRef = push(intentsRef);
    
    const intent = {
      objectId,
      userId,
      userName,
      timestamp: serverTimestamp(),
      status: 'pending', // pending, resolved, cancelled
      gracePeriodEnd: Date.now() + DELETION_GRACE_PERIOD
    };
    
    await set(intentRef, intent);
    
    console.log('📢 Deletion intent broadcasted:', { objectId, userId, userName });
    return intentRef.key;
  } catch (error) {
    console.error('❌ Error broadcasting deletion intent:', error);
    throw error;
  }
}

/**
 * Cancel a deletion intent (e.g., if someone else edited during grace period)
 * @param {string} canvasId - Canvas ID
 * @param {string} intentId - Intent ID to cancel
 * @returns {Promise<void>}
 */
export async function cancelDeletionIntent(canvasId, intentId) {
  try {
    const rtdb = getDatabase();
    const intentRef = ref(rtdb, `${DELETION_INTENTS_PATH}/${canvasId}/${intentId}`);
    
    await set(intentRef, {
      status: 'cancelled',
      cancelledAt: serverTimestamp()
    });
    
    // Clean up after a short delay
    setTimeout(() => {
      remove(intentRef).catch(console.error);
    }, 1000);
    
    console.log('🚫 Deletion intent cancelled:', intentId);
  } catch (error) {
    console.error('❌ Error cancelling deletion intent:', error);
  }
}

/**
 * Confirm a deletion intent (proceed with actual deletion)
 * @param {string} canvasId - Canvas ID
 * @param {string} intentId - Intent ID to confirm
 * @returns {Promise<void>}
 */
export async function confirmDeletionIntent(canvasId, intentId) {
  try {
    const rtdb = getDatabase();
    const intentRef = ref(rtdb, `${DELETION_INTENTS_PATH}/${canvasId}/${intentId}`);
    
    await set(intentRef, {
      status: 'confirmed',
      confirmedAt: serverTimestamp()
    });
    
    // Clean up after deletion
    setTimeout(() => {
      remove(intentRef).catch(console.error);
    }, 1000);
    
    console.log('✅ Deletion intent confirmed:', intentId);
  } catch (error) {
    console.error('❌ Error confirming deletion intent:', error);
  }
}

/**
 * Listen for deletion intents on a canvas
 * @param {string} canvasId - Canvas ID to monitor
 * @param {Function} callback - Callback for intent updates
 * @returns {Function} Unsubscribe function
 */
export function listenToDeletionIntents(canvasId, callback) {
  try {
    const rtdb = getDatabase();
    const intentsRef = ref(rtdb, `${DELETION_INTENTS_PATH}/${canvasId}`);
    
    const handleIntentUpdate = (snapshot) => {
      const intents = [];
      
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const intent = {
            id: childSnapshot.key,
            ...childSnapshot.val()
          };
          
          // Only include active intents (pending or within grace period)
          if (intent.status === 'pending' || 
              (intent.gracePeriodEnd && Date.now() < intent.gracePeriodEnd)) {
            intents.push(intent);
          }
        });
      }
      
      console.log('🔔 Deletion intents update:', intents.length, 'active intents');
      callback(intents);
    };
    
    onValue(intentsRef, handleIntentUpdate, (error) => {
      console.error('❌ Deletion intents listener error:', error);
    });
    
    // Return unsubscribe function
    return () => {
      off(intentsRef, 'value', handleIntentUpdate);
      console.log('🔇 Deletion intents listener unsubscribed');
    };
  } catch (error) {
    console.error('❌ Error setting up deletion intents listener:', error);
    throw error;
  }
}

/**
 * Check if an object has pending deletion intents
 * @param {Array} intents - Array of deletion intents
 * @param {string} objectId - Object ID to check
 * @returns {Object|null} Deletion intent if found, null otherwise
 */
export function getObjectDeletionIntent(intents, objectId) {
  return intents.find(intent => 
    intent.objectId === objectId && 
    intent.status === 'pending' &&
    intent.gracePeriodEnd > Date.now()
  ) || null;
}

/**
 * Resolve deletion conflict based on timestamps
 * @param {Object} intent - Deletion intent
 * @param {number} editTimestamp - Timestamp of the edit attempt
 * @returns {string} 'delete' or 'edit' - which action should win
 */
export function resolveDeletionConflict(intent, editTimestamp) {
  const intentTimestamp = intent.timestamp;
  
  // Compare timestamps - last action wins
  if (editTimestamp > intentTimestamp) {
    console.log('🔄 Deletion conflict: Edit wins (newer timestamp)');
    return 'edit';
  } else {
    console.log('🔄 Deletion conflict: Deletion wins (newer timestamp)');
    return 'delete';
  }
}

/**
 * Clean up old deletion intents (maintenance function)
 * @param {string} canvasId - Canvas ID to clean
 * @returns {Promise<void>}
 */
export async function cleanupOldDeletionIntents(canvasId) {
  try {
    const rtdb = getDatabase();
    const intentsRef = ref(rtdb, `${DELETION_INTENTS_PATH}/${canvasId}`);
    
    // Get all intents
    const snapshot = await get(intentsRef);
    if (!snapshot.exists()) return;
    
    const now = Date.now();
    const cleanupPromises = [];
    
    snapshot.forEach((childSnapshot) => {
      const intent = childSnapshot.val();
      
      // Remove intents older than 5 minutes or already resolved
      if (intent.gracePeriodEnd < now - 300000 || // 5 minutes old
          intent.status === 'confirmed' || 
          intent.status === 'cancelled') {
        cleanupPromises.push(remove(childSnapshot.ref));
      }
    });
    
    await Promise.all(cleanupPromises);
    console.log('🧹 Cleaned up', cleanupPromises.length, 'old deletion intents');
  } catch (error) {
    console.error('❌ Error cleaning up deletion intents:', error);
  }
}
