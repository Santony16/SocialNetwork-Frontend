// API Configuration
const API_BASE_URL = 'http://localhost:3001/api';

// Authentication Service
class AuthService {
    constructor() {
        this.token = sessionStorage.getItem('authToken');
        this.user = this.token ? JSON.parse(sessionStorage.getItem('currentUser') || '{}') : null;
    }

    // Register new user
    async register(userData) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            // Check for server errors first
            if (!response.ok) {
                throw new Error(data.message || `Server error: ${response.status}`);
            }

            if (data.success) {
                // Registration successful - do NOT store token/user data
                // User should login separately after registration
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { 
                success: false, 
                message: error.message || 'Network error. Please check if the server is running.' 
            };
        }
    }

    // Login user
    async login(credentials) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            // Check for server errors first
            if (!response.ok) {
                throw new Error(data.message || `Server error: ${response.status}`);
            }

            if (data.success) {
                // Store token and user data
                this.token = data.token;
                this.user = data.user;
                sessionStorage.setItem('authToken', this.token);
                sessionStorage.setItem('currentUser', JSON.stringify(this.user));
                
                return { success: true, message: data.message, user: data.user };
            } else if (data.requiresTwoFactor) {
                // Two-factor authentication is required
                return { 
                    success: false, 
                    requiresTwoFactor: true,
                    email: data.email,
                    message: data.message 
                };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { 
                success: false, 
                message: error.message || 'Network error. Please check if the server is running.' 
            };
        }
    }

    // Logout user
    logout() {
        this.token = null;
        this.user = null;
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('currentUser');
        
        // Clear any other session data
        sessionStorage.clear();
        
        // Determine correct path to index.html based on current location
        const currentPath = window.location.pathname;
        let redirectPath;
        
        if (currentPath.includes('/views/')) {
            // We're in a views subdirectory
            redirectPath = '../index.html';
        } else {
            // We're already in the root
            redirectPath = 'index.html';
        }
        
        // Redirect to home page
        window.location.href = redirectPath;
    }

    // Get user profile
    async getProfile() {
        if (!this.token) {
            return { success: false, message: 'No token found' };
        }

        try {
            const response = await fetch(`${API_BASE_URL}/users/profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            // Check for server errors first
            if (!response.ok) {
                // Token might be expired
                if (response.status === 401) {
                    this.logout();
                }
                throw new Error(data.message || `Server error: ${response.status}`);
            }

            if (data.success) {
                this.user = data.user;
                sessionStorage.setItem('currentUser', JSON.stringify(this.user));
                return { success: true, user: data.user };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Profile fetch error:', error);
            return { 
                success: false, 
                message: error.message || 'Network error. Please check if the server is running.' 
            };
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    // Get current user
    getCurrentUser() {
        return this.user;
    }

    // Get auth token
    getToken() {
        return this.token;
    }

    // Verify two-factor login
    async verifyTwoFactorLogin(credentials) {
        try {
            const response = await fetch(`${API_BASE_URL}/2fa/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Server error: ${response.status}`);
            }

            if (data.success) {
                // Store token and user data
                this.token = data.data.token;
                this.user = data.data.user;
                sessionStorage.setItem('authToken', this.token);
                sessionStorage.setItem('currentUser', JSON.stringify(this.user));
                
                return { success: true, message: data.message, user: data.data.user };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('2FA verification error:', error);
            return { 
                success: false, 
                message: error.message || 'Network error. Please check if the server is running.' 
            };
        }
    }
}

// Notification System
class NotificationManager {
    static show(message, type = 'info', duration = 5000) {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getIcon(type)}"></i>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border-left: 4px solid ${this.getColor(type)};
            padding: 16px;
            animation: slideInRight 0.3s ease-out;
        `;

        // Add notification content styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .notification-content i:first-child {
                color: ${this.getColor(type)};
                font-size: 18px;
            }
            .notification-message {
                flex: 1;
                font-size: 14px;
                color: #333;
            }
            .notification-close {
                background: none;
                border: none;
                color: #999;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
            }
            .notification-close:hover {
                background: #f5f5f5;
                color: #666;
            }
        `;
        document.head.appendChild(style);

        // Append to body
        document.body.appendChild(notification);

        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }

    static getIcon(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    }

    static getColor(type) {
        switch (type) {
            case 'success': return '#10b981';
            case 'error': return '#ef4444';
            case 'warning': return '#f59e0b';
            default: return '#3b82f6';
        }
    }
}

// Form handlers
class AuthFormHandlers {
    constructor(authService) {
        this.authService = authService;
    }

    // Handle registration form submission
    async handleRegister(formData) {
        const { username, email, password, confirmPassword } = formData;

        // Client-side validation
        if (!username || !email || !password || !confirmPassword) {
            NotificationManager.show('All fields are required', 'error');
            return false;
        }

        if (password !== confirmPassword) {
            NotificationManager.show('Passwords do not match', 'error');
            return false;
        }

        if (password.length < 8) {
            NotificationManager.show('Password must be at least 8 characters long', 'error');
            return false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            NotificationManager.show('Please provide a valid email address', 'error');
            return false;
        }

        // Show loading state
        const submitButton = document.querySelector('#registerModal button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Creating Account...';
        submitButton.disabled = true;

        try {
            const result = await this.authService.register({
                username,
                email,
                password,
                confirmPassword
            });

            if (result.success) {
                NotificationManager.show(result.message, 'success');
                ModalManager.closeModal('registerModal');
                return true;
            } else {
                NotificationManager.show(result.message, 'error');
                return false;
            }
        } finally {
            // Reset button state
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }

    // Handle login form submission
    async handleLogin(formData) {
        const { email, password } = formData;

        // Client-side validation
        if (!email || !password) {
            NotificationManager.show('Email and password are required', 'error');
            return false;
        }

        // Show loading state
        const submitButton = document.querySelector('#loginModal button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Signing In...';
        submitButton.disabled = true;

        try {
            const result = await this.authService.login({ email, password });

            if (result.success) {
                NotificationManager.show(result.message, 'success');
                ModalManager.closeModal('loginModal');
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = './views/main.html';
                }, 1000);
                return true;
            } else if (result.requiresTwoFactor) {
                // 2FA is required
                NotificationManager.show('Please enter your 2FA code', 'info');
                ModalManager.closeModal('loginModal');
                this.showTwoFactorModal(result.email);
                return true;
            } else {
                NotificationManager.show(result.message, 'error');
                return false;
            }
        } finally {
            // Reset button state
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }

    // Update UI for authenticated user
    updateUIForAuthenticatedUser() {
        const user = this.authService.getCurrentUser();
        const navActions = document.querySelector('.nav-actions');
        
        if (user && navActions) {
            // Update navigation to show user info and logout
            navActions.innerHTML = `
                <div class="user-menu">
                    <span class="user-greeting">Welcome, ${user.username}!</span>
                    <button onclick="authFormHandlers.handleLogout()" class="btn btn-secondary">
                        <i class="fas fa-sign-out-alt" style="margin-right: 0.5rem;"></i>
                        Logout
                    </button>
                </div>
            `;
        } else if (navActions) {
            // Reset navigation to default (login/register buttons)
            navActions.innerHTML = `
                <button onclick="showLoginModal()" class="btn btn-secondary">
                    <i class="fas fa-sign-in-alt" style="margin-right: 0.5rem;"></i>
                    Sign In
                </button>
                <button onclick="showRegisterModal()" class="btn btn-primary">
                    <i class="fas fa-user-plus" style="margin-right: 0.5rem;"></i>
                    Sign Up
                </button>
                <!-- Mobile menu button -->
                <button id="mobileMenuToggle" class="mobile-menu-toggle" onclick="toggleMobileMenu()">
                    <i class="fas fa-bars"></i>
                </button>
            `;
        }
    }

    // Handle logout
    handleLogout() {
        this.authService.logout();
        NotificationManager.show('You have been logged out successfully', 'info');
    }

    // Show two-factor modal
    showTwoFactorModal(email) {
        const emailElement = document.getElementById('twoFactorEmail');
        if (emailElement) {
            emailElement.textContent = `Please enter the 6-digit code from your Google Authenticator app for ${email}`;
        }
        
        // Store email for 2FA verification
        this.pendingTwoFactorEmail = email;
        
        ModalManager.showModal('twoFactorModal');
        
        // Focus on the input
        setTimeout(() => {
            const input = document.querySelector('#twoFactorForm input[name="twoFactorCode"]');
            if (input) input.focus();
        }, 100);
    }

    // Handle two-factor authentication
    async handleTwoFactor(formData) {
        const { twoFactorCode } = formData;
        
        if (!twoFactorCode || twoFactorCode.length !== 6) {
            NotificationManager.show('Please enter a valid 6-digit code', 'error');
            return false;
        }

        if (!this.pendingTwoFactorEmail) {
            NotificationManager.show('Session expired. Please login again.', 'error');
            ModalManager.closeModal('twoFactorModal');
            return false;
        }

        const submitButton = document.querySelector('#twoFactorModal button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Verifying...';
        submitButton.disabled = true;

        try {
            const result = await this.authService.verifyTwoFactorLogin({
                email: this.pendingTwoFactorEmail,
                token: twoFactorCode
            });

            if (result.success) {
                NotificationManager.show('Login successful!', 'success');
                ModalManager.closeModal('twoFactorModal');
                this.pendingTwoFactorEmail = null;
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = './views/main.html';
                }, 1000);
                return true;
            } else {
                NotificationManager.show(result.message || 'Invalid verification code', 'error');
                return false;
            }
        } finally {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }
}

// Initialize services
const authService = new AuthService();
const authFormHandlers = new AuthFormHandlers(authService);

// Make services globally available
window.authService = authService;
window.authFormHandlers = authFormHandlers;
window.NotificationManager = NotificationManager;

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', () => {
    if (authService.isAuthenticated()) {
        authFormHandlers.updateUIForAuthenticatedUser();
    } else {
        // Ensure UI is reset when not authenticated
        authFormHandlers.updateUIForAuthenticatedUser();
    }
});
