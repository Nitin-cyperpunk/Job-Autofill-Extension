import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { crx } from '@crxjs/vite-plugin';
import { fileURLToPath, URL } from 'node:url';
import manifest from './manifest.config.ts';

export default defineConfig({
  plugins: [react(), tailwindcss(), crx({ manifest })],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    strictPort: true,
    cors: { origin: [/chrome-extension:\/\//] },
  },
  // Lets a build pick up the website's Buy Me a Coffee override (see src/utils/links.ts).
  // Only this one variable is exposed — nothing else from the environment.
  envPrefix: ['VITE_', 'NEXT_PUBLIC_BUYMEACOFFEE_URL'],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
