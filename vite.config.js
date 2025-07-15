// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react'; // atau plugin lain sesuai project Anda

export default defineConfig({
    // Base path dimana aplikasi akan di-deploy
    base: '/SmartSaku/',

    publicDir: 'public',

    // Konfigurasi build
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        assetsDir: 'assets',
        minify: 'terser',
        sourcemap: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                home: resolve(__dirname, 'src/templates/home.html')
            },
            output: {
                entryFileNames: 'assets/[name]-[hash].js',
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]'
            }
        }
    },

    // Menggunakan resolve untuk menyederhanakan import
    resolve: {
        alias: {
            '@': '/src',
            '@css': resolve(__dirname, 'src/css'),
            '@js': resolve(__dirname, 'src/js'),
            '@images': resolve(__dirname, 'src/images'),
            '@templates': resolve(__dirname, 'src/templates'),
        },
    },    // Konfigurasi server development
    server: {
        port: 3001,
        open: true, // Buka browser otomatis
        proxy: {
            '/api': {
                target: 'https://smartsaku.ddns.net',
                changeOrigin: true,
                secure: false
            }
        }
    },

    // Konfigurasi untuk import file HTML sebagai string
    assetsInclude: ['**/*.html'],

    // Plugin untuk Vite
    plugins: [react()],

    css: {
        postcss: {
            plugins: []
        }
    }
});
