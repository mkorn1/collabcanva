// Hook for managing user presence and canvas joining
import { useState, useEffect, useRef } from 'react';
import { 
  joinCanvas, 
  listenToPresence, 
  startHeartbeat, 
  stopHeartbeat, 
  setUserOffline,
  removeUserPresence 
} from '../services/firestore';

/**
 * Custom hook for managing user presence in the canvas
 * @param {Object} user - Current authenticated user
 * @returns {Object} Presence state and methods
 */
export function usePresence(user) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isJoining, setIsJoining] = useState(false);
  const [userCursorColor, setUserCursorColor] = useState(null);
  const [error, setError] = useState(null);
  
  // Refs to store cleanup functions and intervals
  const presenceUnsubscribeRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const hasJoinedCanvasRef = useRef(false);

  // Join canvas when user is authenticated
  useEffect(() => {
    if (!user || hasJoinedCanvasRef.current) {
      return;
    }

    const handleJoinCanvas = async () => {
      try {
        setIsJoining(true);
        setError(null);
        
        console.log('🎨 Joining canvas for user:', user.uid);
        
        // Join canvas and get cursor color
        const cursorColor = await joinCanvas(user.uid, user);
        setUserCursorColor(cursorColor);
        
        // Start heartbeat system (every 30 seconds)
        heartbeatIntervalRef.current = startHeartbeat(user.uid, 30000);
        
        // Set up presence listener
        presenceUnsubscribeRef.current = listenToPresence((users) => {
          setOnlineUsers(users);
          console.log('👥 Online users updated:', users.length);
        });
        
        hasJoinedCanvasRef.current = true;
        console.log('✅ Successfully joined canvas with color:', cursorColor);
        
      } catch (error) {
        console.error('❌ Error joining canvas:', error);
        setError(error.message);
      } finally {
        setIsJoining(false);
      }
    };

    handleJoinCanvas();

    // Cleanup function
    return () => {
      cleanup();
    };
  }, [user]);

  // Handle component unmount and user logout
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user && hasJoinedCanvasRef.current) {
        // Set user offline (this is a best-effort, might not complete in time)
        setUserOffline(user.uid).catch(console.error);
      }
    };

    // Add event listener for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanup();
    };
  }, [user]);

  // Cleanup function
  const cleanup = async () => {
    console.log('🧹 Cleaning up presence...');
    
    // Stop heartbeat
    if (heartbeatIntervalRef.current) {
      stopHeartbeat(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    
    // Unsubscribe from presence listener
    if (presenceUnsubscribeRef.current) {
      presenceUnsubscribeRef.current();
      presenceUnsubscribeRef.current = null;
    }
    
    // Set user offline if they were in canvas
    if (user && hasJoinedCanvasRef.current) {
      try {
        await setUserOffline(user.uid);
        console.log('✅ User set offline:', user.uid);
      } catch (error) {
        console.error('❌ Error setting user offline:', error);
      }
    }
    
    hasJoinedCanvasRef.current = false;
    setOnlineUsers([]);
    setUserCursorColor(null);
  };

  // Method to manually leave canvas
  const leaveCanvas = async () => {
    await cleanup();
  };

  // Method to get current user's presence info
  const getCurrentUserPresence = () => {
    if (!user || !userCursorColor) return null;
    
    return onlineUsers.find(u => u.id === user.uid) || {
      id: user.uid,
      displayName: user.displayName,
      email: user.email,
      cursorColor: userCursorColor,
      isOnline: true
    };
  };

  // Method to get other users (excluding current user)
  const getOtherUsers = () => {
    if (!user) return onlineUsers;
    return onlineUsers.filter(u => u.id !== user.uid);
  };

  return {
    // State
    onlineUsers,
    otherUsers: getOtherUsers(),
    currentUserPresence: getCurrentUserPresence(),
    userCursorColor,
    isJoining,
    error,
    isConnected: hasJoinedCanvasRef.current,
    
    // Methods  
    leaveCanvas,
    
    // Computed values
    onlineCount: onlineUsers.length,
    otherUsersCount: getOtherUsers().length
  };
}
