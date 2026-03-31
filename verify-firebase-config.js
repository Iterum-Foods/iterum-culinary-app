/**
 * Firebase Configuration Verification Script
 * Run this in browser console to verify Firebase config is correct
 */

console.log('🔍 Verifying Firebase Configuration...\n');

// Get config from window
const config = window.firebaseConfig;

if (!config) {
    console.error('❌ Firebase config not found on window.firebaseConfig');
    console.log('Make sure firebase-config.js is loaded');
} else {
    console.log('✅ Firebase config found\n');
    console.log('📋 Configuration Details:');
    console.log('  Project ID:', config.projectId);
    console.log('  Auth Domain:', config.authDomain);
    console.log('  Storage Bucket:', config.storageBucket);
    console.log('  Messaging Sender ID:', config.messagingSenderId);
    console.log('  App ID:', config.appId);
    console.log('  API Key:', config.apiKey ? config.apiKey.substring(0, 20) + '...' : 'Missing');
    console.log('  Measurement ID:', config.measurementId || 'Not set');
    
    // Validate required fields
    console.log('\n🔍 Validation:');
    const required = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    const missing = required.filter(field => !config[field]);
    
    if (missing.length > 0) {
        console.error('❌ Missing required fields:', missing);
    } else {
        console.log('✅ All required fields present');
    }
    
    // Check for placeholder values
    const placeholders = required.filter(field => 
        config[field] && (
            config[field].includes('your-') || 
            config[field].includes('123456789') ||
            config[field].includes('placeholder')
        )
    );
    
    if (placeholders.length > 0) {
        console.warn('⚠️ Placeholder values detected:', placeholders);
    } else {
        console.log('✅ No placeholder values detected');
    }
    
    // Verify project ID matches expected
    const expectedProjectId = 'iterum-culinary-app2';
    if (config.projectId === expectedProjectId) {
        console.log('✅ Project ID matches expected:', expectedProjectId);
    } else {
        console.warn('⚠️ Project ID mismatch. Expected:', expectedProjectId, 'Got:', config.projectId);
    }
    
    // Verify messaging sender ID matches expected
    const expectedSenderId = '109643878536';
    if (config.messagingSenderId === expectedSenderId) {
        console.log('✅ Messaging Sender ID matches expected:', expectedSenderId);
    } else {
        console.warn('⚠️ Messaging Sender ID mismatch. Expected:', expectedSenderId, 'Got:', config.messagingSenderId);
    }
    
    // Verify app ID format
    const expectedAppIdPrefix = '1:109643878536:web:';
    if (config.appId && config.appId.startsWith(expectedAppIdPrefix)) {
        console.log('✅ App ID format correct (starts with:', expectedAppIdPrefix + ')');
    } else {
        console.warn('⚠️ App ID format may be incorrect. Expected prefix:', expectedAppIdPrefix);
    }
    
    console.log('\n✅ Configuration verification complete!');
    console.log('\n📝 To verify API key is working:');
    console.log('1. Try signing in to the app');
    console.log('2. Check browser console for Firebase errors');
    console.log('3. Check Firebase Console for authentication attempts');
}

