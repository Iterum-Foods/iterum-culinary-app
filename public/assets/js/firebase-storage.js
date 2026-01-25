/**
 * Firebase Storage Integration for Iterum R&D Chef Notebook
 * Provides file upload/download functionality using Firebase Cloud Storage
 * Uses Firebase SDK v11.6.1 (modular imports)
 */

// Firebase configuration - use from firebase-config.js or embedded config
const firebaseConfig = window.firebaseConfig || {
    apiKey: "AIzaSyDnoHJC-p22f-sBsdo_5UTeFiurFZ5Q4Yw",
    authDomain: "iterum-culinary-app2.firebaseapp.com",
    projectId: "iterum-culinary-app2",
    storageBucket: "iterum-culinary-app2.firebasestorage.app",
    messagingSenderId: "109643878536",
    appId: "1:109643878536:web:65a701743af85b083a0f3d",
    measurementId: "G-X9Y60QRWMT"
};

import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    listAll,
    getMetadata
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js';

class FirebaseStorageSystem {
    constructor() {
        this.app = null;
        this.storage = null;
        this.isInitialized = false;
        this.retryAttempted = false;
        
        // Set window.firebaseStorage immediately for other scripts
        window.firebaseStorage = this;
        
        // Initialize immediately
        this.init();
    }

    /**
     * Initialize Firebase Storage
     */
    async init() {
        try {
            console.log('📦 Initializing Firebase Storage...');
            
            // Get or initialize Firebase app
            const apps = getApps();
            if (apps.length > 0) {
                // Use existing app (from firebase-auth.js)
                this.app = apps[0];
                console.log('✅ Using existing Firebase app');
            } else {
                // Initialize new app
                this.app = initializeApp(firebaseConfig);
                console.log('✅ Initialized new Firebase app');
            }
            
            // Initialize Storage
            this.storage = getStorage(this.app);
            this.isInitialized = true;
            
            console.log('✅ Firebase Storage initialized successfully');
            console.log('📦 Storage Bucket:', firebaseConfig.storageBucket);
            
            // Make sure window.firebaseStorage is set
            window.firebaseStorage = this;
            window.firebaseStorageReady = true;
            
            // Dispatch event for other scripts
            window.dispatchEvent(new CustomEvent('firebaseStorageReady', { detail: this }));
            
        } catch (error) {
            console.error('❌ Firebase Storage initialization failed:', error);
            this.isInitialized = false;
            
            // Retry initialization after a delay (only once)
            if (!this.retryAttempted) {
                this.retryAttempted = true;
                setTimeout(() => {
                    console.log('🔄 Retrying Firebase Storage initialization...');
                    this.init();
                }, 1000);
            } else {
                console.error('❌ Firebase Storage initialization failed after retry');
            }
        }
    }

    /**
     * Upload a file to Firebase Storage
     * @param {File|Blob} file - File to upload
     * @param {string} path - Storage path (e.g., 'users/userId/photos/image.jpg')
     * @param {Object} metadata - Optional metadata
     * @returns {Promise<{url: string, path: string}>}
     */
    async uploadFile(file, path, metadata = {}) {
        if (!this.isInitialized) {
            throw new Error('Firebase Storage not initialized');
        }

        try {
            console.log(`📤 Uploading file to: ${path}`);
            
            const storageRef = ref(this.storage, path);
            const uploadResult = await uploadBytes(storageRef, file, metadata);
            const downloadURL = await getDownloadURL(uploadResult.ref);
            
            console.log(`✅ File uploaded successfully: ${downloadURL}`);
            
            return {
                url: downloadURL,
                path: path,
                ref: uploadResult.ref
            };
        } catch (error) {
            console.error('❌ Error uploading file:', error);
            throw error;
        }
    }

    /**
     * Upload file with progress tracking
     * @param {File|Blob} file - File to upload
     * @param {string} path - Storage path
     * @param {Function} onProgress - Progress callback (bytesTransferred, totalBytes)
     * @returns {Promise<{url: string, path: string}>}
     */
    async uploadFileWithProgress(file, path, onProgress = null) {
        if (!this.isInitialized) {
            throw new Error('Firebase Storage not initialized');
        }

        try {
            console.log(`📤 Uploading file with progress: ${path}`);
            
            const storageRef = ref(this.storage, path);
            const uploadTask = uploadBytesResumable(storageRef, file);
            
            return new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        // Progress tracking
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log(`Upload progress: ${progress.toFixed(2)}%`);
                        
                        if (onProgress) {
                            onProgress(snapshot.bytesTransferred, snapshot.totalBytes);
                        }
                    },
                    (error) => {
                        console.error('❌ Upload error:', error);
                        reject(error);
                    },
                    async () => {
                        // Upload complete
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        console.log(`✅ File uploaded successfully: ${downloadURL}`);
                        resolve({
                            url: downloadURL,
                            path: path,
                            ref: uploadTask.snapshot.ref
                        });
                    }
                );
            });
        } catch (error) {
            console.error('❌ Error uploading file:', error);
            throw error;
        }
    }

    /**
     * Get download URL for a file
     * @param {string} path - Storage path
     * @returns {Promise<string>}
     */
    async getDownloadURL(path) {
        if (!this.isInitialized) {
            throw new Error('Firebase Storage not initialized');
        }

        try {
            const storageRef = ref(this.storage, path);
            const url = await getDownloadURL(storageRef);
            return url;
        } catch (error) {
            console.error('❌ Error getting download URL:', error);
            throw error;
        }
    }

    /**
     * Delete a file from Firebase Storage
     * @param {string} path - Storage path
     * @returns {Promise<void>}
     */
    async deleteFile(path) {
        if (!this.isInitialized) {
            throw new Error('Firebase Storage not initialized');
        }

        try {
            console.log(`🗑️ Deleting file: ${path}`);
            const storageRef = ref(this.storage, path);
            await deleteObject(storageRef);
            console.log(`✅ File deleted successfully: ${path}`);
        } catch (error) {
            console.error('❌ Error deleting file:', error);
            throw error;
        }
    }

    /**
     * List files in a directory
     * @param {string} path - Storage path
     * @returns {Promise<Array>}
     */
    async listFiles(path) {
        if (!this.isInitialized) {
            throw new Error('Firebase Storage not initialized');
        }

        try {
            const storageRef = ref(this.storage, path);
            const result = await listAll(storageRef);
            
            const files = [];
            for (const itemRef of result.items) {
                const url = await getDownloadURL(itemRef);
                const metadata = await getMetadata(itemRef);
                files.push({
                    name: itemRef.name,
                    fullPath: itemRef.fullPath,
                    url: url,
                    size: metadata.size,
                    contentType: metadata.contentType,
                    timeCreated: metadata.timeCreated
                });
            }
            
            return files;
        } catch (error) {
            console.error('❌ Error listing files:', error);
            throw error;
        }
    }

    /**
     * Get file metadata
     * @param {string} path - Storage path
     * @returns {Promise<Object>}
     */
    async getFileMetadata(path) {
        if (!this.isInitialized) {
            throw new Error('Firebase Storage not initialized');
        }

        try {
            const storageRef = ref(this.storage, path);
            const metadata = await getMetadata(storageRef);
            return metadata;
        } catch (error) {
            console.error('❌ Error getting file metadata:', error);
            throw error;
        }
    }
}

// Initialize Firebase Storage System immediately
let firebaseStorageInstance = null;

try {
    firebaseStorageInstance = new FirebaseStorageSystem();
    window.firebaseStorage = firebaseStorageInstance;
    console.log('📦 Firebase Storage System instance created');
} catch (error) {
    console.error('❌ Failed to create Firebase Storage System:', error);
    // Create a placeholder object
    window.firebaseStorage = {
        isInitialized: false,
        init: async function() {
            console.log('🔄 Retrying Firebase Storage initialization...');
            try {
                firebaseStorageInstance = new FirebaseStorageSystem();
                window.firebaseStorage = firebaseStorageInstance;
            } catch (e) {
                console.error('❌ Retry failed:', e);
            }
        }
    };
}

// Export for module usage
export default FirebaseStorageSystem;

