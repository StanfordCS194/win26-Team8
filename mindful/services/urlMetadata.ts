// Service to fetch product metadata (title, image) from a URL

export interface UrlMetadata {
  title: string | null;
  image: string | null;
}

interface MicrolinkResponse {
  status: string;
  data: {
    title?: string;
    image?: {
      url: string;
    };
  };
}

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
  try {
    const apiUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

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

    return {
      title: data.data.title || null,
      image: data.data.image?.url || null,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Request timed out');
    } else {
      console.error('Error fetching URL metadata:', error);
    }
    return { title: null, image: null };
  }
}
