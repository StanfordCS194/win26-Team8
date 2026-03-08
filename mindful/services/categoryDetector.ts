// Category Detection Service using Claude API (Anthropic)
// Intelligently detects item category from product name

import { getExpoPublic } from './env';
import type { ItemCategory } from '../types/item';

const CATEGORIES: ItemCategory[] = ['Beauty', 'Clothes', 'Accessories', 'Sports', 'Electronics', 'Home', 'Other'];

const CATEGORY_SYSTEM_PROMPT = `You are a product categorization assistant. Classify the given product name into exactly one category.

VALID CATEGORIES (use one of these exact words only):
- Beauty
- Clothes  
- Accessories
- Sports
- Electronics
- Home
- Other

DEFINITIONS AND EXAMPLES:

Beauty: Skincare, makeup, cosmetics, perfume/fragrance, hair care, nail products, serums, moisturizers, cleansers, face masks, beauty tools (e.g. makeup brushes), self-care grooming. NOT: jewelry, handbags, fashion items.
Examples: "La Mer moisturizer" → Beauty, "Dior lipstick" → Beauty, "Olaplex shampoo" → Beauty.

Clothes: Apparel and footwear only—shirts, pants, dresses, jackets, coats, sweaters, jeans, skirts, tops, blouses, suits, socks, underwear, shoes, sneakers, boots, sandals. NOT: jewelry, bags, watches, sports equipment.
Examples: "Nike running shoes" can be Clothes (everyday wear) or Sports (athletic); prefer Sports if the name suggests athletic use. "Levi's jeans" → Clothes.

Accessories: Jewelry (rings, necklaces, bracelets, earrings), handbags, purses, wallets, belts, fashion watches, sunglasses, scarves, hats, backpacks (non-sport), totes, clutches, hair accessories. Items that accessorize an outfit rather than being primary clothing or beauty.
Examples: "Louis Vuitton handbag" → Accessories, "Cartier watch" → Accessories, "Ray-Ban sunglasses" → Accessories.

Sports: Sports equipment, fitness gear, athletic apparel meant for sport (jerseys, cleats, gym wear), workout equipment, outdoor/activity gear, camping gear, bicycles, yoga mats.
Examples: "Peloton bike" → Sports, "Wilson basketball" → Sports, "Yoga mat" → Sports, "Running shoes" (when clearly athletic) → Sports.

Electronics: Phones, computers, tablets, cameras, TVs, headphones, earbuds, speakers, smartwatches (fitness/tech watches), gaming consoles, drones, chargers, cables, tech gadgets.
Examples: "iPhone 15" → Electronics, "Sony headphones" → Electronics, "Apple Watch" → Electronics, "Nintendo Switch" → Electronics.

Home: Furniture, home decor, bedding, kitchen items, appliances, lighting, rugs, storage, plants, candles, home organization.
Examples: "West Elm sofa" → Home, "KitchenAid mixer" → Home, "Throw pillow" → Home.

Other: Anything that does not clearly fit the above. When in doubt between two categories, choose the more specific one; use Other only when the product is ambiguous or fits none of the others.

OUTPUT: Reply with exactly one word from the list above. No period, no explanation, no other text.`;


function getApiKey(): string {
  return getExpoPublic('EXPO_PUBLIC_ANTHROPIC_API_KEY');
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

  // Accessories keywords (check before Clothes so jewelry/bags don't match clothes)
  const accessoriesKeywords = [
    'jewelry', 'jewellery', 'watch', 'ring', 'necklace', 'bracelet', 'earring',
    'purse', 'handbag', 'bag', 'clutch', 'wallet', 'belt', 'sunglasses', 'tote',
    'backpack', 'crossbody', 'satchel', 'scarf', 'hat', 'cap', 'hair clip',
    'brooch', 'pendant', 'anklet', 'choker', 'accessory', 'accessories'
  ];

  // Clothes keywords (apparel only, no jewelry/bags)
  const clothesKeywords = [
    'shirt', 'pants', 'dress', 'shoes', 'sneakers', 'boots', 'jacket', 'coat',
    'sweater', 'hoodie', 'jeans', 'shorts', 'skirt', 'top', 'blouse', 'suit',
    'tie', 'gloves', 'socks', 'underwear', 'lingerie', 'clothing', 'apparel',
    'fashion', 'outfit', 'wardrobe', 'blazer', 'cardigan', 'jumper', 'leggings'
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
    'smart', 'smartwatch', 'smart watch', 'fitbit', 'apple watch', 'galaxy watch', 'nintendo', 'playstation', 'xbox',
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

  // Full string first so "apple watch" / "smartwatch" match Electronics before "watch" -> Accessories
  if (electronicsKeywords.some(keyword => nameLower.includes(keyword))) {
    return 'Electronics';
  }
  if (beautyKeywords.some(keyword => nameLower.includes(keyword))) {
    return 'Beauty';
  }
  if (accessoriesKeywords.some(keyword => nameLower.includes(keyword))) {
    return 'Accessories';
  }
  if (clothesKeywords.some(keyword => nameLower.includes(keyword))) {
    return 'Clothes';
  }
  if (sportsKeywords.some(keyword => nameLower.includes(keyword))) {
    return 'Sports';
  }
  if (homeKeywords.some(keyword => nameLower.includes(keyword))) {
    return 'Home';
  }

  // Then check by word (order: Accessories before Clothes for jewelry/bags)
  const words = nameLower.split(/\s+/);
  for (const word of words) {
    if (beautyKeywords.some(keyword => word.includes(keyword) || keyword.includes(word))) {
      return 'Beauty';
    }
    if (accessoriesKeywords.some(keyword => word.includes(keyword) || keyword.includes(word))) {
      return 'Accessories';
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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 50,
        system: CATEGORY_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Product name: "${itemName.trim()}"\n\nReply with exactly one word: Beauty, Clothes, Accessories, Sports, Electronics, Home, or Other.`,
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

    // Parse category: find any valid category name in the response (whole-word match to avoid "Other" in "another")
    const contentLower = content.trim().toLowerCase();
    let detectedCategory: string | null = null;
    let earliestIndex = Infinity;
    for (const cat of CATEGORIES) {
      const regex = new RegExp(`\\b${cat.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
      const match = contentLower.match(regex);
      if (match && match.index !== undefined && match.index < earliestIndex) {
        earliestIndex = match.index;
        detectedCategory = cat;
      }
    }
    if (detectedCategory) {
      console.log('AI detected category:', detectedCategory);
      return detectedCategory as ItemCategory;
    }
    // Fallback: first word with trailing punctuation stripped
    const firstWord = content.split(/\s+/)[0].replace(/[.,;:!?]+$/, '').trim();
    if (CATEGORIES.includes(firstWord as ItemCategory)) {
      console.log('AI detected category (first word):', firstWord);
      return firstWord as ItemCategory;
    }
    console.warn('AI returned invalid category:', content.slice(0, 80), '- using fallback');
    return detectCategoryFallback(itemName);
  } catch (error) {
    console.error('Error detecting category with AI:', error);
    console.log('Falling back to keyword-based detection');
    return detectCategoryFallback(itemName);
  }
}
