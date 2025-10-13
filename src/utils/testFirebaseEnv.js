// Firebase Environment Variable Test Utility
// Run this script to validate your Firebase configuration

import { validateFirebaseConfig } from '../services/firebase.js';

/**
 * Test Firebase Environment Variables
 * This function checks if all required Firebase env vars are present and valid
 */
export function testFirebaseEnvVars() {
  console.log('🔍 Testing Firebase Environment Variables...\n');

  // List of required environment variables
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN', 
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  const results = {
    passed: 0,
    failed: 0,
    details: []
  };

  // Check each environment variable
  requiredEnvVars.forEach(varName => {
    const value = import.meta.env[varName];
    const isPresent = !!value;
    const isNotPlaceholder = value && !value.includes('your_') && !value.includes('your-project');
    const isValidFormat = validateEnvVarFormat(varName, value);

    if (isPresent && isNotPlaceholder && isValidFormat) {
      results.passed++;
      results.details.push({
        variable: varName,
        status: '✅ PASS',
        value: maskSensitiveValue(value),
        message: 'Valid'
      });
    } else {
      results.failed++;
      let message = '';
      if (!isPresent) message = 'Missing - not set in .env file';
      else if (!isNotPlaceholder) message = 'Contains placeholder value';
      else if (!isValidFormat) message = 'Invalid format';

      results.details.push({
        variable: varName,
        status: '❌ FAIL',
        value: value ? maskSensitiveValue(value) : 'undefined',
        message
      });
    }
  });

  // Display results
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}\n`);

  results.details.forEach(detail => {
    console.log(`${detail.status} ${detail.variable}`);
    console.log(`   Value: ${detail.value}`);
    console.log(`   Status: ${detail.message}\n`);
  });

  // Try Firebase validation
  try {
    validateFirebaseConfig();
    console.log('🎉 Firebase configuration validation: ✅ PASSED');
    console.log('Your Firebase environment variables are correctly configured!\n');
    return true;
  } catch (error) {
    console.log('🚨 Firebase configuration validation: ❌ FAILED');
    console.log(`Error: ${error.message}\n`);
    return false;
  }
}

/**
 * Validate environment variable format based on expected patterns
 */
function validateEnvVarFormat(varName, value) {
  if (!value) return false;

  switch (varName) {
    case 'VITE_FIREBASE_API_KEY':
      // Should start with AIza and be around 39 characters
      return value.startsWith('AIza') && value.length > 35;
    
    case 'VITE_FIREBASE_AUTH_DOMAIN':
      // Should end with .firebaseapp.com
      return value.endsWith('.firebaseapp.com');
    
    case 'VITE_FIREBASE_PROJECT_ID':
      // Should be lowercase with hyphens, no spaces
      return /^[a-z0-9-]+$/.test(value) && !value.includes(' ');
    
    case 'VITE_FIREBASE_STORAGE_BUCKET':
      // Should end with .appspot.com
      return value.endsWith('.appspot.com');
    
    case 'VITE_FIREBASE_MESSAGING_SENDER_ID':
      // Should be numeric
      return /^\d+$/.test(value) && value.length > 8;
    
    case 'VITE_FIREBASE_APP_ID':
      // Should match format like 1:123456789:web:abcdef
      return /^1:\d+:web:[a-z0-9]+$/.test(value);
    
    default:
      return true;
  }
}

/**
 * Mask sensitive parts of environment variable values for safe display
 */
function maskSensitiveValue(value) {
  if (!value) return 'undefined';
  
  if (value.length <= 8) {
    return value; // Don't mask short values
  }
  
  // Show first 4 and last 4 characters, mask the middle
  const start = value.substring(0, 4);
  const end = value.substring(value.length - 4);
  const middle = '*'.repeat(Math.min(value.length - 8, 16));
  
  return `${start}${middle}${end}`;
}

/**
 * Interactive test runner - call this to run the tests
 */
export function runFirebaseEnvTest() {
  console.clear();
  console.log('🔥 Firebase Environment Variables Test\n');
  console.log('======================================\n');
  
  const success = testFirebaseEnvVars();
  
  if (success) {
    console.log('🎊 All tests passed! Your Firebase configuration is ready.');
    console.log('💡 Next steps:');
    console.log('   1. Test Firebase connection with testFirebaseConnection()');
    console.log('   2. Try authentication: import { auth } from "./services/firebase.js"');
    console.log('   3. Try Firestore: import { db } from "./services/firebase.js"');
  } else {
    console.log('🔧 Please fix the issues above and run the test again.');
    console.log('💡 Tips:');
    console.log('   1. Make sure you have a .env file in your project root');
    console.log('   2. Copy values from Firebase Console > Project Settings');
    console.log('   3. Restart your development server after updating .env');
  }
  
  return success;
}
