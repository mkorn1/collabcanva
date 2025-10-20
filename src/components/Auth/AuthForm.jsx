// Auth form wrapper that handles switching between Login and Signup
import { useState } from 'react';
import Login from './Login';
import Signup from './Signup';

export default function AuthForm({ onAuthSuccess, defaultMode = 'login' }) {
  const [mode, setMode] = useState(defaultMode); // 'login' or 'signup'

  // Toggle between login and signup modes
  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'signup' : 'login');
  };

  // Handle successful authentication
  const handleAuthSuccess = () => {
    console.log(`✅ ${mode === 'login' ? 'Login' : 'Signup'} successful!`);
    
    // Call parent success callback if provided
    if (onAuthSuccess) {
      onAuthSuccess();
    }
  };

  return (
    <div>
      {mode === 'login' ? (
        <Login 
          onToggleMode={toggleMode}
          onSuccess={handleAuthSuccess}
        />
      ) : (
        <Signup 
          onToggleMode={toggleMode}
          onSuccess={handleAuthSuccess}
        />
      )}
      
      {/* Demo Mode Toggle (for development/testing) */}
      {import.meta.env.DEV && (
        <div>
          <button 
            onClick={toggleMode}
            className="fixed bottom-5 right-5 text-xs px-2 py-2 bg-gray-200 text-gray-600 hover:bg-gray-300 rounded-md transition-colors duration-200"
          >
            Switch to {mode === 'login' ? 'Signup' : 'Login'}
          </button>
        </div>
      )}
    </div>
  );
}
