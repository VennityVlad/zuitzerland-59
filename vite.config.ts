
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: '/', // Root-relative paths for better compatibility
  define: {
    // Add environment variables
    'process.env.NODE_ENV': JSON.stringify(mode),
    'process.env.IS_LOVABLE_PREVIEW': JSON.stringify(
      process.env.LOVABLE_PREVIEW === 'true' || 
      process.env.NODE_ENV === 'development'
    ),
  },
}));
