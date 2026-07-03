import { defineConfig } from 'vite';

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
    rollupOptions: {
      input: {
        main: 'index.html',
        categories: 'categories.html',
        products: 'products.html',
        about: 'about.html',
        admin: 'admin.html'
      }
    }
  }
});