import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
      process: "process/browser",
      stream: "stream-browserify",
      zlib: "browserify-zlib",
      util: "util",
    },
  },
  define: {
    'process.env': {},
    'global': 'window', // Fix for simple-peer
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for large libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'mapbox-vendor': ['mapbox-gl'],
          'form-vendor': ['react-hook-form', 'zod'],
          'date-vendor': ['date-fns'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'webrtc-vendor': ['simple-peer']
        }
      }
    },
    // Increase chunk size warning limit to 1000kb to reduce warnings
    chunkSizeWarningLimit: 1000,
  }
}));
