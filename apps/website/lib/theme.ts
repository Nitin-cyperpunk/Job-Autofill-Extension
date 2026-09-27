import { THEME_STORAGE_KEY } from './site';

/**
 * Inlined in <head> so a saved theme applies before first paint (no flash of the wrong
 * theme). Without a saved choice the CSS follows prefers-color-scheme.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}})();`;
