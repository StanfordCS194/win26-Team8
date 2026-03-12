// Question Generation Service using Claude API (Anthropic)
// Generates contextual reflection questions based on the product being added

import { getExpoPublic } from './env';

export interface GeneratedQuestion {
  id: string;
  question: string;
  placeholder: string;
  /** Whether the upper end (5) or lower end (1) of the scale is more mindful */
  mindfulEnd: 'high' | 'low';
}

// For Expo, use EXPO_PUBLIC_ prefix for environment variables
// Note: We check the API key at runtime in the function to ensure it's loaded from .env

const DEFAULT_QUESTIONS: GeneratedQuestion[] = [
  {
    id: 'urgency',
    question: 'How urgent is your need for this item?',
    placeholder: 'Not urgent/Very urgent',
    mindfulEnd: 'high',
  },
  {
    id: 'alternatives',
    question: 'How satisfied would you be with alternatives (borrowing, renting, using what you have)?',
    placeholder: 'Not satisfied/Very satisfied',
    mindfulEnd: 'low',
  },
  {
    id: 'value',
    question: 'How much value will this purchase add to your life compared to its cost?',
    placeholder: 'Low value/High value',
    mindfulEnd: 'high',
  },
];

const SYSTEM_PROMPT = `You are a mindful consumption assistant. Generate exactly 3 reflection questions for someone considering buying a specific product. Questions must be HIGHLY SPECIFIC to the item, its category, and (when provided) how it fits with items they already own.

SCALE: Each question must be answerable on a 1–5 scale:
- 1 = Strongly Disagree / Not at all / Very Low
- 5 = Strongly Agree / Completely / Very High

CATEGORY-SPECIFIC ALTERNATIVES (use these when relevant):
- Beauty: drugstore dupes, samples/travel sizes, multi-use products they already have, DIY or at-home alternatives, borrowing from friends, using up what they have first.
- Clothes: similar pieces already in their wardrobe, rental (e.g. Rent the Runway), tailoring or styling existing pieces, secondhand or consignment, whether it fits their existing capsule or style.
- Accessories: pieces they already own that could serve the same purpose, borrowing, one versatile item vs. many.
- Sports: gear they already own, renting at the venue, borrowing from a friend, a lower-tier or used option to try the sport first.
- Electronics: their current device or a family shared one, refurbished or older model, repairing what they have, borrowing for a short project.
- Home: repurposing or rearranging what they have, borrowing, secondhand, whether it duplicates something they already own.
- Other: infer sensible alternatives (borrowing, renting, cheaper alternative, using what they have).

FITTING WITH EXISTING ITEMS (when the prompt says the user has other items in their list):
- Include one question about how this product fits with what they already have (overlap, redundancy, or complement).
- In the question text, refer only to "items you already have", "what you already own", or "your current items". Do NOT list, name, or mention any specific items—that could be wrong or sound like hallucination.

RULES:
1. Include the actual product name in every question. Never use "this item" or "it".
2. For alternatives, name CONCRETE category-specific options (e.g. "drugstore dupe or a sample" for beauty, "renting or borrowing a racket" for sports).
3. When the prompt indicates the user has other items, include one question about how this product fits with "items you already have" (or similar phrasing)—never name or list specific items.
4. Each question must cover a DISTINCT dimension: e.g. urgency, category-specific alternatives, value vs. cost, fit with existing items, emotional vs. practical need.
5. Be non-judgmental and thought-provoking. Phrase so it can be rated 1–5.

OUTPUT: A JSON array of exactly 3 objects. Each object must have:
- "id": short identifier (e.g. "urgency", "alternatives", "value", "fit_with_owned")
- "question": the reflection question (include product name; be specific to category and/or existing items)
- "placeholder": scale endpoints, e.g. "Not at all/Very much" or "Low/High"
- "mindfulEnd": either "high" or "low". Output "high" if the upper end of the scale (5) reflects more mindful shopping behavior, and "low" if the lower end (1) is more mindful

Only respond with the JSON array. No other text.`;

function getApiKey(): string {
  return getExpoPublic('EXPO_PUBLIC_ANTHROPIC_API_KEY');
}

export type GenerateQuestionsOptions = {
  category?: string;
  existingItemNames?: string[];
};

export type GenerateQuestionsResult = {
  questions: GeneratedQuestion[];
  usedFallback?: boolean;
};

export async function generateQuestions(
  productName: string,
  options?: GenerateQuestionsOptions
): Promise<GenerateQuestionsResult> {
  const { category, existingItemNames } = options ?? {};
  const apiKey = getApiKey();

  if (apiKey.length > 0) {
    console.log('   EXPO_PUBLIC_ANTHROPIC_API_KEY exists: true');
  }
  console.log('   API key length:', apiKey.length);
  if (apiKey) {
    console.log('   API key preview:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4));
  }

  if (!apiKey || apiKey === 'your_api_key_here' || apiKey.trim() === '') {
    console.warn('Anthropic API key not configured. Using default questions.');
    console.warn('   Please:');
    console.warn('   1. Create a .env file in the mindful/ directory (same folder as package.json)');
    console.warn('   2. Add: EXPO_PUBLIC_ANTHROPIC_API_KEY=your_actual_key_here');
    console.warn('   3. Restart your Expo dev server (stop with Ctrl+C, then run npm start again)');
    return { questions: DEFAULT_QUESTIONS, usedFallback: true };
  }

  console.log('API key found, generating questions for:', productName, category ? `(category: ${category})` : '');

  const existingItemsBlob =
    existingItemNames && existingItemNames.length > 0
      ? `\n\nThe user has other items in their list. Include at least one question about how "${productName}" fits with items they already have (overlap, redundancy, or complement). In that question, say only "items you already have" or "what you already own"—do NOT list or name any specific items.`
      : '';

  const userContent = `Generate 3 reflection questions for someone considering buying: "${productName}".${category ? `\nCategory: ${category}. Use concrete, category-specific alternatives (see system prompt).` : ''}${existingItemsBlob}

If the input looks like a URL or site name, infer the kind of product and generate questions accordingly.
Return ONLY the JSON array of 3 objects with "id", "question", "placeholder", and "mindfulEnd". No other text.`;

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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      if (response.status === 529) {
        console.warn('Anthropic API overloaded (529). Falling back to default questions.');
        return { questions: DEFAULT_QUESTIONS, usedFallback: true };
      }
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      console.error('No content in API response');
      throw new Error('No content in API response');
    }

    console.log('API Response received, parsing...');

    // Parse the JSON response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('Could not find JSON array in response:', content.substring(0, 200));
      throw new Error('Could not parse JSON from response');
    }

    const questions: GeneratedQuestion[] = JSON.parse(jsonMatch[0]);

    // Validate the response structure
    if (!Array.isArray(questions) || questions.length !== 3) {
      console.error('Invalid response structure - expected 3 questions, got:', questions.length);
      throw new Error('Invalid response structure');
    }

    for (const q of questions) {
      if (!q.id || !q.question || !q.placeholder || (q.mindfulEnd !== 'high' && q.mindfulEnd !== 'low')) {
        console.error('Invalid question structure:', q);
        throw new Error('Invalid question structure');
      }
    }

    console.log('Successfully generated', questions.length, 'questions for', productName);
    return { questions };
  } catch (error) {
    console.error('Error generating questions:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }
    // Fall back to default questions on error (e.g. 529 overloaded, network error)
    console.warn('Falling back to default questions');
    return { questions: DEFAULT_QUESTIONS, usedFallback: true };
  }
}

export { DEFAULT_QUESTIONS };
