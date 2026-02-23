import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const require = createRequire(import.meta.url);
const vitePrerender = require("vite-plugin-prerender");
const JSDOMRenderer = require("@prerenderer/renderer-jsdom");
const devProxyTarget = process.env.VITE_DEV_PROXY_TARGET ?? "http://127.0.0.1:8000";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

export default defineConfig({
  plugins: [
    react(),
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
      "/api": {
        // Default to Django dev server.
        // Override with VITE_DEV_PROXY_TARGET when routing through nginx or another upstream.
        target: devProxyTarget,
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      "/api": {
        target: devProxyTarget,
        changeOrigin: true,
      },
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
