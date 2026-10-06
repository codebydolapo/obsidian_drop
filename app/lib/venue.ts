// Venue codes split one network's radar into smaller groups (e.g. "#stage1").
// Keep the rules in sync with parseVenue in socket/server.js.

export const MAX_VENUE_LENGTH = 16;

// Cleans text as the user types: lowercase letters, digits and dashes only
export const sanitizeVenueInput = (value: string) =>
  value.toLowerCase().replace(/^#/, '').replace(/[^a-z0-9-]/g, '').slice(0, MAX_VENUE_LENGTH);

export function parseVenue(value: string | null | undefined): string | null {
  if (!value) return null;
  const venue = value.trim().replace(/^#/, '').toLowerCase();
  return /^[a-z0-9-]{1,16}$/.test(venue) ? venue : null;
}

// Keeps ?venue= in the address bar so the link can be shared
export function setVenueInUrl(venue: string | null) {
  const url = new URL(window.location.href);
  if (venue) url.searchParams.set('venue', venue);
  else url.searchParams.delete('venue');
  window.history.replaceState(null, '', url);
}
