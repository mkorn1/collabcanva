// Auth form wrapper that handles switching between Login and Signup
import { useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import './Auth.css';

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
    <div className="auth-wrapper">
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
        <div className="demo-controls">
          <button 
            onClick={toggleMode}
            className="auth-button secondary"
            style={{ 
              position: 'fixed', 
              bottom: '20px', 
              right: '20px',
              fontSize: '0.75rem',
              padding: '0.5rem'
            }}
          >
            Switch to {mode === 'login' ? 'Signup' : 'Login'}
          </button>
        </div>
      )}
    </div>
  );
}
