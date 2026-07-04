import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, existsSync } from 'fs';

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
    minify: 'terser',
    cssMinify: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        categories: resolve(__dirname, 'categories.html'),
        products: resolve(__dirname, 'products.html'),
        about: resolve(__dirname, 'about.html'),
        admin: resolve(__dirname, 'admin.html')
      },
      output: {
        manualChunks: {
          vendor: ['app.js']
        }
      }
    }
  },
  publicDir: 'public',
  plugins: [
    {
      name: 'copy-root-files',
      closeBundle() {
        const files = ['sitemap.xml', 'robots.txt', 'google26b8097e3c616cdc.html'];
        files.forEach(file => {
          if (existsSync(file)) {
            copyFileSync(file, `dist/${file}`);
            console.log(`Copied ${file} to dist/`);
          }
        });
      }
    }
  ]
});