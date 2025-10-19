import { useState, useEffect } from 'react'
import './App.css'

// Import Firebase to test connection
import { app, auth, db } from './services/firebase'

// Import Auth components and providers
import { AuthProvider, useAuth } from './hooks/useAuth'
import AuthForm from './components/Auth/AuthForm'

// Import Dark Mode provider and toggle
import { DarkModeProvider } from './hooks/useDarkMode'
import DarkModeToggle from './components/Layout/DarkModeToggle'

// Import Canvas component
import Canvas from './components/Canvas/Canvas'

// Import AI Agent Panel
import AIAgentPanel from './components/AI/AIAgentPanel'

// Main App content (shown when authenticated)
function MainApp() {
  const { user, signOut } = useAuth()
  
  // AI Agent Panel state
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [aiMessages, setAiMessages] = useState([])
  const [aiLoading, setAiLoading] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out failed:', error.message)
    }
  }

  const handleAiSendMessage = (message) => {
    // Add user message
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    }
    setAiMessages(prev => [...prev, userMessage])
    
    // For now, just add a placeholder AI response
    setAiLoading(true)
    setTimeout(() => {
      const aiMessage = {
        role: 'assistant',
        content: `I received your message: "${message}". The AI integration is not yet connected, but the UI is working!`,
        timestamp: new Date()
      }
      setAiMessages(prev => [...prev, aiMessage])
      setAiLoading(false)
    }, 1000)
  }

  const handleToggleAiPanel = (isOpen) => {
    setAiPanelOpen(isOpen)
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
          <DarkModeToggle />
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

      {/* AI Agent Panel */}
      <AIAgentPanel
        isVisible={true}
        isOpen={aiPanelOpen}
        messages={aiMessages}
        isLoading={aiLoading}
        onSendMessage={handleAiSendMessage}
        onTogglePanel={handleToggleAiPanel}
      />
    </div>
  )
}

// App content wrapper that handles auth routing
function AppContent() {
  const { isAuthenticated, loading, user, forceSignOut } = useAuth()

  // Validate Firebase connection on mount
  useEffect(() => {
    if (!app || !auth || !db) {
      console.error('Firebase services not properly initialized')
    }
  }, [])

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
      <AuthForm />
    )
  }

  // Show main app if authenticated
  return <MainApp />
}

// Root App component
function App() {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <div className="App">
          <AppContent />
        </div>
      </AuthProvider>
    </DarkModeProvider>
  )
}

export default App

