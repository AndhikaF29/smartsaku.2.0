// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react'; // atau plugin lain sesuai project Anda

export default defineConfig({
    // Base path untuk deployment di Vercel
    base: './',

    publicDir: 'public',

    // Konfigurasi build
    build: {
        outDir: 'dist',
        sourcemap: true,
        // Memastikan env variables digunakan dengan benar
        // https://vitejs.dev/config/build-options.html#build-sourcemap
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: false,  // Tetap tampilkan console logs untuk debugging
            },
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
        port: 3000,
        open: true // Buka browser otomatis
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
