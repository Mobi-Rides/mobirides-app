import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { nodeModulesPolyfillPlugin } from 'esbuild-plugins-node-modules-polyfill';
import rollupNodePolyfills from 'rollup-plugin-node-polyfills';

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
    esbuildOptions: {
      plugins: [
        nodeModulesPolyfillPlugin()
      ]
    }
  },
  build: {
    rollupOptions: {
      plugins: [
        rollupNodePolyfills()
      ],
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'mapbox-vendor': ['mapbox-gl'],
          'form-vendor': ['react-hook-form', 'zod'],
          'date-vendor': ['date-fns'],
          'supabase-vendor': ['@supabase/supabase-js']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
}));

