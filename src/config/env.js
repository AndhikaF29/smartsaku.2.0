// Konfigurasi variabel lingkungan untuk SmartSaku
// File ini berisi fungsi untuk mengambil konfigurasi dari variabel lingkungan
// atau dari file konfigurasi lokal yang tidak dicommit

/**
 * Mendapatkan konfigurasi lingkungan untuk aplikasi
 * @returns {Object} Objek berisi variabel konfigurasi
 */
export function getEnvConfig() {
    // Prioritaskan variabel lingkungan jika tersedia
    if (typeof process !== 'undefined' && process.env) {
        return {
            GROQ_API_KEY: process.env.GROQ_API_KEY || '',
            // Tambahkan variabel lingkungan lain di sini
        };
    }

    // Jika tidak, coba load dari window.ENV (diinjeksi dari server)
    if (typeof window !== 'undefined' && window.ENV) {
        return window.ENV;
    }

    // Default fallback - ini sebaiknya diubah saat deployment
    console.warn('Variabel lingkungan tidak tersedia, menggunakan konfigurasi default');
    return {
        GROQ_API_KEY: '',
        // Tambahkan variabel lingkungan lain di sini dengan nilai default aman
    };
}

/**
 * Memeriksa apakah semua konfigurasi yang diperlukan sudah tersedia
 * @returns {boolean} true jika semua konfigurasi tersedia
 */
export function isConfigComplete() {
    const config = getEnvConfig();

    // Daftar konfigurasi yang diperlukan
    const requiredConfigs = [
        'GROQ_API_KEY',
        // Tambahkan konfigurasi wajib lainnya di sini
    ];

    // Periksa apakah semua konfigurasi tersedia
    return requiredConfigs.every(key => !!config[key]);
}