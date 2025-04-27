
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Get the base URL from environment or use dynamic logic for preview
  const isPreview = process.env.VITE_PREVIEW === 'true';
  const baseUrl = isPreview ? '/preview/' : '/';

  console.log('Vite config:', { mode, isPreview, baseUrl });

  return {
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
    base: baseUrl,
    build: {
      // Ensure clean URLs in preview
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          // Add cache busting for assets
          entryFileNames: `assets/[name]-[hash].js`,
          chunkFileNames: `assets/[name]-[hash].js`,
          assetFileNames: `assets/[name]-[hash].[ext]`
        }
      }
    }
  };
});

