/**
 * Two-Factor Authentication functionality
 * This implementation uses the TOTP (Time-Based One-Time Password) standard
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Two-Factor Authentication page loaded');
    
    // Initialize 2FA functionality
    initTwoFactorAuth();
    
    // Add event listeners to buttons
    addEventListeners();
});

// API Base URL
const API_BASE_URL = 'http://localhost:3001';

// Get authentication token from session storage
function getAuthToken() {
    return sessionStorage.getItem('authToken') || sessionStorage.getItem('token');
}

// Initialize the 2FA functionality
function initTwoFactorAuth() {
    // Check if user is authenticated
    const authToken = getAuthToken();
    if (!authToken) {
        showAlert('You must be logged in to access this page', 'error');
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 2000);
        return;
    }
    
    // Check the current 2FA status
    checkTwoFAStatus();
}

// Add event listeners to buttons
function addEventListeners() {
    // Generate QR Code button
    const generateQRButton = document.getElementById('generateQRButton');
    if (generateQRButton) {
        generateQRButton.addEventListener('click', generate2FA);
    }
    
    // Verify 2FA button
    const verifyButton = document.getElementById('verifyButton');
    if (verifyButton) {
        verifyButton.addEventListener('click', verify2FA);
    }
    
    // Disable 2FA button
    const disableButton = document.getElementById('disableButton');
    if (disableButton) {
        disableButton.addEventListener('click', disable2FA);
    }
}

// Check 2FA status
async function checkTwoFAStatus() {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/api/2fa/status`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log('2FA Status response:', data);
        
        if (data.success) {
            updateTwoFAStatus(data.data.twoFactorEnabled);
        } else {
            showAlert(data.message || "Couldn't retrieve 2FA status", 'error');
        }
    } catch (error) {
        console.error('Error checking 2FA status:', error);
        showAlert("Error connecting to server. Please try again later.", 'error');
    } finally {
        hideLoading();
    }
}

// Update UI based on 2FA status
function updateTwoFAStatus(enabled) {
    const statusDiv = document.getElementById('twoFactorStatus');
    const setup2FADiv = document.getElementById('setup2FA');
    const disable2FADiv = document.getElementById('disable2FA');
    const qrCodeSection = document.getElementById('qrCodeSection');
    
    if (statusDiv) {
        if (enabled) {
            statusDiv.innerHTML = `
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div class="flex items-center">
                        <i class="fas fa-check-circle text-green-400 mr-3"></i>
                        <div>
                            <h3 class="text-sm font-medium text-green-800">Two-Factor Authentication is enabled</h3>
                            <p class="text-sm text-green-700 mt-1">Your account is protected with 2FA</p>
                        </div>
                    </div>
                </div>
            `;
        } else {
            statusDiv.innerHTML = `
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div class="flex items-center">
                        <i class="fas fa-exclamation-triangle text-yellow-400 mr-3"></i>
                        <div>
                            <h3 class="text-sm font-medium text-yellow-800">Two-Factor Authentication is disabled</h3>
                            <p class="text-sm text-yellow-700 mt-1">Enable 2FA to add extra security to your account</p>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    // Show/hide appropriate sections based on status
    if (setup2FADiv) setup2FADiv.classList.toggle('hidden', enabled);
    if (disable2FADiv) disable2FADiv.classList.toggle('hidden', !enabled);
    if (qrCodeSection) qrCodeSection.classList.add('hidden');
}

// Generate QR code for 2FA setup
async function generate2FA() {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/api/2fa/generate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log('Generate 2FA response:', data);
        
        if (data.success) {
            // Update UI with QR code and secret key
            const qrCodeContainer = document.getElementById('qrCodeContainer');
            const manualKey = document.getElementById('manualKey');
            
            if (qrCodeContainer) {
                qrCodeContainer.innerHTML = `<img src="${data.data.qrCode}" alt="QR Code" class="border p-2 rounded-lg">`;
            }
            
            if (manualKey) {
                manualKey.textContent = data.data.secret || data.data.manualEntryKey;
            }
            
            // Show QR code section and hide setup section
            document.getElementById('setup2FA').classList.add('hidden');
            document.getElementById('qrCodeSection').classList.remove('hidden');
            
            showAlert('QR Code generated successfully! Scan it with Google Authenticator.', 'success');
        } else {
            showAlert(data.message || "Couldn't generate QR code", 'error');
        }
    } catch (error) {
        console.error('Error generating QR code:', error);
        showAlert("Error connecting to server. Please try again later.", 'error');
    } finally {
        hideLoading();
    }
}

// Verify 2FA code
async function verify2FA() {
    const code = document.getElementById('verificationCode').value;
    
    if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
        showAlert('Please enter a valid 6-digit code', 'error');
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/api/2fa/verify`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: code
            })
        });
        
        const data = await response.json();
        console.log('Verify 2FA response:', data);
        
        if (data.success) {
            showAlert('Two-factor authentication has been enabled!', 'success');
            
            // Update status after a short delay
            setTimeout(() => {
                checkTwoFAStatus();
            }, 1000);
        } else {
            showAlert(data.message || 'Invalid verification code', 'error');
        }
    } catch (error) {
        console.error('Error verifying code:', error);
        showAlert("Error connecting to server. Please try again later.", 'error');
    } finally {
        hideLoading();
    }
}

// Disable 2FA
async function disable2FA() {
    const passwordInput = document.getElementById('currentPassword');
    const password = passwordInput ? passwordInput.value : '';
    
    if (!password) {
        showAlert('Please enter your current password', 'error');
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/api/2fa/disable`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currentPassword: password
            })
        });
        
        const data = await response.json();
        console.log('Disable 2FA response:', data);
        
        if (data.success) {
            showAlert('Two-factor authentication has been disabled', 'success');
            
            // Update status after a short delay
            setTimeout(() => {
                checkTwoFAStatus();
                
                // Reset password field
                if (passwordInput) passwordInput.value = '';
            }, 1000);
        } else {
            showAlert(data.message || 'Failed to disable two-factor authentication', 'error');
        }
    } catch (error) {
        console.error('Error disabling 2FA:', error);
        showAlert("Error connecting to server. Please try again later.", 'error');
    } finally {
        hideLoading();
    }
}

// Show loading overlay
function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
        loadingOverlay.classList.add('flex');
    }
}

// Hide loading overlay
function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
        loadingOverlay.classList.remove('flex');
    }
}

// Display alert message
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `mb-3 p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
        type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
        'bg-blue-100 text-blue-800 border border-blue-200'
    }`;
    alertDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} mr-2"></i>
            <span>${message}</span>
            <button class="ml-auto text-gray-500 hover:text-gray-700" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    alertContainer.appendChild(alertDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode === alertContainer) {
            alertContainer.removeChild(alertDiv);
        }
    }, 5000);
}
