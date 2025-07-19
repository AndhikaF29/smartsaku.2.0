import AuthController from '../services/AuthController.js';
import TransactionService from '../services/TransactionService.js';
import CategoryService from '../services/CategoryService.js';

class TransactionManager {
    constructor() {
        this.currentUser = null;
        this.transactions = [];
        this.filteredTransactions = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.editingTransaction = null;
        this.init();
    }

    async init() {
        try {
            // Check authentication
            await this.checkAuth();

            // Load data
            await this.loadTransactions();
            await this.loadCategories();
            await this.loadQuickStats();

            // Setup event listeners
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing transaction manager:', error);
            this.showError('Gagal memuat halaman transaksi');
        }
    }

    async checkAuth() {
        try {
            this.currentUser = await AuthController.getCurrentUser();
            if (!this.currentUser) {
                window.location.href = '/src/templates/home.html';
                return;
            }

            // Display user name
            const userName = document.getElementById('userName');
            if (userName) {
                userName.textContent = this.currentUser.user_metadata?.nama_lengkap ||
                    this.currentUser.email.split('@')[0] ||
                    'Pengguna';
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = '/src/templates/home.html';
        }
    }

    async loadTransactions() {
        try {
            this.transactions = await TransactionService.getUserTransactions(this.currentUser.id);
            this.filteredTransactions = [...this.transactions];
            this.renderTransactionTable();
            this.renderPagination();
        } catch (error) {
            console.error('Error loading transactions:', error);
            this.showError('Gagal memuat transaksi');
        }
    }

    async loadCategories() {
        try {
            const categories = await CategoryService.getAllCategories();
            this.populateCategorySelects(categories);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    populateCategorySelects(categories) {
        const selects = ['kategoriTransaksi', 'filterKategori'];

        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                // Clear existing options except first one
                while (select.children.length > 1) {
                    select.removeChild(select.lastChild);
                }

                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.nama;
                    option.textContent = `${category.icon} ${category.nama}`;
                    select.appendChild(option);
                });
            }
        });
    }

    async loadQuickStats() {
        try {
            const summary = await TransactionService.getFinancialSummary(this.currentUser.id);

            document.getElementById('totalTransaksi').textContent = this.transactions.length;
            document.getElementById('totalPemasukan').textContent = this.formatCurrency(summary.totalPemasukan);
            document.getElementById('totalPengeluaran').textContent = this.formatCurrency(summary.totalPengeluaran);
            document.getElementById('saldoTotal').textContent = this.formatCurrency(summary.totalSaldo);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    renderTransactionTable() {
        const tbody = document.getElementById('transactionTableBody');
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageTransactions = this.filteredTransactions.slice(startIndex, endIndex);

        if (pageTransactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                        <i class="fas fa-receipt text-3xl mb-3"></i>
                        <p>Tidak ada transaksi ditemukan</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = pageTransactions.map(transaction => {
            const { icon, color } = CategoryService.getCategoryDisplay(transaction.kategori);
            const isIncome = transaction.jenis === 'pemasukan';
            const amountColor = isIncome ? 'text-green-600' : 'text-red-600';
            const typeColor = isIncome ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

            return `
                <tr class="transaction-row">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${this.formatDate(transaction.tanggal)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style="background-color: ${color}20; color: ${color}">
                                <i class="${icon} text-sm"></i>
                            </div>
                            <span class="text-sm font-medium text-gray-900">${transaction.kategori}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        ${transaction.deskripsi || '-'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 text-xs font-medium rounded-full ${typeColor}">
                            ${transaction.jenis.charAt(0).toUpperCase() + transaction.jenis.slice(1)}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold ${amountColor}">
                        ${this.formatCurrency(transaction.nominal)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div class="flex items-center space-x-2">
                            <button onclick="transactionManager.editTransaction('${transaction.id}')" class="text-blue-600 hover:text-blue-900">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="transactionManager.deleteTransaction('${transaction.id}')" class="text-red-600 hover:text-red-900">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Update pagination info
        this.updatePaginationInfo();
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredTransactions.length / this.itemsPerPage);
        const pageNumbers = document.getElementById('pageNumbers');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');

        if (!pageNumbers || !prevBtn || !nextBtn) return;

        // Update prev/next buttons
        prevBtn.disabled = this.currentPage === 1;
        nextBtn.disabled = this.currentPage === totalPages || totalPages === 0;

        // Generate page numbers
        pageNumbers.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                const button = document.createElement('button');
                button.className = `px-3 py-2 text-sm border rounded-lg ${i === this.currentPage
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`;
                button.textContent = i;
                button.onclick = () => this.goToPage(i);
                pageNumbers.appendChild(button);
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                const span = document.createElement('span');
                span.className = 'px-2 py-2 text-sm text-gray-500';
                span.textContent = '...';
                pageNumbers.appendChild(span);
            }
        }
    }

    updatePaginationInfo() {
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredTransactions.length);
        const total = this.filteredTransactions.length;

        document.getElementById('showingStart').textContent = total > 0 ? start : 0;
        document.getElementById('showingEnd').textContent = end;
        document.getElementById('totalEntries').textContent = total;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderTransactionTable();
        this.renderPagination();
    }

    setupEventListeners() {
        // Add transaction button
        document.getElementById('addTransactionBtn')?.addEventListener('click', () => {
            this.openTransactionModal();
        });

        // Modal close buttons
        document.getElementById('closeModalBtn')?.addEventListener('click', () => {
            this.closeTransactionModal();
        });

        document.getElementById('cancelBtn')?.addEventListener('click', () => {
            this.closeTransactionModal();
        });

        // Transaction form
        document.getElementById('transactionForm')?.addEventListener('submit', (e) => {
            this.handleTransactionSubmit(e);
        });

        // Filter buttons
        document.getElementById('applyFilter')?.addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('resetFilter')?.addEventListener('click', () => {
            this.resetFilters();
        });

        // Search
        document.getElementById('searchBtn')?.addEventListener('click', () => {
            this.performSearch();
        });

        document.getElementById('searchTransaction')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // Entries per page
        document.getElementById('entriesPerPage')?.addEventListener('change', (e) => {
            this.itemsPerPage = parseInt(e.target.value);
            this.currentPage = 1;
            this.renderTransactionTable();
            this.renderPagination();
        });

        // Pagination
        document.getElementById('prevPage')?.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.goToPage(this.currentPage - 1);
            }
        });

        document.getElementById('nextPage')?.addEventListener('click', () => {
            const totalPages = Math.ceil(this.filteredTransactions.length / this.itemsPerPage);
            if (this.currentPage < totalPages) {
                this.goToPage(this.currentPage + 1);
            }
        });

        // Delete modal
        document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => {
            this.closeDeleteModal();
        });

        document.getElementById('confirmDeleteBtn')?.addEventListener('click', () => {
            this.confirmDelete();
        });

        // Logout button
        document.getElementById('logoutBtn')?.addEventListener('click', async () => {
            try {
                await AuthController.logout();
                window.location.href = '/src/templates/home.html';
            } catch (error) {
                console.error('Logout failed:', error);
                this.showError('Gagal logout');
            }
        });

        // Category change listener
        document.getElementById('jenisTransaksi')?.addEventListener('change', (e) => {
            this.updateCategoriesByType(e.target.value);
        });
    }

    updateCategoriesByType(type) {
        const categorySelect = document.getElementById('kategoriTransaksi');
        if (!categorySelect) return;

        // Clear current options except first
        while (categorySelect.children.length > 1) {
            categorySelect.removeChild(categorySelect.lastChild);
        }

        // Get categories for the selected type
        const categories = CategoryService.getCategoriesByType(type);
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.nama;
            option.textContent = `${category.icon} ${category.nama}`;
            categorySelect.appendChild(option);
        });
    }

    openTransactionModal(transaction = null) {
        this.editingTransaction = transaction;
        const modal = document.getElementById('modalTransaksi');
        const form = document.getElementById('transactionForm');
        const title = document.getElementById('modalTitle');

        if (transaction) {
            title.textContent = 'Edit Transaksi';
            this.populateForm(transaction);
        } else {
            title.textContent = 'Tambah Transaksi';
            form.reset();
            document.getElementById('tanggalTransaksi').value = new Date().toISOString().split('T')[0];
        }

        modal.classList.remove('hidden');
    }

    closeTransactionModal() {
        document.getElementById('modalTransaksi').classList.add('hidden');
        this.editingTransaction = null;
    }

    populateForm(transaction) {
        document.getElementById('transactionId').value = transaction.id;
        document.getElementById('jenisTransaksi').value = transaction.jenis;
        document.getElementById('nominalTransaksi').value = transaction.nominal;
        document.getElementById('kategoriTransaksi').value = transaction.kategori;
        document.getElementById('deskripsiTransaksi').value = transaction.deskripsi || '';
        document.getElementById('tanggalTransaksi').value = transaction.tanggal;

        // Update categories based on type
        this.updateCategoriesByType(transaction.jenis);

        // Set category after updating options
        setTimeout(() => {
            document.getElementById('kategoriTransaksi').value = transaction.kategori;
        }, 100);
    }

    async handleTransactionSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const transactionData = {
            user_id: this.currentUser.id,
            jenis: formData.get('jenis'),
            nominal: parseFloat(formData.get('nominal')),
            kategori: formData.get('kategori'),
            deskripsi: formData.get('deskripsi') || null,
            tanggal: formData.get('tanggal')
        };

        try {
            if (this.editingTransaction) {
                await TransactionService.updateTransaction(this.editingTransaction.id, transactionData);
                this.showSuccess('Transaksi berhasil diperbarui');
            } else {
                await TransactionService.createTransaction(transactionData);
                this.showSuccess('Transaksi berhasil ditambahkan');
            }

            this.closeTransactionModal();
            await this.loadTransactions();
            await this.loadQuickStats();
        } catch (error) {
            console.error('Error saving transaction:', error);
            this.showError('Gagal menyimpan transaksi');
        }
    }

    editTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (transaction) {
            this.openTransactionModal(transaction);
        }
    }

    deleteTransaction(id) {
        this.deletingTransactionId = id;
        document.getElementById('deleteModal').classList.remove('hidden');
    }

    closeDeleteModal() {
        document.getElementById('deleteModal').classList.add('hidden');
        this.deletingTransactionId = null;
    }

    async confirmDelete() {
        if (!this.deletingTransactionId) return;

        try {
            await TransactionService.deleteTransaction(this.deletingTransactionId);
            this.showSuccess('Transaksi berhasil dihapus');
            this.closeDeleteModal();
            await this.loadTransactions();
            await this.loadQuickStats();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            this.showError('Gagal menghapus transaksi');
        }
    }

    applyFilters() {
        const jenis = document.getElementById('filterJenis').value;
        const kategori = document.getElementById('filterKategori').value;
        const tanggalMulai = document.getElementById('filterTanggalMulai').value;
        const tanggalAkhir = document.getElementById('filterTanggalAkhir').value;

        this.filteredTransactions = this.transactions.filter(transaction => {
            let matches = true;

            if (jenis && transaction.jenis !== jenis) matches = false;
            if (kategori && transaction.kategori !== kategori) matches = false;
            if (tanggalMulai && transaction.tanggal < tanggalMulai) matches = false;
            if (tanggalAkhir && transaction.tanggal > tanggalAkhir) matches = false;

            return matches;
        });

        this.currentPage = 1;
        this.renderTransactionTable();
        this.renderPagination();
    }

    resetFilters() {
        document.getElementById('filterJenis').value = '';
        document.getElementById('filterKategori').value = '';
        document.getElementById('filterTanggalMulai').value = '';
        document.getElementById('filterTanggalAkhir').value = '';
        document.getElementById('searchTransaction').value = '';

        this.filteredTransactions = [...this.transactions];
        this.currentPage = 1;
        this.renderTransactionTable();
        this.renderPagination();
    }

    performSearch() {
        const searchTerm = document.getElementById('searchTransaction').value.toLowerCase();

        if (!searchTerm) {
            this.filteredTransactions = [...this.transactions];
        } else {
            this.filteredTransactions = this.transactions.filter(transaction =>
                transaction.kategori.toLowerCase().includes(searchTerm) ||
                (transaction.deskripsi && transaction.deskripsi.toLowerCase().includes(searchTerm)) ||
                transaction.jenis.toLowerCase().includes(searchTerm)
            );
        }

        this.currentPage = 1;
        this.renderTransactionTable();
        this.renderPagination();
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    showSuccess(message) {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    showError(message) {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.transactionManager = new TransactionManager();
});

export default TransactionManager;

document.getElementById('transactionForm').addEventListener('submit', function (e) {
        const nominalInput = document.getElementById('nominalTransaksi');
        const rawValue = nominalInput.value.replace(/\./g, ''); // Remove thousand separators
        nominalInput.value = rawValue; // Update the input value
      });

      document.getElementById('nominalTransaksi').addEventListener('input', function (e) {
        const value = e.target.value.replace(/\D/g, ''); // Remove non-numeric characters
        e.target.value = new Intl.NumberFormat('id-ID').format(value); // Format as thousand-separated
      });