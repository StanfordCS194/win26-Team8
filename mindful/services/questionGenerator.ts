// Question Generation Service using Claude API (Anthropic)
// Generates contextual reflection questions based on the product being added

export interface GeneratedQuestion {
  id: string;
  question: string;
  placeholder: string;
}

// For Expo, use EXPO_PUBLIC_ prefix for environment variables.
// Guard for environments (like extension popups) without `process`.
// @ts-ignore - process.env may not have types in all environments
const ANTHROPIC_API_KEY =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_ANTHROPIC_API_KEY) || '';

const DEFAULT_QUESTIONS: GeneratedQuestion[] = [
  {
    id: 'why',
    question: 'Why do you want this item?',
    placeholder: 'Think about your motivations...',
  },
  {
    id: 'alternatives',
    question: 'What alternatives have you considered?',
    placeholder: 'Could you borrow it? Do you already have something similar?',
  },
  {
    id: 'impact',
    question: 'What impact will this purchase have?',
    placeholder: 'Consider financial, environmental, and personal impact...',
  },
  {
    id: 'urgency',
    question: 'How urgent is this purchase?',
    placeholder: 'Do you need it now or can it wait?',
  },
];

const SYSTEM_PROMPT = `You are a mindful consumption assistant helping people reflect before making purchases. Generate 4 thoughtful, contextual reflection questions for someone considering buying a specific product.

The questions should:
1. Help the person think about whether they really need this specific item
2. Be specific to the product category/type
3. Encourage mindful decision-making
4. Be non-judgmental but thought-provoking

Return your response as a JSON array with exactly 4 objects, each having:
- "id": a short identifier (e.g., "ownership", "frequency", "alternatives", "timing")
- "question": the reflection question
- "placeholder": a helpful hint for answering (2-10 words)

Example for "Tennis Racket":
[
  {"id": "ownership", "question": "Do you already own a tennis racket that still works?", "placeholder": "Think about what you currently have..."},
  {"id": "frequency", "question": "How often do you realistically play tennis?", "placeholder": "Consider your actual playing frequency..."},
  {"id": "alternatives", "question": "Could you borrow or rent a racket instead of buying?", "placeholder": "Think about temporary options..."},
  {"id": "improvement", "question": "Will this new racket actually improve your game?", "placeholder": "Consider your skill level and needs..."}
]

Only respond with the JSON array, no other text.`;

export async function generateQuestions(
  productName: string
): Promise<GeneratedQuestion[]> {
  // If no API key is configured, return default questions
  if (!ANTHROPIC_API_KEY) {
    console.warn('Anthropic API key not configured. Using default questions.');
    return DEFAULT_QUESTIONS;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Generate 4 contextual reflection questions for someone considering buying: "${productName}"`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      throw new Error('No content in API response');
    }

    // Parse the JSON response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    const questions: GeneratedQuestion[] = JSON.parse(jsonMatch[0]);

    // Validate the response structure
    if (!Array.isArray(questions) || questions.length !== 4) {
      throw new Error('Invalid response structure');
    }

    for (const q of questions) {
      if (!q.id || !q.question || !q.placeholder) {
        throw new Error('Invalid question structure');
      }
    }

    return questions;
  } catch (error) {
    console.error('Error generating questions:', error);
    // Fall back to default questions on error
    return DEFAULT_QUESTIONS;
  }
}

export { DEFAULT_QUESTIONS };
