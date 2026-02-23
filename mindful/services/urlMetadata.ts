// Service to fetch product metadata from a URL
// Tries Microlink scraping and AI inference in parallel.
// Uses scrape result if good, otherwise falls back to AI inference from URL.

export interface UrlMetadata {
  title: string | null;
}

interface MicrolinkResponse {
  status: string;
  data: {
    title?: string;
  };
}

// Titles returned when a site blocks the scraper with a CAPTCHA or bot check
const BOT_CHECK_PATTERNS = [
  /robot or human/i,
  /are you a human/i,
  /captcha/i,
  /verify you're human/i,
  /access denied/i,
  /just a moment/i,        // Cloudflare
  /attention required/i,   // Cloudflare
  /please verify/i,
  /security check/i,
  /blocked/i,
  /pardon our interruption/i,
];

function isBotCheckTitle(title: string): boolean {
  return BOT_CHECK_PATTERNS.some((pattern) => pattern.test(title));
}

/**
 * Try scraping via Microlink. Returns the title or null.
 */
async function scrapeTitle(url: string): Promise<string | null> {
  try {
    const apiUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data: MicrolinkResponse = await response.json();
    if (data.status !== 'success') return null;

    const title = data.data.title || null;
    if (title && !isBotCheckTitle(title)) {
      console.log('Microlink scraped title:', title);
      return title;
    }
    return null;
  } catch (error) {
    console.error('Microlink scraping failed:', error);
    return null;
  }
}

/**
 * Use Claude to infer the product name from the URL structure.
 * URLs often contain product names in their path segments, query params, etc.
 */
async function inferProductNameFromUrl(url: string): Promise<string | null> {
  // Expo replaces process.env.EXPO_PUBLIC_* at build time
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '';
  if (!apiKey || apiKey === 'your_api_key_here') {
    console.warn('No API key available for AI URL inference');
    return null;
  }

  try {
    console.log('AI inference: calling Claude for URL:', url);
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: `Extract the product name from this URL. Return ONLY the product name, nothing else. If you cannot determine a product name, return "Unknown Product".

URL: ${url}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI inference API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const name = data.content?.[0]?.text?.trim();

    if (!name || name === 'Unknown Product') {
      console.log('AI could not determine product name');
      return null;
    }

    console.log('AI inferred product name:', name);
    return name;
  } catch (error) {
    console.error('Error in AI URL inference:', error);
    return null;
  }
}

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
  // Run both scraping and AI inference in parallel
  const [scrapedTitle, aiTitle] = await Promise.all([
    scrapeTitle(url),
    inferProductNameFromUrl(url),
  ]);

  // Prefer scraped title (more accurate), fall back to AI
  const title = scrapedTitle || aiTitle;
  console.log('Final result — scraped:', scrapedTitle, '| AI:', aiTitle, '| using:', title);
  return { title };
}
