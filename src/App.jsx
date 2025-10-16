import { useState, useEffect } from 'react'
import './App.css'

// Import Firebase to test connection
import { app, auth, db } from './services/firebase'

// Import Auth components and providers
import { AuthProvider, useAuth } from './hooks/useAuth'
import AuthForm from './components/Auth/AuthForm'

// Main App content (shown when authenticated)
function MainApp() {
  const { user, signOut, isAuthenticated } = useAuth()
  const [count, setCount] = useState(0)

  const handleSignOut = async () => {
    try {
      await signOut()
      console.log('✅ Signed out successfully')
    } catch (error) {
      console.error('❌ Sign out failed:', error.message)
    }
  }

  return (
    <>
      <div>
        <div className="user-info">
          <h1>CollabCanvas MVP</h1>
          <p>Welcome, {user?.displayName || user?.email}!</p>
          <p>🔥 Firebase Status: Connected & Authenticated</p>
          <div className="user-details">
            <p>📧 Email: {user?.email}</p>
            <p>🎨 Cursor Color: <span style={{ color: user?.cursorColor || '#999' }}>{user?.cursorColor || 'Not assigned yet'}</span></p>
            <p>🆔 User ID: {user?.uid}</p>
          </div>
          <button onClick={handleSignOut} className="auth-button secondary">
            Sign Out
          </button>
        </div>
        
        <p>Real-time collaborative canvas - Coming Soon!</p>
      </div>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Getting started with CollabCanvas - Figma clone with multiplayer
      </p>
    </>
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

