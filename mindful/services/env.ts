/**
 * Safe env access for Expo (Node/bundled) and browser/extension (no process).
 * In extension builds, esbuild can replace process.env.X at build time via define;
 * this helper avoids "process is not defined" when replacement doesn't run (e.g. content script).
 */
export function getExpoPublic(key: string): string {
  try {
    if (typeof process !== 'undefined' && process.env && key in process.env) {
      const v = process.env[key];
      return typeof v === 'string' ? v : '';
    }
  } catch {
    // process is not defined (e.g. content script in browser)
  }
  return '';
}
