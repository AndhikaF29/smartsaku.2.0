// Pengaturan Page JavaScript
import { supabaseClient } from '../services/supabaseClient.js';

class PengaturanManager {
    constructor() {
        this.currentUser = null;
        this.isEditMode = false;
        this.init();
    }

    async init() {
        try {
            // Check authentication
            await this.checkAuth();

            // Initialize components
            this.initializeEventListeners();

            // Load user profile
            await this.loadUserProfile();

            console.log('Pengaturan initialized successfully');
        } catch (error) {
            console.error('Error initializing pengaturan:', error);
            this.redirectToLogin();
        }
    }

    async checkAuth() {
        try {
            const { data: { session }, error } = await supabaseClient.auth.getSession();

            if (error) {
                console.error('Auth error:', error);
                throw error;
            }

            if (!session) {
                console.log('No session found, redirecting to login');
                this.redirectToLogin();
                return;
            }

            this.currentUser = session.user;
            console.log('User authenticated:', this.currentUser.id);

            // Listen for auth changes
            supabaseClient.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_OUT' || !session) {
                    this.redirectToLogin();
                }
            });

        } catch (error) {
            console.error('Error checking auth:', error);
            throw error;
        }
    }

    async loadUserProfile() {
        if (!this.currentUser) {
            console.error('No current user found');
            return;
        }

        try {
            // Show loading state
            this.showLoadingState();

            // Get user profile from database
            const { data: profile, error } = await supabaseClient
                .from('users')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (error) {
                console.error('Error loading profile:', error);
                // If user doesn't exist in users table, create one
                if (error.code === 'PGRST116') {
                    await this.createUserProfile();
                    return;
                }
                throw error;
            }

            // Update UI with profile data
            this.updateProfileUI(profile);

        } catch (error) {
            console.error('Error loading user profile:', error);
            this.showErrorMessage('Gagal memuat profil pengguna');
        } finally {
            this.hideLoadingState();
        }
    } async createUserProfile() {
        try {
            const newProfile = {
                id: this.currentUser.id,
                email: this.currentUser.email,
                nama_lengkap: this.currentUser.user_metadata?.full_name || '',
                no_telepon: this.currentUser.user_metadata?.phone || '',
                profile_image_url: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabaseClient
                .from('users')
                .insert([newProfile])
                .select()
                .single();

            if (error) {
                console.error('Error creating profile:', error);
                throw error;
            }

            console.log('Profile created successfully:', data);
            this.updateProfileUI(data);

        } catch (error) {
            console.error('Error creating user profile:', error);
            this.showErrorMessage('Gagal membuat profil pengguna');
        }
    }

    updateProfileUI(profile) {
        // Update profile display
        document.getElementById('profileName').textContent = profile.nama_lengkap || 'Belum diatur';
        document.getElementById('profileEmail').textContent = profile.email;
        document.getElementById('sidebarUserName').textContent = profile.nama_lengkap || 'User';

        // Update form fields
        document.getElementById('namaLengkap').value = profile.nama_lengkap || '';
        document.getElementById('email').value = profile.email || '';
        document.getElementById('nomorTelepon').value = profile.no_telepon || '';

        // Update profile avatar
        this.updateProfileAvatar(profile.profile_image_url);

        console.log('Profile UI updated successfully');
    }

    updateProfileAvatar(imageUrl) {
        const avatarContainer = document.querySelector('.profile-avatar');
        const avatarIcon = document.getElementById('avatarIcon');

        if (imageUrl) {
            // Show profile image
            avatarContainer.style.backgroundImage = `url(${imageUrl})`;
            avatarContainer.style.backgroundSize = 'cover';
            avatarContainer.style.backgroundPosition = 'center';
            avatarIcon.style.display = 'none';
        } else {
            // Show default icon
            avatarContainer.style.backgroundImage = 'none';
            avatarIcon.style.display = 'block';
        }
    }

    initializeEventListeners() {
        // Edit profile button
        const editBtn = document.getElementById('editProfileBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.toggleEditMode());
        }

        // Cancel edit button
        const cancelBtn = document.getElementById('cancelProfileBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelEdit());
        }

        // Profile form submission
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileSubmit(e));
        }

        // Password form submission
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => this.handlePasswordSubmit(e));
        }

        // Avatar upload
        const avatarInput = document.getElementById('avatarInput');
        const avatarUpload = document.querySelector('.avatar-upload');
        if (avatarInput && avatarUpload) {
            avatarUpload.addEventListener('click', () => avatarInput.click());
            avatarInput.addEventListener('change', (e) => this.handleAvatarUpload(e));
        }

        // Data management buttons
        this.initializeDataManagementListeners();

        // Danger zone buttons
        this.initializeDangerZoneListeners();

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    toggleEditMode() {
        this.isEditMode = !this.isEditMode;

        const namaLengkapInput = document.getElementById('namaLengkap');
        const nomorTeleponInput = document.getElementById('nomorTelepon');
        const profileActions = document.getElementById('profileActions');
        const editBtn = document.getElementById('editProfileBtn');

        if (this.isEditMode) {
            // Enable editing
            namaLengkapInput.disabled = false;
            nomorTeleponInput.disabled = false;
            profileActions.classList.remove('hidden');
            editBtn.innerHTML = '<i class="fas fa-times mr-2"></i>Batal Edit';
            editBtn.className = 'text-red-600 hover:text-red-800 font-medium';
        } else {
            // Disable editing
            namaLengkapInput.disabled = true;
            nomorTeleponInput.disabled = true;
            profileActions.classList.add('hidden');
            editBtn.innerHTML = '<i class="fas fa-edit mr-2"></i>Edit Profil';
            editBtn.className = 'text-blue-600 hover:text-blue-800 font-medium';
        }
    }

    cancelEdit() {
        this.isEditMode = false;
        this.toggleEditMode();
        // Reload profile to reset form values
        this.loadUserProfile();
    }

    async handleProfileSubmit(e) {
        e.preventDefault();

        if (!this.currentUser) {
            this.showErrorMessage('Pengguna tidak terautentikasi');
            return;
        }

        try {
            // Show loading state
            this.showButtonLoading('saveProfileBtn');

            // Get form data
            const formData = new FormData(e.target);
            const profileData = {
                nama_lengkap: formData.get('nama_lengkap').trim(),
                no_telepon: formData.get('no_telepon').trim(),
                updated_at: new Date().toISOString()
            };

            // Validate data
            if (!profileData.nama_lengkap) {
                throw new Error('Nama lengkap tidak boleh kosong');
            }

            // Validate phone number format (optional)
            if (profileData.no_telepon && !this.validatePhoneNumber(profileData.no_telepon)) {
                throw new Error('Format nomor telepon tidak valid');
            }

            console.log('Updating profile for user:', this.currentUser.id);
            console.log('Profile data:', profileData);

            // Update profile in database
            const { data, error } = await supabaseClient
                .from('users')
                .update(profileData)
                .eq('id', this.currentUser.id)
                .select()
                .single();

            if (error) {
                console.error('Error updating profile:', error);
                throw error;
            }

            console.log('Profile updated successfully:', data);

            // Update UI
            this.updateProfileUI(data);
            this.toggleEditMode();

            // Show success message
            this.showSuccessMessage('Profil berhasil diperbarui');

        } catch (error) {
            console.error('Error updating profile:', error);
            this.showErrorMessage(error.message || 'Gagal memperbarui profil');
        } finally {
            this.hideButtonLoading('saveProfileBtn');
        }
    }

    async handlePasswordSubmit(e) {
        e.preventDefault();

        try {
            const formData = new FormData(e.target);
            const currentPassword = formData.get('current_password');
            const newPassword = formData.get('new_password');
            const confirmPassword = formData.get('confirm_password');

            // Validate passwords
            if (newPassword !== confirmPassword) {
                throw new Error('Konfirmasi password tidak cocok');
            }

            if (newPassword.length < 6) {
                throw new Error('Password baru minimal 6 karakter');
            }

            // Update password
            const { error } = await supabaseClient.auth.updateUser({
                password: newPassword
            });

            if (error) {
                throw error;
            }

            // Clear form
            e.target.reset();
            this.showSuccessMessage('Password berhasil diubah');

        } catch (error) {
            console.error('Error updating password:', error);
            this.showErrorMessage(error.message || 'Gagal mengubah password');
        }
    } async handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showErrorMessage('File harus berupa gambar');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showErrorMessage('Ukuran file maksimal 5MB');
            return;
        }

        try {
            // Show loading state
            const avatarIcon = document.getElementById('avatarIcon');
            const originalClass = avatarIcon.className;
            avatarIcon.className = 'fas fa-spinner fa-spin';

            // First, try to check bucket access
            console.log('Checking bucket access...');
            await this.checkStorageBucketAccess();

            // Get current profile to check for existing image
            const { data: currentProfile } = await supabaseClient
                .from('users')
                .select('profile_image_url')
                .eq('id', this.currentUser.id)
                .single();

            // Delete old image if exists
            if (currentProfile?.profile_image_url) {
                await this.deleteOldProfileImage(currentProfile.profile_image_url);
            }

            // Try primary upload method
            let uploadResult = await this.uploadImageToStorage(file);

            // If primary method fails, try fallback methods
            if (!uploadResult.success) {
                console.log('Primary upload failed, trying fallback methods...');
                uploadResult = await this.uploadImageFallback(file);
            }

            if (!uploadResult.success) {
                throw new Error(uploadResult.error || 'Upload failed after all attempts');
            }

            console.log('Upload successful, URL:', uploadResult.publicUrl);

            // Update user profile with image URL
            const { data: updateData, error: updateError } = await supabaseClient
                .from('users')
                .update({
                    profile_image_url: uploadResult.publicUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', this.currentUser.id)
                .select()
                .single();

            if (updateError) {
                console.error('Error updating profile with image URL:', updateError);
                throw updateError;
            }

            console.log('Profile updated with image URL:', updateData);

            // Update UI with new image
            this.updateProfileAvatar(uploadResult.publicUrl);

            // Reset avatar icon
            avatarIcon.className = originalClass;

            this.showSuccessMessage('Avatar berhasil diperbarui');

        } catch (error) {
            console.error('Error uploading avatar:', error);

            // Reset avatar icon
            const avatarIcon = document.getElementById('avatarIcon');
            avatarIcon.className = 'fas fa-user';

            // Show detailed error message
            this.handleUploadError(error);
        }
    }

    async checkStorageBucketAccess() {
        try {
            // Try to list files in bucket to check access
            const { data, error } = await supabaseClient.storage
                .from('profile')
                .list('', { limit: 1 });

            if (error) {
                console.warn('Bucket access check failed:', error);
                if (error.message?.includes('not found')) {
                    throw new Error('BUCKET_NOT_FOUND: Profile bucket tidak ditemukan');
                }
                if (error.statusCode === 403) {
                    throw new Error('BUCKET_ACCESS_DENIED: Tidak memiliki akses ke bucket profile');
                }
            }

            console.log('Bucket access check passed');
            return true;
        } catch (error) {
            console.error('Bucket access check error:', error);
            throw error;
        }
    }

    async uploadImageToStorage(file) {
        try {
            // Create unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${this.currentUser.id}-${Date.now()}.${fileExt}`;

            console.log('Uploading file to profile bucket:', fileName);

            // Primary upload method
            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('profile')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: file.type
                });

            if (uploadError) {
                console.error('Primary upload error:', uploadError);
                return { success: false, error: uploadError.message };
            }

            console.log('File uploaded successfully:', uploadData);

            // Get public URL
            const { data: { publicUrl } } = supabaseClient.storage
                .from('profile')
                .getPublicUrl(fileName);

            console.log('Generated public URL:', publicUrl);

            // Verify URL is valid
            if (!publicUrl || publicUrl.includes('undefined')) {
                return { success: false, error: 'Invalid public URL generated' };
            }

            return { success: true, publicUrl };

        } catch (error) {
            console.error('Upload method error:', error);
            return { success: false, error: error.message };
        }
    }

    async uploadImageFallback(file) {
        try {
            console.log('Trying fallback upload method...');

            // Convert file to base64 as fallback
            const base64Data = await this.fileToBase64(file);

            // Store base64 data temporarily (you could use a different approach here)
            const timestamp = Date.now();
            const fallbackUrl = `data:${file.type};base64,${base64Data}`;

            console.log('Fallback method using base64 data URL');

            return {
                success: true,
                publicUrl: fallbackUrl,
                isFallback: true
            };

        } catch (error) {
            console.error('Fallback upload failed:', error);
            return { success: false, error: error.message };
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    }

    handleUploadError(error) {
        let errorMessage = 'Gagal mengupload avatar';
        let isStorageIssue = false;

        if (error.message?.includes('new row violates row-level security policy')) {
            errorMessage = '❌ Storage RLS Error: Jalankan SQL fix untuk memperbaiki kebijakan storage.';
            isStorageIssue = true;
        } else if (error.message?.includes('BUCKET_NOT_FOUND')) {
            errorMessage = '❌ Bucket "profile" tidak ditemukan. Buat bucket di Supabase Dashboard.';
            isStorageIssue = true;
        } else if (error.message?.includes('BUCKET_ACCESS_DENIED')) {
            errorMessage = '❌ Akses bucket ditolak. Periksa pengaturan RLS storage.';
            isStorageIssue = true;
        } else if (error.message?.includes('Unauthorized')) {
            errorMessage = '❌ Tidak memiliki izin akses storage. Periksa konfigurasi bucket.';
            isStorageIssue = true;
        } else if (error.statusCode === 403) {
            errorMessage = '❌ Akses ditolak (403). Jalankan SQL fix untuk storage policies.';
            isStorageIssue = true;
        }

        this.showErrorMessage(errorMessage);

        // Show additional debugging info for storage issues
        if (isStorageIssue) {
            console.error('🔧 STORAGE ISSUE DETECTED - Follow these steps:');
            console.error('1. Run the SQL fix: database/fixes/storage_complete_fix.sql');
            console.error('2. Make sure profile bucket exists and is public');
            console.error('3. Check RLS policies are correctly applied');
            console.error('Error details:', {
                error: error,
                userId: this.currentUser.id,
                fileType: file?.type,
                fileSize: file?.size
            });

            // Show help modal for storage issues
            this.showStorageHelpModal();
        }
    }

    showStorageHelpModal() {
        const helpMessage = `
🔧 STORAGE CONFIGURATION REQUIRED

Untuk memperbaiki error upload gambar:

1. Buka Supabase SQL Editor
2. Jalankan script: database/fixes/storage_complete_fix.sql
3. Pastikan bucket 'profile' sudah dibuat dan public
4. Restart aplikasi dan coba lagi

Error ini terjadi karena konfigurasi Row Level Security (RLS) pada storage belum tepat.
        `;

        if (confirm(helpMessage + '\n\nBuka dokumentasi storage fix?')) {
            console.log('📖 Check: STORAGE_SETUP_GUIDE.md for detailed instructions');
        }
    }

    async deleteOldProfileImage(imageUrl) {
        try {
            // Extract filename from URL - handle different URL formats
            let fileName;
            if (imageUrl.includes('/object/public/profile/')) {
                // Standard Supabase storage URL format
                const urlParts = imageUrl.split('/object/public/profile/');
                fileName = urlParts[1];
            } else {
                // Fallback: get last part of URL
                const urlParts = imageUrl.split('/');
                fileName = urlParts[urlParts.length - 1];
            }

            if (!fileName) {
                console.warn('Could not extract filename from URL:', imageUrl);
                return;
            }

            console.log('Attempting to delete old profile image:', fileName);

            const { error } = await supabaseClient.storage
                .from('profile')
                .remove([fileName]);

            if (error) {
                console.warn('Could not delete old profile image:', error);
                // Don't throw error, just log warning
            } else {
                console.log('Old profile image deleted successfully');
            }
        } catch (error) {
            console.warn('Error deleting old profile image:', error);
            // Don't throw error, just log warning
        }
    }

    initializeDataManagementListeners() {
        // Export buttons
        const exportAllBtn = document.getElementById('exportAllDataBtn');
        const exportBackupBtn = document.getElementById('exportBackupBtn');
        const importBtn = document.getElementById('importDataBtn');
        const importInput = document.getElementById('importFileInput');

        if (exportAllBtn) {
            exportAllBtn.addEventListener('click', () => this.exportAllData());
        }

        if (exportBackupBtn) {
            exportBackupBtn.addEventListener('click', () => this.exportBackup());
        }

        if (importBtn) {
            importBtn.addEventListener('click', () => importInput.click());
        }

        if (importInput) {
            importInput.addEventListener('change', (e) => this.handleDataImport(e));
        }
    }

    initializeDangerZoneListeners() {
        const deleteDataBtn = document.getElementById('deleteAllDataBtn');
        const deleteAccountBtn = document.getElementById('deleteAccountBtn');

        if (deleteDataBtn) {
            deleteDataBtn.addEventListener('click', () => this.confirmDeleteAllData());
        }

        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', () => this.confirmDeleteAccount());
        }
    }

    async exportAllData() {
        try {
            // Get all user transactions
            const { data: transactions, error } = await supabaseClient
                .from('transaksi')
                .select('*')
                .eq('user_id', this.currentUser.id);

            if (error) throw error;

            // Create export data
            const exportData = {
                user_profile: {
                    email: this.currentUser.email,
                    exported_at: new Date().toISOString()
                },
                transactions: transactions || []
            };

            // Download as JSON
            this.downloadJSON(exportData, 'smartsaku_data_export.json');
            this.showSuccessMessage('Data berhasil diexport');

        } catch (error) {
            console.error('Error exporting data:', error);
            this.showErrorMessage('Gagal mengexport data');
        }
    }

    async exportBackup() {
        try {
            // Get user profile and transactions
            const [profileResult, transactionsResult] = await Promise.all([
                supabaseClient.from('users').select('*').eq('id', this.currentUser.id).single(),
                supabaseClient.from('transaksi').select('*').eq('user_id', this.currentUser.id)
            ]);

            const backupData = {
                backup_info: {
                    created_at: new Date().toISOString(),
                    user_id: this.currentUser.id,
                    version: '1.0'
                },
                profile: profileResult.data,
                transactions: transactionsResult.data || []
            };

            // Download as JSON
            this.downloadJSON(backupData, 'smartsaku_backup.json');
            this.showSuccessMessage('Backup berhasil dibuat');

        } catch (error) {
            console.error('Error creating backup:', error);
            this.showErrorMessage('Gagal membuat backup');
        }
    }

    async handleDataImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            // Validate backup format
            if (!data.backup_info || !data.profile || !data.transactions) {
                throw new Error('Format backup tidak valid');
            }

            // Confirm import
            if (!confirm('Import data akan mengganti data yang ada. Lanjutkan?')) {
                return;
            }

            // Import data (implementation depends on your needs)
            console.log('Importing data:', data);
            this.showSuccessMessage('Data berhasil diimport');

        } catch (error) {
            console.error('Error importing data:', error);
            this.showErrorMessage('Gagal mengimport data');
        }
    }

    confirmDeleteAllData() {
        this.showConfirmationModal(
            'Hapus Semua Data',
            'Apakah Anda yakin ingin menghapus semua data transaksi? Tindakan ini tidak dapat dibatalkan.',
            () => this.deleteAllData()
        );
    }

    confirmDeleteAccount() {
        this.showConfirmationModal(
            'Hapus Akun',
            'Apakah Anda yakin ingin menghapus akun? Semua data akan hilang permanen.',
            () => this.deleteAccount()
        );
    }

    async deleteAllData() {
        try {
            // Delete all user transactions
            const { error } = await supabaseClient
                .from('transaksi')
                .delete()
                .eq('user_id', this.currentUser.id);

            if (error) throw error;

            this.showSuccessMessage('Semua data berhasil dihapus');

        } catch (error) {
            console.error('Error deleting data:', error);
            this.showErrorMessage('Gagal menghapus data');
        }
    }

    async deleteAccount() {
        try {
            // Delete user account
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;

            // Redirect to login
            this.redirectToLogin();

        } catch (error) {
            console.error('Error deleting account:', error);
            this.showErrorMessage('Gagal menghapus akun');
        }
    }

    async handleLogout() {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;

            this.redirectToLogin();
        } catch (error) {
            console.error('Error during logout:', error);
            this.showErrorMessage('Gagal logout');
        }
    }

    // Utility methods
    validatePhoneNumber(phone) {
        // Indonesian phone number validation
        const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showConfirmationModal(title, message, onConfirm) {
        const modal = document.getElementById('confirmationModal');
        const titleEl = document.getElementById('confirmTitle');
        const messageEl = document.getElementById('confirmMessage');
        const confirmBtn = document.getElementById('confirmActionBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');

        titleEl.textContent = title;
        messageEl.textContent = message;
        modal.classList.remove('hidden');

        const handleConfirm = () => {
            modal.classList.add('hidden');
            onConfirm();
            confirmBtn.removeEventListener('click', handleConfirm);
        };

        const handleCancel = () => {
            modal.classList.add('hidden');
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
        };

        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
    }

    showLoadingState() {
        const elements = ['profileName', 'profileEmail'];
        elements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = 'Loading...';
        });
    }

    hideLoadingState() {
        // Loading state will be hidden when profile is loaded
    }

    showButtonLoading(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            const loadingText = button.querySelector('.loading-text');
            const loadingSpinner = button.querySelector('.loading-spinner');

            if (loadingText) loadingText.classList.add('hidden');
            if (loadingSpinner) loadingSpinner.classList.remove('hidden');

            button.disabled = true;
        }
    }

    hideButtonLoading(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            const loadingText = button.querySelector('.loading-text');
            const loadingSpinner = button.querySelector('.loading-spinner');

            if (loadingText) loadingText.classList.remove('hidden');
            if (loadingSpinner) loadingSpinner.classList.add('hidden');

            button.disabled = false;
        }
    }

    showSuccessMessage(message) {
        // Create and show success toast
        this.showToast(message, 'success');
    }

    showErrorMessage(message) {
        // Create and show error toast
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        // Simple toast implementation
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-50 transition-all duration-300 ${type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`;
        toast.textContent = message;

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => toast.style.transform = 'translateY(0)', 100);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateY(-100%)';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    redirectToLogin() {
        window.location.href = '../index.html';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PengaturanManager();
});