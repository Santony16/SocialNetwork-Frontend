// Mastodon integration functions
window.connectMastodon = async () => {
    try {
        const token = sessionStorage.getItem('authToken');
        
        if (!token) {
            showNotification('Please log in again', 'error');
            return;
        }
        
        const response = await fetch('http://localhost:3001/api/mastodon/auth', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to get authorization URL');
        }

        const data = await response.json();
        
        if (data.success) {
            if (data.isOOB) {
                // Handle OOB flow - show modal for code input
                showOOBModal(data.authUrl);
            } else {
                // Regular redirect flow
                window.location.href = data.authUrl;
            }
        } else {
            showNotification(data.message || 'Error connecting to Mastodon', 'error');
        }
    } catch (error) {
        console.error('Mastodon connection error:', error);
        showNotification(error.message || 'Error connecting to Mastodon', 'error');
    }
};

// Show OOB Modal for manual code input
window.showOOBModal = (authUrl) => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Connect Mastodon Account</h3>
            <p class="text-gray-600 mb-4">
                Click the button below to authorize the application, then copy and paste the authorization code here.
            </p>
            
            <div class="mb-4">
                <a href="${authUrl}" target="_blank" class="btn-primary inline-block text-center w-full">
                    <i class="fab fa-mastodon mr-2"></i>
                    Authorize on Mastodon
                </a>
            </div>
            
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Authorization Code:
                </label>
                <input type="text" id="mastodon-code" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Paste your authorization code here">
            </div>
            
            <div class="flex space-x-3">
                <button onclick="submitMastodonCode()" class="btn-primary flex-1">
                    <i class="fas fa-check mr-2"></i>
                    Connect
                </button>
                <button onclick="closeOOBModal()" class="btn-secondary flex-1">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus on the code input
    setTimeout(() => {
        document.getElementById('mastodon-code').focus();
    }, 100);
};

// Submit the OOB authorization code
window.submitMastodonCode = async () => {
    const code = document.getElementById('mastodon-code').value.trim();
    
    if (!code) {
        showNotification('Please enter the authorization code', 'error');
        return;
    }
    
    try {
        const token = sessionStorage.getItem('authToken');
        
        if (!token) {
            showNotification('Authentication token not found. Please log in again.', 'error');
            closeOOBModal();
            return;
        }
        
        // Add loading state
        const connectButton = document.querySelector('#mastodon-code').nextElementSibling;
        if (connectButton) {
            const originalText = connectButton.innerHTML;
            connectButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Connecting...';
            connectButton.disabled = true;
            
            // Reset button after timeout in case of failure
            setTimeout(() => {
                if (connectButton.disabled) {
                    connectButton.innerHTML = originalText;
                    connectButton.disabled = false;
                }
            }, 10000);
        }
        
        const response = await fetch('http://localhost:3001/api/mastodon/connect', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code: code })
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
            closeOOBModal();
            showNotification('Mastodon account connected successfully!', 'success');
            setTimeout(() => window.location.reload(), 1000);
        } else {
            const errorMsg = data.message || (response.status === 500 ? 
                'Server error connecting to Mastodon. Please try again.' : 
                'Error connecting account');
            showNotification(errorMsg, 'error');
            
            // Reset button state
            if (connectButton) {
                connectButton.innerHTML = 'Connect';
                connectButton.disabled = false;
            }
        }
    } catch (error) {
        console.error('Error submitting Mastodon code:', error);
        showNotification('Network error. Please try again.', 'error');
        
        // Close modal on critical error
        closeOOBModal();
    }
};

// Close OOB Modal
window.closeOOBModal = () => {
    const modal = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
    if (modal) {
        modal.remove();
    }
};

// Helper notification function if not present
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
