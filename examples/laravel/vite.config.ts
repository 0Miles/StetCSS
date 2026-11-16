import react from '@vitejs/plugin-react';
import stetCSS from '@stet-css/vite';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    laravel({
      input: ['resources/css/app.css', 'resources/js/app.tsx'],
      ssr: 'resources/js/ssr.tsx',
      refresh: true,
    }),
    react(),
    stetCSS(),
  ],
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
    },
  },
});
