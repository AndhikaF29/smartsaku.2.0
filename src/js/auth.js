import AuthController from '../services/AuthController.js';

class AuthManager {
    constructor() {
        this.init();
    }

    async init() {
        // Check if user is already logged in
        try {
            const currentUser = await AuthController.getCurrentUser();
            if (currentUser) {
                window.location.href = '/src/templates/dashboard.html';
                return;
            }
        } catch (error) {
            console.log('User not logged in, showing login page');
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Show register modal
        const showRegisterBtn = document.getElementById('showRegisterBtn');
        const registerModal = document.getElementById('registerModal');
        if (showRegisterBtn && registerModal) {
            showRegisterBtn.addEventListener('click', () => {
                registerModal.classList.remove('hidden');
            });
        }

        // Close register modal
        const closeRegisterModal = document.getElementById('closeRegisterModal');
        const cancelRegisterBtn = document.getElementById('cancelRegisterBtn');
        if (closeRegisterModal && registerModal) {
            closeRegisterModal.addEventListener('click', () => {
                this.closeRegisterModal();
            });
        }
        if (cancelRegisterBtn && registerModal) {
            cancelRegisterBtn.addEventListener('click', () => {
                this.closeRegisterModal();
            });
        }

        // Toggle password visibility
        const togglePassword = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('password');
        const eyeIcon = document.getElementById('eyeIcon');
        if (togglePassword && passwordInput && eyeIcon) {
            togglePassword.addEventListener('click', () => {
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    eyeIcon.classList.remove('fa-eye');
                    eyeIcon.classList.add('fa-eye-slash');
                } else {
                    passwordInput.type = 'password';
                    eyeIcon.classList.remove('fa-eye-slash');
                    eyeIcon.classList.add('fa-eye');
                }
            });
        }

        // Close modal when clicking outside
        if (registerModal) {
            registerModal.addEventListener('click', (e) => {
                if (e.target === registerModal) {
                    this.closeRegisterModal();
                }
            });
        }
    }

    async handleLogin() {
        const loginBtn = document.getElementById('loginBtn');
        const loginBtnText = document.getElementById('loginBtnText');
        const loginLoading = document.getElementById('loginLoading');
        const loginError = document.getElementById('loginError');
        const loginSuccess = document.getElementById('loginSuccess');

        try {
            // Show loading state
            loginBtn.disabled = true;
            loginBtnText.classList.add('hidden');
            loginLoading.classList.remove('hidden');
            this.hideMessage(loginError);
            this.hideMessage(loginSuccess);

            // Get form data
            const formData = new FormData(document.getElementById('loginForm'));
            const email = formData.get('email').trim();
            const password = formData.get('password');

            // Validate input
            if (!email || !password) {
                throw new Error('Email dan password harus diisi');
            }

            // Attempt login
            const result = await AuthController.login(email, password);

            if (result.user) {
                this.showMessage(loginSuccess, 'Login berhasil! Mengalihkan ke dashboard...');

                // Redirect to dashboard after short delay
                setTimeout(() => {
                    window.location.href = '/src/templates/dashboard.html';
                }, 1500);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage(loginError, error.message || 'Gagal login. Silakan coba lagi.');
        } finally {
            // Reset loading state
            loginBtn.disabled = false;
            loginBtnText.classList.remove('hidden');
            loginLoading.classList.add('hidden');
        }
    }

    async handleRegister() {
        const registerBtn = document.getElementById('registerBtn');
        const registerBtnText = document.getElementById('registerBtnText');
        const registerLoading = document.getElementById('registerLoading');
        const registerError = document.getElementById('registerError');
        const registerSuccess = document.getElementById('registerSuccess');

        try {
            // Show loading state
            registerBtn.disabled = true;
            registerBtnText.classList.add('hidden');
            registerLoading.classList.remove('hidden');
            this.hideMessage(registerError);
            this.hideMessage(registerSuccess);

            // Get form data
            const formData = new FormData(document.getElementById('registerForm'));
            const userData = {
                nama_lengkap: formData.get('nama_lengkap').trim(),
                no_telepon: formData.get('no_telepon').trim() || null
            };
            const email = formData.get('email').trim();
            const password = formData.get('password');

            // Validate input
            if (!userData.nama_lengkap || !email || !password) {
                throw new Error('Nama lengkap, email, dan password harus diisi');
            }

            if (password.length < 6) {
                throw new Error('Password minimal 6 karakter');
            }

            // Attempt registration
            const result = await AuthController.register(email, password, userData);

            if (result.user) {
                this.showMessage(registerSuccess, 'Pendaftaran berhasil! Mengalihkan ke dashboard...');

                // Close modal and redirect after short delay
                setTimeout(() => {
                    this.closeRegisterModal();
                    window.location.href = '/src/templates/dashboard.html';
                }, 2000);
            }
        } catch (error) {
            console.error('Register error:', error);
            this.showMessage(registerError, error.message || 'Gagal mendaftar. Silakan coba lagi.');
        } finally {
            // Reset loading state
            registerBtn.disabled = false;
            registerBtnText.classList.remove('hidden');
            registerLoading.classList.add('hidden');
        }
    }

    closeRegisterModal() {
        const registerModal = document.getElementById('registerModal');
        const registerForm = document.getElementById('registerForm');
        const registerError = document.getElementById('registerError');
        const registerSuccess = document.getElementById('registerSuccess');

        if (registerModal) {
            registerModal.classList.add('hidden');
        }
        if (registerForm) {
            registerForm.reset();
        }
        this.hideMessage(registerError);
        this.hideMessage(registerSuccess);
    }

    showMessage(element, message) {
        if (element) {
            element.textContent = message;
            element.classList.remove('hidden');
        }
    }

    hideMessage(element) {
        if (element) {
            element.classList.add('hidden');
        }
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});