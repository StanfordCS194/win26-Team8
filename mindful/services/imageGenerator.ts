// Service to generate product images using OpenAI DALL-E 3 when scraping fails

import { getExpoPublic } from './env';

export async function generateProductImage(
  productName: string,
  productDescription?: string
): Promise<string | null> {
  const apiKey = getExpoPublic('EXPO_PUBLIC_OPENAI_API_KEY');

  if (!apiKey || apiKey === 'your_api_key_here' || apiKey.trim() === '') {
    console.warn('OpenAI API key not configured. Cannot generate image.');
    return null;
  }

  try {
    console.log('🎨 Generating image for:', productName);

    const prompt = `A clean, simple product photo of ${productName}${
      productDescription ? `: ${productDescription}` : ''
    }. White background, centered, professional product photography style.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error('No image URL in OpenAI response');
    }

    console.log('✅ Image generated successfully');
    return imageUrl;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Image generation timed out');
    } else {
      console.error('Error generating image:', error);
    }
    return null;
  }
}
