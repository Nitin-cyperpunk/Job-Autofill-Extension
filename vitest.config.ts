import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./apps/extension/src', import.meta.url)) },
  },
  test: {
    include: ['{apps,packages}/**/src/**/*.test.{ts,tsx}'],
    // DOM tests opt in per file with `// @vitest-environment jsdom`.
    environment: 'node',
  },
});
