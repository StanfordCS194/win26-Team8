/**
 * Date helpers for unlock / wait_until_date display.
 * Pure functions, no env or Supabase dependency (reusable in app and extension).
 */

/**
 * Days from start of today until the given date (ISO string).
 * Returns 0 if the date is today or in the past.
 */
export function daysRemainingUntil(dateStr: string): number {
  if (!dateStr || !dateStr.trim()) return 0;
  try {
    const d = new Date(dateStr.trim());
    if (Number.isNaN(d.getTime())) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    const diffMs = d.getTime() - today.getTime();
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    return Math.max(0, days);
  } catch {
    return 0;
  }
}

/**
 * Format wait_until_date for display (e.g. "Jan 15, 2026").
 */
export function formatUnlockDate(dateStr: string): string {
  if (!dateStr || !dateStr.trim()) return '—';
  try {
    const d = new Date(dateStr.trim());
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}
