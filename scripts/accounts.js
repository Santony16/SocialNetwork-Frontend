/**
 * Accounts management - Handles fetching and displaying connected social accounts
 */
const API_BASE_URL = 'http://localhost:3001';

/**
 * Load connected accounts from the API
 */
window.loadConnectedAccounts = async function() {
    console.log('loadConnectedAccounts called');
    try {
        const token = getAuthToken();
        const user = getCurrentUser();
        if (!token) {
            console.warn('No token found in sessionStorage');
        }
        if (!user) {
            console.warn('No user found in sessionStorage');
        }
        if (!token || !user) {
            showNotification('Authentication required. Please log in again.', 'error');
            setTimeout(() => window.location.href = '../index.html', 2000);
            return;
        }

        // Pass user id as query param
        console.log('Fetching accounts for user id:', user.id);
        const response = await fetch(`${API_BASE_URL}/api/accounts?user_id=${user.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            console.error('API response not ok:', response.status, response.statusText);
            throw new Error(`HTTP error ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            console.log('Accounts loaded:', result.data);
            displayConnectedAccounts(result.data);
        } else {
            throw new Error(result.message || 'Failed to retrieve connected accounts');
        }
    } catch (error) {
        console.error('Error loading connected accounts:', error);
        displayEmptyState();
    }
}

/**
 * Show connected accounts in the UI
 */
function displayConnectedAccounts(accounts) {
    const container = document.getElementById('connected-accounts-list');
    if (!container) return;

    container.innerHTML = '';

    // Detect which platforms are already connected
    const mastodonConnected = accounts.some(acc => acc.provider && acc.provider.toLowerCase() === 'mastodon');
    const redditConnected = accounts.some(acc => acc.provider && acc.provider.toLowerCase() === 'reddit');
    const linkedinConnected = accounts.some(acc => acc.provider && acc.provider.toLowerCase() === 'linkedin');

    console.log('Connection status:', { mastodonConnected, redditConnected, linkedinConnected });

    // Hide Mastodon connect button if already connected
    const mastodonBtn = document.querySelector('#mastodon-connect-card button');
    if (mastodonBtn) {
        mastodonBtn.style.display = mastodonConnected ? 'none' : '';
    }
    
    // Hide Reddit connect button if already connected
    const redditBtn = document.querySelector('#reddit-connect-card button');
    if (redditBtn) {
        redditBtn.style.display = redditConnected ? 'none' : '';
    }
    
    // Hide LinkedIn connect button if already connected
    const linkedinBtn = document.querySelector('#linkedin-connect-card button');
    if (linkedinBtn) {
        console.log('LinkedIn button found:', linkedinBtn);
        console.log('Setting display to:', linkedinConnected ? 'none' : '');
        linkedinBtn.style.display = linkedinConnected ? 'none' : '';
    } else {
        console.warn('LinkedIn button not found in the DOM');
    }

    if (!accounts || accounts.length === 0) {
        displayEmptyState();
        return;
    }

    accounts.forEach(account => {
        const el = document.createElement('div');
        el.className = 'bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300';
        
        // Determine correct color scheme and icon based on provider
        let bgColorClass, faIcon;
        switch(account.provider.toLowerCase()) {
            case 'reddit':
                bgColorClass = 'bg-gradient-to-r from-orange-500 to-yellow-500';
                faIcon = 'fa-reddit';
                break;
            case 'linkedin':
                bgColorClass = 'bg-gradient-to-r from-blue-500 to-blue-700';
                faIcon = 'fa-linkedin-in';
                break;
            case 'mastodon':
            default:
                bgColorClass = 'bg-gradient-to-r from-purple-500 to-indigo-600';
                faIcon = 'fa-mastodon';
                break;
        }

        // Format the username to show with @ prefix if it doesn't already have it
        let displayUsername = account.username;
        if (displayUsername && !displayUsername.startsWith('@')) {
            displayUsername = '@' + displayUsername;
        }

        el.innerHTML = `
            <div class="p-5">
                <div class="flex items-center mb-4">
                    <div class="w-12 h-12 ${bgColorClass} rounded-lg flex items-center justify-center text-white text-lg mr-3">
                        <i class="fab ${faIcon}"></i>
                    </div>
                    <div>
                        <h5 class="font-medium text-gray-900">${displayUsername || account.provider + ' User'}</h5>
                        <p class="text-sm text-gray-500">${account.instance_url || 'https://www.linkedin.com'}</p>
                    </div>
                </div>

                <div class="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span class="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        <i class="fas fa-check-circle mr-1"></i>
                        Connected
                    </span>
                    <button onclick="disconnectAccount(${account.id})" class="text-sm text-gray-500 hover:text-red-600 transition-colors">
                        <i class="fas fa-unlink mr-1"></i>
                        Disconnect
                    </button>
                </div>
            </div>
        `;

        container.appendChild(el);
    });
}

/**
 * Display empty state when no accounts are connected
 */
function displayEmptyState() {
    const container = document.getElementById('connected-accounts-list');
    if (!container) return;

    container.innerHTML = `
        <div class="text-center py-8 col-span-full">
            <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <i class="fas fa-link text-gray-400 text-xl"></i>
            </div>
            <p class="text-gray-500">No accounts connected yet</p>
            <p class="text-sm text-gray-400">Connect your first social media account to get started</p>
        </div>
    `;
}

/**
 * Disconnect any social account (generic, works for any provider)
 */
window.disconnectAccount = async function (accountId) {
    if (!confirm('Are you sure you want to disconnect this account?')) return;

    try {
        const token = getAuthToken();
        if (!token) {
            showNotification('Authentication token not found. Please log in again.', 'error');
            return;
        }

        // Generic endpoint for any social account
        const response = await fetch(`${API_BASE_URL}/api/accounts/${accountId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showNotification('Account disconnected successfully', 'success');
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showNotification(data.message || 'Error disconnecting account', 'error');
        }
    } catch (error) {
        console.error('Disconnect error:', error);
        showNotification('Error disconnecting account', 'error');
    }
};

/**
 * Get authentication token
 */
function getAuthToken() {
    return sessionStorage.getItem('authToken') || sessionStorage.getItem('token');
}

/**
 * Get current user from sessionStorage
 */
function getCurrentUser() {
    try {
        const user = sessionStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2';
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = `p-4 rounded-lg shadow-lg flex items-center ${
        type === 'success'
            ? 'bg-green-100 text-green-800 border-l-4 border-green-500'
            : type === 'error'
            ? 'bg-red-100 text-red-800 border-l-4 border-red-500'
            : 'bg-blue-100 text-blue-800 border-l-4 border-blue-500'
    } min-w-[300px]`;

    notification.innerHTML = `
        <i class="mr-2 ${
            type === 'success'
                ? 'fas fa-check-circle text-green-500'
                : type === 'error'
                ? 'fas fa-exclamation-circle text-red-500'
                : 'fas fa-info-circle text-blue-500'
        }"></i>
        <span>${message}</span>
        <button class="ml-auto text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
        </button>
    `;

    notification.querySelector('button').addEventListener('click', () => notification.remove());

    container.appendChild(notification);

    setTimeout(() => notification.remove(), 5000);
}

