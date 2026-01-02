// Load apps from Firebase and display on main pages

// Get apps from Firebase (with cache fallback)
async function getAppsData() {
    // Try to get from Firebase Service
    if (window.FirebaseService) {
        try {
            // First try cached data for immediate response
            const cached = window.FirebaseService.getCachedApps();
            if (cached && (cached['top-rated']?.length > 0 || cached['latest']?.length > 0 || 
                cached['pc']?.length > 0 || cached['game']?.length > 0 || cached['editing']?.length > 0)) {
                // Return cached immediately, but still fetch fresh data in background
                window.FirebaseService.loadApps().catch(() => {});
                return cached;
            }
            // If no cache, fetch from Firebase
            return await window.FirebaseService.loadApps();
        } catch (error) {
            console.error('Error loading from Firebase:', error);
            // Fallback to cached data from service
            return window.FirebaseService.getCachedApps();
        }
    }
    
    // Fallback to default structure
    return {
        'top-rated': [],
        'latest': [],
        'pc': [],
        'game': [],
        'editing': []
    };
}

// Load and display apps for a specific section
async function loadAppsForSection(sectionId, category) {
    const apps = await getAppsData();
    const sectionApps = apps[category] || [];
    
    if (sectionApps.length === 0) {
        return; // Keep existing HTML if no apps in Firebase
    }
    
    // Generate HTML for apps
    let html = '';
    
    if (category === 'top-rated') {
        // Top rated apps carousel format
        html = sectionApps.map(app => `
            <a href="${getAppPageUrl(app.title, app.id)}" class="app-card">
                <div class="app-icon">
                    <img src="${app.image || 'images/pokemon-go.webp'}" alt="${app.title}" onerror="if(this.src.indexOf('pokemon-go')===-1){this.src='images/pokemon-go.webp';}else{this.style.display='none';}">
                </div>
                <div class="app-info">
                    <h3>${truncateText(app.title, 30)}</h3>
                    ${app.subtitle ? `<p class="app-subtitle">${app.subtitle}</p>` : ''}
                    <div class="app-rating">
                        <span class="stars">★★★★★</span>
                    </div>
                    <div class="app-meta">
                        ${app.version ? `<span class="version">${app.version}</span>` : ''}
                        ${app.date ? `<span class="date">${formatDate(app.date)}</span>` : ''}
                    </div>
                </div>
            </a>
        `).join('');
        
        // Insert into carousel
        const carousel = document.querySelector('.apps-carousel');
        if (carousel) {
            carousel.innerHTML = html + carousel.innerHTML;
        }
    } else {
        // Latest apps / category pages format
        html = sectionApps.map(app => `
            <a href="${getAppPageUrl(app.title, app.id)}" class="latest-app-card">
                <div class="latest-app-icon">
                    <img src="${app.image || 'images/pokemon-go.webp'}" alt="${app.title}" onerror="if(this.src.indexOf('pokemon-go')===-1){this.src='images/pokemon-go.webp';}else{this.style.display='none';}">
                </div>
                <div class="latest-app-info">
                    <h3>${truncateText(app.title, 40)}</h3>
                    <div class="latest-app-meta">
                        ${app.version ? `<span class="version">${app.version}</span>` : ''}
                        ${app.date ? `<span class="date">${formatDate(app.date)}</span>` : ''}
                    </div>
                    <div class="latest-app-rating">
                        <span class="stars">★★★★★</span>
                    </div>
                </div>
            </a>
        `).join('');
        
        // Insert into grid
        const container = document.getElementById(sectionId);
        if (container) {
            container.innerHTML = html + container.innerHTML;
            
            // Refresh pagination after adding new cards
            setTimeout(() => {
                if (window.refreshPagination) {
                    window.refreshPagination(sectionId);
                }
            }, 100);
        }
    }
}

// Get app page URL from title and ID
function getAppPageUrl(title, appId) {
    // Use app-detail.html with title parameter
    const titleSlug = title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    let url = `app-detail.html?title=${encodeURIComponent(titleSlug)}`;
    if (appId) {
        url += `&id=${encodeURIComponent(appId)}`;
    }
    return url;
}

// Truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// Wait for Firebase Service to be ready
function waitForFirebaseService(callback, maxAttempts = 20) {
    let attempts = 0;
    const checkInterval = setInterval(() => {
        attempts++;
        if (window.FirebaseService) {
            clearInterval(checkInterval);
            if (callback) callback();
        } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.warn('Firebase Service not available, using fallback');
            if (callback) callback();
        }
    }, 100);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    waitForFirebaseService(async () => {
        await initializeApps();
    });
});

async function initializeApps() {
    try {
        // Load apps for current page
        const path = window.location.pathname;
        
        if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
            await loadAppsForSection('topRatedCarousel', 'top-rated');
            await loadAppsForSection('latestAppsGrid', 'latest');
            // Initialize pagination for latest apps
            setTimeout(() => {
                if (window.initPagination) {
                    window.initPagination('latestAppsGrid', {
                        paginationContainerId: 'latestAppsPagination',
                        cardsPerPage: 5
                    });
                }
            }, 200);
        } else if (path.includes('pc.html')) {
            await loadAppsForSection('pcAppsGrid', 'pc');
            setTimeout(() => {
                if (window.initPagination) {
                    window.initPagination('pcAppsGrid', {
                        paginationContainerId: 'pcAppsPagination',
                        cardsPerPage: 5
                    });
                }
            }, 200);
        } else if (path.includes('game.html')) {
            await loadAppsForSection('gamesGrid', 'game');
            setTimeout(() => {
                if (window.initPagination) {
                    window.initPagination('gamesGrid', {
                        paginationContainerId: 'gamesPagination',
                        cardsPerPage: 5
                    });
                }
            }, 200);
        } else if (path.includes('editing-app.html')) {
            await loadAppsForSection('editingAppsGrid', 'editing');
            setTimeout(() => {
                if (window.initPagination) {
                    window.initPagination('editingAppsGrid', {
                        paginationContainerId: 'editingAppsPagination',
                        cardsPerPage: 5
                    });
                }
            }, 200);
        }
    } catch (error) {
        console.error('Error initializing apps:', error);
    }
}

