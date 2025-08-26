/**
 * LinkedIn integration functions - Browser compatible version
 */
const LINKEDIN_API_BASE = 'http://localhost:3001';

/**
 * Start LinkedIn connection (get authorization URL)
 */
window.connectLinkedIn = async () => {
    console.log('connectLinkedIn function called');
    try {
        // Show connecting state in button
        const connectBtn = document.querySelector('#linkedin-connect-card button');
        if (connectBtn) {
            console.log('Found LinkedIn connect button, updating state');
            connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Connecting...';
            connectBtn.disabled = true;
        } else {
            console.warn('LinkedIn connect button not found');
        }
        
        // Get auth token
        const token = sessionStorage.getItem('authToken');
        if (!token) {
            throw new Error('Authentication required. Please log in again.');
        }
        
        console.log('Requesting LinkedIn authorization URL...');
        
        // Request auth URL from our backend
        const response = await fetch(`${LINKEDIN_API_BASE}/api/linkedin/auth`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API error (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        console.log('LinkedIn auth response:', data);
        
        if (data.success && data.authUrl) {
            // Store the current page URL to return to after auth
            localStorage.setItem('linkedInReturnUrl', window.location.href);
            
            // Redirect in the SAME window (important for localhost auth flow)
            window.location.href = data.authUrl;
        } else {
            throw new Error(data.message || 'Error getting LinkedIn authorization URL');
        }
    } catch (error) {
        console.error('LinkedIn connection error:', error);
        
        // Display error notification
        if (typeof showNotification === 'function') {
            showNotification('Error: ' + error.message, 'error');
        } else {
            alert('Error: ' + error.message);
        }
        
        // Reset button
        const connectBtn = document.querySelector('#linkedin-connect-card button');
        if (connectBtn) {
            connectBtn.innerHTML = '<i class="fas fa-plus mr-2"></i>Connect';
            connectBtn.disabled = false;
        }
    }
};

// Check for LinkedIn connection on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Checking for LinkedIn connection parameters');
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('linkedin') === 'connected') {
        console.log('LinkedIn connection successful, showing notification');
        // Use the global notification function if it exists
        if (typeof showNotification === 'function') {
            showNotification('LinkedIn connected successfully!', 'success');
        } else {
            // Create our own notification if the global one isn't available
            let container = document.getElementById('notification-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'notification-container';
                container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2';
                document.body.appendChild(container);
            }

            const notification = document.createElement('div');
            notification.className = 'p-4 rounded-lg shadow-lg flex items-center bg-green-100 text-green-800 border-l-4 border-green-500 min-w-[300px]';
            notification.innerHTML = `
                <i class="mr-2 fas fa-check-circle text-green-500"></i>
                <span>LinkedIn connected successfully!</span>
                <button class="ml-auto text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            `;
            notification.querySelector('button').addEventListener('click', () => notification.remove());
            container.appendChild(notification);
            setTimeout(() => notification.parentNode === container && notification.remove(), 5000);
        }
        
        // Remove the query parameter
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
        
        // Refresh the accounts list
        if (typeof loadConnectedAccounts === 'function') {
            setTimeout(loadConnectedAccounts, 1000);
        } else {
            setTimeout(() => window.location.reload(), 1000);
        }
    }
});

