import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// componentTagger disabled to avoid dev runtime conflicts

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/', // Para cPanel, garante que os assets sejam carregados corretamente
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'supabase-vendor': ['@supabase/supabase-js']
        }
      }
    }
  },
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
    dedupe: ['react', 'react-dom'],
  },
}));
