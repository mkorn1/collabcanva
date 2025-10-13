import { useState, useEffect } from 'react'
import './App.css'

// Import Firebase to test connection
import { app, auth, db } from './services/firebase'

function App() {
  const [count, setCount] = useState(0)

  // Test Firebase connection on component mount
  useEffect(() => {
    console.log('🔥 Testing Firebase connection...')
    console.log('Firebase App:', app ? '✅ Connected' : '❌ Failed')
    console.log('Firebase Auth:', auth ? '✅ Available' : '❌ Failed')
    console.log('Firebase Firestore:', db ? '✅ Available' : '❌ Failed')
  }, [])

  return (
    <>
      <div>
        <h1>CollabCanvas MVP</h1>
        <p>Real-time collaborative canvas - Hello World!</p>
        <p>🔥 Firebase Status: Check browser console for connection details</p>
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

export default App

