/**
 * Pre-resolved env vars that esbuild can replace at build time via `define`.
 * Direct `process.env.X` references get substituted by esbuild; dynamic
 * key lookups like `process.env[key]` do NOT get replaced.
 */
const ENV_CACHE: Record<string, string> = {};
try {
  ENV_CACHE['EXPO_PUBLIC_ANTHROPIC_API_KEY'] = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
  ENV_CACHE['EXPO_PUBLIC_OPENAI_API_KEY'] = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
  ENV_CACHE['EXPO_PUBLIC_RESEND_API_KEY'] = process.env.EXPO_PUBLIC_RESEND_API_KEY ?? '';
  ENV_CACHE['EXPO_PUBLIC_POSTHOG_KEY'] = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '';
} catch {
  // process is not defined (e.g. content script in browser before esbuild runs)
}

/**
 * Safe env access for Expo (Node/bundled) and browser/extension (no process).
 * Uses pre-resolved cache so esbuild can inline values at build time.
 */
export function getExpoPublic(key: string): string {
  if (key in ENV_CACHE) {
    return ENV_CACHE[key];
  }
  try {
    if (typeof process !== 'undefined' && process.env && key in process.env) {
      const v = process.env[key];
      return typeof v === 'string' ? v : '';
    }
  } catch {
    // process is not defined
  }
  return '';
}
