import AuthController from '../services/AuthController.js';
import TransactionService from '../services/TransactionService.js';
import CategoryService from '../services/CategoryService.js';
import { supabaseClient } from '../services/supabaseClient.js';



class DashboardManager {
    constructor() {
        this.currentUser = null;
        this.transactions = [];
        this.recentTransactions = [];
        this.financialSummary = {
            totalSaldo: 0,
            totalPemasukan: 0,
            totalPengeluaran: 0,
            totalTransaksi: 0
        };
        this.healthScore = 0;
        this.init();
    }

    async init() {
        try {
            await this.checkAuth();
            await this.loadTransactions();
            
            // Load categories with validation
            try {
                await this.loadCategories();
                const categorySelect = document.getElementById('kategoriTransaksi');
                if (categorySelect && categorySelect.options.length <= 1) {
                    console.log('Categories not loaded properly, using defaults');
                    this.loadAllCategories(); // Fallback to default categories
                }
            } catch (error) {
                console.warn('Error loading categories, using defaults:', error);
                this.loadAllCategories();
            }

            this.setupEventListeners();
            this.updateDateTime();
            await this.calculateFinancialSummary();
            this.calculateFinancialHealth();
            this.renderDashboard();
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            this.showError('Gagal memuat dashboard');
        }
    }

    updateDateTime() {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };

        document.getElementById('currentDate').textContent = now.toLocaleDateString('id-ID', options);

        const hour = now.getHours();
        let greeting = '';
        if (hour < 12) {
            greeting = 'Selamat Pagi!';
        } else if (hour < 15) {
            greeting = 'Selamat Siang!';
        } else if (hour < 18) {
            greeting = 'Selamat Sore!';
        } else {
            greeting = 'Selamat Malam!';
        }

        document.getElementById('greeting').textContent = greeting;
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
            console.log('Loading transactions for user:', this.currentUser.id);
            
            // Get transactions from database via TransactionService
            this.transactions = await TransactionService.getUserTransactions(this.currentUser.id);
            
            this.recentTransactions = this.transactions
                .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
                .slice(0, 5);

            console.log('Loaded transactions:', this.transactions.length);
        } catch (error) {
            console.error('Error loading transactions:', error);
            this.transactions = [];
            this.recentTransactions = [];
            this.showError('Gagal memuat transaksi: ' + error.message);
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

    async calculateFinancialSummary() {
        try {
            // Get financial summary from TransactionService
            this.financialSummary = await TransactionService.getFinancialSummary(this.currentUser.id);
            console.log('Financial summary loaded:', this.financialSummary);
        } catch (error) {
            console.error('Error calculating financial summary:', error);
            
            // Fallback to manual calculation if service fails
            try {
                let totalPemasukan = 0;
                let totalPengeluaran = 0;

                this.transactions.forEach(transaction => {
                    if (transaction.jenis === 'pemasukan') {
                        totalPemasukan += parseFloat(transaction.nominal);
                    } else {
                        totalPengeluaran += parseFloat(transaction.nominal);
                    }
                });

                // Update current month transactions
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                
                const monthlyTransactions = this.transactions.filter(transaction => {
                    const transactionDate = new Date(transaction.tanggal);
                    return transactionDate.getMonth() === currentMonth && 
                           transactionDate.getFullYear() === currentYear;
                }).length;

                this.financialSummary = {
                    totalSaldo: totalPemasukan - totalPengeluaran,
                    totalPemasukan: totalPemasukan,
                    totalPengeluaran: totalPengeluaran,
                    totalTransaksi: monthlyTransactions
                };
                
                console.log('Financial summary calculated manually:', this.financialSummary);
            } catch (fallbackError) {
                console.error('Fallback calculation also failed:', fallbackError);
                this.financialSummary = {
                    totalSaldo: 0,
                    totalPemasukan: 0,
                    totalPengeluaran: 0,
                    totalTransaksi: 0
                };
            }
        }
    }

    calculateFinancialHealth() {
        const { totalSaldo, totalPemasukan, totalPengeluaran } = this.financialSummary;

        let score = 0;
        let level = '';
        let status = '';
        let tip = '';
        let color = '';

        // Calculate expense ratio (pengeluaran/pemasukan)
        const expenseRatio = totalPemasukan > 0 ? (totalPengeluaran / totalPemasukan) : 1;

        // Calculate savings ratio (saldo/pemasukan)
        const savingsRatio = totalPemasukan > 0 ? (totalSaldo / totalPemasukan) : 0;

        // Scoring system (0-100)
        if (expenseRatio <= 0.5 && savingsRatio >= 0.3) {
            // Excellent: Pengeluaran ≤ 50% dari pemasukan, tabungan ≥ 30%
            score = 90 + Math.min(10, Math.floor((0.5 - expenseRatio) * 20));
            level = 'A+';
            status = 'Sangat Baik';
            color = 'health-excellent';
            tip = {
                title: 'Keuangan Anda sangat sehat!',
                description: 'Pertahankan rasio pengeluaran yang baik dan terus tingkatkan tabungan.'
            };
        } else if (expenseRatio <= 0.7 && savingsRatio >= 0.2) {
            // Good: Pengeluaran ≤ 70% dari pemasukan, tabungan ≥ 20%
            score = 75 + Math.min(15, Math.floor((0.7 - expenseRatio) * 30));
            level = 'A';
            status = 'Baik';
            color = 'health-good';
            tip = {
                title: 'Keuangan Anda dalam kondisi baik',
                description: 'Coba kurangi pengeluaran non-essential untuk meningkatkan tabungan.'
            };
        } else if (expenseRatio <= 0.85 && savingsRatio >= 0.1) {
            // Fair: Pengeluaran ≤ 85% dari pemasukan, tabungan ≥ 10%
            score = 60 + Math.min(15, Math.floor((0.85 - expenseRatio) * 40));
            level = 'B';
            status = 'Cukup';
            color = 'health-fair';
            tip = {
                title: 'Keuangan Anda perlu perhatian',
                description: 'Buat anggaran yang lebih ketat dan mulai menabung lebih konsisten.'
            };
        } else {
            // Poor: Pengeluaran > 85% dari pemasukan atau tabungan < 10%
            score = Math.max(20, 60 - Math.floor((expenseRatio - 0.85) * 100));
            level = 'C';
            status = 'Perlu Perbaikan';
            color = 'health-poor';
            tip = {
                title: 'Keuangan Anda memerlukan perbaikan segera',
                description: 'Evaluasi pengeluaran, buat anggaran ketat, dan pertimbangkan sumber pemasukan tambahan.'
            };
        }

        this.healthScore = Math.max(0, Math.min(100, score));

        // Update UI
        this.updateHealthIndicator(level, status, color, tip);
        this.updateProgressRing(this.healthScore);
    }

    updateHealthIndicator(level, status, color, tip) {
        const indicator = document.getElementById('healthIndicator');
        const statusElement = document.getElementById('healthStatus');
        const tipElement = document.getElementById('financialTip');

        if (indicator) indicator.textContent = level;
        if (indicator) indicator.className = `health-indicator ${color}`;
        if (statusElement) statusElement.textContent = status;

        if (tipElement) {
            tipElement.innerHTML = `
                <div class="flex items-start space-x-2">
                    <i class="fas fa-lightbulb text-yellow-600 mt-1"></i>
                    <div>
                        <p class="text-sm font-medium">${tip.title}</p>
                        <p class="text-xs text-gray-600 mt-1">${tip.description}</p>
                    </div>
                </div>
            `;
        }
    }

    updateProgressRing(percentage) {
        const circle = document.getElementById('progressCircle');
        const percentageText = document.getElementById('healthPercentage');

        if (!circle || !percentageText) return;

        const circumference = 2 * Math.PI * 50; // radius = 50
        const offset = circumference - (percentage / 100) * circumference;

        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = offset;

        // Change color based on score
        if (percentage >= 85) {
            circle.setAttribute('stroke', '#10b981'); // Green
        } else if (percentage >= 70) {
            circle.setAttribute('stroke', '#06b6d4'); // Blue
        } else if (percentage >= 55) {
            circle.setAttribute('stroke', '#f59e0b'); // Yellow
        } else {
            circle.setAttribute('stroke', '#ef4444'); // Red
        }

        percentageText.textContent = `${Math.round(percentage)}%`;
    }

    populateCategorySelects(categories) {
        const select = document.getElementById('kategoriTransaksi');
        if (!select) return;

        // Clear existing options except first one
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        // Use provided categories or fallback to default
        if (!Array.isArray(categories) || categories.length === 0) {
            this.loadAllCategories();
        } else {
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.nama;
                option.textContent = `${category.icon} ${category.nama}`;
                option.dataset.type = category.type || 'both';
                select.appendChild(option);
            });
        }
    }

    renderDashboard() {
        this.renderSummaryStats();
        this.renderRecentTransactions();
        this.renderCharts();
        this.renderCategoryDetails();
    }

    renderSummaryStats() {
        const elements = {
            totalSaldo: document.getElementById('totalSaldo'),
            totalPemasukan: document.getElementById('totalPemasukan'),
            totalPengeluaran: document.getElementById('totalPengeluaran'),
            totalTransaksi: document.getElementById('totalTransaksi')
        };

        if (elements.totalSaldo) elements.totalSaldo.textContent = this.formatCurrency(this.financialSummary.totalSaldo);
        if (elements.totalPemasukan) elements.totalPemasukan.textContent = this.formatCurrency(this.financialSummary.totalPemasukan);
        if (elements.totalPengeluaran) elements.totalPengeluaran.textContent = this.formatCurrency(this.financialSummary.totalPengeluaran);
        if (elements.totalTransaksi) elements.totalTransaksi.textContent = this.financialSummary.totalTransaksi;
    }

    renderRecentTransactions() {
        const container = document.getElementById('recentTransactions');
        if (!container) return;

        if (this.recentTransactions.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-receipt text-gray-300 text-3xl mb-3"></i>
                    <p class="text-gray-500">Belum ada transaksi</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.recentTransactions.map(transaction => {
            // Default values if CategoryService fails
            let icon = '💸';
            let color = '#6b7280';
            
            try {
                const categoryDisplay = CategoryService.getCategoryDisplay(transaction.kategori);
                if (categoryDisplay) {
                    icon = categoryDisplay.icon || icon;
                    color = categoryDisplay.color || color;
                }
            } catch (error) {
                console.warn('Error getting category display:', error);
            }

            const isIncome = transaction.jenis === 'pemasukan';
            const amountClass = isIncome ? 'text-green-600' : 'text-red-600';
            const amountPrefix = isIncome ? '+' : '-';

            return `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background-color: ${color}20; color: ${color}">
                            <span>${icon}</span>
                        </div>
                        <div>
                            <p class="font-medium text-gray-900">${transaction.kategori}</p>
                            <p class="text-sm text-gray-600">${this.formatDate(transaction.tanggal)}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-semibold ${amountClass}">${amountPrefix}${this.formatCurrency(transaction.nominal)}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderCharts() {
        this.renderCashFlowChart();
        this.renderCategoryChart();
    }

    renderCashFlowChart() {
        const ctx = document.getElementById('cashFlowChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.cashFlowChart) {
            this.cashFlowChart.destroy();
        }

        const chartData = this.prepareCashFlowData();

        this.cashFlowChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Pemasukan',
                    data: chartData.income,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Pengeluaran',
                    data: chartData.expense,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return context.dataset.label + ': ' + new Intl.NumberFormat('id-ID', {
                                    style: 'currency',
                                    currency: 'IDR',
                                    minimumFractionDigits: 0
                                }).format(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return new Intl.NumberFormat('id-ID', {
                                    style: 'currency',
                                    currency: 'IDR',
                                    minimumFractionDigits: 0
                                }).format(value);
                            }
                        }
                    }
                }
            }
        });
    }

    renderCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.categoryChart) {
            this.categoryChart.destroy();
        }

        const categoryData = this.prepareCategoryData();

        if (categoryData.labels.length === 0) {
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            return;
        }

        this.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categoryData.labels,
                datasets: [{
                    data: categoryData.values,
                    backgroundColor: [
                        '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
                        '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return context.label + ': ' +
                                    new Intl.NumberFormat('id-ID', {
                                        style: 'currency',
                                        currency: 'IDR',
                                        minimumFractionDigits: 0
                                    }).format(context.parsed) +
                                    ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
    }

    prepareCashFlowData() {
        const period = parseInt(document.getElementById('chartPeriod')?.value || 30);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - period);

        const dailyData = {};
        const labels = [];

        // Initialize days
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            dailyData[dateStr] = { income: 0, expense: 0 };
        }

        // Aggregate transactions
        this.transactions.forEach(transaction => {
            const date = transaction.tanggal;
            if (dailyData[date]) {
                if (transaction.jenis === 'pemasukan') {
                    dailyData[date].income += transaction.nominal;
                } else {
                    dailyData[date].expense += transaction.nominal;
                }
            }
        });

        // Convert to arrays
        const income = [];
        const expense = [];

        Object.keys(dailyData).forEach(date => {
            labels.push(new Date(date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }));
            income.push(dailyData[date].income);
            expense.push(dailyData[date].expense);
        });

        return { labels, income, expense };
    }

    prepareCategoryData() {
        const categoryTotals = {};

        this.transactions
            .filter(t => t.jenis === 'pengeluaran')
            .forEach(transaction => {
                categoryTotals[transaction.kategori] = (categoryTotals[transaction.kategori] || 0) + transaction.nominal;
            });

        const sortedCategories = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 8); // Top 8 categories

        return {
            labels: sortedCategories.map(([category]) => category),
            values: sortedCategories.map(([, total]) => total)
        };
    }

    renderCategoryDetails() {
        const container = document.getElementById('categoryDetails');
        if (!container) return;
        
        const categoryData = this.prepareCategoryData();

        if (categoryData.labels.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-chart-pie text-gray-300 text-3xl mb-3"></i>
                    <p class="text-gray-500">Belum ada data kategori</p>
                </div>
            `;
            return;
        }

        const total = categoryData.values.reduce((sum, value) => sum + value, 0);

        container.innerHTML = categoryData.labels.map((category, index) => {
            const amount = categoryData.values[index];
            const percentage = ((amount / total) * 100).toFixed(1);
            
            // Default values if CategoryService fails
            let icon = '💸';
            let color = '#6b7280';
            
            try {
                const categoryDisplay = CategoryService.getCategoryDisplay(category);
                if (categoryDisplay) {
                    icon = categoryDisplay.icon || icon;
                    color = categoryDisplay.color || color;
                }
            } catch (error) {
                console.warn('Error getting category display:', error);
            }

            return `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background-color: ${color}20; color: ${color}">
                            <span>${icon}</span>
                        </div>
                        <div>
                            <p class="font-medium text-gray-900">${category}</p>
                            <p class="text-sm text-gray-600">${percentage}% dari total</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-semibold text-gray-900">${this.formatCurrency(amount)}</p>
                        <div class="w-16 bg-gray-200 rounded-full h-2 mt-1">
                            <div class="h-2 rounded-full" style="width: ${percentage}%; background-color: ${color}"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    setupEventListeners() {
        // Add transaction modal
        document.getElementById('addTransactionBtn')?.addEventListener('click', () => {
            this.openTransactionModal();
        });

        document.getElementById('closeModalBtn')?.addEventListener('click', () => {
            this.closeTransactionModal();
        });

        document.getElementById('cancelBtn')?.addEventListener('click', () => {
            this.closeTransactionModal();
        });

        // Add validation and debugging for kategori selection
        const jenisTransaksiSelect = document.getElementById('jenisTransaksi');
        const kategoriSelect = document.getElementById('kategoriTransaksi');
        
        if (jenisTransaksiSelect && kategoriSelect) {
            // Debug log when jenis changes
            jenisTransaksiSelect.addEventListener('change', (e) => {
                const selectedType = e.target.value;
                console.log('Jenis changed to:', selectedType);
                this.updateCategoriesByType(selectedType);
                
                // Validate categories are visible
                setTimeout(() => {
                    const visibleOptions = Array.from(kategoriSelect.options)
                        .filter(opt => opt.style.display !== 'none');
                    console.log('Visible kategori options:', visibleOptions.length);
                }, 100);
            });

            // Debug log when kategori changes
            kategoriSelect.addEventListener('change', (e) => {
                console.log('Selected kategori:', e.target.value);
            });
        }

        // Transaction form submission
        document.getElementById('transactionForm')?.addEventListener('submit', (e) => {
            this.handleTransactionSubmit(e);
        });

        // Chart period change
        document.getElementById('chartPeriod')?.addEventListener('change', () => {
            this.renderCashFlowChart();
        });

        // Nominal input formatting
        const nominalInput = document.getElementById('nominalTransaksi');
        if (nominalInput) {
            nominalInput.addEventListener('input', (e) => {
                this.formatCurrencyInput(e.target);
            });

            nominalInput.addEventListener('blur', (e) => {
                this.formatCurrencyInput(e.target);
            });

            // Prevent non-numeric characters except comma and dot
            nominalInput.addEventListener('keypress', (e) => {
                const char = String.fromCharCode(e.which);
                if (!/[0-9,.]/.test(char) && e.which !== 8 && e.which !== 46) {
                    e.preventDefault();
                }
            });
        }

        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', async () => {
            try {
                await AuthController.logout();
                window.location.href = '/src/templates/home.html';
            } catch (error) {
                console.error('Logout failed:', error);
                this.showError('Gagal logout');
            }
        });
    }

    formatCurrencyInput(input) {
        let value = input.value.replace(/[^\d]/g, ''); // Remove all non-digits
        
        if (value === '') {
            input.value = '';
            return;
        }

        // Add thousand separators
        value = parseInt(value).toLocaleString('id-ID');
        input.value = value;
    }

    parseCurrencyInput(value) {
        // Remove all non-digits and convert to number
        // Returns a number with 2 decimal places to match numeric(15,2) in database
        const rawValue = parseInt(value.replace(/[^\d]/g, '')) || 0;
        return parseFloat(rawValue.toFixed(2));
    }

    updateCategoriesByType(type) {
        const categorySelect = document.getElementById('kategoriTransaksi');
        if (!categorySelect) return;

        console.log('Filtering categories for type:', type);

        try {
            // Try using CategoryService
            const categories = CategoryService.getCategoriesByType(type);
            
            if (Array.isArray(categories) && categories.length > 0) {
                // Clear current options except first
                while (categorySelect.children.length > 1) {
                    categorySelect.removeChild(categorySelect.lastChild);
                }
    
                // Add new options
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.nama;
                    option.textContent = `${category.icon} ${category.nama}`;
                    categorySelect.appendChild(option);
                });
            } else {
                // Fallback to showing/hiding options based on type
                this.filterCategoriesByType(type);
            }
        } catch (error) {
            console.warn('Error in CategoryService.getCategoriesByType, using filter method:', error);
            this.filterCategoriesByType(type);
        }
    }

    filterCategoriesByType(type) {
        const categorySelect = document.getElementById('kategoriTransaksi');
        if (!categorySelect) return;
        
        // Show/hide options based on type
        Array.from(categorySelect.options).forEach(option => {
            if (option.value === '') {
                // Keep the placeholder option
                option.style.display = '';
                return;
            }

            const optionType = option.dataset.type;
            if (!type) {
                // Show all if no type selected
                option.style.display = '';
            } else if (optionType === 'both' || optionType === type) {
                // Show if category matches type or is universal
                option.style.display = '';
            } else {
                // Hide if category doesn't match type
                option.style.display = 'none';
            }
        });

        // Reset selection if current selection is now hidden
        const currentSelection = categorySelect.value;
        const currentOption = Array.from(categorySelect.options).find(opt => opt.value === currentSelection);
        if (currentOption && currentOption.style.display === 'none') {
            categorySelect.value = '';
        }
    }

    openTransactionModal() {
        const modal = document.getElementById('modalTransaksi');
        const form = document.getElementById('transactionForm');
        
        if (!modal || !form) return;
        
        form.reset();
        const dateInput = document.getElementById('tanggalTransaksi');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
        
        // Load all categories initially
        this.loadAllCategories();
        
        modal.classList.remove('hidden');
    }

    loadAllCategories() {
        const categorySelect = document.getElementById('kategoriTransaksi');
        if (!categorySelect) return;

        // Clear existing options except first one
        while (categorySelect.children.length > 1) {
            categorySelect.removeChild(categorySelect.lastChild);
        }

        // Add all default categories
        const allCategories = [
            // Income categories
            { nama: 'Gaji', icon: '💰', type: 'pemasukan' },
            { nama: 'Uang Saku', icon: '💵', type: 'pemasukan' },
            { nama: 'Hadiah', icon: '🎁', type: 'pemasukan' },
            { nama: 'Investasi', icon: '📈', type: 'pemasukan' },
            { nama: 'Freelance', icon: '💻', type: 'pemasukan' },
            // Expense categories
            { nama: 'Makanan', icon: '🍔', type: 'pengeluaran' },
            { nama: 'Transportasi', icon: '🚗', type: 'pengeluaran' },
            { nama: 'Belanja', icon: '🛒', type: 'pengeluaran' },
            { nama: 'Hiburan', icon: '🎬', type: 'pengeluaran' },
            { nama: 'Kesehatan', icon: '🏥', type: 'pengeluaran' },
            { nama: 'Pendidikan', icon: '📚', type: 'pengeluaran' },
            { nama: 'Tagihan', icon: '📄', type: 'pengeluaran' },
            { nama: 'Lain-lain', icon: '💸', type: 'both' }
        ];

        allCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.nama;
            option.textContent = `${category.icon} ${category.nama}`;
            option.dataset.type = category.type;
            categorySelect.appendChild(option);
        });

        console.log('Categories loaded:', allCategories.length, 'categories');
    }

    closeTransactionModal() {
        const modal = document.getElementById('modalTransaksi');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    async handleTransactionSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        
        // Check if using input field with currency formatting
        const nominalInput = document.getElementById('nominalTransaksi');
        let nominalValue;
        
        if (nominalInput && nominalInput.type === 'text') {
            nominalValue = this.parseCurrencyInput(nominalInput.value);
        } else {
            nominalValue = parseFloat(formData.get('nominal'));
        }
        
        // Validation
        if (isNaN(nominalValue) || nominalValue <= 0) {
            this.showError('Nominal harus lebih dari 0');
            return;
        }

        if (!formData.get('jenis')) {
            this.showError('Pilih jenis transaksi');
            return;
        }

        if (!formData.get('kategori')) {
            this.showError('Pilih kategori');
            return;
        }

        const transactionData = {
            user_id: this.currentUser.id,
            jenis: formData.get('jenis'),
            nominal: nominalValue,
            kategori: formData.get('kategori'),
            deskripsi: formData.get('deskripsi') || null,
            tanggal: formData.get('tanggal')
        };

        console.log('Saving transaction to Supabase:', transactionData);
        
        try {
            const savedTransaction = await TransactionService.createTransaction(transactionData);
            console.log('Transaction saved successfully:', savedTransaction);
            
            this.showSuccess('Transaksi berhasil ditambahkan');
            this.closeTransactionModal();
            
            // Reload data and update dashboard
            await this.loadTransactions();
            await this.calculateFinancialSummary();
            this.calculateFinancialHealth();
            this.renderDashboard();
        } catch (error) {
            console.error('Error saving transaction:', error);
            
            let errorMessage = 'Gagal menyimpan transaksi';
            
            if (error.message) {
                errorMessage += ': ' + error.message;
            }
            
            if (error.code === '23514') {
                errorMessage = 'Nominal transaksi harus lebih dari 0';
            } else if (error.code === '23503') {
                errorMessage = 'User ID tidak valid';
            }
            
            this.showError(errorMessage);
        }
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
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
        toast.textContent = message;
        document.body.appendChild(toast);

        // Add slide-in animation
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 10);

        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 3000);
    }

    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
        toast.textContent = message;
        document.body.appendChild(toast);

        // Add slide-in animation
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 10);

        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 3000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DashboardManager();
});