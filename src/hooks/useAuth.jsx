import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChange, signIn, signUp, signOut, getUserProfile, updateUserStatus } from '../services/auth';

// Create Auth Context
const AuthContext = createContext({});

// AuthProvider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔄 Setting up auth state listener...');
    
    // Listen to authentication state changes
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      console.log('🔄 Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');
      
      try {
        if (firebaseUser) {
          console.log('👤 Firebase user detected:', firebaseUser.uid);
          
          // Fetch full user profile from Firestore
          try {
            const userProfile = await getUserProfile(firebaseUser.uid);
            console.log('📄 User profile loaded:', userProfile);
            
            const fullUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || userProfile.displayName || firebaseUser.email,
              cursorColor: userProfile.cursorColor,
              ...userProfile
            };
            
            setUser(fullUser);
            setIsAuthenticated(true);
            
            // Update online status
            updateUserStatus(firebaseUser.uid, true);
            
          } catch (profileError) {
            console.error('❌ Error loading user profile:', profileError.message);
            
            // Still set basic user info from Firebase Auth if profile loading fails
            const basicUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email
            };
            
            setUser(basicUser);
            setIsAuthenticated(true);
          }
        } else {
          console.log('👤 No user authenticated');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('❌ Auth state change error:', error.message);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('🔄 Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Sign in function
  const handleSignIn = async (email, password) => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      const user = await signIn(email, password);
      console.log('✅ Sign in successful:', user.displayName || user.email);
      return user;
    } catch (error) {
      console.error('❌ Sign in failed:', error.message);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign up function
  const handleSignUp = async (email, password, displayName) => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      const user = await signUp(email, password, displayName);
      console.log('✅ Sign up successful:', user.displayName || user.email);
      return user;
    } catch (error) {
      console.error('❌ Sign up failed:', error.message);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const handleSignOut = async () => {
    try {
      // Update offline status before signing out (non-blocking)
      if (user?.uid) {
        updateUserStatus(user.uid, false).catch(error => {
          console.warn('⚠️ Could not update offline status:', error.message);
        });
      }
      
      await signOut();
      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Sign out failed:', error.message);
      throw error;
    }
  };

  // Force sign out function (for debugging)
  const forceSignOut = async () => {
    try {
      console.log('🔄 Force signing out...');
      await handleSignOut();
    } catch (error) {
      console.error('❌ Force sign out failed, clearing state anyway:', error.message);
      // Clear state even if sign out fails
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  // Auth context value
  const value = {
    user,
    loading,
    isAuthenticated,
    error,
    clearError,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    forceSignOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth hook
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export default useAuth;
