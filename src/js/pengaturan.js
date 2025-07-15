import AuthController from '../services/AuthController.js';
import TransactionService from '../services/TransactionService.js';

class SettingsManager {
    constructor() {
        this.currentUser = null;
        this.isEditing = false;
        this.settings = {
            theme: 'light',
            currency: 'IDR',
            notifications: {
                email: true,
                push: false,
                transaction: true
            }
        };
        this.init();
    }

    async init() {
        try {
            await this.checkAuth();
            await this.loadUserProfile();
            this.loadSettings();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing settings:', error);
            this.showError('Gagal memuat halaman pengaturan');
        }
    }

    async checkAuth() {
        try {
            this.currentUser = await AuthController.getCurrentUser();
            if (!this.currentUser) {
                window.location.href = '/src/templates/home.html';
                return;
            }

            // Update sidebar user name
            const sidebarUserName = document.getElementById('sidebarUserName');
            if (sidebarUserName) {
                sidebarUserName.textContent = this.currentUser.user_metadata?.nama_lengkap ||
                    this.currentUser.email.split('@')[0] ||
                    'Pengguna';
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = '/src/templates/home.html';
        }
    }

    async loadUserProfile() {
        try {
            const userData = this.currentUser.user_metadata || {};

            // Update profile display
            document.getElementById('profileName').textContent = userData.nama_lengkap || 'Nama Belum Diatur';
            document.getElementById('profileEmail').textContent = this.currentUser.email;

            // Fill form fields
            document.getElementById('namaLengkap').value = userData.nama_lengkap || '';
            document.getElementById('email').value = this.currentUser.email;
            document.getElementById('nomorTelepon').value = userData.nomor_telepon || '';
            document.getElementById('tanggalLahir').value = userData.tanggal_lahir || '';
            document.getElementById('universitas').value = userData.universitas || '';
            document.getElementById('jurusan').value = userData.jurusan || '';

            // Update avatar
            this.updateAvatarDisplay(userData.nama_lengkap || this.currentUser.email);
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    updateAvatarDisplay(name) {
        const avatarIcon = document.getElementById('avatarIcon');
        if (name) {
            const initials = name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
            avatarIcon.textContent = initials;
            avatarIcon.className = '';
        } else {
            avatarIcon.className = 'fas fa-user';
            avatarIcon.textContent = '';
        }
    }

    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('smartsaku_settings');
            if (savedSettings) {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            }

            // Apply theme
            this.applyTheme(this.settings.theme);
            document.querySelector(`[data-theme="${this.settings.theme}"]`).classList.add('active');

            // Apply currency
            document.getElementById('currencyFormat').value = this.settings.currency;

            // Apply notification settings
            document.getElementById('emailNotifications').checked = this.settings.notifications.email;
            document.getElementById('pushNotifications').checked = this.settings.notifications.push;
            document.getElementById('transactionReminder').checked = this.settings.notifications.transaction;
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    setupEventListeners() {
        // Profile editing
        document.getElementById('editProfileBtn').addEventListener('click', () => {
            this.toggleProfileEdit();
        });

        document.getElementById('cancelProfileBtn').addEventListener('click', () => {
            this.toggleProfileEdit();
        });

        document.getElementById('profileForm').addEventListener('submit', (e) => {
            this.handleProfileSubmit(e);
        });

        // Avatar upload
        document.getElementById('avatarInput').addEventListener('change', (e) => {
            this.handleAvatarUpload(e);
        });

        document.querySelector('.avatar-upload').addEventListener('click', () => {
            document.getElementById('avatarInput').click();
        });

        // Password form
        document.getElementById('passwordForm').addEventListener('submit', (e) => {
            this.handlePasswordSubmit(e);
        });

        // Theme selection
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.changeTheme(e.target.closest('.theme-option').dataset.theme);
            });
        });

        // Currency change
        document.getElementById('currencyFormat').addEventListener('change', (e) => {
            this.settings.currency = e.target.value;
            this.saveSettings();
        });

        // Notification toggles
        document.getElementById('emailNotifications').addEventListener('change', (e) => {
            this.settings.notifications.email = e.target.checked;
            this.saveSettings();
        });

        document.getElementById('pushNotifications').addEventListener('change', (e) => {
            this.settings.notifications.push = e.target.checked;
            this.saveSettings();
            if (e.target.checked) {
                this.requestNotificationPermission();
            }
        });

        document.getElementById('transactionReminder').addEventListener('change', (e) => {
            this.settings.notifications.transaction = e.target.checked;
            this.saveSettings();
        });

        // Two-factor authentication
        document.getElementById('twoFactorToggle').addEventListener('change', (e) => {
            this.handleTwoFactorToggle(e.target.checked);
        });

        // Data management
        document.getElementById('exportAllDataBtn').addEventListener('click', () => {
            this.exportAllData();
        });

        document.getElementById('exportBackupBtn').addEventListener('click', () => {
            this.exportBackup();
        });

        document.getElementById('importDataBtn').addEventListener('click', () => {
            document.getElementById('importFileInput').click();
        });

        document.getElementById('importFileInput').addEventListener('change', (e) => {
            this.handleDataImport(e);
        });

        // Danger zone
        document.getElementById('deleteAllDataBtn').addEventListener('click', () => {
            this.showConfirmation(
                'Hapus Semua Data',
                'Apakah Anda yakin ingin menghapus semua data transaksi? Tindakan ini tidak dapat dibatalkan.',
                () => this.deleteAllData()
            );
        });

        document.getElementById('deleteAccountBtn').addEventListener('click', () => {
            this.showConfirmation(
                'Hapus Akun',
                'Apakah Anda yakin ingin menghapus akun Anda? Semua data akan hilang dan tidak dapat dipulihkan.',
                () => this.deleteAccount()
            );
        });

        // Confirmation modal
        document.getElementById('confirmCancelBtn').addEventListener('click', () => {
            this.hideConfirmation();
        });

        document.getElementById('confirmActionBtn').addEventListener('click', () => {
            if (this.pendingAction) {
                this.pendingAction();
            }
            this.hideConfirmation();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', async () => {
            try {
                await AuthController.logout();
                window.location.href = '/src/templates/home.html';
            } catch (error) {
                console.error('Logout failed:', error);
                this.showError('Gagal logout');
            }
        });
    }

    toggleProfileEdit() {
        this.isEditing = !this.isEditing;
        const inputs = document.querySelectorAll('#profileForm input:not([readonly])');
        const editBtn = document.getElementById('editProfileBtn');
        const actions = document.getElementById('profileActions');

        if (this.isEditing) {
            inputs.forEach(input => input.removeAttribute('disabled'));
            editBtn.innerHTML = '<i class="fas fa-times mr-2"></i>Batal Edit';
            actions.classList.remove('hidden');
        } else {
            inputs.forEach(input => input.setAttribute('disabled', 'true'));
            editBtn.innerHTML = '<i class="fas fa-edit mr-2"></i>Edit Profil';
            actions.classList.add('hidden');
            this.loadUserProfile(); // Reset form
        }
    }

    async handleProfileSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const profileData = {
            nama_lengkap: formData.get('namaLengkap') || '',
            nomor_telepon: formData.get('nomorTelepon') || '',
            tanggal_lahir: formData.get('tanggalLahir') || '',
            universitas: formData.get('universitas') || '',
            jurusan: formData.get('jurusan') || ''
        };

        try {
            await AuthController.updateProfile(profileData);
            this.currentUser.user_metadata = { ...this.currentUser.user_metadata, ...profileData };

            // Update displays
            document.getElementById('profileName').textContent = profileData.nama_lengkap || 'Nama Belum Diatur';
            document.getElementById('sidebarUserName').textContent = profileData.nama_lengkap ||
                this.currentUser.email.split('@')[0];
            this.updateAvatarDisplay(profileData.nama_lengkap);

            this.toggleProfileEdit();
            this.showSuccess('Profil berhasil diperbarui');
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showError('Gagal memperbarui profil');
        }
    }

    handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            this.showError('Hanya file gambar yang diperbolehkan');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB
            this.showError('Ukuran file tidak boleh lebih dari 5MB');
            return;
        }

        // Read and display image
        const reader = new FileReader();
        reader.onload = (e) => {
            const avatarIcon = document.getElementById('avatarIcon');
            const profileAvatar = document.querySelector('.profile-avatar');

            // Create image element
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'w-full h-full object-cover rounded-full';

            // Replace avatar content
            avatarIcon.style.display = 'none';
            profileAvatar.innerHTML = '';
            profileAvatar.appendChild(img);

            // Re-add upload button
            const uploadBtn = document.createElement('div');
            uploadBtn.className = 'avatar-upload';
            uploadBtn.innerHTML = '<i class="fas fa-camera text-sm"></i>';
            uploadBtn.addEventListener('click', () => {
                document.getElementById('avatarInput').click();
            });
            profileAvatar.appendChild(uploadBtn);
        };
        reader.readAsDataURL(file);
    }

    async handlePasswordSubmit(e) {
        e.preventDefault();

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validate passwords
        if (newPassword !== confirmPassword) {
            this.showError('Password baru dan konfirmasi tidak cocok');
            return;
        }

        if (newPassword.length < 6) {
            this.showError('Password baru harus minimal 6 karakter');
            return;
        }

        try {
            await AuthController.updatePassword(newPassword);

            // Reset form
            e.target.reset();
            this.showSuccess('Password berhasil diubah');
        } catch (error) {
            console.error('Error updating password:', error);
            this.showError('Gagal mengubah password');
        }
    }

    changeTheme(theme) {
        // Update UI
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`[data-theme="${theme}"]`).classList.add('active');

        // Save setting
        this.settings.theme = theme;
        this.saveSettings();

        // Apply theme
        this.applyTheme(theme);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);

        if (theme === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }

    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                this.showSuccess('Notifikasi push diaktifkan');
            } else {
                this.showError('Izin notifikasi ditolak');
                document.getElementById('pushNotifications').checked = false;
                this.settings.notifications.push = false;
                this.saveSettings();
            }
        }
    }

    handleTwoFactorToggle(enabled) {
        if (enabled) {
            this.showInfo('Fitur Two-Factor Authentication akan segera hadir');
            document.getElementById('twoFactorToggle').checked = false;
        }
    }

    async exportAllData() {
        try {
            const transactions = await TransactionService.getUserTransactions(this.currentUser.id);
            const userData = {
                user: {
                    email: this.currentUser.email,
                    profile: this.currentUser.user_metadata || {}
                },
                transactions: transactions,
                settings: this.settings,
                exportDate: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(userData, null, 2)], {
                type: 'application/json'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `SmartSaku_AllData_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showSuccess('Data berhasil diexport');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showError('Gagal mengexport data');
        }
    }

    async exportBackup() {
        try {
            const transactions = await TransactionService.getUserTransactions(this.currentUser.id);
            const backupData = {
                transactions: transactions,
                settings: this.settings,
                version: '1.0',
                backupDate: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(backupData, null, 2)], {
                type: 'application/json'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `SmartSaku_Backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showSuccess('Backup berhasil dibuat');
        } catch (error) {
            console.error('Error creating backup:', error);
            this.showError('Gagal membuat backup');
        }
    }

    async handleDataImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            this.showError('Hanya file JSON yang didukung');
            return;
        }

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            // Validate backup format
            if (!data.transactions || !Array.isArray(data.transactions)) {
                this.showError('Format backup tidak valid');
                return;
            }

            // Show confirmation
            this.showConfirmation(
                'Import Data',
                `Apakah Anda yakin ingin mengimport ${data.transactions.length} transaksi? Data yang ada akan ditambahkan.`,
                async () => {
                    await this.performDataImport(data);
                }
            );

            // Display file name
            document.getElementById('importFileName').textContent = file.name;
        } catch (error) {
            console.error('Error reading import file:', error);
            this.showError('Gagal membaca file import');
        }
    }

    async performDataImport(data) {
        try {
            let importedCount = 0;

            for (const transaction of data.transactions) {
                const transactionData = {
                    user_id: this.currentUser.id,
                    jenis: transaction.jenis,
                    nominal: transaction.nominal,
                    kategori: transaction.kategori,
                    deskripsi: transaction.deskripsi,
                    tanggal: transaction.tanggal
                };

                await TransactionService.createTransaction(transactionData);
                importedCount++;
            }

            // Import settings if available
            if (data.settings) {
                this.settings = { ...this.settings, ...data.settings };
                this.saveSettings();
                this.loadSettings(); // Apply imported settings
            }

            this.showSuccess(`${importedCount} transaksi berhasil diimport`);
        } catch (error) {
            console.error('Error importing data:', error);
            this.showError('Gagal mengimport data');
        }
    }

    async deleteAllData() {
        try {
            const transactions = await TransactionService.getUserTransactions(this.currentUser.id);

            for (const transaction of transactions) {
                await TransactionService.deleteTransaction(transaction.id);
            }

            this.showSuccess('Semua data berhasil dihapus');
        } catch (error) {
            console.error('Error deleting data:', error);
            this.showError('Gagal menghapus data');
        }
    }

    async deleteAccount() {
        try {
            // First delete all transactions
            await this.deleteAllData();

            // Then delete account
            await AuthController.deleteAccount();

            // Clear local storage
            localStorage.clear();

            // Redirect to home
            window.location.href = '/src/templates/home.html';
        } catch (error) {
            console.error('Error deleting account:', error);
            this.showError('Gagal menghapus akun');
        }
    }

    saveSettings() {
        localStorage.setItem('smartsaku_settings', JSON.stringify(this.settings));
    }

    showConfirmation(title, message, action) {
        this.pendingAction = action;
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmationModal').classList.remove('hidden');
    }

    hideConfirmation() {
        document.getElementById('confirmationModal').classList.add('hidden');
        this.pendingAction = null;
    }

    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 success-animation';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    showInfo(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
});

export default SettingsManager;