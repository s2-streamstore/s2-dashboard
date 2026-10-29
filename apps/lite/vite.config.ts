import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Served by s2-lite under /dashboard. Assets keep Vite's content hashes so a
// new build bypasses the one-hour cache lite puts on /dashboard/assets/*;
// index.html itself is served with no-cache.
export default defineConfig(({ mode }) => {
  // `pnpm dev` against a local s2-lite: `S2_LITE_URL=http://localhost:4243 pnpm dev`
  const liteUrl = loadEnv(mode, '.', 'S2_LITE_URL').S2_LITE_URL;
  return {
    base: '/dashboard/',
    plugins: [react(), tailwindcss()],
    server: {
      proxy: liteUrl
        ? {
            '/v1': { target: liteUrl, changeOrigin: true },
            '/dashboard/config.json': { target: liteUrl, changeOrigin: true },
          }
        : undefined,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});
