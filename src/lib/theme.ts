export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';
/** Fired on <html> whenever the theme changes, so non-React layers can react. */
export const THEME_EVENT = 'themechange';

/**
 * The WebGL scene lives inside a React Three Fiber root, which does not inherit
 * React context from the surrounding app. Rather than bridge context across
 * that boundary, theme state is kept on the document element and broadcast as a
 * DOM event — readable from anywhere, React or not.
 */
export function getTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function setTheme(theme: Theme) {
  const root = document.documentElement;

  if (theme === 'dark') root.dataset.theme = 'dark';
  else delete root.dataset.theme;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private mode / blocked storage — the theme still applies for this visit.
  }

  // Keep the browser chrome in step with the page.
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#0c0b0a' : '#f2f0eb');

  root.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }));
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

/** Subscribe to theme changes. Returns an unsubscribe function. */
export function onThemeChange(fn: (theme: Theme) => void): () => void {
  const handler = (e: Event) => fn((e as CustomEvent<Theme>).detail);
  document.documentElement.addEventListener(THEME_EVENT, handler);
  return () => document.documentElement.removeEventListener(THEME_EVENT, handler);
}
