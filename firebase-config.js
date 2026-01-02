// Firebase Configuration - Optimized
// Initialize Firebase only once and export reusable instances
// Using Firebase Compat API for compatibility

(function() {
    'use strict';

    // Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyAyk981Z7xPlib0WT2MQ9ObE9td_dIbUpQ",
        authDomain: "softapk.firebaseapp.com",
        databaseURL: "https://softapk-default-rtdb.firebaseio.com",
        projectId: "softapk",
        storageBucket: "softapk.firebasestorage.app",
        messagingSenderId: "532704148864",
        appId: "1:532704148864:web:f58df6684cd6ea8e945565",
        measurementId: "G-WG14XNZKNK"
    };

    // Initialize Firebase only if not already initialized
    let app, database, analytics;
    
    function initializeFirebase() {
        try {
            // Check if Firebase is already initialized (compat API)
            if (typeof firebase !== 'undefined') {
                // Check if app already exists
                if (firebase.apps && firebase.apps.length > 0) {
                    app = firebase.app();
                } else {
                    // Initialize Firebase
                    app = firebase.initializeApp(firebaseConfig);
                }
                
                // Get database instance
                database = firebase.database();
                
                // Initialize Analytics only if available
                if (firebase.analytics && typeof firebase.analytics !== 'undefined') {
                    try {
                        analytics = firebase.analytics(app);
                    } catch (e) {
                        console.warn('Analytics initialization failed:', e);
                    }
                }
                
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Firebase initialization error:', error);
            return false;
        }
    }
    
    // Try to initialize immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            if (!initializeFirebase()) {
                // Retry after a short delay
                setTimeout(initializeFirebase, 100);
            }
        });
    } else {
        if (!initializeFirebase()) {
            // Retry after a short delay
            setTimeout(initializeFirebase, 100);
        }
    }

    // Export Firebase instances
    window.FirebaseApp = app;
    window.FirebaseDatabase = database;
    window.FirebaseAnalytics = analytics;
    
    // Export config for external use
    window.FirebaseConfig = firebaseConfig;
    
    if (app && database) {
        console.log('Firebase initialized successfully');
    } else {
        console.warn('Firebase initialization incomplete. Some features may not work.');
    }
})();

