/**
 * Real-time deletion broadcasting using RTDB
 * Provides immediate visual feedback when objects are deleted
 */

import { getDatabase, ref, set, onValue, off, remove, serverTimestamp } from 'firebase/database';

const DELETIONS_PATH = 'live-deletions';

/**
 * Broadcast object deletion to all users immediately
 * @param {string} canvasId - Canvas ID
 * @param {string} objectId - Object being deleted
 * @param {string} userId - User who deleted it
 * @param {string} userName - User's display name
 * @returns {Promise<void>}
 */
export async function broadcastDeletion(canvasId, objectId, userId, userName) {
  try {
    const rtdb = getDatabase();
    const deletionRef = ref(rtdb, `${DELETIONS_PATH}/${canvasId}/${objectId}`);
    
    const deletion = {
      objectId,
      userId,
      userName,
      timestamp: serverTimestamp(),
      deletedAt: Date.now()
    };
    
    await set(deletionRef, deletion);
    
    console.log('📢 Deletion broadcasted immediately:', { objectId, userId, userName });
    
    // Auto-cleanup after 2 seconds
    setTimeout(() => {
      remove(deletionRef).catch(console.error);
    }, 2000);
  } catch (error) {
    console.error('❌ Error broadcasting deletion:', error);
    throw error;
  }
}

/**
 * Listen for real-time deletions on a canvas
 * @param {string} canvasId - Canvas ID to monitor
 * @param {Function} callback - Callback for deletion events
 * @returns {Function} Unsubscribe function
 */
export function listenToLiveDeletions(canvasId, callback) {
  try {
    const rtdb = getDatabase();
    const deletionsRef = ref(rtdb, `${DELETIONS_PATH}/${canvasId}`);
    
    const handleDeletionUpdate = (snapshot) => {
      if (snapshot.exists()) {
        const deletions = [];
        snapshot.forEach((childSnapshot) => {
          const deletion = {
            id: childSnapshot.key,
            ...childSnapshot.val()
          };
          deletions.push(deletion);
        });
        
        console.log('🔔 Live deletions update:', deletions.length, 'objects deleted');
        callback(deletions);
      } else {
        callback([]);
      }
    };
    
    onValue(deletionsRef, handleDeletionUpdate, (error) => {
      console.error('❌ Live deletions listener error:', error);
    });
    
    // Return unsubscribe function
    return () => {
      off(deletionsRef, 'value', handleDeletionUpdate);
      console.log('🔇 Live deletions listener unsubscribed');
    };
  } catch (error) {
    console.error('❌ Error setting up live deletions listener:', error);
    throw error;
  }
}
