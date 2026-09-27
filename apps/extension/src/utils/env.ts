/**
 * True for `npm run dev` and `npm run build:debug` (vite --mode development).
 * Statically replaced at build time, so debug-only code is removed from release builds.
 */
export const DEBUG = import.meta.env.DEV || import.meta.env.MODE === 'development';
