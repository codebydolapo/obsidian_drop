'use client';

import { useLayoutEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { applyTheme, readStoredTheme, saveTheme } from '../lib/theme';

// Server-rendered on the landing page, where the saved theme isn't known yet. So the
// icon is picked by CSS from <html data-theme> (set by the inline script in layout.tsx)
// instead of React state, and the markup is identical on server and client.
export function ThemeToggle() {
  // Re-applies the saved theme after React's development remount clears the attribute
  useLayoutEffect(() => {
    applyTheme(readStoredTheme());
  }, []);

  const toggle = () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    saveTheme(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className="rounded-full p-1.5 text-muted transition hover:bg-raised hover:text-ink"
    >
      <Moon className="h-4 w-4 dark:hidden" />
      <Sun className="hidden h-4 w-4 dark:block" />
    </button>
  );
}
