import { supabaseClient } from './supabaseClient.js';
import { getEnvConfig } from '../config/env.js';

class GroqService {
    constructor() {
        const config = getEnvConfig();
        this.apiKey = config.GROQ_API_KEY || '';
        this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        this.model = 'meta-llama/llama-4-scout-17b-16e-instruct';
    }

    async generateResponse(userMessage, context = '') {
        // Check if API key is available
        if (!this.apiKey || this.apiKey.trim() === '') {
            console.warn('Groq API key not configured, using fallback response');
            return this.getFallbackResponse(userMessage, context);
        }

        try {
            const systemPrompt = `Anda adalah asisten keuangan pribadi SmartSaku yang membantu pengguna dengan pengelolaan keuangan mereka.
Anda hanya membahas topik terkait keuangan pribadi, tabungan, investasi, anggaran, dan topik keuangan lainnya.
Berikan jawaban dalam Bahasa Indonesia yang ringkas, informatif, dan praktis.
${context ? 'Berikut konteks data keuangan pengguna yang mungkin relevan: ' + context : ''}`;

            const payload = {
                model: this.model,
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: userMessage
                    }
                ],
                max_tokens: 800,
                temperature: 0.7,
                top_p: 0.9
            };

            console.log('Sending request to Groq API');

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorDetail = await response.json().catch(() => ({}));
                console.error('Groq API error:', errorDetail);

                // If API key is invalid, use fallback
                if (response.status === 401 || errorDetail.error?.code === 'invalid_api_key') {
                    console.warn('Invalid API key detected, using fallback response');
                    return this.getFallbackResponse(userMessage, context);
                }

                throw new Error(`Groq API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Groq API response received successfully');

            // Extract the AI message content
            const messageContent = data.choices[0]?.message?.content || "Maaf, saya tidak dapat memproses permintaan Anda saat ini.";

            // Format response as HTML
            const formattedResponse = this.formatResponseAsHtml(messageContent);

            return formattedResponse;
        } catch (error) {
            console.error('Error calling Groq API:', error);

            // Use fallback response for network or API errors
            return this.getFallbackResponse(userMessage, context);
        }
    }

    getFallbackResponse(userMessage, context = '') {
        console.log('Using fallback response for message:', userMessage);

        const messageWords = userMessage.toLowerCase();

        // Predefined responses for common financial questions
        const fallbackResponses = {
            greeting: `
                <p>Halo! Saya adalah asisten keuangan SmartSaku. Meskipun saat ini saya menggunakan mode offline, saya masih bisa membantu Anda dengan informasi dasar tentang pengelolaan keuangan.</p>
                <p class="mt-2">Silakan tanyakan tentang tips budgeting, tabungan, investasi, atau fitur SmartSaku!</p>
            `,

            budget: `
                <p>Berikut adalah tips dasar untuk mengatur budget:</p>
                <ol class="ml-5 space-y-2 mt-2">
                    <li><strong>Catat semua pendapatan</strong> - Identifikasi semua sumber pendapatan bulanan Anda</li>
                    <li><strong>Lacak pengeluaran</strong> - Pantau semua pengeluaran untuk mendapat gambaran pola spending</li>
                    <li><strong>Terapkan aturan 50/30/20</strong>:
                        <ul class="ml-4 mt-1">
                            <li>50% untuk kebutuhan (sewa, makanan, transportasi)</li>
                            <li>30% untuk keinginan (hiburan, makan di luar)</li>
                            <li>20% untuk tabungan dan investasi</li>
                        </ul>
                    </li>
                    <li><strong>Evaluasi dan sesuaikan</strong> secara berkala</li>
                </ol>
                <p class="mt-2">Gunakan fitur Budget di SmartSaku untuk memudahkan pelacakan anggaran Anda.</p>
            `,

            tabungan: `
                <p>Tabungan ideal adalah 20-30% dari pendapatan bulanan:</p>
                <ul class="ml-5 space-y-2 mt-2">
                    <li><strong>10-15%</strong> untuk dana pensiun dan investasi jangka panjang</li>
                    <li><strong>5-10%</strong> untuk dana darurat (3-6 bulan biaya hidup)</li>
                    <li><strong>5%</strong> untuk tujuan jangka pendek</li>
                </ul>
                <p class="mt-2">Mulai dari persentase kecil jika sulit mencapai target ini, lalu tingkatkan bertahap.</p>
            `,

            hemat: `
                <p>Tips menghemat pengeluaran sehari-hari:</p>
                <ul class="ml-5 space-y-2 mt-2">
                    <li><strong>Buat daftar belanja</strong> dan patuhi daftar tersebut</li>
                    <li><strong>Masak di rumah</strong> daripada makan di luar</li>
                    <li><strong>Gunakan transportasi umum</strong> untuk jarak dekat</li>
                    <li><strong>Batalkan langganan</strong> yang jarang digunakan</li>
                    <li><strong>Belanja saat ada promo</strong> atau diskon</li>
                    <li><strong>Terapkan aturan 30 hari</strong> sebelum membeli barang non-esensial</li>
                </ul>
                <p class="mt-2">SmartSaku dapat membantu melacak pengeluaran untuk melihat area mana yang bisa dihemat.</p>
            `,

            investasi: `
                <p>Tips investasi untuk pemula:</p>
                <ol class="ml-5 space-y-2 mt-2">
                    <li><strong>Pastikan ada dana darurat</strong> terlebih dahulu</li>
                    <li><strong>Tetapkan tujuan investasi</strong> yang jelas</li>
                    <li><strong>Pahami profil risiko</strong> Anda</li>
                    <li><strong>Mulai dari produk sederhana</strong> seperti reksa dana</li>
                    <li><strong>Diversifikasi portofolio</strong> untuk mengurangi risiko</li>
                    <li><strong>Investasi rutin</strong> dengan nominal yang konsisten</li>
                </ol>
                <p class="mt-2">Konsultasikan dengan perencana keuangan jika perlu panduan lebih detail.</p>
            `,

            smartsaku: `
                <p>SmartSaku memiliki fitur-fitur berikut:</p>
                <ul class="ml-5 space-y-2 mt-2">
                    <li><strong>Dashboard</strong> - Ringkasan keuangan dan tren pengeluaran</li>
                    <li><strong>Transaksi</strong> - Pencatatan pemasukan dan pengeluaran</li>
                    <li><strong>Laporan</strong> - Analisis detail pola keuangan</li>
                    <li><strong>Chat AI</strong> - Konsultasi tips keuangan</li>
                    <li><strong>Pengaturan</strong> - Kustomisasi profil dan preferensi</li>
                </ul>
                <p class="mt-2">Mulai dengan menambahkan transaksi reguler untuk analisis yang lebih akurat.</p>
            `,

            analisis: context ? this.generateOfflineAnalysis(context) : `
                <p>Untuk mendapatkan analisis keuangan yang akurat, saya memerlukan data transaksi Anda.</p>
                <p class="mt-2">Silakan tambahkan beberapa transaksi di SmartSaku terlebih dahulu, kemudian tanyakan kembali untuk analisis.</p>
            `,

            saldo: context ? this.generateOfflineSaldoInfo(context) : `
                <p>Saya tidak dapat mengakses informasi saldo saat ini.</p>
                <p class="mt-2">Silakan lihat informasi saldo di halaman Dashboard SmartSaku.</p>
            `,

            default: `
                <p>Maaf, saat ini saya dalam mode offline dan hanya bisa memberikan informasi dasar tentang keuangan.</p>
                <p class="mt-2">Beberapa topik yang bisa saya bantu:</p>
                <ul class="ml-5 mt-2">
                    <li>Tips mengatur budget</li>
                    <li>Strategi menabung</li>
                    <li>Cara menghemat pengeluaran</li>
                    <li>Informasi dasar investasi</li>
                    <li>Fitur-fitur SmartSaku</li>
                </ul>
                <p class="mt-2">Untuk analisis data keuangan personal, silakan coba lagi nanti saat layanan online tersedia.</p>
            `
        };

        // Check message content and return appropriate response
        if (this.containsWords(messageWords, ['hai', 'halo', 'hello', 'hi', 'selamat'])) {
            return fallbackResponses.greeting;
        } else if (this.containsWords(messageWords, ['budget', 'anggaran', 'mengatur'])) {
            return fallbackResponses.budget;
        } else if (this.containsWords(messageWords, ['tabungan', 'menabung', 'ideal'])) {
            return fallbackResponses.tabungan;
        } else if (this.containsWords(messageWords, ['hemat', 'menghemat', 'pengeluaran'])) {
            return fallbackResponses.hemat;
        } else if (this.containsWords(messageWords, ['investasi', 'invest', 'pemula'])) {
            return fallbackResponses.investasi;
        } else if (this.containsWords(messageWords, ['smartsaku', 'fitur', 'aplikasi'])) {
            return fallbackResponses.smartsaku;
        } else if (this.containsWords(messageWords, ['analisis', 'analisa', 'keuangan saya'])) {
            return fallbackResponses.analisis;
        } else if (this.containsWords(messageWords, ['saldo', 'uang saya', 'berapa'])) {
            return fallbackResponses.saldo;
        } else {
            return fallbackResponses.default;
        }
    }

    containsWords(text, words) {
        return words.some(word => text.includes(word));
    }

    generateOfflineAnalysis(context) {
        // Basic analysis when we have context data
        return `
            <p>Berdasarkan data yang tersedia:</p>
            <div class="bg-blue-50 p-3 rounded-lg mt-2">
                <p>Analisis keuangan sedang diproses dalam mode offline.</p>
                <p class="mt-1">Untuk analisis detail dan rekomendasi personal, silakan gunakan fitur Laporan di dashboard.</p>
            </div>
            <p class="mt-2">Tips umum: Pastikan pengeluaran tidak melebihi 70% dari pendapatan dan sisihkan minimal 20% untuk tabungan.</p>
        `;
    }

    generateOfflineSaldoInfo(context) {
        return `
            <p>Informasi saldo tidak dapat diakses dalam mode offline.</p>
            <p class="mt-2">Silakan lihat informasi terkini di Dashboard SmartSaku atau halaman Transaksi.</p>
            <div class="bg-blue-50 p-3 rounded-lg mt-2">
                <p><strong>Tip:</strong> Selalu pantau saldo secara rutin untuk menjaga kesehatan keuangan Anda.</p>
            </div>
        `;
    }

    formatResponseAsHtml(text) {
        // Convert line breaks to paragraphs
        let formatted = text
            .replace(/\n\n+/g, '</p><p class="mt-2">')
            .replace(/\n/g, '<br>');

        // Add paragraph tags at the beginning and end if they don't exist
        if (!formatted.startsWith('<p>')) {
            formatted = `<p>${formatted}`;
        }
        if (!formatted.endsWith('</p>')) {
            formatted = `${formatted}</p>`;
        }

        // Replace simple markdown-like formatting with HTML
        formatted = formatted
            // Bold text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/__(.*?)__/g, '<strong>$1</strong>')

            // Lists (only basic support)
            .replace(/^- (.*?)$/gm, '<li>$1</li>')
            .replace(/^[0-9]+\. (.*?)$/gm, '<li>$1</li>');

        // Wrap lists in ul/ol tags
        if (formatted.includes('<li>')) {
            formatted = formatted
                .replace(/<p>(<li>.*?<\/li>)<\/p>/gs, '<ul class="ml-5 space-y-2 mt-2">$1</ul>');
        }

        return formatted;
    }
}

export default new GroqService();