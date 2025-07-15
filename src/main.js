// Main entry point for SmartSaku application
import './css/style.css';
import AuthController from './services/AuthController.js';

// Set base URL
const BASE_URL = window.location.origin + '/SmartSaku';

// Initialize application
class SmartSakuApp {
    constructor() {
        this.init();
    }

    async init() {
        try {
            // Check if user is already logged in
            const currentUser = await AuthController.getCurrentUser();

            if (currentUser) {
                console.log('User sudah login:', currentUser);
                this.redirectToDashboard();
            } else {
                console.log('User belum login, menampilkan halaman login');
                this.showHomePage();
            }
        } catch (error) {
            console.error('Error saat inisialisasi app:', error);
            this.showHomePage();
        }
    }

    showHomePage() {
        // Only redirect to home if we're at the root or index
        const path = window.location.pathname;
        if (path === '/' || path === '/index.html' || path === '/SmartSaku/' || path === '/SmartSaku/index.html') {
            window.location.href = BASE_URL + '/src/templates/home.html';
        }
    }

    redirectToDashboard() {
        // Redirect to dashboard if not already there
        if (!window.location.pathname.includes('dashboard.html')) {
            window.location.href = BASE_URL + '/src/templates/dashboard.html';
        }
    }
}

// Start the application when DOM is loaded
// Initialize app immediately
new SmartSakuApp();

// Export for use in other modules
export default SmartSakuApp;