// Universal App Detail Loader - Works for both app-detail.html and individual app pages
// Optimized and efficient code

(function() {
    'use strict';

    // Cache DOM elements
    const elements = {
        pageTitle: document.getElementById('pageTitle') || document.querySelector('title'),
        appLogo: document.getElementById('appLogo'),
        breadcrumbs: document.getElementById('breadcrumbs'),
        appTitle: document.getElementById('appTitle'),
        appVersion: document.getElementById('appVersion'),
        appVersionTable: document.getElementById('appVersionTable'),
        downloadBtn: document.getElementById('downloadBtn'),
        telegramBtn: document.getElementById('telegramBtn'),
        youtubeBtn: document.getElementById('youtubeBtn'),
        appDate: document.getElementById('appDate'),
        appSize: document.getElementById('appSize'),
        appRequirements: document.getElementById('appRequirements'),
        appDownloads: document.getElementById('appDownloads'),
        appStore: document.getElementById('appStore'),
        appDescriptionPreview: document.getElementById('appDescriptionPreview'),
        appDescriptionFull: document.getElementById('appDescriptionFull'),
        appDescriptionFullText: document.getElementById('appDescriptionFullText'),
        videoThumbnail: document.getElementById('videoThumbnail'),
        watchYoutubeBtn: document.getElementById('watchYoutubeBtn'),
        imagesCarousel: document.getElementById('imagesCarousel'),
        telegramGroupBtn: document.getElementById('telegramGroupBtn'),
        installationTitle: document.getElementById('installationTitle'),
        appNameForInstall: document.getElementById('appNameForInstall'),
        installationSteps: document.getElementById('installationSteps'),
        downloadLinksSection: document.getElementById('downloadLinksSection'),
        videoSection: document.getElementById('videoSection'),
        imagesSection: document.getElementById('imagesSection'),
        ratingValue: document.querySelector('.rating-value'),
        ratingVotes: document.querySelector('.rating-votes')
    };

    // Get apps data from Firebase (with cache fallback)
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

    // Generate slug from title
    function generateSlug(title) {
        return title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    // Find app in all categories
    async function findApp(appId, appTitle, pageFilename) {
        const apps = await getAppsData();
        const allCategories = ['top-rated', 'latest', 'pc', 'game', 'editing'];
        
        // First try by ID
        if (appId) {
            for (const category of allCategories) {
                const found = apps[category].find(app => app.id === appId);
                if (found) {
                    found.category = category;
                    return found;
                }
            }
        }
        
        // Then try by title slug
        if (appTitle) {
            const searchSlug = generateSlug(appTitle);
            for (const category of allCategories) {
                const found = apps[category].find(app => {
                    const appSlug = generateSlug(app.title);
                    return appSlug === searchSlug;
                });
                if (found) {
                    found.category = category;
                    return found;
                }
            }
        }
        
        // Finally try by page filename
        if (pageFilename) {
            const filenameSlug = pageFilename.replace('.html', '').toLowerCase();
            for (const category of allCategories) {
                const found = apps[category].find(app => {
                    const appSlug = generateSlug(app.title);
                    return appSlug.includes(filenameSlug) || filenameSlug.includes(appSlug);
                });
                if (found) {
                    found.category = category;
                    return found;
                }
            }
        }
        
        return null;
    }

    // Format date
    function formatDate(dateString) {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString; // Return original if invalid
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
            return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        } catch (e) {
            return dateString;
        }
    }

    // Get app from URL or page
    function getAppFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const appId = urlParams.get('id');
        const appTitle = urlParams.get('title');
        
        // Get page filename
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        
        return { id: appId, title: appTitle, filename: filename };
    }

    // Update element safely
    function updateElement(element, value, isHTML = false) {
        if (!element) return;
        if (isHTML) {
            element.innerHTML = value || '';
        } else {
            element.textContent = value || '';
        }
    }

    // Set image with fallback
    function setImage(imgElement, src, fallback = 'images/pokemon-go.webp') {
        if (!imgElement) return;
        if (src) {
            imgElement.src = src;
            imgElement.onerror = function() {
                if (this.src !== fallback) {
                    this.src = fallback;
                } else {
                    this.style.display = 'none';
                }
            };
        } else if (fallback) {
            imgElement.src = fallback;
        }
    }

    // Load images carousel
    function loadImagesCarousel(images, appTitle) {
        if (!elements.imagesCarousel) return;
        
        let imagesToShow = [];
        
        // Handle additionalImages
        if (images && images.length > 0) {
            if (Array.isArray(images)) {
                imagesToShow = images.filter(img => img && typeof img === 'string' && img.trim() !== '');
            } else if (typeof images === 'string') {
                try {
                    const parsed = JSON.parse(images);
                    imagesToShow = Array.isArray(parsed) ? parsed : [images];
                } catch (e) {
                    imagesToShow = [images];
                }
            }
        }
        
        // Fallback to default
        if (imagesToShow.length === 0) {
            imagesToShow = ['images/pokemon-go.webp'];
        }
        
        // Clear and render
        elements.imagesCarousel.innerHTML = '';
        imagesToShow.forEach((img, index) => {
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';
            
            const imgElement = document.createElement('img');
            imgElement.src = img.trim();
            imgElement.alt = `${appTitle} ${imagesToShow.length > 1 ? 'Screenshot ' + (index + 1) : ''}`;
            imgElement.onerror = function() {
                if (this.src.indexOf('pokemon-go') === -1) {
                    this.src = 'images/pokemon-go.webp';
                } else {
                    this.style.display = 'none';
                }
            };
            
            slide.appendChild(imgElement);
            elements.imagesCarousel.appendChild(slide);
        });
        
        // Reset carousel
        if (window.currentSlide !== undefined) {
            window.currentSlide = 0;
        }
        if (elements.imagesCarousel) {
            elements.imagesCarousel.style.transform = 'translateX(0%)';
        }
        
        // Update navigation visibility
        const prevBtn = document.querySelector('.carousel-nav.prev');
        const nextBtn = document.querySelector('.carousel-nav.next');
        if (imagesToShow.length <= 1) {
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
        } else {
            if (prevBtn) prevBtn.style.display = 'flex';
            if (nextBtn) nextBtn.style.display = 'flex';
        }
    }

    // Load video section
    function loadVideoSection(videoLink, youtubeLink) {
        if (!elements.videoSection) return;
        
        const videoUrl = videoLink || youtubeLink;
        if (!videoUrl) {
            elements.videoSection.style.display = 'none';
            return;
        }
        
        elements.videoSection.style.display = 'block';
        
        // Extract YouTube video ID
        const videoIdMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
        let videoId = null;
        
        if (videoIdMatch) {
            videoId = videoIdMatch[1];
            if (elements.videoThumbnail) {
                elements.videoThumbnail.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            }
        } else if (videoUrl && elements.videoThumbnail) {
            // If not YouTube, use the video URL directly as thumbnail
            elements.videoThumbnail.src = videoUrl;
        }
        
        if (elements.watchYoutubeBtn) {
            elements.watchYoutubeBtn.href = videoUrl;
        }
        
        // Add click handler to play video inline
        if (videoId) {
            const videoThumbnailContainer = document.querySelector('.video-thumbnail');
            if (videoThumbnailContainer) {
                videoThumbnailContainer.style.cursor = 'pointer';
                videoThumbnailContainer.onclick = function() {
                    playVideoInline(videoId, videoThumbnailContainer);
                };
            }
        }
    }
    
    // Play video inline
    function playVideoInline(videoId, container) {
        if (!container || !videoId) return;
        
        // Create iframe for YouTube embed
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.position = 'absolute';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.border = 'none';
        iframe.style.borderRadius = '8px';
        
        // Replace thumbnail content with iframe (keep container structure)
        container.innerHTML = '';
        container.appendChild(iframe);
        
        // Remove click handler after playing
        container.onclick = null;
        container.style.cursor = 'default';
    }

    // Load installation steps
    function loadInstallationSteps(steps, appTitle) {
        if (!elements.installationSteps) return;
        
        let installationSteps = [];
        if (steps) {
            if (Array.isArray(steps)) {
                installationSteps = steps;
            } else if (typeof steps === 'string') {
                try {
                    installationSteps = JSON.parse(steps);
                } catch (e) {
                    installationSteps = steps.split('\n').filter(s => s.trim());
                }
            }
        }
        
        // Default steps if none provided
        if (installationSteps.length === 0) {
            installationSteps = [
                `Tap the downloaded ${appTitle} APK file.`,
                'Touch install.',
                'Follow the steps on the screen.'
            ];
        }
        
        if (installationSteps.length > 0) {
            elements.installationSteps.innerHTML = installationSteps.map(step => `<li>${step}</li>`).join('');
            if (elements.installationTitle) elements.installationTitle.style.display = 'block';
            elements.installationSteps.style.display = 'block';
            if (elements.downloadLinksSection) elements.downloadLinksSection.style.display = 'block';
            if (elements.appNameForInstall) elements.appNameForInstall.textContent = appTitle;
        }
    }

    // Main function to load app details
    async function loadAppDetails() {
        const { id, title, filename } = getAppFromURL();
        const app = await findApp(id, title, filename);
        
        if (!app) {
            // If no app found, keep existing content (for backward compatibility)
            console.log('App not found in localStorage, using default content');
            return;
        }
        
        // Update page title
        if (elements.pageTitle) {
            if (elements.pageTitle.tagName === 'TITLE') {
                elements.pageTitle.textContent = `${app.title} - True for PC`;
            } else {
                elements.pageTitle.textContent = `${app.title} - True for PC`;
            }
        }
        
        // Update app logo
        if (app.image && elements.appLogo) {
            setImage(elements.appLogo, app.image);
        }
        
        // Update breadcrumbs
        if (elements.breadcrumbs) {
            const categoryLinks = {
                'top-rated': '<a href="index.html">Home</a>',
                'latest': '<a href="index.html">Home</a>',
                'pc': '<a href="index.html">Home</a> / <a href="pc.html">PC</a>',
                'game': '<a href="index.html">Home</a> / <a href="game.html">Game</a>',
                'editing': '<a href="index.html">Home</a> / <a href="editing-app.html">Editing App</a>'
            };
            elements.breadcrumbs.innerHTML = categoryLinks[app.category] || '<a href="index.html">Home</a>';
        }
        
        // Update app title
        updateElement(elements.appTitle, app.title);
        
        // Update version
        if (app.version) {
            if (elements.appVersion) {
                updateElement(elements.appVersion, app.version);
                elements.appVersion.style.display = 'block';
            }
            if (elements.appVersionTable) {
                updateElement(elements.appVersionTable, app.version);
            }
        }
        
        // Update rating
        if (app.downloads && elements.ratingVotes) {
            elements.ratingVotes.textContent = `Votes: ${app.downloads}`;
        }
        if (app.rating && elements.ratingValue) {
            elements.ratingValue.textContent = app.rating;
        }
        
        // Update buttons
        if (app.downloadLink && elements.downloadBtn) {
            elements.downloadBtn.href = app.downloadLink;
        }
        if (app.telegramLink && elements.telegramBtn) {
            elements.telegramBtn.href = app.telegramLink;
            if (elements.telegramGroupBtn) {
                elements.telegramGroupBtn.href = app.telegramLink;
            }
        }
        if (app.youtubeLink && elements.youtubeBtn) {
            elements.youtubeBtn.href = app.youtubeLink;
        }
        
        // Update table data
        if (elements.appDate) updateElement(elements.appDate, app.date ? formatDate(app.date) : '-');
        if (elements.appSize) updateElement(elements.appSize, app.size || '-');
        if (elements.appRequirements) updateElement(elements.appRequirements, app.requirements || '-');
        if (elements.appDownloads) updateElement(elements.appDownloads, app.downloads || '-');
        
        // Update store
        if (elements.appStore) {
            if (app.store) {
                if (app.store.toLowerCase().includes('windows') || app.store.toLowerCase().includes('microsoft')) {
                    elements.appStore.innerHTML = `<svg class="windows-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 12V6.75l6-1.32v6.48L3 12zm17-9v8.75l-10 .15V5.21L20 3zM3 13l6 .09v6.81l-6-1.15V13zm17 .25V22L10 20.9v-7.15l10 1.5z"/>
                    </svg>`;
                } else {
                    updateElement(elements.appStore, app.store);
                }
            } else {
                updateElement(elements.appStore, '-');
            }
        }
        
        // Update description
        if (app.description && elements.appDescriptionPreview) {
            updateElement(elements.appDescriptionPreview, app.description);
            if (app.descriptionFull && elements.appDescriptionFullText) {
                updateElement(elements.appDescriptionFullText, app.descriptionFull);
                // Show read more button if full description exists
                const readMoreBtn = document.querySelector('.read-more-btn');
                if (readMoreBtn) {
                    readMoreBtn.style.display = 'inline-block';
                    readMoreBtn.textContent = 'Read more';
                    readMoreBtn.setAttribute('aria-expanded', 'false');
                }
            } else {
                // Hide full description section and button if no full description
                if (elements.appDescriptionFull) elements.appDescriptionFull.style.display = 'none';
                const readMoreBtn = document.querySelector('.read-more-btn');
                if (readMoreBtn) readMoreBtn.style.display = 'none';
            }
        }
        
        // Load video section
        loadVideoSection(app.videoLink, app.youtubeLink);
        
        // Load images carousel
        loadImagesCarousel(app.additionalImages || app.image, app.title);
        
        // Load installation steps
        loadInstallationSteps(app.installationSteps, app.title);
        
        // Show download links section if telegram link exists
        if (app.telegramLink && elements.downloadLinksSection) {
            elements.downloadLinksSection.style.display = 'block';
        }
        
        // Initialize read more button state
        initializeReadMoreButton();
    }
    
    // Initialize read more button
    function initializeReadMoreButton() {
        const readMoreBtn = document.querySelector('.read-more-btn');
        const fullContent = document.getElementById('appDescriptionFull');
        const fullText = document.getElementById('appDescriptionFullText');
        
        if (readMoreBtn && fullContent && fullText) {
            // Check if full description has content
            if (fullText.textContent && fullText.textContent.trim() !== '') {
                // Show button and ensure initial state
                readMoreBtn.style.display = 'inline-block';
                readMoreBtn.textContent = 'Read more';
                readMoreBtn.setAttribute('aria-expanded', 'false');
                
                // Ensure preview is visible and full content is hidden initially
                const preview = document.getElementById('appDescriptionPreview');
                if (preview) {
                    preview.style.display = 'block';
                }
                fullContent.style.display = 'none';
            } else {
                // Hide button if no full description
                readMoreBtn.style.display = 'none';
            }
        }
    }

    // Carousel functionality
    window.moveCarousel = function(direction) {
        const track = elements.imagesCarousel;
        if (!track) return;
        
        const slides = track.querySelectorAll('.carousel-slide');
        const totalSlides = slides.length;
        
        if (totalSlides === 0 || totalSlides === 1) return;
        
        if (window.currentSlide === undefined) {
            window.currentSlide = 0;
        }
        
        window.currentSlide += direction;
        if (window.currentSlide < 0) {
            window.currentSlide = totalSlides - 1;
        } else if (window.currentSlide >= totalSlides) {
            window.currentSlide = 0;
        }
        
        track.style.transform = `translateX(-${window.currentSlide * 100}%)`;
    };

    // Toggle description - Make it available immediately and globally
    window.toggleDescription = function(eventOrButton) {
        try {
            // Handle both event object and button element
            let button;
            if (eventOrButton && typeof eventOrButton.preventDefault === 'function') {
                // It's an event object
                eventOrButton.preventDefault();
                eventOrButton.stopPropagation();
                button = eventOrButton.currentTarget || eventOrButton.target;
            } else if (eventOrButton && eventOrButton.nodeType === 1) {
                // It's a DOM element (button) - this is what onclick="toggleDescription(this)" passes
                button = eventOrButton;
            } else {
                // Fallback: Try to find button by selector
                button = document.querySelector('.read-more-btn');
            }
            
            if (!button || !button.nodeType) {
                console.error('toggleDescription: No valid button element found');
                return false;
            }
            
            // Get elements directly by ID (more reliable)
            const preview = document.getElementById('appDescriptionPreview');
            const fullContent = document.getElementById('appDescriptionFull');
            const fullText = document.getElementById('appDescriptionFullText');
            
            if (!preview) {
                console.error('toggleDescription: Preview element (#appDescriptionPreview) not found');
                return false;
            }
            
            if (!fullContent) {
                console.error('toggleDescription: Full content element (#appDescriptionFull) not found');
                return false;
            }
            
            // Check if full content has any text
            if (fullText && (!fullText.textContent || fullText.textContent.trim() === '')) {
                // No full description available, hide button
                button.style.display = 'none';
                return false;
            }
            
            // Toggle visibility - check both inline style and computed style
            const inlineDisplay = fullContent.style.display;
            const computedDisplay = window.getComputedStyle(fullContent).display;
            const isHidden = inlineDisplay === 'none' || computedDisplay === 'none';
            
            if (isHidden) {
                // Show full description
                preview.style.display = 'none';
                fullContent.style.display = 'block';
                button.textContent = 'Hide';
                button.setAttribute('aria-expanded', 'true');
            } else {
                // Hide full description
                fullContent.style.display = 'none';
                preview.style.display = 'block';
                button.textContent = 'Read more';
                button.setAttribute('aria-expanded', 'false');
            }
            
            return true;
        } catch (error) {
            console.error('toggleDescription error:', error);
            return false;
        }
    };

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

    // Setup read more button event listener
    function setupReadMoreButton() {
        const readMoreBtn = document.querySelector('.read-more-btn');
        if (readMoreBtn) {
            // Remove any existing event listeners by cloning (but keep onclick)
            const hasOnclick = readMoreBtn.getAttribute('onclick');
            if (!hasOnclick) {
                // Only add event listener if onclick is not present
                readMoreBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.toggleDescription(e);
                });
            }
        }
    }

    // Initialize on page load
    async function initializeAppDetails() {
        waitForFirebaseService(async () => {
            await loadAppDetails();
            // Setup button after content is loaded
            setTimeout(setupReadMoreButton, 100);
        });
    }

    // Make sure toggleDescription is available immediately
    if (!window.toggleDescription) {
        // Already defined above, but ensure it's available
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initializeAppDetails();
            // Also setup button when DOM is ready
            setTimeout(setupReadMoreButton, 300);
        });
    } else {
        initializeAppDetails();
        setTimeout(setupReadMoreButton, 300);
    }
})();

