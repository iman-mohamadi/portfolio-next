import { useEffect, useState } from 'react';
import { getTheme, onThemeChange, toggleTheme, type Theme } from '../lib/theme';

/** React view of the document-level theme, plus a toggle. */
export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setThemeState] = useState<Theme>(getTheme);

  useEffect(() => onThemeChange(setThemeState), []);

  return { theme, toggle: () => setThemeState(toggleTheme()) };
}
