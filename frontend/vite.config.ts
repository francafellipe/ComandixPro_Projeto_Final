import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0', 
    port: 5173,
    proxy: mode === 'development' ? {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    } : undefined
  },
  build: {
    sourcemap: false, 
    minify: "esbuild", 
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: undefined, 
      },
    },
  },
}));
