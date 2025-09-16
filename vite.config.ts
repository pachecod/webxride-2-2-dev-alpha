import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: [
      '@codemirror/lang-html',
      '@codemirror/lang-css',
      '@codemirror/lang-javascript'
    ]
  },
  build: {
    rollupOptions: {
      // Disable native binary to avoid platform-specific issues
      external: [],
    },
  },
  // Force Vite to use pure JavaScript Rollup
  define: {
    'process.env.ROLLUP_SKIP_NATIVE': 'true',
  },
  // Configure static file serving
  publicDir: 'public',
  server: {
    // Ensure static files are served correctly
    fs: {
      allow: ['..']
    }
  },
  resolve: {
    alias: {
      'three': path.resolve(__dirname, 'node_modules/three')
    }
  }
});