import AuthController from '../services/AuthController.js';
import TransactionService from '../services/TransactionService.js';
import GroqService from '../services/GroqService.js';

class ChatManager {
    constructor() {
        this.currentUser = null;
        this.chatHistory = [];
        this.financialData = null;
        this.suggestedQuestions = [
            'Bagaimana cara mengatur budget?',
            'Berapa ideal tabungan bulanan?',
            'Bagaimana cara menghemat pengeluaran?',
            'Tips investasi untuk pemula',
            'Cara melacak pengeluaran harian',
            'Bagaimana saya bisa mengurangi pengeluaran makanan?',
            'Strategi melunasi hutang',
            'Berapa dana darurat yang ideal?',
            'Fitur-fitur apa saja yang ada di SmartSaku?',
            'Bagaimana cara menganalisis pengeluaran saya?'
        ];

        this.knowledgeBase = {
            'mengatur budget': `
                <p>Berikut adalah langkah-langkah untuk mengatur budget yang baik:</p>
                <ol class="ml-5 space-y-2 mt-2">
                    <li><strong>Catat semua pendapatan</strong> - Identifikasi semua sumber pendapatan bulanan Anda.</li>
                    <li><strong>Lacak pengeluaran</strong> - Pantau semua pengeluaran selama sebulan untuk mendapat gambaran pengeluaran Anda.</li>
                    <li><strong>Kategorikan pengeluaran</strong> - Bagi pengeluaran ke dalam kategori tetap (sewa, listrik) dan variabel (makanan, hiburan).</li>
                    <li><strong>Terapkan aturan 50/30/20</strong>:
                        <ul class="ml-4 mt-1">
                            <li>50% untuk kebutuhan (sewa, makanan, transportasi)</li>
                            <li>30% untuk keinginan (hiburan, makan di luar)</li>
                            <li>20% untuk tabungan dan investasi</li>
                        </ul>
                    </li>
                    <li><strong>Evaluasi dan sesuaikan</strong> - Tinjau budget Anda secara berkala dan sesuaikan jika perlu.</li>
                </ol>
                <p class="mt-2">Di SmartSaku, Anda dapat menggunakan fitur Budget untuk membuat dan melacak anggaran Anda dengan mudah.</p>
            `,

            'tabungan bulanan': `
                <p>Tabungan bulanan yang ideal adalah 20-30% dari pendapatan Anda. Berikut rinciannya:</p>
                <ul class="ml-5 space-y-2 mt-2">
                    <li><strong>10-15%</strong> untuk dana pensiun dan investasi jangka panjang</li>
                    <li><strong>5-10%</strong> untuk dana darurat (idealnya cukup untuk 3-6 bulan biaya hidup)</li>
                    <li><strong>5%</strong> untuk tujuan jangka pendek (liburan, elektronik, dll)</li>
                </ul>
                <p class="mt-2">Jika Anda kesulitan mencapai target ini, mulailah dari persentase kecil (misal 5-10%) dan tingkatkan secara bertahap.</p>
            `,

            'menghemat pengeluaran': `
                <p>Berikut adalah strategi efektif untuk menghemat pengeluaran harian:</p>
                <ul class="ml-5 space-y-2 mt-2">
                    <li><strong>Buat daftar belanja</strong> dan patuhi daftar tersebut</li>
                    <li><strong>Masak di rumah</strong> daripada makan di luar atau pesan antar</li>
                    <li><strong>Gunakan transportasi umum</strong> atau sepeda untuk jarak dekat</li>
                    <li><strong>Batalkan langganan</strong> yang jarang digunakan</li>
                    <li><strong>Belanja dengan diskon</strong> atau saat ada promo</li>
                    <li><strong>Tetapkan aturan 30 hari</strong> sebelum membeli barang non-esensial</li>
                    <li><strong>Gunakan aplikasi pengelola keuangan</strong> seperti SmartSaku untuk melacak pengeluaran</li>
                </ul>
                <p class="mt-2">Dari data pengeluaran Anda di SmartSaku, Anda bisa melihat kategori mana yang paling banyak mengeluarkan uang dan mulai berhemat dari sana.</p>
            `,

            'investasi pemula': `
                <p>Sebagai pemula dalam investasi, berikut adalah tips untuk memulai:</p>
                <ol class="ml-5 space-y-2 mt-2">
                    <li><strong>Mulai dengan dana darurat</strong> - Pastikan Anda memiliki dana darurat 3-6 bulan sebelum investasi</li>
                    <li><strong>Tetapkan tujuan</strong> - Apakah untuk dana pensiun, pendidikan, atau tujuan jangka pendek?</li>
                    <li><strong>Pahami profil risiko</strong> - Konservatif, moderat, atau agresif?</li>
                    <li><strong>Diversifikasi</strong> - Jangan taruh semua telur dalam satu keranjang</li>
                    <li><strong>Investasi bertahap</strong> - Gunakan strategi Dollar Cost Averaging</li>
                    <li><strong>Mulai dari produk sederhana</strong>:
                        <ul class="ml-4 mt-1">
                            <li>Reksa Dana Pasar Uang (risiko rendah)</li>
                            <li>Reksa Dana Pendapatan Tetap (risiko menengah)</li>
                            <li>Reksa Dana Saham (risiko tinggi)</li>
                            <li>SBN/ORI (Obligasi Pemerintah)</li>
                        </ul>
                    </li>
                </ol>
                <p class="mt-2">Semakin dini Anda memulai investasi, semakin besar potensi keuntungan jangka panjang berkat bunga majemuk.</p>
            `,

            'dana darurat': `
                <p>Dana darurat adalah uang yang disisihkan untuk keadaan mendesak seperti kehilangan pekerjaan atau masalah kesehatan.</p>
                <p class="mt-2"><strong>Jumlah ideal dana darurat:</strong></p>
                <ul class="ml-5 space-y-2 mt-1">
                    <li><strong>Untuk yang masih single:</strong> 3-6 bulan total pengeluaran</li>
                    <li><strong>Untuk yang sudah berkeluarga:</strong> 6-12 bulan total pengeluaran</li>
                    <li><strong>Untuk wirausaha/pekerja lepas:</strong> 12 bulan total pengeluaran</li>
                </ul>
                <p class="mt-2">Dana darurat sebaiknya disimpan di instrumen yang likuid (mudah dicairkan) dan aman, seperti:</p>
                <ul class="ml-5 mt-1">
                    <li>Tabungan</li>
                    <li>Deposito jangka pendek</li>
                    <li>Reksa dana pasar uang</li>
                </ul>
            `,

            'hutang': `
                <p>Untuk melunasi hutang dengan efektif, berikut strategi yang bisa Anda terapkan:</p>
                <ol class="ml-5 space-y-2 mt-2">
                    <li><strong>Metode Snowball</strong> - Lunasi hutang terkecil terlebih dahulu untuk membangun momentum</li>
                    <li><strong>Metode Avalanche</strong> - Lunasi hutang dengan bunga tertinggi terlebih dahulu untuk menghemat biaya bunga</li>
                    <li><strong>Konsolidasi hutang</strong> - Gabungkan beberapa hutang dengan bunga tinggi menjadi satu hutang dengan bunga lebih rendah</li>
                    <li><strong>Alokasikan minimal 20% pendapatan</strong> untuk pembayaran hutang</li>
                    <li><strong>Hindari menambah hutang baru</strong> selama proses pelunasan</li>
                </ol>
                <p class="mt-2">Ingat untuk selalu membayar minimal pembayaran minimum tepat waktu untuk menjaga skor kredit Anda.</p>
            `,

            'fitur smartsaku': `
                <p>SmartSaku memiliki beberapa fitur utama untuk membantu mengelola keuangan Anda:</p>
                <ul class="ml-5 space-y-2 mt-2">
                    <li><strong>Dashboard</strong> - Melihat ringkasan keuangan dan tren pengeluaran</li>
                    <li><strong>Transaksi</strong> - Mencatat dan mengkategorikan pemasukan dan pengeluaran</li>
                    <li><strong>Laporan</strong> - Analisis detail tentang pola keuangan Anda</li>
                    <li><strong>Chat AI</strong> - Mendapatkan tips dan jawaban atas pertanyaan keuangan</li>
                    <li><strong>Pengaturan</strong> - Mengatur profil dan preferensi aplikasi</li>
                </ul>
                <p class="mt-2">Untuk memulai, tambahkan transaksi reguler Anda agar dapat melihat analisis yang lebih akurat.</p>
            `
        };

        this.init();
    }

    async init() {
        try {
            await this.checkAuth();
            this.updateDateTime();
            this.setupEventListeners();
            await this.loadFinancialData();

            // Set welcome time
            const welcomeTimeElement = document.getElementById('welcomeTime');
            if (welcomeTimeElement) {
                welcomeTimeElement.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }

            console.log('Chat manager initialized successfully');
        } catch (error) {
            console.error('Error initializing chat:', error);
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

        const currentDateElement = document.getElementById('currentDate');
        if (currentDateElement) {
            currentDateElement.textContent = now.toLocaleDateString('id-ID', options);
        }

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

        const greetingElement = document.getElementById('greeting');
        if (greetingElement) {
            greetingElement.textContent = greeting;
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
            const userNameElement = document.getElementById('userName');

            if (userNameElement) {
                const displayName = this.currentUser.user_metadata?.nama_lengkap ||
                    this.currentUser.email.split('@')[0] ||
                    'Pengguna';

                userNameElement.textContent = displayName;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = '/src/templates/home.html';
        }
    }

    async loadFinancialData() {
        try {
            // Get financial summary from TransactionService
            this.financialData = await TransactionService.getFinancialSummary(this.currentUser.id);

            // Get recent transactions
            const transactions = await TransactionService.getUserTransactions(this.currentUser.id);
            this.financialData.transactions = transactions || [];

            console.log('Financial data loaded for chat analysis:', this.financialData);
        } catch (error) {
            console.error('Error loading financial data for chat:', error);
            this.financialData = {
                totalSaldo: 0,
                totalPemasukan: 0,
                totalPengeluaran: 0,
                totalTransaksi: 0,
                transactions: []
            };
        }
    }

    setupEventListeners() {
        // Chat form submission
        const chatForm = document.getElementById('chatForm');
        if (chatForm) {
            chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleChatSubmit();
            });
        }

        // Suggestion chips
        const suggestionChips = document.querySelectorAll('.suggestion-chip');
        suggestionChips.forEach(chip => {
            chip.addEventListener('click', () => {
                document.getElementById('chatInput').value = chip.textContent.trim();
                this.handleChatSubmit();
            });
        });

        // Input keypress event (for enter key)
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleChatSubmit();
                }
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    await AuthController.logout();
                    window.location.href = '/src/templates/home.html';
                } catch (error) {
                    console.error('Logout failed:', error);
                }
            });
        }

        console.log('Chat event listeners set up');
    }

    handleChatSubmit() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();

        if (message.length === 0) return;

        console.log('User submitted message:', message);

        // Add user message to chat
        this.addUserMessage(message);
        chatInput.value = '';

        // Generate AI response after a short delay
        this.showTypingIndicator();

        setTimeout(() => {
            this.generateResponse(message);
        }, 1000);
    }

    addUserMessage(message) {
        const chatMessages = document.getElementById('chatMessages');
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const messageHTML = `
            <div class="message-user p-4 rounded-lg mb-4 shadow-sm">
                <div class="flex items-start flex-row-reverse">
                    <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center ml-3">
                        <i class="fas fa-user text-green-600"></i>
                    </div>
                    <div class="text-right">
                        <p class="font-medium text-gray-800">Anda</p>
                        <div class="text-gray-700 mt-1 text-left">
                            <p>${message}</p>
                        </div>
                        <p class="text-xs text-gray-500 mt-2">${time}</p>
                    </div>
                </div>
            </div>
        `;

        chatMessages.insertAdjacentHTML('beforeend', messageHTML);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Add to history
        this.chatHistory.push({
            role: 'user',
            message: message,
            timestamp: new Date()
        });
    }

    addAIMessage(htmlContent) {
        const chatMessages = document.getElementById('chatMessages');
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Remove typing indicator if exists
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }

        const messageHTML = `
            <div class="message-ai p-4 rounded-lg mb-4 shadow-sm">
                <div class="flex items-start">
                    <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <i class="fas fa-robot text-blue-500"></i>
                    </div>
                    <div>
                        <p class="font-medium text-gray-800">SmartSaku AI</p>
                        <div class="text-gray-700 mt-1">
                            ${htmlContent}
                        </div>
                        <p class="text-xs text-gray-500 mt-2">${time}</p>
                    </div>
                </div>
            </div>
        `;

        chatMessages.insertAdjacentHTML('beforeend', messageHTML);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Add to history
        this.chatHistory.push({
            role: 'ai',
            message: htmlContent,
            timestamp: new Date()
        });

        // Refresh suggestions
        this.updateSuggestionChips();
    }

    showTypingIndicator() {
        const chatMessages = document.getElementById('chatMessages');

        const indicatorHTML = `
            <div id="typingIndicator" class="message-ai p-4 rounded-lg mb-4 shadow-sm">
                <div class="flex items-start">
                    <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <i class="fas fa-robot text-blue-500"></i>
                    </div>
                    <div>
                        <p class="font-medium text-gray-800">SmartSaku AI</p>
                        <div class="text-gray-700 mt-1 typing-indicator">
                            <span>•</span>
                            <span>•</span>
                            <span>•</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        chatMessages.insertAdjacentHTML('beforeend', indicatorHTML);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    updateSuggestionChips() {
        const suggestionChips = document.getElementById('suggestionChips');
        if (!suggestionChips) return;

        // Clear existing chips
        suggestionChips.innerHTML = '';

        // Select 4 random suggestions from the list
        const randomSuggestions = this.getRandomSuggestions(4);

        randomSuggestions.forEach(suggestion => {
            const chipHTML = `
                <button class="suggestion-chip px-4 py-2 rounded-full text-sm transition-colors">
                    ${suggestion}
                </button>
            `;

            suggestionChips.insertAdjacentHTML('beforeend', chipHTML);
        });

        // Re-attach event listeners
        const newChips = suggestionChips.querySelectorAll('.suggestion-chip');
        newChips.forEach(chip => {
            chip.addEventListener('click', () => {
                document.getElementById('chatInput').value = chip.textContent.trim();
                this.handleChatSubmit();
            });
        });
    }

    getRandomSuggestions(count) {
        // Shuffle array and take first 'count' elements
        return [...this.suggestedQuestions]
            .sort(() => 0.5 - Math.random())
            .slice(0, count);
    }

    async generateResponse(userMessage) {
        console.log("Generating response for:", userMessage);

        try {
            // Periksa apakah pesan tentang analisis keuangan pengguna
            const isFinancialAnalysisRequest = this.isFinancialAnalysisRequest(userMessage);
            const isSaldoRequest = this.isSaldoRequest(userMessage);

            let contextData = '';

            // Tambahkan konteks data keuangan jika diperlukan
            if (isFinancialAnalysisRequest || isSaldoRequest) {
                contextData = this.prepareFinancialContext();
                console.log("Menambahkan konteks keuangan ke prompt");
            }

            // Gunakan API Groq untuk mendapatkan respons
            const response = await GroqService.generateResponse(userMessage, contextData);

            this.addAIMessage(response);
        } catch (error) {
            console.error("Error generating response:", error);

            // Use GroqService fallback instead of showing error to user
            const fallbackResponse = await GroqService.generateResponse(userMessage, contextData);
            this.addAIMessage(fallbackResponse);
        }
    }

    isFinancialAnalysisRequest(message) {
        const keywords = ['analisis', 'analisa', 'pengeluaran', 'keuangan saya', 'kondisi keuangan', 'bagaimana keuangan'];
        return keywords.some(keyword => message.toLowerCase().includes(keyword));
    }

    isSaldoRequest(message) {
        const keywords = ['saldo', 'uang saya', 'tabungan saya', 'berapa uang', 'berapa saldo', 'pemasukan', 'pengeluaran'];
        return keywords.some(keyword => message.toLowerCase().includes(keyword));
    }

    prepareFinancialContext() {
        if (!this.financialData) {
            return 'Tidak ada data keuangan tersedia.';
        }

        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
            }).format(amount);
        };

        // Hitung rasio pengeluaran terhadap pemasukan
        const spendingRatio = this.financialData.totalPemasukan > 0 ?
            (this.financialData.totalPengeluaran / this.financialData.totalPemasukan) * 100 : 0;

        // Siapkan konteks data keuangan
        return `
            Data Keuangan Pengguna:
            - Saldo saat ini: ${formatCurrency(this.financialData.totalSaldo)}
            - Total Pemasukan: ${formatCurrency(this.financialData.totalPemasukan)}
            - Total Pengeluaran: ${formatCurrency(this.financialData.totalPengeluaran)} (${spendingRatio.toFixed(1)}% dari pemasukan)
            - Jumlah Transaksi: ${this.financialData.totalTransaksi} transaksi
            
            Berikan analisis dan saran berdasarkan data ini. Jika rasio pengeluaran > 70% dari pemasukan, sarankan untuk mengurangi pengeluaran.
        `;
    }

    isGreeting(message) {
        const greetings = ['hai', 'halo', 'hello', 'hi', 'pagi', 'siang', 'sore', 'malam', 'selamat'];
        return greetings.some(greeting => message.includes(greeting));
    }

    generateFinancialAnalysis() {
        if (!this.financialData || !this.financialData.transactions || this.financialData.transactions.length === 0) {
            return `
                <p>Saya belum bisa memberikan analisis keuangan pribadi Anda karena belum ada data transaksi yang tercatat.</p>
                <p class="mt-2">Mulailah mencatat transaksi pengeluaran dan pemasukan Anda di SmartSaku agar saya bisa memberikan analisis yang akurat.</p>
            `;
        }

        // Calculate percentage of income spent
        const spendingRatio = this.financialData.totalPemasukan > 0 ?
            (this.financialData.totalPengeluaran / this.financialData.totalPemasukan) * 100 : 0;

        // Format currency
        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
            }).format(amount);
        };

        // Generate spending advice based on ratio
        let advice = '';
        if (spendingRatio > 90) {
            advice = 'Anda menghabiskan hampir semua pendapatan Anda. Cobalah untuk mengurangi pengeluaran dan meningkatkan tabungan.';
        } else if (spendingRatio > 70) {
            advice = 'Persentase pengeluaran Anda cukup tinggi. Pertimbangkan untuk menabung lebih banyak untuk jaga-jaga.';
        } else if (spendingRatio > 50) {
            advice = 'Rasio pengeluaran Anda cukup seimbang. Tetap konsisten dan tingkatkan tabungan jika memungkinkan.';
        } else {
            advice = 'Selamat! Anda mengelola keuangan dengan sangat baik dengan pengeluaran di bawah 50% pendapatan.';
        }

        return `
            <p>Berdasarkan data keuangan Anda, berikut adalah analisis singkat:</p>
            <div class="bg-blue-50 p-3 rounded-lg mt-2">
                <p><strong>Saldo saat ini:</strong> ${formatCurrency(this.financialData.totalSaldo)}</p>
                <p><strong>Total Pemasukan:</strong> ${formatCurrency(this.financialData.totalPemasukan)}</p>
                <p><strong>Total Pengeluaran:</strong> ${formatCurrency(this.financialData.totalPengeluaran)} (${spendingRatio.toFixed(1)}% dari pemasukan)</p>
                <p><strong>Jumlah Transaksi:</strong> ${this.financialData.totalTransaksi} transaksi</p>
            </div>
            <p class="mt-3">${advice}</p>
            <p class="mt-2">Anda dapat melihat analisis lebih detail di dashboard SmartSaku.</p>
        `;
    }

    generateSaldoInformation() {
        if (!this.financialData) {
            return `
                <p>Maaf, saya tidak bisa mengakses informasi saldo Anda saat ini. Silakan coba lagi nanti atau lihat langsung di dashboard.</p>
            `;
        }

        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
            }).format(amount);
        };

        return `
            <p>Berikut adalah informasi saldo dan keuangan Anda saat ini:</p>
            <div class="bg-blue-50 p-3 rounded-lg mt-2">
                <p><strong>Saldo saat ini:</strong> ${formatCurrency(this.financialData.totalSaldo)}</p>
                <p><strong>Total Pemasukan:</strong> ${formatCurrency(this.financialData.totalPemasukan)}</p>
                <p><strong>Total Pengeluaran:</strong> ${formatCurrency(this.financialData.totalPengeluaran)}</p>
                <p><strong>Jumlah Transaksi:</strong> ${this.financialData.totalTransaksi} transaksi</p>
            </div>
            <p class="mt-3">Untuk informasi lebih detail tentang transaksi Anda, silakan kunjungi halaman Dashboard atau Transaksi.</p>
        `;
    }
}

// Initialize chat manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChatManager();
});