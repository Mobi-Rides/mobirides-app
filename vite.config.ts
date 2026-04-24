import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import nodePolyfills from '@rolldown/plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure: (proxy, options) => {
          // Fallback to serve API files directly if no server is running
          proxy.on('error', (err, req, res) => {
            console.log('API proxy error, serving directly');
          });
        }
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Standard aliases for browser-compatible versions of Node modules
      "util": "util",
      "stream": "stream-browserify",
      "buffer": "buffer",
      "process": "process/browser",
    },
  },
  define: {
    'process.env': {},
    'global': 'globalThis',
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    rolldownOptions: {
      plugins: [
        nodePolyfills()
      ]
    }
  },
  build: {
    target: 'esnext',
    minify: 'oxc',
    cssMinify: true,
    sourcemap: false,
    rolldownOptions: {
      plugins: [
        nodePolyfills()
      ],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-router-dom/')) {
              return 'react-vendor';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            if (id.includes('mapbox-gl')) {
              return 'mapbox-vendor';
            }
            if (id.includes('react-hook-form') || id.includes('zod')) {
              return 'form-vendor';
            }
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            if (id.includes('@supabase/supabase-js')) {
              return 'supabase-vendor';
            }
          }
        }
      }
    },
    chunkSizeWarningLimit: 2000,
  }
}));




