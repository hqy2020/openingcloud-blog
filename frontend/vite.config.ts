import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const require = createRequire(import.meta.url);
const vitePrerender = require("vite-plugin-prerender");
const JSDOMRenderer = require("@prerenderer/renderer-jsdom");
const devProxyTarget = process.env.VITE_DEV_PROXY_TARGET ?? "http://127.0.0.1:8001";

// Bypass system HTTP proxy for local dev proxy
const directAgent = new http.Agent();

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

const proxyOptions = {
  target: devProxyTarget,
  changeOrigin: true,
  agent: directAgent,
};

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      devOptions: { enabled: false },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/media/"),
            handler: "CacheFirst",
            options: {
              cacheName: "media-cache",
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 365,
                purgeOnQuotaError: true,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/raw\.githubusercontent\.com\/hqy2020\/obsidian-images\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "github-images-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 90,
                purgeOnQuotaError: true,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/assets/"),
            handler: "CacheFirst",
            options: {
              cacheName: "assets-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
    vitePrerender({
      staticDir: path.join(currentDir, "dist"),
      routes: ["/", "/tech", "/learning", "/life"],
      renderer: new JSDOMRenderer({
        renderAfterTime: 250,
      }),
    }),
  ],
  server: {
    proxy: {
      "/api": proxyOptions,
      "/admin": proxyOptions,
      "/static": proxyOptions,
    },
  },
  preview: {
    proxy: {
      "/api": proxyOptions,
      "/admin": proxyOptions,
      "/static": proxyOptions,
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("three") || id.includes("@react-three")) {
            return "three-stack";
          }
          if (id.includes("echarts")) {
            return "echarts-stack";
          }
          if (id.includes("react-force-graph")) {
            return "graph-stack";
          }
          return undefined;
        },
      },
    },
  },
});
