import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

/** Serves the detection test pages (npm run test-pages). React resolves from node_modules. */
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  server: { port: 5180 },
});
