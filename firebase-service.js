// Firebase Service Module - Handles all database operations
// Optimized with error handling, caching, and offline support

(function() {
    'use strict';

    const DB_PATH = 'apps';
    const CACHE_KEY = 'firebase_apps_cache';
    const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

    // Cache management
    const cache = {
        get: function() {
            try {
                const cached = localStorage.getItem(CACHE_KEY);
                if (!cached) return null;
                
                const data = JSON.parse(cached);
                const now = Date.now();
                
                // Check if cache is expired
                if (data.timestamp && (now - data.timestamp) > CACHE_TIMEOUT) {
                    localStorage.removeItem(CACHE_KEY);
                    return null;
                }
                
                return data.apps;
            } catch (e) {
                console.error('Cache read error:', e);
                return null;
            }
        },
        
        set: function(apps) {
            try {
                const data = {
                    apps: apps,
                    timestamp: Date.now()
                };
                localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            } catch (e) {
                console.error('Cache write error:', e);
            }
        },
        
        clear: function() {
            try {
                localStorage.removeItem(CACHE_KEY);
            } catch (e) {
                console.error('Cache clear error:', e);
            }
        }
    };

    // Get database reference
    function getDatabase() {
        if (!window.FirebaseDatabase) {
            // Wait a bit for Firebase to initialize
            if (typeof firebase !== 'undefined' && firebase.database) {
                window.FirebaseDatabase = firebase.database();
            } else {
                throw new Error('Firebase Database is not initialized. Make sure firebase-config.js is loaded first.');
            }
        }
        return window.FirebaseDatabase.ref(DB_PATH);
    }

    // Firebase Service API
    const FirebaseService = {
        // Load all apps from Firebase (with immediate cache return)
        loadApps: function(useCacheFirst = false) {
            return new Promise((resolve, reject) => {
                try {
                    // If cache first is requested, return cached data immediately
                    if (useCacheFirst) {
                        const cached = cache.get();
                        if (cached) {
                            // Still fetch from Firebase in background to update cache
                            const db = getDatabase();
                            db.once('value')
                                .then((snapshot) => {
                                    const apps = snapshot.val() || cached;
                                    cache.set(apps);
                                })
                                .catch(() => {
                                    // Silent fail for background update
                                });
                            resolve(cached);
                            return;
                        }
                    }
                    
                    const db = getDatabase();
                    
                    // Load from Firebase (always fetch latest)
                    db.once('value')
                        .then((snapshot) => {
                            const data = snapshot.val();
                            const apps = data || {
                                'top-rated': [],
                                'latest': [],
                                'pc': [],
                                'game': [],
                                'editing': []
                            };
                            
                            // Ensure all categories exist
                            if (!apps['top-rated']) apps['top-rated'] = [];
                            if (!apps['latest']) apps['latest'] = [];
                            if (!apps['pc']) apps['pc'] = [];
                            if (!apps['game']) apps['game'] = [];
                            if (!apps['editing']) apps['editing'] = [];
                            
                            // Update cache with fresh data
                            cache.set(apps);
                            
                            resolve(apps);
                        })
                        .catch((error) => {
                            console.error('Firebase load error:', error);
                            
                            // Fallback to cache if available
                            const cached = cache.get();
                            if (cached) {
                                console.warn('Using cached data due to Firebase error');
                                resolve(cached);
                            } else {
                                // Return empty structure if no cache
                                const emptyApps = {
                                    'top-rated': [],
                                    'latest': [],
                                    'pc': [],
                                    'game': [],
                                    'editing': []
                                };
                                resolve(emptyApps);
                            }
                        });
                } catch (error) {
                    console.error('Firebase service error:', error);
                    
                    // Fallback to cache
                    const cached = cache.get();
                    if (cached) {
                        resolve(cached);
                    } else {
                        // Return empty structure
                        const emptyApps = {
                            'top-rated': [],
                            'latest': [],
                            'pc': [],
                            'game': [],
                            'editing': []
                        };
                        resolve(emptyApps);
                    }
                }
            });
        },

        // Save apps to Firebase
        saveApps: function(apps) {
            return new Promise((resolve, reject) => {
                try {
                    const db = getDatabase();
                    
                    // Update cache immediately for instant UI update
                    cache.set(apps);
                    
                    // Save to Firebase
                    db.set(apps)
                        .then(() => {
                            console.log('Apps saved to Firebase successfully');
                            resolve(apps);
                        })
                        .catch((error) => {
                            console.error('Firebase save error:', error);
                            reject(error);
                        });
                } catch (error) {
                    console.error('Firebase service error:', error);
                    reject(error);
                }
            });
        },

        // Listen to real-time changes
        onAppsChange: function(callback) {
            try {
                const db = getDatabase();
                
                db.on('value', (snapshot) => {
                    const apps = snapshot.val() || {
                        'top-rated': [],
                        'latest': [],
                        'pc': [],
                        'game': [],
                        'editing': []
                    };
                    
                    // Update cache
                    cache.set(apps);
                    
                    if (callback && typeof callback === 'function') {
                        callback(apps);
                    }
                });
            } catch (error) {
                console.error('Firebase listener error:', error);
            }
        },

        // Remove listener
        offAppsChange: function() {
            try {
                const db = getDatabase();
                db.off('value');
            } catch (error) {
                console.error('Firebase listener removal error:', error);
            }
        },

        // Clear cache
        clearCache: function() {
            cache.clear();
        },

        // Get cached apps (synchronous, for immediate use)
        getCachedApps: function() {
            return cache.get() || {
                'top-rated': [],
                'latest': [],
                'pc': [],
                'game': [],
                'editing': []
            };
        }
    };

    // Export service
    window.FirebaseService = FirebaseService;
    
    // Wait for Firebase to be ready
    function waitForFirebase(callback, maxAttempts = 10) {
        let attempts = 0;
        const checkInterval = setInterval(() => {
            attempts++;
            if (window.FirebaseDatabase || (typeof firebase !== 'undefined' && firebase.database)) {
                clearInterval(checkInterval);
                if (typeof firebase !== 'undefined' && firebase.database && !window.FirebaseDatabase) {
                    window.FirebaseDatabase = firebase.database();
                }
                if (callback) callback();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.warn('Firebase Database not available after', maxAttempts, 'attempts');
            }
        }, 100);
    }
    
    // Initialize when Firebase is ready
    waitForFirebase(() => {
        console.log('Firebase Service initialized and ready');
    });
    
    console.log('Firebase Service module loaded');
})();

