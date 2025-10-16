// Debug utilities for Firebase Realtime Database issues
import { getDatabase, ref, set, get, onValue, off } from 'firebase/database';
import { auth } from '../services/firebase.js';

/**
 * Comprehensive Firebase RTDB diagnostic tool
 */
export async function diagnoseFirebaseRTDB() {
  console.log('🔍 Starting Firebase Realtime Database Diagnostics...\n');
  
  const results = {
    envVars: {},
    rtdbConnection: null,
    authState: null,
    permissionTest: null,
    presenceTest: null
  };

  try {
    // 1. Check Environment Variables
    console.log('1️⃣ Checking Environment Variables...');
    const requiredEnvVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN', 
      'VITE_FIREBASE_DATABASE_URL',
      'VITE_FIREBASE_PROJECT_ID'
    ];
    
    requiredEnvVars.forEach(varName => {
      const value = import.meta.env[varName];
      results.envVars[varName] = value ? '✅ Set' : '❌ Missing';
      console.log(`   ${varName}: ${value ? '✅ Set' : '❌ Missing'}`);
    });

    const databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL;
    if (databaseURL) {
      console.log(`   Database URL: ${databaseURL}`);
      console.log(`   URL format: ${databaseURL.includes('firebaseio.com') ? '✅ Correct' : '❌ Invalid format'}`);
      console.log(`   Has https: ${databaseURL.startsWith('https://') ? '✅ Yes' : '❌ No'}`);
      console.log(`   Ends with slash: ${databaseURL.endsWith('/') ? '✅ Yes' : '⚠️ No (should end with /)'}`);
    } else {
      console.log('   Database URL: ❌ MISSING');
    }

    // 2. Test RTDB Connection
    console.log('\n2️⃣ Testing Realtime Database Connection...');
    try {
      const rtdb = getDatabase();
      const testRef = ref(rtdb, '.info/connected');
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
        
        onValue(testRef, (snapshot) => {
          clearTimeout(timeout);
          const connected = snapshot.val();
          results.rtdbConnection = connected ? '✅ Connected' : '❌ Disconnected';
          console.log(`   RTDB Connection: ${connected ? '✅ Connected' : '❌ Disconnected'}`);
          off(testRef);
          resolve();
        }, (error) => {
          clearTimeout(timeout);
          results.rtdbConnection = `❌ Error: ${error.message}`;
          console.log(`   RTDB Connection: ❌ Error: ${error.message}`);
          reject(error);
        });
      });
    } catch (error) {
      results.rtdbConnection = `❌ Error: ${error.message}`;
      console.log(`   RTDB Connection: ❌ Error: ${error.message}`);
    }

    // 3. Check Auth State
    console.log('\n3️⃣ Checking Authentication State...');
    if (auth.currentUser) {
      results.authState = `✅ Authenticated as ${auth.currentUser.email}`;
      console.log(`   Auth State: ✅ Authenticated as ${auth.currentUser.email}`);
      console.log(`   User ID: ${auth.currentUser.uid}`);
    } else {
      results.authState = '❌ Not authenticated';
      console.log('   Auth State: ❌ Not authenticated');
    }

    // 4. Test Permission (only if authenticated)
    if (auth.currentUser) {
      console.log('\n4️⃣ Testing RTDB Permissions...');
      try {
        const rtdb = getDatabase();
        const testRef = ref(rtdb, `test/${auth.currentUser.uid}`);
        
        // Test write permission
        await set(testRef, {
          test: true,
          timestamp: Date.now()
        });
        
        // Test read permission
        const snapshot = await get(testRef);
        const canRead = snapshot.exists();
        
        results.permissionTest = canRead ? '✅ Read/Write OK' : '❌ Read failed';
        console.log(`   Permissions: ${canRead ? '✅ Read/Write OK' : '❌ Read failed'}`);
        
        // Cleanup test data
        await set(testRef, null);
      } catch (error) {
        results.permissionTest = `❌ Permission error: ${error.message}`;
        console.log(`   Permissions: ❌ Error: ${error.message}`);
      }
    }

    // 5. Test Presence Listener
    console.log('\n5️⃣ Testing Presence Listener...');
    try {
      const rtdb = getDatabase();
      const presenceRef = ref(rtdb, 'presence');
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Listener timeout')), 3000);
        
        const unsubscribe = onValue(presenceRef, (snapshot) => {
          clearTimeout(timeout);
          const exists = snapshot.exists();
          const data = snapshot.val();
          
          results.presenceTest = exists ? '✅ Listener working' : '⚠️ No presence data';
          console.log(`   Presence Listener: ${exists ? '✅ Working' : '⚠️ No data'}`);
          
          if (data) {
            const userCount = Object.keys(data).length;
            console.log(`   Presence Data: ${userCount} users found`);
          }
          
          unsubscribe();
          resolve();
        }, (error) => {
          clearTimeout(timeout);
          results.presenceTest = `❌ Listener error: ${error.message}`;
          console.log(`   Presence Listener: ❌ Error: ${error.message}`);
          reject(error);
        });
      });
    } catch (error) {
      results.presenceTest = `❌ Error: ${error.message}`;
      console.log(`   Presence Listener: ❌ Error: ${error.message}`);
    }

    // Summary
    console.log('\n📊 DIAGNOSIS SUMMARY:');
    console.log('='.repeat(50));
    Object.entries(results).forEach(([category, result]) => {
      if (typeof result === 'object') {
        console.log(`${category.toUpperCase()}:`);
        Object.entries(result).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      } else {
        console.log(`${category.toUpperCase()}: ${result}`);
      }
    });

    return results;
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    return { error: error.message };
  }
}

/**
 * Quick RTDB connection test
 */
export function quickRTDBTest() {
  console.log('⚡ Quick RTDB Test Starting...');
  
  try {
    const rtdb = getDatabase();
    console.log('✅ getDatabase() succeeded');
    
    const testRef = ref(rtdb, 'test/connection');
    console.log('✅ ref() succeeded');
    
    onValue(testRef, (snapshot) => {
      console.log('✅ onValue() listener attached successfully');
      console.log('📡 Connection test result:', snapshot.exists());
    }, (error) => {
      console.error('❌ onValue() listener error:', error);
    });
  } catch (error) {
    console.error('❌ Quick RTDB test failed:', error);
  }
}
