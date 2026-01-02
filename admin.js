// Admin JavaScript

// Check authentication
function checkAuth() {
    if (window.location.pathname.includes('admin-dashboard.html')) {
        const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
        if (!isLoggedIn || isLoggedIn !== 'true') {
            window.location.href = 'admin-login.html';
        }
    }
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
            console.warn('Firebase Service not available');
            if (callback) callback();
        }
    }, 100);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    if (window.location.pathname.includes('admin-dashboard.html')) {
        waitForFirebaseService(() => {
            initializeAdminDashboard();
        });
    }
});

// Get apps from Firebase (with cache fallback)
let appsCache = null;

async function getAppsData() {
    // Return cached data immediately if available
    if (appsCache) {
        return appsCache;
    }
    
    // Try to get from Firebase Service
    if (window.FirebaseService) {
        try {
            // First try cached data for immediate response
            const cached = window.FirebaseService.getCachedApps();
            if (cached && (cached['top-rated']?.length > 0 || cached['latest']?.length > 0 || 
                cached['pc']?.length > 0 || cached['game']?.length > 0 || cached['editing']?.length > 0)) {
                appsCache = cached;
                // Still fetch fresh data in background
                window.FirebaseService.loadApps().then(apps => {
                    appsCache = apps;
                }).catch(() => {});
                return cached;
            }
            // If no cache, fetch from Firebase
            const apps = await window.FirebaseService.loadApps();
            appsCache = apps;
            return apps;
        } catch (error) {
            console.error('Error loading from Firebase:', error);
            // Fallback to cached data from service
            const cached = window.FirebaseService.getCachedApps();
            appsCache = cached;
            return cached;
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

// Save apps to Firebase
async function saveAppsData(apps) {
    // Update cache immediately
    appsCache = apps;
    
    // Save to Firebase
    if (window.FirebaseService) {
        try {
            await window.FirebaseService.saveApps(apps);
            return true;
        } catch (error) {
            console.error('Error saving to Firebase:', error);
            alert('Error saving to Firebase. Please check your internet connection and try again.');
            throw error;
        }
    } else {
        console.error('Firebase Service is not available');
        alert('Firebase Service is not initialized. Please refresh the page.');
        throw new Error('Firebase Service not available');
    }
}

// Compress and resize image before converting to base64
function compressImage(file, maxWidth = 400, maxHeight = 400, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Calculate new dimensions
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to base64 with compression
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedBase64);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Convert image file to base64 (with compression for large images)
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        // If file is larger than 500KB, compress it more aggressively
        if (file.size > 500 * 1024) {
            compressImage(file, 300, 300, 0.6)
                .then(resolve)
                .catch(reject);
        } else if (file.size > 200 * 1024) {
            // For medium files, compress moderately
            compressImage(file, 400, 400, 0.7)
                .then(resolve)
                .catch(reject);
        } else {
            // For smaller files, compress slightly to reduce size
            compressImage(file, 500, 500, 0.8)
                .then(resolve)
                .catch(() => {
                    // Fallback to original if compression fails
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
        }
    });
}

// Preview single image
function previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    preview.innerHTML = '';
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '200px';
            img.style.maxHeight = '200px';
            img.style.borderRadius = '8px';
            preview.appendChild(img);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Preview multiple images
function previewMultipleImages(input, previewId) {
    const preview = document.getElementById(previewId);
    preview.innerHTML = '';
    
    if (input.files) {
        Array.from(input.files).forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const item = document.createElement('div');
                item.className = 'image-preview-item';
                item.innerHTML = `
                    <img src="${e.target.result}" alt="Preview ${index + 1}">
                    <button type="button" class="remove-image" onclick="removeImagePreview(${index})">Remove</button>
                `;
                preview.appendChild(item);
            };
            reader.readAsDataURL(file);
        });
    }
}

// Remove image preview
function removeImagePreview(index) {
    const input = document.getElementById('additionalImages');
    const dt = new DataTransfer();
    Array.from(input.files).forEach((file, i) => {
        if (i !== index) {
            dt.items.add(file);
        }
    });
    input.files = dt.files;
    previewMultipleImages(input, 'additionalImagesPreview');
}

// Initialize Admin Dashboard
async function initializeAdminDashboard() {
    await loadAllApps();
    setupFormHandler();
    
    // Set up real-time listener for changes
    if (window.FirebaseService) {
        window.FirebaseService.onAppsChange((apps) => {
            appsCache = apps;
            displayAllApps(apps);
        });
    }
}

// Display all apps
function displayAllApps(apps) {
    // Display apps in each section
    displayApps('top-rated', apps['top-rated']);
    displayApps('latest', apps['latest']);
    displayApps('pc', apps['pc']);
    displayApps('game', apps['game']);
    displayApps('editing', apps['editing']);
    
    // Update stats
    updateStats(apps);
}

// Load all apps and display
async function loadAllApps() {
    const apps = await getAppsData();
    displayAllApps(apps);
}

// Display apps in a section
function displayApps(section, apps) {
    const gridId = {
        'top-rated': 'topRatedGrid',
        'latest': 'latestAppsGrid',
        'pc': 'pcAppsGrid',
        'game': 'gameAppsGrid',
        'editing': 'editingAppsGrid'
    }[section];
    
    const grid = document.getElementById(gridId);
    if (!grid) return;
    
    if (apps.length === 0) {
        grid.innerHTML = '<div class="empty-state"><p>No apps found</p></div>';
        return;
    }
    
    grid.innerHTML = apps.map((app, index) => {
        const titleSlug = app.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const appUrl = `app-detail.html?title=${encodeURIComponent(titleSlug)}&id=${app.id}`;
        return `
        <div class="card-item">
            <img src="${app.image || 'images/pokemon-go.webp'}" alt="${app.title}" onerror="if(this.src.indexOf('pokemon-go')===-1){this.src='images/pokemon-go.webp';}else{this.style.display='none';}">
            <div class="card-item-info">
                <h4>${app.title}</h4>
                <p>${app.category} • ${app.date || 'No date'}</p>
                <a href="${appUrl}" target="_blank" style="color: #20b2aa; font-size: 0.85rem; text-decoration: none; margin-top: 5px; display: inline-block;">View Page →</a>
            </div>
            <div class="card-item-actions">
                <button class="btn btn-primary btn-small" onclick="editApp('${section}', ${index})">Edit</button>
                <button class="btn btn-danger btn-small" onclick="deleteApp('${section}', ${index})">Delete</button>
            </div>
        </div>
    `;
    }).join('');
}

// Update statistics
function updateStats(apps) {
    document.getElementById('topRatedCount').textContent = apps['top-rated'].length;
    document.getElementById('latestAppsCount').textContent = apps['latest'].length;
    document.getElementById('pcAppsCount').textContent = apps['pc'].length;
    document.getElementById('gameAppsCount').textContent = apps['game'].length;
    document.getElementById('editingAppsCount').textContent = apps['editing'].length;
}

// Open add modal
function openAddModal() {
    document.getElementById('appModal').classList.add('active');
    document.getElementById('modalTitle').textContent = 'Add New App';
    document.getElementById('appForm').reset();
    document.getElementById('appId').value = '';
    document.getElementById('appIndex').value = '';
    document.getElementById('appSection').value = '';
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('additionalImagesPreview').innerHTML = '';
}

// Open edit modal
async function editApp(section, index) {
    const apps = await getAppsData();
    const app = apps[section][index];
    
    if (!app) return;
    
    document.getElementById('appModal').classList.add('active');
    document.getElementById('modalTitle').textContent = 'Edit App';
    
    // Fill form with app data
    document.getElementById('appId').value = app.id || '';
    document.getElementById('appIndex').value = index;
    document.getElementById('appSection').value = section;
    document.getElementById('appTitle').value = app.title || '';
    document.getElementById('appCategory').value = section;
    document.getElementById('appVersion').value = app.version || '';
    document.getElementById('appDate').value = app.date || '';
    document.getElementById('appDescription').value = app.description || '';
    document.getElementById('appDescriptionFull').value = app.descriptionFull || '';
    document.getElementById('downloadLink').value = app.downloadLink || '';
    document.getElementById('telegramLink').value = app.telegramLink || '';
    document.getElementById('youtubeLink').value = app.youtubeLink || '';
    document.getElementById('videoLink').value = app.videoLink || '';
    document.getElementById('reportDetails').value = app.reportDetails || '';
    document.getElementById('appSize').value = app.size || '';
    document.getElementById('appRequirements').value = app.requirements || '';
    document.getElementById('appDownloads').value = app.downloads || '';
    document.getElementById('appStore').value = app.store || '';
    document.getElementById('appSubtitle').value = app.subtitle || '';
    
    // Show existing image
    if (app.image) {
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = `<img src="${app.image}" style="max-width: 200px; max-height: 200px; border-radius: 8px;">`;
    }
    
    // Show existing additional images
    if (app.additionalImages && app.additionalImages.length > 0) {
        const preview = document.getElementById('additionalImagesPreview');
        preview.innerHTML = app.additionalImages.map((img, i) => `
            <div class="image-preview-item">
                <img src="${img}" alt="Image ${i + 1}">
            </div>
        `).join('');
    }
}

// Close modal
function closeModal() {
    document.getElementById('appModal').classList.remove('active');
}

// Setup form handler
function setupFormHandler() {
    document.getElementById('appForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const appId = document.getElementById('appId').value;
        const appIndex = document.getElementById('appIndex').value;
        const appSection = document.getElementById('appSection').value;
        const category = document.getElementById('appCategory').value;
        
        // Get image as base64
        let imageBase64 = '';
        const imageFile = document.getElementById('appImage').files[0];
        if (imageFile) {
            imageBase64 = await fileToBase64(imageFile);
        } else if (appId) {
            // Keep existing image when editing
            const apps = await getAppsData();
            const existingApp = apps[appSection][appIndex];
            if (existingApp && existingApp.image) {
                imageBase64 = existingApp.image;
            }
        }
        
        // Get additional images (limit to 3 and compress)
        const additionalImages = [];
        const additionalFiles = document.getElementById('additionalImages').files;
        if (additionalFiles && additionalFiles.length > 0) {
            for (let i = 0; i < Math.min(additionalFiles.length, 3); i++) {
                try {
                    const base64 = await fileToBase64(additionalFiles[i]);
                    additionalImages.push(base64);
                } catch (error) {
                    console.error('Error processing image:', error);
                    alert(`Error processing image ${i + 1}. Please try a smaller image.`);
                }
            }
        } else if (appId) {
            // Keep existing images when editing
            const apps = await getAppsData();
            const existingApp = apps[appSection][appIndex];
            if (existingApp && existingApp.additionalImages) {
                additionalImages.push(...existingApp.additionalImages);
            }
        }
        
        const appData = {
            id: appId || Date.now().toString(),
            title: formData.get('appTitle'),
            category: category,
            version: formData.get('appVersion'),
            date: formData.get('appDate'),
            description: formData.get('appDescription'),
            descriptionFull: formData.get('appDescriptionFull'),
            downloadLink: formData.get('downloadLink'),
            telegramLink: formData.get('telegramLink'),
            youtubeLink: formData.get('youtubeLink'),
            videoLink: formData.get('videoLink'),
            reportDetails: formData.get('reportDetails'),
            size: formData.get('appSize'),
            requirements: formData.get('appRequirements'),
            downloads: formData.get('appDownloads'),
            store: formData.get('appStore'),
            subtitle: formData.get('appSubtitle'),
            image: imageBase64,
            additionalImages: additionalImages,
            createdAt: appId ? (getAppsData()[appSection][appIndex]?.createdAt || Date.now()) : Date.now()
        };
        
        // Store app ID in the data for easy lookup
        if (!appData.id) {
            appData.id = Date.now().toString();
        }
        
        const apps = await getAppsData();
        
        if (appId && appIndex !== '') {
            // Edit existing app
            apps[appSection][appIndex] = appData;
            
            // Also update in Latest Apps if it exists there
            const latestIndex = apps['latest'].findIndex(app => app.id === appData.id);
            if (latestIndex !== -1) {
                apps['latest'][latestIndex] = appData;
            }
        } else {
            // Add new app - add to beginning of array in selected category
            apps[category].unshift(appData);
            
            // Always add to Latest Apps section at the beginning (newest first)
            // Remove if already exists (to avoid duplicates)
            apps['latest'] = apps['latest'].filter(app => app.id !== appData.id);
            apps['latest'].unshift(appData);
        }
        
        try {
            await saveAppsData(apps);
            await loadAllApps();
            closeModal();
            alert(appId ? 'App updated successfully!' : 'App added successfully!');
        } catch (error) {
            console.error('Error saving app:', error);
            alert('Error saving app. ' + (error.message || 'Please try again with smaller images or delete some old apps.'));
        }
    });
}

// Delete app
async function deleteApp(section, index) {
    if (!confirm('Are you sure you want to delete this app?')) {
        return;
    }
    
    const apps = await getAppsData();
    const appToDelete = apps[section][index];
    
    // Delete from selected section
    apps[section].splice(index, 1);
    
    // Also remove from Latest Apps if it exists there
    if (appToDelete && appToDelete.id) {
        apps['latest'] = apps['latest'].filter(app => app.id !== appToDelete.id);
    }
    
    try {
        await saveAppsData(apps);
        await loadAllApps();
        alert('App deleted successfully!');
    } catch (error) {
        console.error('Error deleting app:', error);
        alert('Error deleting app. Please try again.');
    }
}

// Logout
function logout() {
    sessionStorage.removeItem('adminLoggedIn');
    window.location.href = 'admin-login.html';
}

// Close modal on outside click
document.addEventListener('click', function(e) {
    const modal = document.getElementById('appModal');
    if (e.target === modal) {
        closeModal();
    }
});

