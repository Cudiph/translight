import { defineConfig, loadEnv } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vitejs.dev/config/
export default defineConfig((command, mode, isSsrBuild, isPreview) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [svelte()],
    build: {
      watch: env.NODE_ENV === 'dev',
      sourcemap: env.NODE_ENV === 'dev',
      emptyOutDir: false,
      rollupOptions: {
        input: "src/content/content-script.ts",
        output: [
          {
            dir: "dist/chromium",
            entryFileNames: "[name].js",
            assetFileNames: "[name][extname]",
          },
          {
            dir: "dist/firefox",
            entryFileNames: "[name].js",
            assetFileNames: "[name][extname]",
          },
        ],
      },
    },
  };
});
