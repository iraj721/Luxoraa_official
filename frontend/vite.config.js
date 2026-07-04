import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 5500,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        categories: resolve(__dirname, 'categories.html'),
        products: resolve(__dirname, 'products.html'),
        about: resolve(__dirname, 'about.html'),
        admin: resolve(__dirname, 'admin.html')
      }
    }
  },
  publicDir: 'public'
});