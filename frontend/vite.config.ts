import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const require = createRequire(import.meta.url);
const vitePrerender = require("vite-plugin-prerender");
const JSDOMRenderer = require("@prerenderer/renderer-jsdom");

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
