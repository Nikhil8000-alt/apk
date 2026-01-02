// Universal Search Module - Works across all pages
// Optimized search functionality with Firebase integration

(function() {
    'use strict';

    // Search state
    let searchTimeout = null;
    let allAppsCache = null;

    // Get all apps from Firebase
    async function getAllApps() {
        if (allAppsCache) {
            return allAppsCache;
        }

        if (window.FirebaseService) {
            try {
                const apps = await window.FirebaseService.loadApps();
                // Flatten all categories into single array
                const allApps = [];
                Object.keys(apps).forEach(category => {
                    if (Array.isArray(apps[category])) {
                        apps[category].forEach(app => {
                            if (app && app.id) {
                                // Add category to app for filtering
                                const appWithCategory = { ...app, searchCategory: category };
                                // Avoid duplicates by ID
                                if (!allApps.find(a => a.id === app.id)) {
                                    allApps.push(appWithCategory);
                                }
                            }
                        });
                    }
                });
                allAppsCache = allApps;
                return allApps;
            } catch (error) {
                console.error('Error loading apps for search:', error);
                return [];
            }
        }
        return [];
    }

    // Normalize text for search (remove special chars, lowercase)
    function normalizeText(text) {
        if (!text) return '';
        return text.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .trim();
    }

    // Search apps
    function searchApps(query, apps) {
        if (!query || query.trim() === '') {
            return [];
        }

        const normalizedQuery = normalizeText(query);
        const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);

        return apps.filter(app => {
            const title = normalizeText(app.title || '');
            const description = normalizeText(app.description || '');
            const subtitle = normalizeText(app.subtitle || '');
            const category = normalizeText(app.category || app.searchCategory || '');
            const version = normalizeText(app.version || '');

            // Check if all query words match
            return queryWords.every(word => {
                return title.includes(word) ||
                       description.includes(word) ||
                       subtitle.includes(word) ||
                       category.includes(word) ||
                       version.includes(word);
            });
        });
    }

    // Create search results HTML
    function createSearchResultsHTML(results) {
        if (results.length === 0) {
            return `
                <div class="search-results-empty">
                    <p>No apps found matching your search.</p>
                </div>
            `;
        }

        return results.map(app => {
            const titleSlug = (app.title || '').toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            const appUrl = `app-detail.html?title=${encodeURIComponent(titleSlug)}&id=${app.id || ''}`;
            
            return `
                <a href="${appUrl}" class="search-result-item">
                    <div class="search-result-icon">
                        <img src="${app.image || 'images/pokemon-go.webp'}" 
                             alt="${app.title || 'App'}" 
                             onerror="this.src='images/pokemon-go.webp';">
                    </div>
                    <div class="search-result-info">
                        <h4>${app.title || 'Untitled App'}</h4>
                        ${app.subtitle ? `<p class="search-result-subtitle">${app.subtitle}</p>` : ''}
                        ${app.description ? `<p class="search-result-desc">${app.description.substring(0, 100)}${app.description.length > 100 ? '...' : ''}</p>` : ''}
                        <div class="search-result-meta">
                            ${app.category ? `<span class="search-result-category">${app.category}</span>` : ''}
                            ${app.version ? `<span class="search-result-version">v${app.version}</span>` : ''}
                        </div>
                    </div>
                </a>
            `;
        }).join('');
    }

    // Show search results
    function showSearchResults(results) {
        // Find or create search results container
        let resultsContainer = document.getElementById('searchResultsContainer');
        
        if (!resultsContainer) {
            resultsContainer = document.createElement('div');
            resultsContainer.id = 'searchResultsContainer';
            resultsContainer.className = 'search-results-container';
            
            // Insert after search container
            const searchContainer = document.querySelector('.search-container');
            if (searchContainer && searchContainer.parentElement) {
                searchContainer.parentElement.appendChild(resultsContainer);
            } else {
                // Fallback: insert at beginning of main content
                const mainContent = document.querySelector('.main-content') || document.querySelector('main');
                if (mainContent) {
                    mainContent.insertBefore(resultsContainer, mainContent.firstChild);
                }
            }
        }

        resultsContainer.innerHTML = createSearchResultsHTML(results);
        resultsContainer.style.display = results.length > 0 || document.querySelector('.search-input').value.trim() !== '' ? 'block' : 'none';
    }

    // Hide search results
    function hideSearchResults() {
        const resultsContainer = document.getElementById('searchResultsContainer');
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }
    }

    // Perform search
    async function performSearch(query) {
        if (!query || query.trim() === '') {
            hideSearchResults();
            return;
        }

        try {
            const allApps = await getAllApps();
            const results = searchApps(query, allApps);
            showSearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
            hideSearchResults();
        }
    }

    // Initialize search on page
    function initializeSearch() {
        const searchInputs = document.querySelectorAll('.search-input');
        const searchButtons = document.querySelectorAll('.search-button');

        searchInputs.forEach(input => {
            // Clear previous listeners
            const newInput = input.cloneNode(true);
            input.parentNode.replaceChild(newInput, input);

            // Add event listeners
            newInput.addEventListener('input', function(e) {
                const query = e.target.value.trim();
                
                // Clear previous timeout
                if (searchTimeout) {
                    clearTimeout(searchTimeout);
                }

                // Debounce search (wait 300ms after user stops typing)
                searchTimeout = setTimeout(() => {
                    performSearch(query);
                }, 300);
            });

            newInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const query = e.target.value.trim();
                    if (searchTimeout) {
                        clearTimeout(searchTimeout);
                    }
                    performSearch(query);
                }
            });

            // Hide results when input is cleared
            newInput.addEventListener('blur', function() {
                // Delay to allow click on results
                setTimeout(() => {
                    if (newInput.value.trim() === '') {
                        hideSearchResults();
                    }
                }, 200);
            });
        });

        searchButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const searchInput = button.parentElement.querySelector('.search-input');
                if (searchInput) {
                    const query = searchInput.value.trim();
                    performSearch(query);
                    searchInput.focus();
                }
            });
        });

        // Close results when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.search-container') && 
                !e.target.closest('#searchResultsContainer')) {
                // Don't hide if there's a query
                const searchInput = document.querySelector('.search-input');
                if (searchInput && searchInput.value.trim() === '') {
                    hideSearchResults();
                }
            }
        });
    }

    // Wait for DOM and Firebase
    function waitAndInitialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(initializeSearch, 100);
            });
        } else {
            setTimeout(initializeSearch, 100);
        }
    }

    // Initialize
    waitAndInitialize();

    // Export for manual trigger
    window.performAppSearch = performSearch;
    window.clearSearchCache = function() {
        allAppsCache = null;
    };

    console.log('Search module loaded');
})();

