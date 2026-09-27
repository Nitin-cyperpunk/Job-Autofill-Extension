import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/dist-debug/**',
      '**/node_modules/**',
      '**/.next/**',
      '**/next-env.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.webextensions },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      // ignoreRestSiblings: `const { omit, ...rest } = obj` is the idiomatic way to drop a key.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
  {
    files: ['apps/extension/src/**/*.tsx'],
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    // Privacy: candidate data must never reach a console. All logging goes through
    // utils/logger.ts (fixed messages, error names only); the opt-in field debugger
    // prints page field metadata, never values.
    files: ['apps/extension/src/**/*.{ts,tsx}', 'packages/*/src/**/*.ts'],
    ignores: [
      '**/*.test.{ts,tsx}',
      'apps/extension/src/utils/logger.ts',
      'apps/extension/src/field-detection/debug.ts',
    ],
    rules: { 'no-console': 'error' },
  },
  {
    files: ['**/*.config.{js,ts}', '**/scripts/**/*.{js,mjs}'],
    languageOptions: { globals: globals.node },
  },
  {
    // Fixture pages' scripts run in the browser.
    files: ['apps/extension/test-pages/**/*.js'],
    languageOptions: { globals: globals.browser },
  },
  prettier,
);
