'use client';

import { useLayoutEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { applyTheme, readStoredTheme, saveTheme, Theme } from '../lib/theme';

export function ThemeToggle() {
  // Rendered only after the page mounts, so reading storage here is safe
  const [theme, setTheme] = useState<Theme>(readStoredTheme);
  const next: Theme = theme === 'dark' ? 'light' : 'dark';

  // Keeps <html data-theme> in sync. The inline script in layout.tsx handles first paint;
  // this re-applies it after React's development remount clears the attribute.
  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggle = () => {
    saveTheme(next);
    setTheme(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className="rounded-full p-1.5 text-muted transition hover:bg-raised hover:text-ink"
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
