
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { execSync } from 'child_process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    {
      name: 'supabase-types',
      buildStart() {
        if (mode === 'development') {
          console.log('Generating Supabase types...');
          try {
            execSync('npm run generate-types', { stdio: 'inherit' });
          } catch (error) {
            console.error('Failed to generate Supabase types:', error);
          }
        }
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

