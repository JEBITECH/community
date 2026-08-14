import svgr from "vite-plugin-svgr";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [
    svgr({
      svgrOptions: {
        exportType: "named",
        ref: true,
        svgo: true, // Enable SVG optimization
        titleProp: true,
      },
      include: "**/*.svg",
    }),
    react({
      // Enable React Fast Refresh
      fastRefresh: true,
    }),
    tsconfigPaths(),
  ],

  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-icons',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      'lucide-react',
      'clsx',
      'tailwind-merge',
      'class-variance-authority',
    ],
    exclude: ['@replit/vite-plugin-cartographer', '@replit/vite-plugin-runtime-error-modal']
  },
  esbuild: {
    // Enable tree shaking and minification
    treeShaking: true,
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@platform": path.resolve(__dirname, "../server/platform"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    allowedHosts: ['localhost', '127.0.0.1'],

    watch: {
      usePolling: true,
      interval: 1000, // Reduce polling frequency
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false,
      },
    },
    // Enable HTTP/2 and compression
    middlewareMode: false,
    hmr: {
      overlay: false, // Disable error overlay for better performance
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../dist/client"),
    // outputs to community/dist/client, kept separate from the main app's dist/client
    emptyOutDir: true,
    // Build optimizations
    minify: 'esbuild',
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-icons',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
          ],
          'utils-vendor': ['clsx', 'tailwind-merge', 'class-variance-authority'],
        },
      },
    },
  },
  base: "./",
});
