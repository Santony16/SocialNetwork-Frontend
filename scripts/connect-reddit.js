/**
 * Reddit integration functions
 */
const REDDIT_API_BASE = 'http://localhost:3001';

/**
 * Start Reddit connection (get authorization URL)
 */
window.connectReddit = async () => {
    try {
        const token = sessionStorage.getItem('authToken');
        console.log('[Reddit] connectReddit called. Token:', !!token);

        if (!token) {
            showNotification('Please log in again', 'error');
            return;
        }

        const response = await fetch(`${REDDIT_API_BASE}/api/reddit/auth`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('[Reddit] /api/reddit/auth status:', response.status);

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('[Reddit] Non-JSON response:', text);
            showNotification('Reddit API not available or misconfigured.', 'error');
            return;
        }

        const data = await response.json();
        console.log('[Reddit] /api/reddit/auth response:', data);

        if (response.ok && data.success && data.authUrl) {
            // Open Reddit OAuth in the same window (recommended for OAuth2)
            window.location.href = data.authUrl;
        } else {
            showNotification(data.message || 'Error connecting to Reddit', 'error');
        }
    } catch (error) {
        console.error('[Reddit] Reddit connection error:', error);
        showNotification(error.message || 'Error connecting to Reddit', 'error');
    }
};

/**
 * Show OOB Modal for Reddit authorization code
 */
window.showRedditOOBModal = (authUrl) => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Connect Reddit Account</h3>
            <p class="text-gray-600 mb-4">
                Click the button below to authorize the application, then copy and paste the authorization code here.
            </p>
            
            <div class="mb-4">
                <a href="${authUrl}" target="_blank" class="btn-primary inline-block text-center w-full">
                    <i class="fab fa-reddit mr-2"></i>
                    Authorize on Reddit
                </a>
            </div>
            
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Authorization Code:
                </label>
                <input type="text" id="reddit-code" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder="Paste your authorization code here">
            </div>
            
            <div class="flex space-x-3">
                <button onclick="submitRedditCode()" class="btn-primary flex-1">
                    <i class="fas fa-check mr-2"></i>
                    Connect
                </button>
                <button onclick="closeRedditOOBModal()" class="btn-secondary flex-1">
                    Cancel
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    setTimeout(() => {
        document.getElementById('reddit-code').focus();
    }, 100);
};

/**
 * Close Reddit OOB modal
 */
window.closeRedditOOBModal = () => {
    const modal = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
    if (modal) modal.remove();
};
