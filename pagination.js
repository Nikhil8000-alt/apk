// Reusable Pagination Module - Works with dynamic content
// Optimized and efficient pagination system

(function() {
    'use strict';

    // Pagination instances storage
    const paginationInstances = {};

    // Initialize pagination for a container
    window.initPagination = function(containerId, options = {}) {
        const {
            cardsPerPage = 5,
            cardSelector = '.latest-app-card',
            paginationContainerId = null,
            onPageChange = null
        } = options;

        // Get container
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Pagination: Container #${containerId} not found`);
            return null;
        }

        // Get pagination container
        const paginationId = paginationContainerId || `${containerId}Pagination`;
        const paginationContainer = document.getElementById(paginationId);
        if (!paginationContainer) {
            console.warn(`Pagination: Pagination container #${paginationId} not found`);
            return null;
        }

        // Get all cards (including dynamically loaded ones)
        const getAllCards = () => {
            return Array.from(container.querySelectorAll(cardSelector));
        };

        let currentPage = 1;
        let totalPages = 0;

        // Function to show cards for a specific page
        function showPage(page) {
            const cards = getAllCards();
            
            if (cards.length === 0) {
                paginationContainer.style.display = 'none';
                return;
            }

            totalPages = Math.ceil(cards.length / cardsPerPage);
            
            if (totalPages <= 1) {
                paginationContainer.style.display = 'none';
                // Show all cards if only one page
                cards.forEach(card => {
                    card.classList.add('show');
                });
                return;
            }

            paginationContainer.style.display = 'flex';
            
            const startIndex = (page - 1) * cardsPerPage;
            const endIndex = startIndex + cardsPerPage;
            
            cards.forEach((card, index) => {
                if (index >= startIndex && index < endIndex) {
                    card.classList.add('show');
                } else {
                    card.classList.remove('show');
                }
            });
            
            // Update active page in pagination
            const pageNumbers = paginationContainer.querySelectorAll('.page-number:not(.nav-btn)');
            pageNumbers.forEach((btn) => {
                const pageNum = parseInt(btn.textContent);
                if (pageNum === page) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            // Update nav buttons
            const prevBtn = paginationContainer.querySelector('.prev-btn');
            const nextBtn = paginationContainer.querySelector('.next-btn');
            
            if (prevBtn) {
                prevBtn.style.display = page > 1 ? 'inline-block' : 'none';
            }
            if (nextBtn) {
                nextBtn.style.display = page < totalPages ? 'inline-block' : 'none';
            }
            
            // Call callback if provided
            if (onPageChange && typeof onPageChange === 'function') {
                onPageChange(page, totalPages);
            }
        }

        // Generate pagination buttons
        function generatePagination() {
            const cards = getAllCards();
            totalPages = Math.ceil(cards.length / cardsPerPage);
            
            if (totalPages <= 1) {
                paginationContainer.innerHTML = '';
                paginationContainer.style.display = 'none';
                // Show all cards
                cards.forEach(card => card.classList.add('show'));
                return;
            }

            paginationContainer.style.display = 'flex';
            paginationContainer.innerHTML = '';
            
            // Previous button
            const prevBtn = document.createElement('a');
            prevBtn.href = '#';
            prevBtn.className = 'page-number nav-btn prev-btn';
            prevBtn.textContent = '« Prev';
            prevBtn.style.display = 'none';
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (currentPage > 1) {
                    currentPage--;
                    showPage(currentPage);
                    // Scroll to top of container
                    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
            paginationContainer.appendChild(prevBtn);
            
            // Page number buttons (show max 5 pages at a time)
            const maxVisiblePages = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            if (endPage - startPage < maxVisiblePages - 1) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }
            
            // First page
            if (startPage > 1) {
                const firstBtn = document.createElement('a');
                firstBtn.href = '#';
                firstBtn.className = 'page-number';
                firstBtn.textContent = '1';
                firstBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    currentPage = 1;
                    showPage(currentPage);
                    generatePagination();
                    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
                paginationContainer.appendChild(firstBtn);
                
                if (startPage > 2) {
                    const ellipsis = document.createElement('span');
                    ellipsis.className = 'page-ellipsis';
                    ellipsis.textContent = '...';
                    paginationContainer.appendChild(ellipsis);
                }
            }
            
            // Page numbers
            for (let i = startPage; i <= endPage; i++) {
                const pageBtn = document.createElement('a');
                pageBtn.href = '#';
                pageBtn.className = 'page-number';
                pageBtn.textContent = i;
                if (i === currentPage) {
                    pageBtn.classList.add('active');
                }
                
                pageBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    currentPage = i;
                    showPage(currentPage);
                    generatePagination();
                    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
                
                paginationContainer.appendChild(pageBtn);
            }
            
            // Last page
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    const ellipsis = document.createElement('span');
                    ellipsis.className = 'page-ellipsis';
                    ellipsis.textContent = '...';
                    paginationContainer.appendChild(ellipsis);
                }
                
                const lastBtn = document.createElement('a');
                lastBtn.href = '#';
                lastBtn.className = 'page-number';
                lastBtn.textContent = totalPages;
                lastBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    currentPage = totalPages;
                    showPage(currentPage);
                    generatePagination();
                    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
                paginationContainer.appendChild(lastBtn);
            }
            
            // Next button
            const nextBtn = document.createElement('a');
            nextBtn.href = '#';
            nextBtn.className = 'page-number nav-btn next-btn';
            nextBtn.textContent = 'Next »';
            nextBtn.style.display = currentPage < totalPages ? 'inline-block' : 'none';
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (currentPage < totalPages) {
                    currentPage++;
                    showPage(currentPage);
                    generatePagination();
                    // Scroll to top of container
                    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
            paginationContainer.appendChild(nextBtn);
        }

        // Public API
        const paginationInstance = {
            init: function() {
                const cards = getAllCards();
                if (cards.length > 0) {
                    generatePagination();
                    showPage(1);
                } else {
                    paginationContainer.innerHTML = '';
                    paginationContainer.style.display = 'none';
                }
            },
            
            refresh: function() {
                // Re-initialize when new cards are added
                currentPage = 1;
                this.init();
            },
            
            goToPage: function(page) {
                const cards = getAllCards();
                totalPages = Math.ceil(cards.length / cardsPerPage);
                if (page >= 1 && page <= totalPages) {
                    currentPage = page;
                    showPage(currentPage);
                    generatePagination();
                }
            },
            
            getCurrentPage: function() {
                return currentPage;
            },
            
            getTotalPages: function() {
                const cards = getAllCards();
                return Math.ceil(cards.length / cardsPerPage);
            }
        };

        // Store instance
        paginationInstances[containerId] = paginationInstance;

        // Initialize
        paginationInstance.init();

        return paginationInstance;
    };

    // Refresh pagination for a container (useful after dynamic content loads)
    window.refreshPagination = function(containerId) {
        if (paginationInstances[containerId]) {
            paginationInstances[containerId].refresh();
        } else {
            // Try to initialize if not already initialized
            const container = document.getElementById(containerId);
            if (container) {
                // Try to detect pagination container
                const paginationId = `${containerId}Pagination`;
                const paginationContainer = document.getElementById(paginationId);
                if (paginationContainer) {
                    window.initPagination(containerId, {
                        paginationContainerId: paginationId
                    });
                }
            }
        }
    };

    console.log('Pagination module loaded');
})();

