// End-to-end test: URL scraping -> Dynamic questions flow

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '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';

console.log('════════════════════════════════════════════════════════════');
console.log('       END-TO-END TEST: URL Scraping + Dynamic Questions');
console.log('════════════════════════════════════════════════════════════\n');

// Step 1: Scrape product metadata from URL
async function fetchUrlMetadata(url) {
  console.log('STEP 1: Fetching product metadata from URL...');
  console.log(`   URL: ${url}\n`);

  const apiUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}`;
  const response = await fetch(apiUrl);
  const data = await response.json();

  if (data.status !== 'success') {
    throw new Error('Failed to fetch metadata');
  }

  const result = {
    title: data.data.title || null,
    image: data.data.image?.url || null,
  };

  console.log('   ✅ Metadata fetched successfully!');
  console.log(`   Product Name: ${result.title}`);
  console.log(`   Image URL: ${result.image ? result.image.substring(0, 60) + '...' : 'none'}\n`);

  return result;
}

// Step 2: Generate dynamic questions based on product name
async function generateQuestions(productName) {
  console.log('STEP 2: Generating dynamic questions with Claude AI...');
  console.log(`   Product: "${productName}"\n`);

  const SYSTEM_PROMPT = `You are a mindful consumption assistant helping people reflect before making purchases. Generate 4 thoughtful, contextual reflection questions for someone considering buying a specific product.

The questions should:
1. Help the person think about whether they really need this specific item
2. Be specific to the product category/type
3. Encourage mindful decision-making
4. Be non-judgmental but thought-provoking

Return your response as a JSON array with exactly 4 objects, each having:
- "id": a short identifier
- "question": the reflection question
- "placeholder": a helpful hint for answering (2-10 words)

Only respond with the JSON array, no other text.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
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

  const data = await response.json();
  const content = data.content?.[0]?.text;
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  const questions = JSON.parse(jsonMatch[0]);

  console.log('   ✅ Questions generated successfully!\n');
  return questions;
}

// Run the full flow
async function runE2ETest() {
  try {
    // Test with Apple AirPods Pro URL
    const testUrl = 'https://www.apple.com/airpods-pro/';

    // Step 1: Scrape
    const metadata = await fetchUrlMetadata(testUrl);

    // Step 2: Generate questions using scraped product name
    const questions = await generateQuestions(metadata.title);

    // Show results
    console.log('════════════════════════════════════════════════════════════');
    console.log('                    FULL FLOW RESULTS');
    console.log('════════════════════════════════════════════════════════════\n');

    console.log(`📦 Product: ${metadata.title}`);
    console.log(`🖼️  Image: ${metadata.image ? 'Yes' : 'No'}\n`);

    console.log('📝 AI-Generated Reflection Questions:\n');
    questions.forEach((q, i) => {
      console.log(`   ${i + 1}. ${q.question}`);
      console.log(`      💡 Hint: ${q.placeholder}\n`);
    });

    console.log('════════════════════════════════════════════════════════════');
    console.log('                  ✅ E2E TEST PASSED');
    console.log('════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ E2E TEST FAILED:', error.message);
    process.exit(1);
  }
}

runE2ETest();
