import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { VitePWA } from 'vite-plugin-pwa';

const buildId =
  (process.env as any).VERCEL_GIT_COMMIT_SHA?.substring(0, 7) ||
  (process.env as any).VERCEL_DEPLOYMENT_ID ||
  Date.now().toString();

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        manifest: {
          name: 'Holisticare',
          short_name: 'Holisticare',
          description: '',
          theme_color: '#ffffff',
          icons: [
            {
              src: '/icons/ic_launcher192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/icons/ic_launcher.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
      workbox: {
        // Disable precaching to prevent install hangs
        globPatterns: [],
        // No runtime caching - always fetch fresh from network
        runtimeCaching: [],
        // Critical: These ensure immediate activation
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Add unique cache ID to ensure service worker changes on each build
        cacheId: `holisticare-${buildId}`,
        // Remove navigateFallback since we're not precaching
        // This prevents the "non-precached-url" error
        navigateFallback: undefined,
        navigateFallbackDenylist: undefined,
      },

      devOptions: {
        enabled: false,
      },
      }),      
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  // بارگذاری .env از ریشه پروژه (کنار package.json)
  envDir: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
