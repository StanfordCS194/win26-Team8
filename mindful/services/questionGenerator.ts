// Question Generation Service using Claude API (Anthropic)
// Generates contextual reflection questions based on the product being added

import { getExpoPublic } from './env';

export interface GeneratedQuestion {
  id: string;
  question: string;
  placeholder: string;
}

// For Expo, use EXPO_PUBLIC_ prefix for environment variables
// Note: We check the API key at runtime in the function to ensure it's loaded from .env

const DEFAULT_QUESTIONS: GeneratedQuestion[] = [
  {
    id: 'urgency',
    question: 'How urgent is your need for this item?',
    placeholder: 'Not urgent/Very urgent',
  },
  {
    id: 'alternatives',
    question: 'How satisfied would you be with alternatives (borrowing, renting, using what you have)?',
    placeholder: 'Not satisfied/Very satisfied',
  },
  {
    id: 'value',
    question: 'How much value will this purchase add to your life compared to its cost?',
    placeholder: 'Low value/High value',
  },
];

const SYSTEM_PROMPT = `You are a mindful consumption assistant helping people reflect before making purchases. Generate 3 thoughtful, contextual reflection questions for someone considering buying a specific product.

IMPORTANT: Each question must be answerable on a 5-point scale where:
- 1 = Strongly Disagree / Not at all / Very Low
- 2 = Disagree / Slightly / Low
- 3 = Neutral / Somewhat / Moderate
- 4 = Agree / Mostly / High
- 5 = Strongly Agree / Completely / Very High

CRITICAL REQUIREMENTS:
1. You MUST include the actual product name in each question. Do NOT use generic terms like "this item", "this product", or "it".
2. You MUST recognize product categories and relationships. For example:
   - If the product is "AirPods" (which are wireless headphones), ask about "other headphones" or "wired headphones" as alternatives
   - If the product is "iPhone 15" (which is a smartphone), ask about "other smartphones" or "your current phone"
   - If the product is "Nike Running Shoes", ask about "other running shoes" or "your current shoes"
   - Understand product types and suggest category-specific alternatives

The questions should:
1. Help the person think about whether they really need this specific item
2. Be specific to the product category/type and recognize product relationships
3. Include the actual product name in the question text
4. When asking about alternatives, reference the product category (e.g., "other headphones" for AirPods, "other smartphones" for iPhones)
5. Encourage mindful decision-making
6. Be non-judgmental but thought-provoking
7. Be phrased as statements or questions that can be rated on a 1-5 scale

Return your response as a JSON array with exactly 3 objects, each having:
- "id": a short identifier (e.g., "urgency", "alternatives", "value")
- "question": the reflection question (must be answerable on a 1-5 scale AND must include the product name)
- "placeholder": labels for the scale endpoints (format: "Low/High" or "Not at all/Very much")

Each question must cover a DISTINCT dimension of the purchase decision. Good dimensions include: urgency, alternatives/substitutes, financial impact, emotional vs practical need, long-term value. Do NOT repeat similar themes across questions.

Example for "AirPods":
[
  {"id": "urgency", "question": "How urgent is your need for AirPods right now?", "placeholder": "Not urgent/Very urgent"},
  {"id": "alternatives", "question": "How satisfied would you be with other headphones (wired, different brands, or what you currently have)?", "placeholder": "Not satisfied/Very satisfied"},
  {"id": "value", "question": "How much will AirPods improve your daily audio experience compared to their cost?", "placeholder": "Low value/High value"}
]

Example for "Tennis Racket":
[
  {"id": "urgency", "question": "How urgent is your need for a Tennis Racket?", "placeholder": "Not urgent/Very urgent"},
  {"id": "alternatives", "question": "How satisfied would you be borrowing, renting, or using a different racket instead?", "placeholder": "Not satisfied/Very satisfied"},
  {"id": "value", "question": "How much will this Tennis Racket improve your game compared to its cost?", "placeholder": "Low value/High value"}
]

Only respond with the JSON array, no other text.`;

function getApiKey(): string {
  return getExpoPublic('EXPO_PUBLIC_ANTHROPIC_API_KEY');
}

export type GenerateQuestionsResult = {
  questions: GeneratedQuestion[];
  usedFallback?: boolean;
};

export async function generateQuestions(
  productName: string
): Promise<GenerateQuestionsResult> {
  // Check if API key is configured
  // Note: Expo automatically loads .env files, but you must restart the dev server after adding/changing .env
  const apiKey = getApiKey();

  // Debug: Log what we're getting from environment
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

  console.log('API key found, generating questions for:', productName);

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
        messages: [
          {
            role: 'user',
            content: `Generate 3 contextual reflection questions for someone considering buying: "${productName}".

If the input looks like a URL or website name rather than a product, infer what kind of product it might be from context and generate questions about shopping on that site.

Requirements:
1. Include the product name or a short reference to it in each question.
2. Recognize what type of product it is and suggest category-specific alternatives.
3. Make each question cover a DISTINCT dimension (e.g. urgency, alternatives, value).
4. ONLY respond with the JSON array. No explanations, no caveats, no other text.`,
          },
        ],
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
      if (!q.id || !q.question || !q.placeholder) {
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
