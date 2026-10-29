import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Served by s2-lite under /dashboard. Assets keep Vite's content hashes so a
// new build bypasses the one-hour cache lite puts on /dashboard/assets/*;
// index.html itself is served with no-cache.
export default defineConfig({
  base: '/dashboard/',
  plugins: [react(), tailwindcss()],
  // `pnpm dev` against a local s2-lite: `S2_LITE_URL=http://localhost:4243 pnpm dev`
  server: {
    proxy: process.env.S2_LITE_URL
      ? { '/v1': { target: process.env.S2_LITE_URL, changeOrigin: true } }
      : undefined,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
