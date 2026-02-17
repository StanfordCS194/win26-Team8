// Category Detection Service using Claude API (Anthropic)
// Intelligently detects item category from product name

import type { ItemCategory } from '../types/item';

const CATEGORIES: ItemCategory[] = ['Beauty', 'Clothes', 'Sports', 'Electronics', 'Home', 'Other'];

const CATEGORY_SYSTEM_PROMPT = `You are a product categorization assistant. Your task is to classify product names into one of these categories: Beauty, Clothes, Sports, Electronics, Home, or Other.

Categories:
- Beauty: Skincare products, makeup, cosmetics, perfumes, hair care, beauty tools, nail polish, serums, creams, lotions, etc.
- Clothes: Clothing items, shoes, accessories, jewelry, bags, fashion items
- Sports: Sports equipment, fitness gear, athletic wear, workout equipment, outdoor gear
- Electronics: Phones, computers, cameras, TVs, headphones, gadgets, tech devices
- Home: Furniture, home decor, appliances, kitchen items, bedding, lighting, storage
- Other: Anything that doesn't fit the above categories

Return ONLY the category name (one word: Beauty, Clothes, Sports, Electronics, Home, or Other). Do not include any explanation or additional text.`;

// Safe env access for both Expo (process.env) and browser/extension (no process)
function getApiKey(): string {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '';
  }
  return '';
}

// Fallback keyword-based detection (used when API is unavailable)
function detectCategoryFallback(itemName: string): ItemCategory {
  if (!itemName || itemName.trim().length === 0) {
    return 'Other';
  }

  const nameLower = itemName.toLowerCase().trim();

  // Beauty keywords
  const beautyKeywords = [
    'beauty', 'makeup', 'cosmetic', 'skincare', 'moisturizer', 'serum', 'cleanser', 'toner',
    'foundation', 'concealer', 'lipstick', 'mascara', 'eyeliner', 'eyeshadow', 'blush',
    'perfume', 'cologne', 'fragrance', 'hair', 'shampoo', 'conditioner', 'hairspray',
    'nail', 'polish', 'lotion', 'cream', 'sunscreen', 'spf', 'face', 'mask', 'exfoliant',
    'retinol', 'vitamin c', 'hyaluronic', 'squalane', 'niacinamide', 'cleansing', 'brush',
    'makeup brush', 'palette', 'primer', 'setting spray', 'beauty tool', 'skincare tool',
    'cosmetic', 'beauty product', 'self-care', 'grooming', 'facial', 'treatment'
  ];

  // Clothes keywords
  const clothesKeywords = [
    'shirt', 'pants', 'dress', 'shoes', 'sneakers', 'boots', 'jacket', 'coat',
    'sweater', 'hoodie', 'jeans', 'shorts', 'skirt', 'top', 'blouse', 'suit',
    'tie', 'hat', 'cap', 'gloves', 'scarf', 'socks', 'underwear', 'lingerie',
    'clothing', 'apparel', 'fashion', 'outfit', 'wardrobe', 'jewelry', 'watch',
    'ring', 'necklace', 'bracelet', 'earrings', 'bag', 'purse', 'handbag', 'backpack'
  ];

  // Sports keywords
  const sportsKeywords = [
    'sport', 'gym', 'workout', 'exercise', 'fitness', 'running', 'jogging',
    'basketball', 'football', 'soccer', 'tennis', 'golf', 'baseball', 'hockey',
    'swimming', 'cycling', 'bike', 'bicycle', 'yoga', 'pilates', 'weights',
    'dumbbell', 'treadmill', 'elliptical', 'equipment', 'racket', 'ball',
    'helmet', 'skateboard', 'surfboard', 'ski', 'snowboard', 'hiking', 'camping',
    'outdoor', 'athletic', 'trainer', 'sneaker', 'cleats'
  ];

  // Electronics keywords
  const electronicsKeywords = [
    'phone', 'iphone', 'android', 'smartphone', 'laptop', 'computer', 'pc', 'mac',
    'tablet', 'ipad', 'camera', 'tv', 'television', 'headphone', 'earbud', 'airpod',
    'speaker', 'microphone', 'keyboard', 'mouse', 'monitor', 'screen', 'display',
    'charger', 'cable', 'usb', 'battery', 'power', 'electronic', 'device', 'gadget',
    'smart', 'watch', 'fitbit', 'apple watch', 'nintendo', 'playstation', 'xbox',
    'console', 'game', 'drone', 'router', 'modem', 'printer', 'scanner'
  ];

  // Home keywords
  const homeKeywords = [
    'furniture', 'chair', 'table', 'desk', 'sofa', 'couch', 'bed', 'mattress',
    'pillow', 'blanket', 'sheet', 'lamp', 'light', 'lighting', 'decor', 'decoration',
    'art', 'painting', 'frame', 'mirror', 'rug', 'carpet', 'curtain', 'blinds',
    'plant', 'vase', 'candle', 'home', 'house', 'kitchen', 'appliance', 'refrigerator',
    'oven', 'microwave', 'dishwasher', 'washer', 'dryer', 'vacuum', 'cleaner',
    'tool', 'shelf', 'cabinet', 'drawer', 'storage', 'organizer'
  ];

  // Check each category (order matters - more specific first)
  const words = nameLower.split(/\s+/);
  
  for (const word of words) {
    if (beautyKeywords.some(keyword => word.includes(keyword) || keyword.includes(word))) {
      return 'Beauty';
    }
    if (clothesKeywords.some(keyword => word.includes(keyword) || keyword.includes(word))) {
      return 'Clothes';
    }
    if (sportsKeywords.some(keyword => word.includes(keyword) || keyword.includes(word))) {
      return 'Sports';
    }
    if (electronicsKeywords.some(keyword => word.includes(keyword) || keyword.includes(word))) {
      return 'Electronics';
    }
    if (homeKeywords.some(keyword => word.includes(keyword) || keyword.includes(word))) {
      return 'Home';
    }
  }

  // Check full string matches (for compound words/phrases)
  if (beautyKeywords.some(keyword => nameLower.includes(keyword))) {
    return 'Beauty';
  }
  if (clothesKeywords.some(keyword => nameLower.includes(keyword))) {
    return 'Clothes';
  }
  if (sportsKeywords.some(keyword => nameLower.includes(keyword))) {
    return 'Sports';
  }
  if (electronicsKeywords.some(keyword => nameLower.includes(keyword))) {
    return 'Electronics';
  }
  if (homeKeywords.some(keyword => nameLower.includes(keyword))) {
    return 'Home';
  }

  return 'Other';
}

/**
 * Detects the category of an item using AI (Claude API) with fallback to keyword matching
 * @param itemName The name of the item to categorize
 * @returns The detected category
 */
export async function detectCategory(itemName: string): Promise<ItemCategory> {
  if (!itemName || itemName.trim().length === 0) {
    return 'Other';
  }

  const apiKey = getApiKey();

  // If no API key, use fallback keyword matching
  if (!apiKey || apiKey === 'your_api_key_here' || apiKey.trim() === '') {
    console.log('No API key found, using keyword-based category detection');
    return detectCategoryFallback(itemName);
  }

  try {
    console.log('Using AI to detect category for:', itemName);

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
        max_tokens: 50,
        system: CATEGORY_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `What category does this product belong to: "${itemName}"?`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('AI category detection failed, using fallback:', response.status, errorText);
      return detectCategoryFallback(itemName);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text?.trim();

    if (!content) {
      console.warn('No content in AI response, using fallback');
      return detectCategoryFallback(itemName);
    }

    // Extract category from response (should be just the category name)
    const detectedCategory = content.split(/\s+/)[0].trim();
    
    // Validate it's a valid category
    if (CATEGORIES.includes(detectedCategory as ItemCategory)) {
      console.log('AI detected category:', detectedCategory);
      return detectedCategory as ItemCategory;
    } else {
      console.warn('AI returned invalid category:', detectedCategory, '- using fallback');
      return detectCategoryFallback(itemName);
    }
  } catch (error) {
    console.error('Error detecting category with AI:', error);
    console.log('Falling back to keyword-based detection');
    return detectCategoryFallback(itemName);
  }
}
