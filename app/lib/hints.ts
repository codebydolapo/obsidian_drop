// Remembers which one-time hints this browser has already seen.
// Storage can be unavailable (private mode, blocked site data), so failures
// just mean the hint shows again.

export type Hint = 'onboarding' | 'close_chat';

const key = (hint: Hint) => `obsidian_hint_${hint}`;

export function hasSeenHint(hint: Hint): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(key(hint)) === '1';
  } catch {
    return false;
  }
}

export function markHintSeen(hint: Hint) {
  try {
    localStorage.setItem(key(hint), '1');
  } catch {
    // Ignore: the hint will show again next visit
  }
}
