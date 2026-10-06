// Light/dark theme. Light is the default; the choice is saved per browser.

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'obsidian_theme';

// Runs in <head> before the page paints, so a saved dark theme doesn't flash light first
export const themeInitScript = `try{if(localStorage.getItem('${THEME_STORAGE_KEY}')==='dark')document.documentElement.dataset.theme='dark'}catch(e){}`;

// Saved choice; storage is the source of truth because React can reset <html> attributes in development
export function readStoredTheme(): Theme {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function applyTheme(theme: Theme) {
  if (theme === 'dark') document.documentElement.dataset.theme = 'dark';
  else delete document.documentElement.dataset.theme;
}

export function saveTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage blocked: the theme still applies until the page is reloaded
  }
}
