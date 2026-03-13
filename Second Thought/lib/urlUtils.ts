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
