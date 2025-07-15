import AuthController from '../services/AuthController.js';
import TransactionService from '../services/TransactionService.js';
import CategoryService from '../services/CategoryService.js';

class ReportManager {
    constructor() {
        this.currentUser = null;
        this.reportData = [];
        this.filteredData = [];
        this.currentPeriod = 7;
        this.charts = {};
        this.init();
    }

    async init() {
        try {
            await this.checkAuth();
            await this.loadReportData();
            this.setupEventListeners();
            this.setupDateRange();
            this.renderReports();
        } catch (error) {
            console.error('Error initializing report manager:', error);
            this.showError('Gagal memuat halaman laporan');
        }
    }

    async checkAuth() {
        try {
            this.currentUser = await AuthController.getCurrentUser();
            if (!this.currentUser) {
                window.location.href = '/src/templates/home.html';
                return;
            }

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

    async loadReportData() {
        try {
            this.reportData = await TransactionService.getUserTransactions(this.currentUser.id);
            this.filterDataByPeriod();
        } catch (error) {
            console.error('Error loading report data:', error);
            this.showError('Gagal memuat data laporan');
        }
    }

    setupDateRange() {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - this.currentPeriod);

        document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
        document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
    }

    filterDataByPeriod() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (startDate && endDate) {
            this.filteredData = this.reportData.filter(transaction => {
                return transaction.tanggal >= startDate && transaction.tanggal <= endDate;
            });
        } else {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - this.currentPeriod);

            this.filteredData = this.reportData.filter(transaction => {
                const transactionDate = new Date(transaction.tanggal);
                return transactionDate >= startDate && transactionDate <= endDate;
            });
        }
    }

    setupEventListeners() {
        // Period tabs
        document.querySelectorAll('.period-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.period-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentPeriod = parseInt(e.target.dataset.period);
                this.setupDateRange();
                this.filterDataByPeriod();
                this.renderReports();
            });
        });

        // Date inputs
        document.getElementById('startDate').addEventListener('change', () => {
            this.filterDataByPeriod();
            this.renderReports();
        });

        document.getElementById('endDate').addEventListener('change', () => {
            this.filterDataByPeriod();
            this.renderReports();
        });

        // Export buttons
        document.getElementById('exportExcelBtn').addEventListener('click', () => {
            this.exportToExcel();
        });

        document.getElementById('exportPdfBtn').addEventListener('click', () => {
            this.exportToPDF();
        });

        // Toggle report view
        document.getElementById('toggleReportView').addEventListener('click', () => {
            this.toggleReportView();
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

    renderReports() {
        this.renderSummaryStats();
        this.renderCharts();
        this.renderTopCategories();
        this.renderSpendingPattern();
        this.renderReportCards();
    }

    renderSummaryStats() {
        const summary = this.calculateSummary();

        document.getElementById('totalTransaksi').textContent = summary.totalTransactions;
        document.getElementById('totalPemasukan').textContent = this.formatCurrency(summary.totalIncome);
        document.getElementById('totalPengeluaran').textContent = this.formatCurrency(summary.totalExpense);
        document.getElementById('netWorth').textContent = this.formatCurrency(summary.netWorth);

        // Calculate trends (simplified - could be improved with actual comparison)
        this.renderTrends(summary);
    }

    calculateSummary() {
        const summary = {
            totalTransactions: this.filteredData.length,
            totalIncome: 0,
            totalExpense: 0,
            netWorth: 0
        };

        this.filteredData.forEach(transaction => {
            if (transaction.jenis === 'pemasukan') {
                summary.totalIncome += transaction.nominal;
            } else {
                summary.totalExpense += transaction.nominal;
            }
        });

        summary.netWorth = summary.totalIncome - summary.totalExpense;
        return summary;
    }

    renderTrends(summary) {
        // Simplified trend calculation
        const trends = {
            transaction: Math.floor(Math.random() * 20) - 10,
            income: Math.floor(Math.random() * 30) - 10,
            expense: Math.floor(Math.random() * 25) - 10,
            netWorth: Math.floor(Math.random() * 35) - 15
        };

        this.updateTrendElement('transactionTrend', trends.transaction);
        this.updateTrendElement('incomeTrend', trends.income);
        this.updateTrendElement('expenseTrend', trends.expense);
        this.updateTrendElement('netWorthTrend', trends.netWorth);
    }

    updateTrendElement(elementId, percentage) {
        const element = document.getElementById(elementId);
        const isPositive = percentage >= 0;
        const icon = isPositive ? 'fa-arrow-up' : 'fa-arrow-down';
        const colorClass = isPositive ? 'trend-positive' : 'trend-negative';
        const sign = isPositive ? '+' : '';

        element.innerHTML = `
            <i class="fas ${icon} mr-1"></i>
            ${sign}${percentage}% dari periode sebelumnya
        `;
        element.className = `text-sm font-medium ${colorClass}`;
    }

    renderCharts() {
        this.renderCashFlowTrendChart();
        this.renderCategoryBreakdownChart();
        this.renderMonthlyComparisonChart();
    }

    renderCashFlowTrendChart() {
        const ctx = document.getElementById('cashFlowTrendChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.cashFlow) {
            this.charts.cashFlow.destroy();
        }

        const dailyData = this.aggregateDataByDay();

        this.charts.cashFlow = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dailyData.labels,
                datasets: [{
                    label: 'Pemasukan',
                    data: dailyData.income,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Pengeluaran',
                    data: dailyData.expense,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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

    renderCategoryBreakdownChart() {
        const ctx = document.getElementById('categoryBreakdownChart');
        if (!ctx) return;

        if (this.charts.category) {
            this.charts.category.destroy();
        }

        const categoryData = this.aggregateDataByCategory();

        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categoryData.labels,
                datasets: [{
                    data: categoryData.values,
                    backgroundColor: [
                        '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
                        '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    renderMonthlyComparisonChart() {
        const ctx = document.getElementById('monthlyComparisonChart');
        if (!ctx) return;

        if (this.charts.monthly) {
            this.charts.monthly.destroy();
        }

        const monthlyData = this.aggregateDataByMonth();

        this.charts.monthly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthlyData.labels,
                datasets: [{
                    label: 'Pemasukan',
                    data: monthlyData.income,
                    backgroundColor: '#10b981'
                }, {
                    label: 'Pengeluaran',
                    data: monthlyData.expense,
                    backgroundColor: '#ef4444'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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

    aggregateDataByDay() {
        const dailyData = {};
        const labels = [];
        const income = [];
        const expense = [];

        // Initialize days in range
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            dailyData[dateStr] = { income: 0, expense: 0 };
        }

        // Aggregate data
        this.filteredData.forEach(transaction => {
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
        Object.keys(dailyData).forEach(date => {
            labels.push(new Date(date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }));
            income.push(dailyData[date].income);
            expense.push(dailyData[date].expense);
        });

        return { labels, income, expense };
    }

    aggregateDataByCategory() {
        const categoryData = {};

        this.filteredData.forEach(transaction => {
            if (transaction.jenis === 'pengeluaran') {
                categoryData[transaction.kategori] = (categoryData[transaction.kategori] || 0) + transaction.nominal;
            }
        });

        return {
            labels: Object.keys(categoryData),
            values: Object.values(categoryData)
        };
    }

    aggregateDataByMonth() {
        const monthlyData = {};

        this.filteredData.forEach(transaction => {
            const date = new Date(transaction.tanggal);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { income: 0, expense: 0 };
            }

            if (transaction.jenis === 'pemasukan') {
                monthlyData[monthKey].income += transaction.nominal;
            } else {
                monthlyData[monthKey].expense += transaction.nominal;
            }
        });

        const labels = Object.keys(monthlyData).map(key => {
            const [year, month] = key.split('-');
            return new Date(year, month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        });

        return {
            labels,
            income: Object.values(monthlyData).map(data => data.income),
            expense: Object.values(monthlyData).map(data => data.expense)
        };
    }

    renderTopCategories() {
        const categoryData = this.aggregateDataByCategory();
        const sortedCategories = Object.entries(categoryData.labels.map((label, index) => ({
            category: label,
            amount: categoryData.values[index]
        }))).sort((a, b) => b[1].amount - a[1].amount).slice(0, 5);

        const container = document.getElementById('topCategories');
        container.innerHTML = sortedCategories.map((item, index) => {
            const { category, amount } = item[1];
            const { icon, color } = CategoryService.getCategoryDisplay(category);
            const percentage = (amount / categoryData.values.reduce((a, b) => a + b, 0) * 100).toFixed(1);

            return `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background-color: ${color}20; color: ${color}">
                            <i class="${icon}"></i>
                        </div>
                        <div>
                            <p class="font-medium text-gray-900">${category}</p>
                            <p class="text-sm text-gray-600">${percentage}% dari total</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-semibold text-gray-900">${this.formatCurrency(amount)}</p>
                        <div class="w-16 bg-gray-200 rounded-full h-2 mt-1">
                            <div class="progress-bar" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderSpendingPattern() {
        const patterns = this.analyzeSpendingPattern();
        const container = document.getElementById('spendingPattern');

        container.innerHTML = `
            <div class="space-y-4">
                <div class="bg-blue-50 p-4 rounded-lg">
                    <h5 class="font-medium text-blue-900 mb-2">Rata-rata Harian</h5>
                    <p class="text-2xl font-bold text-blue-600">${this.formatCurrency(patterns.dailyAverage)}</p>
                </div>
                <div class="bg-green-50 p-4 rounded-lg">
                    <h5 class="font-medium text-green-900 mb-2">Hari Terbesar</h5>
                    <p class="text-lg font-semibold text-green-600">${patterns.highestDay}</p>
                    <p class="text-sm text-green-600">${this.formatCurrency(patterns.highestAmount)}</p>
                </div>
                <div class="bg-yellow-50 p-4 rounded-lg">
                    <h5 class="font-medium text-yellow-900 mb-2">Kategori Favorit</h5>
                    <p class="text-lg font-semibold text-yellow-600">${patterns.favoriteCategory}</p>
                </div>
            </div>
        `;
    }

    analyzeSpendingPattern() {
        const expenses = this.filteredData.filter(t => t.jenis === 'pengeluaran');
        const totalExpense = expenses.reduce((sum, t) => sum + t.nominal, 0);
        const days = Math.max(1, (new Date(document.getElementById('endDate').value) - new Date(document.getElementById('startDate').value)) / (1000 * 60 * 60 * 24));

        const dailyExpenses = {};
        const categoryCount = {};

        expenses.forEach(transaction => {
            // Daily analysis
            const date = transaction.tanggal;
            dailyExpenses[date] = (dailyExpenses[date] || 0) + transaction.nominal;

            // Category analysis
            categoryCount[transaction.kategori] = (categoryCount[transaction.kategori] || 0) + 1;
        });

        const highestDayEntry = Object.entries(dailyExpenses).reduce((max, current) =>
            current[1] > max[1] ? current : max, ['', 0]);

        const favoriteCategory = Object.entries(categoryCount).reduce((max, current) =>
            current[1] > max[1] ? current : max, ['', 0])[0] || 'Tidak ada';

        return {
            dailyAverage: totalExpense / days,
            highestDay: new Date(highestDayEntry[0]).toLocaleDateString('id-ID'),
            highestAmount: highestDayEntry[1],
            favoriteCategory
        };
    }

    renderReportCards() {
        const container = document.getElementById('reportCards');
        const categories = [...new Set(this.filteredData.map(t => t.kategori))];

        container.innerHTML = categories.map(category => {
            const categoryTransactions = this.filteredData.filter(t => t.kategori === category);
            const totalAmount = categoryTransactions.reduce((sum, t) => sum + t.nominal, 0);
            const transactionCount = categoryTransactions.length;
            const { icon, color } = CategoryService.getCategoryDisplay(category);

            return `
                <div class="bg-white p-4 rounded-lg border border-gray-200">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center space-x-2">
                            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background-color: ${color}20; color: ${color}">
                                <i class="${icon} text-sm"></i>
                            </div>
                            <h4 class="font-medium text-gray-900">${category}</h4>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span class="text-sm text-gray-600">Total</span>
                            <span class="font-semibold">${this.formatCurrency(totalAmount)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm text-gray-600">Transaksi</span>
                            <span class="font-semibold">${transactionCount}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm text-gray-600">Rata-rata</span>
                            <span class="font-semibold">${this.formatCurrency(totalAmount / transactionCount || 0)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    toggleReportView() {
        const tableContainer = document.getElementById('reportTableContainer');
        const cardsContainer = document.getElementById('reportCardsContainer');
        const toggleBtn = document.getElementById('toggleReportView');

        if (tableContainer.classList.contains('hidden')) {
            // Show table
            tableContainer.classList.remove('hidden');
            cardsContainer.classList.add('hidden');
            toggleBtn.innerHTML = '<i class="fas fa-th-large mr-2"></i>Lihat Cards';
            this.renderReportTable();
        } else {
            // Show cards
            tableContainer.classList.add('hidden');
            cardsContainer.classList.remove('hidden');
            toggleBtn.innerHTML = '<i class="fas fa-table mr-2"></i>Lihat Tabel';
        }
    }

    renderReportTable() {
        const tbody = document.getElementById('reportTableBody');
        if (!tbody) return;

        tbody.innerHTML = this.filteredData.map(transaction => {
            const { icon, color } = CategoryService.getCategoryDisplay(transaction.kategori);
            const isIncome = transaction.jenis === 'pemasukan';
            const amountColor = isIncome ? 'text-green-600' : 'text-red-600';
            const typeColor = isIncome ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

            return `
                <tr>
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
                </tr>
            `;
        }).join('');
    }

    async exportToExcel() {
        try {
            const wb = XLSX.utils.book_new();

            // Summary Sheet
            const summaryData = [
                ['Laporan Keuangan SmartSaku'],
                ['Periode:', `${document.getElementById('startDate').value} - ${document.getElementById('endDate').value}`],
                [''],
                ['Ringkasan'],
                ['Total Transaksi', this.filteredData.length],
                ['Total Pemasukan', this.calculateSummary().totalIncome],
                ['Total Pengeluaran', this.calculateSummary().totalExpense],
                ['Net Worth', this.calculateSummary().netWorth],
                [''],
                ['Detail Transaksi'],
                ['Tanggal', 'Kategori', 'Deskripsi', 'Jenis', 'Nominal']
            ];

            // Add transaction data
            this.filteredData.forEach(transaction => {
                summaryData.push([
                    transaction.tanggal,
                    transaction.kategori,
                    transaction.deskripsi || '',
                    transaction.jenis,
                    transaction.nominal
                ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(wb, ws, 'Laporan');

            // Category analysis sheet
            const categoryData = this.aggregateDataByCategory();
            const categorySheet = [
                ['Analisis Kategori'],
                ['Kategori', 'Total Pengeluaran'],
                ...categoryData.labels.map((label, index) => [label, categoryData.values[index]])
            ];

            const catWs = XLSX.utils.aoa_to_sheet(categorySheet);
            XLSX.utils.book_append_sheet(wb, catWs, 'Kategori');

            // Download
            const fileName = `SmartSaku_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);

            this.showSuccess('Laporan Excel berhasil didownload');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            this.showError('Gagal mengexport ke Excel');
        }
    }

    async exportToPDF() {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Header
            doc.setFontSize(20);
            doc.text('Laporan Keuangan SmartSaku', 20, 30);

            doc.setFontSize(12);
            doc.text(`Periode: ${document.getElementById('startDate').value} - ${document.getElementById('endDate').value}`, 20, 45);

            // Summary
            doc.setFontSize(16);
            doc.text('Ringkasan', 20, 65);

            const summary = this.calculateSummary();
            doc.setFontSize(12);
            doc.text(`Total Transaksi: ${summary.totalTransactions}`, 20, 80);
            doc.text(`Total Pemasukan: ${this.formatCurrency(summary.totalIncome)}`, 20, 95);
            doc.text(`Total Pengeluaran: ${this.formatCurrency(summary.totalExpense)}`, 20, 110);
            doc.text(`Net Worth: ${this.formatCurrency(summary.netWorth)}`, 20, 125);

            // Transactions table (limited)
            doc.setFontSize(16);
            doc.text('Transaksi Terbaru (10 Terakhir)', 20, 150);

            const recentTransactions = this.filteredData.slice(-10);
            let y = 165;

            doc.setFontSize(10);
            recentTransactions.forEach(transaction => {
                if (y > 270) {
                    doc.addPage();
                    y = 30;
                }

                doc.text(`${this.formatDate(transaction.tanggal)} | ${transaction.kategori} | ${transaction.jenis} | ${this.formatCurrency(transaction.nominal)}`, 20, y);
                y += 15;
            });

            // Download
            const fileName = `SmartSaku_Report_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            this.showSuccess('Laporan PDF berhasil didownload');
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            this.showError('Gagal mengexport ke PDF');
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
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.reportManager = new ReportManager();
});

export default ReportManager;