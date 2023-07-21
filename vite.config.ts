import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte({ configFile: "../svelte.config.js" })],
  root: "src/",
  publicDir: "../public",
  build: {
    emptyOutDir: true,
    rollupOptions: {
      input: [
        "src/background/main.html",
        "src/popup/main.html",
        "src/options/main.html",
      ],
      output: [
        { dir: "dist/chromium", entryFileNames: "[name].js" },
        { dir: "dist/firefox", entryFileNames: "[name].js"},
      ],
    },
  },
});
