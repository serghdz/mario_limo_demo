import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { fileURLToPath, URL } from 'node:url';

// A static entry using the same page components and assets as the local site.
// GitHub Pages cannot run the separate Vinext/Cloudflare server build.
export default defineConfig({
  base: '/mario_limo_demo/',
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  css: { postcss: { plugins: [tailwindcss()] } },
  build: { outDir: 'dist-pages', emptyOutDir: true },
});
