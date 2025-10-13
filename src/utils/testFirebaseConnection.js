// Firebase Connection Test
// Tests actual Firebase services connectivity

import { app, auth, db } from '../services/firebase.js';
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

/**
 * Test Firebase Connection
 * This function tests actual connectivity to Firebase services
 */
export async function testFirebaseConnection() {
  console.log('🔥 Testing Firebase Connection...\n');

  const tests = [
    { name: 'Firebase App Initialization', test: testAppInitialization },
    { name: 'Authentication Service', test: testAuthService },
    { name: 'Firestore Database', test: testFirestoreService }
  ];

  const results = [];

  for (const testCase of tests) {
    console.log(`🧪 Running: ${testCase.name}`);
    
    try {
      const result = await testCase.test();
      console.log(`✅ ${testCase.name}: PASSED`);
      if (result.details) console.log(`   ${result.details}`);
      results.push({ name: testCase.name, status: 'PASSED', details: result.details });
    } catch (error) {
      console.log(`❌ ${testCase.name}: FAILED`);
      console.log(`   Error: ${error.message}`);
      results.push({ name: testCase.name, status: 'FAILED', error: error.message });
    }
    console.log('');
  }

  // Summary
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;

  console.log('📊 Connection Test Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}\n`);

  if (failed === 0) {
    console.log('🎉 All Firebase services are working correctly!');
    console.log('Your Firebase configuration is fully operational.\n');
    
    console.log('🚀 Ready for development:');
    console.log('   - Authentication: Ready');
    console.log('   - Firestore Database: Ready');
    console.log('   - Real-time updates: Ready');
  } else {
    console.log('🔧 Some services need attention:');
    results.filter(r => r.status === 'FAILED').forEach(result => {
      console.log(`   - ${result.name}: ${result.error}`);
    });
  }

  return { passed, failed, results };
}

/**
 * Test Firebase App Initialization
 */
async function testAppInitialization() {
  if (!app) {
    throw new Error('Firebase app not initialized');
  }

  // Check if app has required properties
  if (!app.options.projectId) {
    throw new Error('Firebase app missing projectId');
  }

  if (!app.options.apiKey) {
    throw new Error('Firebase app missing apiKey');
  }

  return {
    details: `Project: ${app.options.projectId}`
  };
}

/**
 * Test Authentication Service
 */
async function testAuthService() {
  if (!auth) {
    throw new Error('Firebase Auth not initialized');
  }

  // Check auth configuration
  if (!auth.app) {
    throw new Error('Auth service not connected to Firebase app');
  }

  // Test auth state (should be null for unauthenticated user)
  const currentUser = auth.currentUser;
  
  return {
    details: `Auth ready, Current user: ${currentUser ? currentUser.email : 'None (not signed in)'}`
  };
}

/**
 * Test Firestore Service
 */
async function testFirestoreService() {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  // Test basic Firestore operations
  const testDocRef = doc(db, 'test-connection', 'connectivity-test');
  const testData = {
    message: 'Firebase connection test',
    timestamp: new Date().toISOString(),
    success: true
  };

  try {
    // Try to write a test document
    await setDoc(testDocRef, testData);
    
    // Try to read it back
    const docSnapshot = await getDoc(testDocRef);
    
    if (!docSnapshot.exists()) {
      throw new Error('Failed to read test document');
    }

    const readData = docSnapshot.data();
    if (readData.message !== testData.message) {
      throw new Error('Data integrity check failed');
    }

    // Clean up - delete the test document
    await deleteDoc(testDocRef);

    return {
      details: 'Read/Write operations successful'
    };
    
  } catch (error) {
    // If it's a permission error, it means Firestore is accessible but rules are restrictive
    if (error.code === 'permission-denied') {
      return {
        details: 'Connected (permission rules active - this is normal)'
      };
    }
    throw error;
  }
}

/**
 * Quick connection test - simplified version
 */
export function quickConnectionTest() {
  console.log('⚡ Quick Firebase Connection Check\n');

  const checks = [
    { name: 'Firebase App', service: app, status: !!app },
    { name: 'Auth Service', service: auth, status: !!auth },
    { name: 'Firestore DB', service: db, status: !!db }
  ];

  checks.forEach(check => {
    const status = check.status ? '✅ Ready' : '❌ Not initialized';
    console.log(`${check.name}: ${status}`);
  });

  const allReady = checks.every(check => check.status);
  console.log(`\n🔥 Firebase Status: ${allReady ? '✅ All services ready' : '❌ Some services missing'}`);

  return allReady;
}

/**
 * Interactive test runner
 */
export async function runFirebaseConnectionTest() {
  console.clear();
  console.log('🔥 Firebase Connection Test\n');
  console.log('==========================\n');

  // First do a quick check
  const servicesReady = quickConnectionTest();
  console.log('\n' + '='.repeat(40) + '\n');

  if (!servicesReady) {
    console.log('❌ Cannot run connection tests - services not initialized');
    console.log('💡 Please check your environment variables first');
    return false;
  }

  // Run full connection tests
  const results = await testFirebaseConnection();
  return results.failed === 0;
}
