import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte({ configFile: '../svelte.config.js' })],
  root: 'src/',
  publicDir: '../public',
  build: {
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/content/content-script.ts',
      output: [
        {
          dir: 'dist/chromium',
          entryFileNames: '[name].js',
          assetFileNames: '[name][extname]',
        },
        {
          dir: 'dist/firefox',
          entryFileNames: '[name].js',
          assetFileNames: '[name][extname]',
        },
      ],
    },
  },
});
