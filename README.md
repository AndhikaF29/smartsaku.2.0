# SmartSaku

SmartSaku adalah aplikasi pengelolaan keuangan cerdas yang membantu pengguna mengelola keuangan dengan mudah menggunakan teknologi AI terdepan.

## Fitur

- Pelacakan pengeluaran dan pendapatan
- Analisis keuangan berbasis AI
- Visualisasi data keuangan
- Rekomendasi untuk mengoptimalkan keuangan

## Teknologi

Aplikasi ini dikembangkan menggunakan:

- HTML, CSS, JavaScript
- Tailwind CSS
- Chart.js
- Vite
- Supabase
- Groq API dengan model Llama 4 Scout

> 📘 **Untuk detail lengkap teknologi yang digunakan, lihat [Dokumentasi Teknis](DOKUMENTASI_TEKNIS.md)**

## Demo

Kunjungi aplikasi di [https://[your-github-username].github.io/Smartsaku](https://[your-github-username].github.io/Smartsaku)

## Pengaturan Variabel Lingkungan

SmartSaku menggunakan beberapa API key dan konfigurasi yang perlu diatur sebelum menjalankan aplikasi:

1. Salin file `.env.example` menjadi `.env`:

   ```bash
   cp .env.example .env
   ```

2. Edit file `.env` dan isi dengan API key Anda:

   ```
   GROQ_API_KEY=your_groq_api_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **PENTING:** Jangan commit file `.env` ke repositori Git!

## Cara Instalasi

```bash
# Clone repository
git clone https://github.com/[your-github-username]/Smartsaku.git

# Pindah ke direktori proyek
cd Smartsaku

# Install dependensi
npm install

# Setup variabel lingkungan (lihat instruksi di atas)

# Jalankan server pengembangan
npm run dev
```

## Deployment

```bash
# Build untuk produksi
npm run build

# Deploy ke GitHub Pages
npm run deploy
```

## Keamanan

⚠️ **PERHATIAN:** Aplikasi ini menggunakan API keys dari layanan eksternal. Jangan pernah commit API keys langsung ke repositori Git!

- Gunakan file `.env` untuk menyimpan API keys dan credentials
- Pastikan `.env` ditambahkan ke `.gitignore`
- Saat deployment, gunakan variabel lingkungan atau secrets yang aman

## Kontribusi

Jika Anda ingin berkontribusi pada proyek ini:

1. Fork repositori
2. Buat branch fitur (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan Anda (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buka Pull Request

## Lisensi

[MIT](LICENSE)

- **Vite** - Module bundler yang cepat untuk pengembangan frontend
- **Tailwind CSS** (via CDN) - Framework CSS utility-first
- **Vanilla JavaScript** - JavaScript murni dengan pendekatan modular

## Struktur Folder

```
frontend-vite/
├── index.html            # Entry point HTML
├── package.json          # Konfigurasi npm dan dependencies
├── vite.config.js        # Konfigurasi Vite
└── src/                  # Source code
    ├── main.js           # JavaScript entry point
    ├── css/              # File CSS
    ├── images/           # Gambar dan assets
    ├── js/               # Module JavaScript
    └── templates/        # Template HTML
```

## Cara Menjalankan

1. Install dependencies:

   ```
   npm install
   ```

2. Menjalankan server pengembangan:

   ```
   npm run dev
   ```

3. Build untuk production:

   ```
   npm run build
   ```

4. Preview hasil build:
   ```
   npm run preview
   ```
