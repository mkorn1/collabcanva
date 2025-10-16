import { useState, useEffect } from 'react'
import './App.css'

// Import Firebase to test connection
import { app, auth, db } from './services/firebase'

// Import Auth components and providers
import { AuthProvider, useAuth } from './hooks/useAuth'
import AuthForm from './components/Auth/AuthForm'

// Import Canvas component
import Canvas from './components/Canvas/Canvas'

// Main App content (shown when authenticated)
function MainApp() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      console.log('✅ Signed out successfully')
    } catch (error) {
      console.error('❌ Sign out failed:', error.message)
    }
  }

  return (
    <div className="canvas-app">
      {/* Header with user info and controls */}
      <div className="canvas-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1>CollabCanvas</h1>
          <div className="user-welcome">
            Welcome, {user?.displayName || user?.email}!
          </div>
        </div>
        
        <div className="header-controls">
          {user?.cursorColor && (
            <div className="cursor-indicator">
              <div 
                className="cursor-dot"
                style={{ backgroundColor: user.cursorColor }}
              />
              <span className="cursor-label">Your cursor</span>
            </div>
          )}
          <button 
            onClick={handleSignOut}
            className="header-sign-out"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Canvas takes up the full viewport minus the header */}
      <div className="canvas-container">
        <Canvas />
      </div>
    </div>
  )
}

// App content wrapper that handles auth routing
function AppContent() {
  const { isAuthenticated, loading, user, forceSignOut } = useAuth()

  // Test Firebase connection on component mount
  useEffect(() => {
    console.log('🔥 Testing Firebase connection...')
    console.log('Firebase App:', app ? '✅ Connected' : '❌ Failed')
    console.log('Firebase Auth:', auth ? '✅ Available' : '❌ Failed')
    console.log('Firebase Firestore:', db ? '✅ Available' : '❌ Failed')
    
    // Debug current auth state
    console.log('🔍 Current auth state:')
    console.log('- isAuthenticated:', isAuthenticated)
    console.log('- loading:', loading)
    console.log('- user:', user)
    console.log('- Firebase currentUser:', auth.currentUser)
  }, [isAuthenticated, loading, user])

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner large"></div>
          <p>Loading CollabCanvas...</p>
          <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
            Checking authentication state...
          </p>
        </div>
      </div>
    )
  }

  // Show auth forms if not authenticated
  if (!isAuthenticated) {
    return (
      <div>
        <AuthForm onAuthSuccess={() => console.log('🎉 User authenticated!')} />
        {/* Debug panel for development */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ 
            position: 'fixed', 
            top: '10px', 
            left: '10px', 
            background: 'rgba(0,0,0,0.8)', 
            color: '#ffffff !important', 
            padding: '10px', 
            fontSize: '12px',
            borderRadius: '5px'
          }}>
            <div style={{ color: '#ffffff !important' }}>🔍 Debug Info:</div>
            <div style={{ color: '#ffffff !important' }}>Auth: {isAuthenticated ? 'Yes' : 'No'}</div>
            <div style={{ color: '#ffffff !important' }}>Loading: {loading ? 'Yes' : 'No'}</div>
            <div style={{ color: '#ffffff !important' }}>User: {user ? 'Present' : 'None'}</div>
            <div style={{ color: '#ffffff !important' }}>Firebase User: {auth.currentUser ? 'Present' : 'None'}</div>
            <button 
              onClick={() => {
                console.log('🔄 Force auth state refresh')
                window.location.reload()
              }}
              style={{ marginTop: '5px', fontSize: '10px', marginRight: '5px' }}
            >
              Force Refresh
            </button>
            <button 
              onClick={() => {
                console.log('🔄 Force sign out')
                forceSignOut()
              }}
              style={{ marginTop: '5px', fontSize: '10px' }}
            >
              Force Sign Out
            </button>
          </div>
        )}
      </div>
    )
  }

  // Show main app if authenticated
  return <MainApp />
}

// Root App component
function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AppContent />
      </div>
    </AuthProvider>
  )
}

export default App

