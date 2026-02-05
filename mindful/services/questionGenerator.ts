// Question Generation Service using Claude API (Anthropic)
// Generates contextual reflection questions based on the product being added

export interface GeneratedQuestion {
  id: string;
  question: string;
  placeholder: string;
}

// For Expo, use EXPO_PUBLIC_ prefix for environment variables
// Note: We check the API key at runtime in the function to ensure it's loaded from .env

const DEFAULT_QUESTIONS: GeneratedQuestion[] = [
  {
    id: 'importance',
    question: 'How important is this item to you?',
    placeholder: 'Not important/Very important',
  },
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
    id: 'impact',
    question: 'How significant will the positive impact of this purchase be?',
    placeholder: 'No impact/Significant impact',
  },
];

const SYSTEM_PROMPT = `You are a mindful consumption assistant helping people reflect before making purchases. Generate 4 thoughtful, contextual reflection questions for someone considering buying a specific product.

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

Return your response as a JSON array with exactly 4 objects, each having:
- "id": a short identifier (e.g., "importance", "urgency", "alternatives", "need")
- "question": the reflection question (must be answerable on a 1-5 scale AND must include the product name)
- "placeholder": labels for the scale endpoints (format: "Low/High" or "Not at all/Very much")

Example for "AirPods":
[
  {"id": "importance", "question": "How important is owning AirPods to you?", "placeholder": "Not important/Very important"},
  {"id": "urgency", "question": "How urgent is your need for AirPods?", "placeholder": "Not urgent/Very urgent"},
  {"id": "alternatives", "question": "How satisfied would you be with other headphones (wired, different wireless brands, or what you currently have)?", "placeholder": "Not satisfied/Very satisfied"},
  {"id": "improvement", "question": "How much will AirPods improve your audio experience compared to what you have?", "placeholder": "No improvement/Significant improvement"}
]

Example for "Tennis Racket":
[
  {"id": "importance", "question": "How important is owning a Tennis Racket to you?", "placeholder": "Not important/Very important"},
  {"id": "urgency", "question": "How urgent is your need for a Tennis Racket?", "placeholder": "Not urgent/Very urgent"},
  {"id": "alternatives", "question": "How satisfied would you be with other tennis rackets (borrowing, renting, or using a different racket)?", "placeholder": "Not satisfied/Very satisfied"},
  {"id": "improvement", "question": "How much will this Tennis Racket improve your tennis experience?", "placeholder": "No improvement/Significant improvement"}
]

Only respond with the JSON array, no other text.`;

export async function generateQuestions(
  productName: string
): Promise<GeneratedQuestion[]> {
  // Check if API key is configured
  // Note: Expo automatically loads .env files, but you must restart the dev server after adding/changing .env
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '';
  
  // Debug: Log what we're getting from environment
  console.log('Environment check:');
  console.log('   EXPO_PUBLIC_ANTHROPIC_API_KEY exists:', !!process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY);
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
    return DEFAULT_QUESTIONS;
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
        model: 'claude-3-5-haiku-latest',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Generate 4 contextual reflection questions for someone considering buying: "${productName}". 

Requirements:
1. Include the product name "${productName}" in each question - do not use generic terms like "this item" or "this product".
2. Recognize what type of product "${productName}" is and suggest category-specific alternatives. For example:
   - If it's AirPods (wireless headphones), ask about "other headphones" or "wired headphones"
   - If it's an iPhone (smartphone), ask about "other smartphones" or "your current phone"
   - If it's a specific brand/model of a product type, reference that product category in alternatives
3. Make questions specific to the product category and context.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
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
    if (!Array.isArray(questions) || questions.length !== 4) {
      console.error('Invalid response structure - expected 4 questions, got:', questions.length);
      throw new Error('Invalid response structure');
    }

    for (const q of questions) {
      if (!q.id || !q.question || !q.placeholder) {
        console.error('Invalid question structure:', q);
        throw new Error('Invalid question structure');
      }
    }

    console.log('Successfully generated', questions.length, 'questions for', productName);
    return questions;
  } catch (error) {
    console.error('Error generating questions:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }
    // Fall back to default questions on error
    console.warn('Falling back to default questions');
    return DEFAULT_QUESTIONS;
  }
}

export { DEFAULT_QUESTIONS };
