/**
 * Inserts the complete layout into the element with id "layout-placeholder"
 * Include this script in any page that needs the full layout
 */
document.addEventListener('DOMContentLoaded', function() {
    loadLayout();
});

function loadLayout() {
    const layoutPlaceholder = document.getElementById('layout-placeholder');
    if (!layoutPlaceholder) {
        console.error('No layout placeholder found. Add <div id="layout-placeholder"></div> to your HTML.');
        return;
    }
    
    // Get the current page name to highlight active link
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop().split('.')[0];
    const activePage = (currentPage === 'index' || currentPage === '') ? 'main' : currentPage;
    
    // Determine base path for resources
    const inViewsFolder = currentPath.includes('/views/');
    const basePath = inViewsFolder ? '../' : './';
    
    // Generate layout HTML
    const layoutHtml = `
    <div class="min-h-full">
        <!-- Navigation -->
        <nav class="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div class="flex h-20 justify-between items-center">
                    <div class="flex items-center">
                        <div class="flex flex-shrink-0 items-center">
                            <div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-lg mr-3">
                                <i class="fas fa-share-alt text-white text-xl"></i>
                            </div>
                            <h1 class="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Social Hub Manager</h1>
                        </div>
                        <div class="hidden lg:ml-10 lg:flex lg:space-x-1">
                            <a href="${inViewsFolder ? '' : 'views/'}main.html" class="nav-link flex items-center px-4 py-2 rounded-lg transition-all duration-200 hover:bg-indigo-50 ${activePage === 'main' ? 'active' : ''}" data-section="main">
                                <i class="fas fa-chart-line mr-2 text-lg"></i>Home
                            </a>
                            <a href="${inViewsFolder ? '' : 'views/'}compose.html" class="nav-link flex items-center px-4 py-2 rounded-lg transition-all duration-200 hover:bg-indigo-50 ${activePage === 'compose' ? 'active' : ''}" data-section="compose">
                                <i class="fas fa-edit mr-2 text-lg"></i>Compose Post
                            </a>
                            <a href="${inViewsFolder ? '' : 'views/'}queue.html" class="nav-link flex items-center px-4 py-2 rounded-lg transition-all duration-200 hover:bg-indigo-50 ${activePage === 'queue' ? 'active' : ''}" data-section="queue">
                                <i class="fas fa-clock mr-2 text-lg"></i>Post Queue
                            </a>
                            <a href="${inViewsFolder ? '' : 'views/'}schedule.html" class="nav-link flex items-center px-4 py-2 rounded-lg transition-all duration-200 hover:bg-indigo-50 ${activePage === 'schedule' ? 'active' : ''}" data-section="schedule">
                                <i class="fas fa-calendar mr-2 text-lg"></i>Schedule
                            </a>
                            <a href="${inViewsFolder ? '' : 'views/'}accounts.html" class="nav-link flex items-center px-4 py-2 rounded-lg transition-all duration-200 hover:bg-indigo-50 ${activePage === 'accounts' ? 'active' : ''}" data-section="accounts">
                                <i class="fas fa-link mr-2 text-lg"></i>Social Accounts
                            </a>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <!-- Profile dropdown -->
                        <div class="relative ml-3">
                            <div>
                                <button type="button" class="relative flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md hover:shadow-lg transition-shadow duration-200" id="user-menu-button">
                                    <span class="sr-only">Open user menu</span>
                                    <div class="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                                        <span class="text-white font-medium text-sm" id="user-avatar"></span>
                                    </div>
                                </button>
                            </div>
                            <div class="absolute right-0 z-10 mt-3 w-56 origin-top-right rounded-xl bg-white py-2 shadow-xl ring-1 ring-gray-200 focus:outline-none hidden" id="user-menu">
                                <a href="#" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200">
                                    <i class="fas fa-user mr-3 text-indigo-500"></i>Your Profile
                                </a>
                                <a href="${inViewsFolder ? '' : 'views/'}two-factor.html" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200">
                                    <i class="fas fa-shield-alt mr-3 text-green-500"></i>Two-Factor Auth
                                </a>
                                <hr class="my-1 border-gray-200">
                                <a href="#" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200" onclick="handleLogout()">
                                    <i class="fas fa-sign-out-alt mr-3 text-red-500"></i>Sign out
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main content -->
        <main class="py-12 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
            <div class="mx-auto max-w-7xl px-6 lg:px-8">
                <!-- Contenido específico de cada página -->
                <div id="content-container">
                    <!-- El contenido de la página se cargará aquí automáticamente -->
                </div>
            </div>
        </main>
    </div>

    <!-- Componente modal para 2FA (se cargará cuando sea necesario) -->
    <div id="modal-container"></div>
    `;
    
    /* 
     * Backup all the main content elements before modifying the DOM
     * This approach prevents duplication by saving only specific content
    */
    const mainContentElements = [];
    
    const pageContentElement = document.getElementById('page-content');
    if (pageContentElement) {
        mainContentElements.push({
            html: pageContentElement.innerHTML,
            source: 'page-content'
        });
    }
    // Also check for any other direct children of body that are not scripts or the layout placeholder
    const parent = layoutPlaceholder.parentNode;
    if (parent) {
        Array.from(parent.children).forEach(child => {
            if (child !== layoutPlaceholder && child.tagName !== 'SCRIPT') {
                // Save the entire element and mark for removal
                mainContentElements.push({
                    element: child,
                    source: 'direct-child'
                });
            }
        });
    }
    
    // Insert the layout
    layoutPlaceholder.innerHTML = layoutHtml;
    
    // Initialize user menu toggle
    initUserMenu();
    
    // Now insert the saved content into the content container
    const contentContainer = document.getElementById('content-container');
    if (contentContainer && mainContentElements.length > 0) {
        contentContainer.innerHTML = ''; // Clear any default content
        
        mainContentElements.forEach(item => {
            if (item.source === 'page-content') {
                // Insert HTML from page-content
                contentContainer.innerHTML = item.html;
                pageContentElement.remove(); // Remove original to avoid duplication
            } else if (item.source === 'direct-child') {
                // Move the element into the content container
                contentContainer.appendChild(item.element);
            }
        });
    }
    
    // Add necessary CSS
    addLayoutStyles(basePath);
    
}

function initUserMenu() {
    const userMenuButton = document.getElementById('user-menu-button');
    const userMenu = document.getElementById('user-menu');
    
    if (userMenuButton && userMenu) {
        userMenuButton.addEventListener('click', function() {
            userMenu.classList.toggle('hidden');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!userMenuButton.contains(event.target) && !userMenu.contains(event.target)) {
                userMenu.classList.add('hidden');
            }
        });
        
        // Set user avatar
        const userAvatar = document.getElementById('user-avatar');
        if (userAvatar) {
            const userEmail = sessionStorage.getItem('userEmail') || 'U';
            userAvatar.textContent = userEmail.charAt(0).toUpperCase();
        }
    }
}

function addLayoutStyles(basePath) {
    // Add Tailwind CSS
    if (!document.querySelector('script[src*="tailwindcss"]')) {
        const tailwind = document.createElement('script');
        tailwind.src = 'https://cdn.tailwindcss.com';
        document.head.appendChild(tailwind);
    }
    
    // Add Font Awesome
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fontAwesome = document.createElement('link');
        fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        fontAwesome.rel = 'stylesheet';
        document.head.appendChild(fontAwesome);
    }
    
    // Add custom CSS
    if (!document.querySelector('link[href*="dashboard.css"]')) {
        const customCSS = document.createElement('link');
        customCSS.href = `${basePath}css/dashboard.css`;
        customCSS.rel = 'stylesheet';
        document.head.appendChild(customCSS);
    }
}

// Global logout function
window.handleLogout = function() {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = '../index.html';
};

// Function to load 2FA modal
window.loadTwoFAModal = function() {
    // Fetch the modal template
    fetch('../components/twofa-modal.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('modal-container').innerHTML = html;
            document.getElementById('twofa-modal').classList.remove('hidden');
        })
        .catch(error => console.error('Error loading 2FA modal:', error));
};

// Function to close 2FA modal
window.closeTwoFAModal = function() {
    const modal = document.getElementById('twofa-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
};
