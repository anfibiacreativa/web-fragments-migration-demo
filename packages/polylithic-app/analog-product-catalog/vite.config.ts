/// <reference types="vitest" />

import { defineConfig } from 'vite';
import analog from '@analogjs/platform';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  build: {
    target: ['es2020'],
    assetsDir: '_fragment/analog/assets',
  },
  resolve: {
    mainFields: ['module'],
  },
  plugins: [analog({ nitro: {
    publicAssets: [
      {
        baseURL: "_fragment/analog/assets",
      },
    ],
  },
  vite: { experimental: { supportAnalogFormat: true } } })],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['**/*.spec.ts'],
    reporters: ['default'],
  },
  define: {
    'import.meta.vitest': mode !== 'production',
  },
}));
