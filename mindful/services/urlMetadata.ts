// Service to fetch product metadata from a URL
// Tries Microlink scraping first, falls back to AI inference from URL structure

export interface UrlMetadata {
  title: string | null;
}

interface MicrolinkResponse {
  status: string;
  data: {
    title?: string;
  };
}

// Safe env access for both Expo (process.env) and browser/extension (no process)
function getApiKey(): string {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '';
  }
  return '';
}

/**
 * Use Claude to infer the product name from the URL structure.
 * URLs often contain product names in their path segments, query params, etc.
 * e.g. amazon.com/dp/Sony-WH-1000XM5-Headphones/B09XS7JWHH → "Sony WH-1000XM5 Headphones"
 */
async function inferProductNameFromUrl(url: string): Promise<string | null> {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === 'your_api_key_here' || apiKey.trim() === '') {
    console.warn('No API key available for AI URL inference');
    return null;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-latest',
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
      console.error('AI inference API error:', response.status);
      return null;
    }

    const data = await response.json();
    const name = data.content?.[0]?.text?.trim();

    if (!name || name === 'Unknown Product') {
      return null;
    }

    console.log('AI inferred product name from URL:', name);
    return name;
  } catch (error) {
    console.error('Error in AI URL inference:', error);
    return null;
  }
}

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
  // Step 1: Try Microlink scraping
  try {
    const apiUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(apiUrl, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const data: MicrolinkResponse = await response.json();

    if (data.status !== 'success') {
      throw new Error('API returned non-success status');
    }

    const title = data.data.title || null;

    if (title) {
      return { title };
    }

    // Scraping succeeded but returned no title — fall through to AI
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Microlink request timed out');
    } else {
      console.error('Microlink scraping failed:', error);
    }
    // Fall through to AI inference
  }

  // Step 2: AI fallback — infer product name from URL
  console.log('Falling back to AI inference for URL:', url);
  const inferredName = await inferProductNameFromUrl(url);
  return { title: inferredName };
}
