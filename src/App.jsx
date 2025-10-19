import { useState, useEffect, useCallback } from 'react'
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

// Import Canvas hook for AI integration
import { useCanvas } from './hooks/useCanvas.js'

// Import AI Agent Panel
import AIAgentPanel from './components/AI/AIAgentPanel'
import CommandOutlinePreview from './components/AI/CommandOutlinePreview'
import { processCommand, testConnection, getLangSmithStatus } from './services/aiAgent'
import { executeCommand, executeCommands } from './services/commandExecutor'

// Main App content (shown when authenticated)
function MainApp() {
  const { user, signOut } = useAuth()
  
  // Canvas context for AI integration
  const canvasContext = useCanvas('main', user)
  const {
    objects,
    selectedObjectIds,
    addObject,
    updateObject,
    removeObject,
    getSelectedObjects
  } = canvasContext
  
  // AI Agent Panel state
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [aiMessages, setAiMessages] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  
  // Preview mode state
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [pendingCommand, setPendingCommand] = useState(null)

  // Serialize canvas state for AI consumption
  const serializeCanvasState = useCallback(() => {
    return {
      objects: objects || [],
      selectedObjects: getSelectedObjects ? getSelectedObjects() : [],
      dimensions: {
        width: 1920, // Canvas width
        height: 1080 // Canvas height
      },
      selectedObjectIds: selectedObjectIds || []
    }
  }, [objects, selectedObjectIds, getSelectedObjects])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out failed:', error.message)
    }
  }

  const handleAiSendMessage = async (message) => {
    // Check if this is an approval response for a pending preview
    if (pendingCommand && isApprovalResponse(message)) {
      await handlePreviewApprove(previewData);
      return;
    }
    
    // Check if this is a rejection response for a pending preview
    if (pendingCommand && isRejectionResponse(message)) {
      handlePreviewReject(previewData);
      return;
    }
    
    // Add user message
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    }
    setAiMessages(prev => [...prev, userMessage])
    
    // Process with AI service
    setAiLoading(true)
    try {
      const canvasState = serializeCanvasState()
      
      const result = await processCommand(message, canvasState, user?.uid || 'anonymous')
      
      if (result.success) {
        if (result.type === 'function_call') {
          // AI wants to execute a function - show preview first
          let functionCalls = [];
          let summary = result.message;
          
          // Handle multi-step commands
          if (result.functionCall.name === 'multi_step_command') {
            functionCalls = result.functionCall.arguments.steps || [];
            summary = `Executing ${functionCalls.length} steps: ${functionCalls.map(step => step.name).join(', ')}`;
          } else {
            // Single function call
            functionCalls = [result.functionCall];
          }
          
          const aiMessage = {
            role: 'assistant',
            content: `I'll execute this command for you. ${summary}`,
            timestamp: new Date(),
            functionCall: result.functionCall
          }
          setAiMessages(prev => [...prev, aiMessage])
          
          // Prepare preview data
          const preview = {
            functionCalls: functionCalls,
            summary: summary,
            affectedObjects: getAffectedObjectsPreview(functionCalls, canvasState)
          }
          
          // Show preview overlay
          setPreviewData(preview)
          setPendingCommand(result.functionCall)
          setPreviewVisible(true)
        } else {
          // AI provided a text response
          const aiMessage = {
            role: 'assistant',
            content: result.message,
            timestamp: new Date()
          }
          setAiMessages(prev => [...prev, aiMessage])
        }
      } else {
        // Error response
        const errorMessage = {
          role: 'system',
          content: result.message,
          timestamp: new Date()
        }
        setAiMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('AI processing error:', error)
      const errorMessage = {
        role: 'system',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      }
      setAiMessages(prev => [...prev, errorMessage])
    } finally {
      setAiLoading(false)
    }
  }

  const handleToggleAiPanel = (isOpen) => {
    setAiPanelOpen(isOpen)
  }

  // Helper function to detect approval responses
  const isApprovalResponse = (message) => {
    const approvalKeywords = ['yes', 'y', 'approve', 'ok', 'okay', 'go ahead', 'proceed', 'execute', 'confirm'];
    const lowerMessage = message.toLowerCase().trim();
    return approvalKeywords.some(keyword => lowerMessage === keyword || lowerMessage.includes(keyword));
  }

  // Helper function to detect rejection responses
  const isRejectionResponse = (message) => {
    const rejectionKeywords = ['no', 'n', 'reject', 'cancel', 'stop', 'abort', 'decline'];
    const lowerMessage = message.toLowerCase().trim();
    return rejectionKeywords.some(keyword => lowerMessage === keyword || lowerMessage.includes(keyword));
  }

  // Helper function to get affected objects for preview
  const getAffectedObjectsPreview = (functionCalls, canvasState) => {
    // Handle both single function call and array of function calls
    const calls = Array.isArray(functionCalls) ? functionCalls : [functionCalls];
    const affectedObjects = [];
    
    calls.forEach(functionCall => {
      const { name, arguments: args } = functionCall;
      
      switch (name) {
        case 'create_shape':
          affectedObjects.push({
            id: 'new-' + Date.now() + '-' + Math.random(),
            type: args.type,
            fill: args.fill,
            width: args.width,
            height: args.height,
            x: args.x,
            y: args.y
          });
          break;
        
        case 'modify_shape':
        case 'delete_shape':
          const existingObjects = canvasState.objects.filter(obj => obj.id === args.id);
          affectedObjects.push(...existingObjects);
          break;
        
        case 'arrange_shapes':
          const arrangeObjects = canvasState.objects.filter(obj => args.ids.includes(obj.id));
          affectedObjects.push(...arrangeObjects);
          break;
        
        default:
          break;
      }
    });
    
    return affectedObjects;
  }

  // Handle preview approval
  const handlePreviewApprove = async (previewData) => {
    if (!pendingCommand) return;
    
    try {
      // Use real canvas context
      const canvasContextForExecution = {
        addObject,
        updateObject,
        removeObject,
        objects: objects || [],
        getSelectedObjects: getSelectedObjects || (() => [])
      };
      
      let result;
      
      // Handle multi-step commands differently
      if (pendingCommand.name === 'multi_step_command') {
        const steps = pendingCommand.arguments.steps || [];
        result = await executeCommands(steps, canvasContextForExecution, user);
      } else {
        // Single command
        result = await executeCommand(pendingCommand, canvasContextForExecution, user);
      }
      
      if (result.success) {
        const successMessage = {
          role: 'system',
          content: `✅ ${result.message}`,
          timestamp: new Date()
        };
        setAiMessages(prev => [...prev, successMessage]);
      } else if (result.type === 'partial_success') {
        // Handle partial success with detailed reporting
        const partialMessage = {
          role: 'system',
          content: `⚠️ ${result.message}`,
          timestamp: new Date(),
          details: {
            successfulUpdates: result.successfulUpdates || [],
            failedUpdates: result.failedUpdates || [],
            updateResults: result.updateResults || []
          }
        };
        setAiMessages(prev => [...prev, partialMessage]);
        
        // Add individual result messages for better visibility
        if (result.updateResults) {
          result.updateResults.forEach(updateResult => {
            const detailMessage = {
              role: 'system',
              content: updateResult.success ? 
                `✅ ${updateResult.message}` : 
                `❌ ${updateResult.message}`,
              timestamp: new Date()
            };
            setAiMessages(prev => [...prev, detailMessage]);
          });
        }
      } else {
        const errorMessage = {
          role: 'system',
          content: `❌ ${result.message}`,
          timestamp: new Date(),
          error: result.error
        };
        setAiMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Command execution error:', error);
      const errorMessage = {
        role: 'system',
        content: '❌ Failed to execute command. Please try again.',
        timestamp: new Date(),
        error: error
      };
      setAiMessages(prev => [...prev, errorMessage]);
    } finally {
      // Close preview
      setPreviewVisible(false);
      setPreviewData(null);
      setPendingCommand(null);
    }
  }

  // Handle preview rejection
  const handlePreviewReject = (previewData) => {
    const rejectMessage = {
      role: 'system',
      content: '❌ Command cancelled by user.',
      timestamp: new Date()
    };
    setAiMessages(prev => [...prev, rejectMessage]);
    
    // Close preview
    setPreviewVisible(false);
    setPreviewData(null);
    setPendingCommand(null);
  }

  // Test AI connection and check LangSmith status on component mount
  useEffect(() => {
    const testAiConnection = async () => {
      try {
        const result = await testConnection()
        if (result.success) {
          console.log('✅ AI Agent connection successful')
        } else {
          console.warn('⚠️ AI Agent connection failed:', result.message)
        }
      } catch (error) {
        console.error('❌ AI Agent connection error:', error)
      }
    }
    
    const checkLangSmithStatus = () => {
      const status = getLangSmithStatus()
      if (status.enabled) {
        console.log('✅ LangSmith monitoring enabled')
        console.log(`📊 Project: ${status.project}`)
      } else if (status.configured) {
        console.warn('⚠️ LangSmith configured but not enabled')
      } else {
        console.log('ℹ️ LangSmith monitoring not configured')
      }
    }
    
    testAiConnection()
    checkLangSmithStatus()
  }, [])

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
        <Canvas canvasContext={canvasContext} />
      </div>

      {/* AI Agent Panel */}
      <AIAgentPanel
        isVisible={true}
        isOpen={aiPanelOpen}
        messages={aiMessages}
        isLoading={aiLoading}
        onSendMessage={handleAiSendMessage}
        onTogglePanel={handleToggleAiPanel}
        isServiceAvailable={!!import.meta.env.VITE_OPENAI_API_KEY}
      />

      {/* Command Outline Preview */}
      <CommandOutlinePreview
        isVisible={previewVisible}
        previewData={previewData}
        onApprove={handlePreviewApprove}
        onReject={handlePreviewReject}
        position="bottom-right"
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

