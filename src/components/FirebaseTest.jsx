// Firebase Test Component
// Add this component to your app to easily test Firebase configuration

import React, { useState, useEffect } from 'react';
import { runFirebaseEnvTest } from '../utils/testFirebaseEnv.js';
import { runFirebaseConnectionTest, quickConnectionTest } from '../utils/testFirebaseConnection.js';

const FirebaseTest = () => {
  const [envTestResults, setEnvTestResults] = useState(null);
  const [connectionResults, setConnectionResults] = useState(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Quick status check on component mount
  useEffect(() => {
    const isReady = quickConnectionTest();
    setConnectionResults({ quickCheck: isReady });
  }, []);

  const runEnvTests = () => {
    setIsRunningTests(true);
    console.clear();
    
    // Capture console output for display
    const originalLog = console.log;
    const logs = [];
    
    console.log = (...args) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };

    try {
      const success = runFirebaseEnvTest();
      setEnvTestResults({ success, logs: [...logs] });
    } catch (error) {
      setEnvTestResults({ success: false, error: error.message, logs: [...logs] });
    }

    console.log = originalLog;
    setIsRunningTests(false);
  };

  const runConnectionTests = async () => {
    setIsRunningTests(true);
    console.clear();

    try {
      const success = await runFirebaseConnectionTest();
      setConnectionResults({ success, quickCheck: success });
    } catch (error) {
      setConnectionResults({ success: false, error: error.message, quickCheck: false });
    }

    setIsRunningTests(false);
  };

  const getStatusIcon = (status) => {
    if (status === true) return '✅';
    if (status === false) return '❌';
    return '⏳';
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🔥 Firebase Configuration Test</h2>
      
      <div style={styles.section}>
        <h3>Environment Variables</h3>
        <p>Check if Firebase environment variables are properly configured</p>
        <button 
          onClick={runEnvTests} 
          disabled={isRunningTests}
          style={styles.button}
        >
          {isRunningTests ? 'Running...' : 'Test Environment Variables'}
        </button>
        
        {envTestResults && (
          <div style={envTestResults.success ? styles.successBox : styles.errorBox}>
            <strong>
              {getStatusIcon(envTestResults.success)} 
              {envTestResults.success ? 'Environment Variables: PASSED' : 'Environment Variables: FAILED'}
            </strong>
            {envTestResults.error && (
              <div style={styles.errorText}>{envTestResults.error}</div>
            )}
          </div>
        )}
      </div>

      <div style={styles.section}>
        <h3>Firebase Connection</h3>
        <p>Test actual connection to Firebase services</p>
        <div style={styles.quickStatus}>
          <strong>Quick Status:</strong> {getStatusIcon(connectionResults?.quickCheck)} 
          {connectionResults?.quickCheck ? 'Services Ready' : 'Services Not Ready'}
        </div>
        <button 
          onClick={runConnectionTests} 
          disabled={isRunningTests || !connectionResults?.quickCheck}
          style={styles.button}
        >
          {isRunningTests ? 'Testing...' : 'Test Firebase Connection'}
        </button>
        
        {connectionResults && connectionResults.success !== undefined && (
          <div style={connectionResults.success ? styles.successBox : styles.errorBox}>
            <strong>
              {getStatusIcon(connectionResults.success)} 
              {connectionResults.success ? 'Firebase Connection: PASSED' : 'Firebase Connection: FAILED'}
            </strong>
            {connectionResults.error && (
              <div style={styles.errorText}>{connectionResults.error}</div>
            )}
          </div>
        )}
      </div>

      <div style={styles.instructions}>
        <h4>Instructions:</h4>
        <ol>
          <li>Create a <code>.env</code> file in your project root</li>
          <li>Add your Firebase configuration variables (see console for required format)</li>
          <li>Restart your development server</li>
          <li>Run the tests above</li>
        </ol>
        
        <div style={styles.note}>
          <strong>Note:</strong> Check the browser console for detailed test output and error messages.
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '600px',
    margin: '20px auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9'
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '30px'
  },
  section: {
    marginBottom: '30px',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '6px',
    border: '1px solid #eee'
  },
  button: {
    backgroundColor: '#4285F4',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '10px'
  },
  successBox: {
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    color: '#155724',
    padding: '10px',
    borderRadius: '4px',
    marginTop: '10px'
  },
  errorBox: {
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    color: '#721c24',
    padding: '10px',
    borderRadius: '4px',
    marginTop: '10px'
  },
  errorText: {
    marginTop: '5px',
    fontSize: '14px',
    fontFamily: 'monospace'
  },
  quickStatus: {
    padding: '8px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    marginBottom: '10px'
  },
  instructions: {
    backgroundColor: '#e9ecef',
    padding: '15px',
    borderRadius: '6px',
    fontSize: '14px'
  },
  note: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '4px',
    fontSize: '13px'
  }
};

export default FirebaseTest;
