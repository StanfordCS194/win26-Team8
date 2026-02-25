/**
 * Normalize a product URL for duplicate detection (same host + path, no hash, optional query).
 */
export function normalizeProductUrl(url: string): string {
  if (!url || !url.trim()) return '';
  try {
    const u = new URL(url.trim());
    const path = u.pathname.replace(/\/+$/, '') || '/';
    const host = u.hostname.toLowerCase().replace(/^www\./, '');
    return `${u.protocol}//${host}${path}`;
  } catch {
    return url.trim();
  }
}

/**
 * Returns true if the given URL matches any of the stored URLs (after normalization).
 * Used for duplicate-URL check and "already in cart" banner.
 */
export function isUrlInStoredUrls(url: string, storedUrls: string[]): boolean {
  if (!url || !storedUrls?.length) return false;
  const normalized = normalizeProductUrl(url);
  return storedUrls.some(
    (stored) => stored && normalizeProductUrl(stored) === normalized
  );
}
