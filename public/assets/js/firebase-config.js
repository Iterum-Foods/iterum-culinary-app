/**
 * Firebase Configuration for Iterum R&D Chef Notebook
 *
 * To set up Firebase for your app:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project or select existing project
 * 3. Go to Project Settings > General > Your apps
 * 4. Add a web app and copy the config
 * 5. Replace the placeholder values below with your actual config
 * 6. Enable Authentication methods in Firebase Console:
 *    - Go to Authentication > Sign-in method
 *    - Enable Email/Password
 *    - Enable Google
 *
 * 7. Authorized domains (required for Google sign-in on Vercel):
 *    Authentication → Settings → Authorized domains — add your host(s), e.g.
 *    iterum-culinary-app.vercel.app and any custom domain (not only *.web.app).
 */

// Firebase configuration - Your actual Firebase project config
const firebaseConfig = {
  apiKey: 'AIzaSyDnoHJC-p22f-sBsdo_5UTeFiurFZ5Q4Yw',
  authDomain: 'iterum-culinary-app2.firebaseapp.com',
  projectId: 'iterum-culinary-app2',
  storageBucket: 'iterum-culinary-app2.firebasestorage.app',
  messagingSenderId: '109643878536',
  appId: '1:109643878536:web:65a701743af85b083a0f3d',
  measurementId: 'G-X9Y60QRWMT'
};

// Initialize Firestore flag
window.firestoreEnabled = true;

// Make config globally available
window.firebaseConfig = firebaseConfig;
console.log('🔥 Firebase config set on window:', firebaseConfig.projectId);
console.log('🔥 Firestore enabled:', window.firestoreEnabled);

// Also make it available for ES modules
if (typeof globalThis !== 'undefined') {
  globalThis.firebaseConfig = firebaseConfig;
  console.log(
    '🔥 Firebase config set on globalThis:',
    firebaseConfig.projectId
  );
}

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = firebaseConfig;
  console.log(
    '🔥 Firebase config exported for modules:',
    firebaseConfig.projectId
  );
}

// Firebase Authentication configuration
const authConfig = {
  // Sign-in methods to enable
  signInMethods: ['google', 'email'],

  // Google provider configuration
  googleProvider: {
    scopes: ['email', 'profile']
  },

  // Email provider configuration
  emailProvider: {
    requireDisplayName: true,
    requireEmailVerification: false // Set to true if you want email verification
  },

  // UI customization
  ui: {
    theme: 'light', // 'light' or 'dark'
    primaryColor: '#3b82f6', // Your app's primary color
    logoUrl: 'assets/icons/iterum.ico' // Your app logo
  },

  // Security settings
  security: {
    enableAnonymousAuth: false,
    enablePhoneAuth: false,
    passwordMinLength: 6,
    requireStrongPassword: false
  }
};

// Export configuration
window.firebaseConfig = firebaseConfig;
window.firebaseAuthConfig = authConfig;

// Validation function to check if config is properly set
function validateFirebaseConfig() {
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];
  const missingFields = requiredFields.filter(
    field =>
      !firebaseConfig[field] ||
      firebaseConfig[field].includes('your-') ||
      firebaseConfig[field].includes('123456789')
  );

  if (missingFields.length > 0) {
    console.warn(
      '⚠️ Firebase configuration incomplete. Missing or placeholder values for:',
      missingFields
    );
    console.log(
      '📝 Please update firebase-config.js with your actual Firebase project configuration'
    );
    return false;
  }

  console.log('✅ Firebase configuration validated successfully');
  return true;
}

// Run validation
validateFirebaseConfig();

/**
 * Setup Instructions:
 *
 * 1. CREATE FIREBASE PROJECT:
 *    - Go to https://console.firebase.google.com/
 *    - Click "Create a project" or "Add project"
 *    - Enter project name (e.g., "iterum-culinary-app2")
 *    - Enable/disable Google Analytics as needed
 *    - Click "Create project"
 *
 * 2. ADD WEB APP:
 *    - In Firebase Console, click the web icon (</>)
 *    - Enter app nickname (e.g., "Iterum Web App")
 *    - Check "Also set up Firebase Hosting" if desired
 *    - Click "Register app"
 *    - Copy the firebaseConfig object
 *
 * 3. ENABLE AUTHENTICATION:
 *    - Go to Authentication > Sign-in method
 *    - Click "Get started"
 *    - Enable "Email/Password"
 *    - Enable "Google" (you'll need to configure OAuth consent screen)
 *
 * 4. CONFIGURE GOOGLE AUTH (if using Google sign-in):
 *    - In Google provider settings, add your domain to authorized domains
 *    - Set up OAuth consent screen in Google Cloud Console
 *    - Add your app's URL to authorized JavaScript origins
 *
 * 5. UPDATE CONFIGURATION:
 *    - Replace the placeholder values in this file with your actual config
 *    - Test the authentication flow
 *
 * 6. SECURITY RULES (optional):
 *    - Set up Firestore security rules if using Firestore
 *    - Configure Firebase Storage rules if using file uploads
 *
 * 7. DEPLOYMENT:
 *    - Add your production domain to Firebase authorized domains
 *    - Update configuration for different environments (dev/prod)
 */

// Export for ES modules (if needed)
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { firebaseConfig, authConfig, validateFirebaseConfig };
}
