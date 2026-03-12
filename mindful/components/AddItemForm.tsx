import { useEffect, useState, useRef } from 'react';
import type { Item, ItemCategory, QuestionAnswer } from '../types/item';
import { generateQuestions, GeneratedQuestion, DEFAULT_QUESTIONS } from '../services/questionGenerator';
import { detectCategory } from '../services/categoryDetector';
import { fetchUrlMetadata } from '../services/urlMetadata';
import { generateProductImage } from '../services/imageGenerator';
import { Loader2, Link } from 'lucide-react';
import { Slider } from './ui/slider';

const ITEM_CATEGORIES: ItemCategory[] = ['Beauty', 'Clothes', 'Accessories', 'Sports', 'Electronics', 'Home', 'Other'];



// Generate intuitive explanation of how mindfulness score reflects the user's responses
function generateMindfulnessExplanation(questionnaire: QuestionAnswer[], finalScore: number): string {
  const insights: string[] = [];
  const areasForGrowth: string[] = [];

  questionnaire.forEach((qa) => {
    const numericAnswer = parseInt(qa.answer, 10);
    if (isNaN(numericAnswer) || numericAnswer < 1 || numericAnswer > 5) return;

    if (qa.id === 'consumption') {
      const needLevel = numericAnswer <= 2 ? 'low' : numericAnswer <= 3 ? 'moderate' : 'high';
      insights.push(`You indicated a ${needLevel} need for this item (${numericAnswer}/5), showing you've recognized your desire`);
    } else if (qa.id === 'urgency') {
      if (numericAnswer <= 2) {
        insights.push(`You indicated low urgency (${numericAnswer}/5), demonstrating patience and thoughtful consideration rather than impulsive decision-making`);
      } else if (numericAnswer >= 4) {
        insights.push(`You indicated high urgency (${numericAnswer}/5), which suggests a more reactive approach that may limit reflection time`);
        areasForGrowth.push('taking more time to reflect before acting');
      } else {
        insights.push(`You indicated moderate urgency (${numericAnswer}/5), showing some consideration of timing`);
        areasForGrowth.push('allowing more time for reflection');
      }
    } else {
      const qLower = qa.question.toLowerCase();
      let questionMeaning = '';
      let reflectionType = '';
      let growthArea = '';

      if (qLower.includes('essential') || qLower.includes('important')) {
        questionMeaning = numericAnswer >= 4 ? 'very essential' : numericAnswer <= 2 ? 'not very essential' : 'moderately essential';
        reflectionType = 'thoughtful reflection about its importance';
        if (numericAnswer <= 3) {
          growthArea = 'deeper consideration of whether this truly meets your needs';
        }
      } else if (qLower.includes('alternative') || qLower.includes('satisfied')) {
        questionMeaning = numericAnswer >= 4 ? 'high satisfaction with alternatives' : numericAnswer <= 2 ? 'low satisfaction with alternatives' : 'moderate satisfaction with alternatives';
        reflectionType = numericAnswer >= 4 ? 'openness to alternatives and flexibility' : 'you\'ve considered alternatives and determined they don\'t meet your needs';
        if (numericAnswer <= 2) {
          growthArea = 'exploring whether any alternatives could work with some adjustment';
        } else if (numericAnswer <= 3) {
          growthArea = 'further exploration of alternative options';
        }
      } else if (qLower.includes('impact') || qLower.includes('consequence') || qLower.includes('significant')) {
        questionMeaning = numericAnswer >= 4 ? 'significant positive impact' : numericAnswer <= 2 ? 'limited impact' : 'moderate impact';
        reflectionType = 'awareness of the purchase\'s consequences';
        if (numericAnswer <= 3) {
          growthArea = 'deeper reflection on the broader impact of this purchase';
        }
      } else if (qLower.includes('integrat') || qLower.includes('confident') || qLower.includes('expect')) {
        questionMeaning = numericAnswer >= 4 ? 'high confidence' : numericAnswer <= 2 ? 'low confidence' : 'moderate confidence';
        reflectionType = 'thoughtful evaluation of how this item fits into your life';
        if (numericAnswer <= 3) {
          growthArea = 'more thorough evaluation of how this integrates with your lifestyle';
        }
      } else {
        questionMeaning = numericAnswer >= 4 ? 'strong agreement' : numericAnswer <= 2 ? 'limited agreement' : 'moderate agreement';
        reflectionType = 'reflection on this aspect';
        if (numericAnswer <= 3) {
          growthArea = 'deeper consideration of this aspect';
        }
      }

      insights.push(`You indicated ${questionMeaning} (${numericAnswer}/5), which demonstrates ${reflectionType}`);
      if (growthArea && numericAnswer <= 3) {
        areasForGrowth.push(growthArea);
      }
    }
  });

  if (insights.length === 0) return '';

  let explanation = `Your score of ${finalScore}/10 reflects your thoughtful decision-making process. ${insights.join('. ')}.`;

  if (finalScore < 10 && areasForGrowth.length > 0) {
    explanation += ` You can reflect further on ${areasForGrowth[0]}${areasForGrowth.length > 1 ? `, as well as ${areasForGrowth.slice(1).join(', and ')}` : ''} to deepen your mindfulness around this decision.`;
  } else if (finalScore < 10) {
    explanation += ` You can reflect further across all dimensions of this decision to deepen your mindfulness.`;
  } else {
    explanation += ` Together, these responses demonstrate exceptional intentionality and awareness in your decision-making process.`;
  }

  return explanation;
}

interface AddItemFormProps {
  onSubmit: (item: Omit<Item, 'id' | 'addedDate'>) => void;
  onCancel: () => void;
  initialUrl?: string;
  /** If provided, called when moving to dynamic questions. Return true to block and show "already in inventory". */
  checkUrlInInventory?: (url: string) => Promise<boolean>;
  /** Names of items the user already has; used to generate questions about fit/overlap. */
  existingItemNames?: string[];
}

export function AddItemForm({ onSubmit, onCancel, initialUrl, checkUrlInInventory, existingItemNames }: AddItemFormProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [productUrl, setProductUrl] = useState(initialUrl ?? '');
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [hasProductUrlTouched, setHasProductUrlTouched] = useState(false);
  const [category, setCategory] = useState<ItemCategory>('Other');
  const [categoryIsAISuggested, setCategoryIsAISuggested] = useState(false);
  const [hasUrlTouched, setHasUrlTouched] = useState(false);
  const [constraintType, setConstraintType] = useState<'time' | 'goals'>('time');
  const [waitUntilDate, setWaitUntilDate] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [consumptionScore, setConsumptionScore] = useState(3);
  const [goalDescription, setGoalDescription] = useState('');
  const [friendName, setFriendName] = useState('');
  const [friendEmail, setFriendEmail] = useState('');

  // Already-in-inventory state (stops flow and shows message)
  const [showAlreadyInInventory, setShowAlreadyInInventory] = useState(false);
  const [isCheckingUrl, setIsCheckingUrl] = useState(false);

  // Dynamic questions state
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [questionsUsedFallback, setQuestionsUsedFallback] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  useEffect(() => {
    if (initialUrl) {
      setProductUrl(initialUrl);
    }
  }, [initialUrl]);

  useEffect(() => {
    if (initialUrl && !hasProductUrlTouched) {
      setProductUrl(initialUrl);
    }
  }, [initialUrl, hasProductUrlTouched]);

  // Generate a random unlock password
  const generateUnlockPassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 6; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const resetForm = () => {
    setStep(1);
    setProductUrl(initialUrl ?? '');
    setName('');
    setImageUrl('');
    setHasProductUrlTouched(false);
    setCategory('Other');
    setCategoryIsAISuggested(false);
    setHasUrlTouched(false);
    setConstraintType('time');
    setWaitUntilDate('');
    setDifficulty('medium');
    setConsumptionScore(3);
    setQuestions([]);
    setQuestionsUsedFallback(false);
    setAnswers({});
    setGoalDescription('');
    setFriendName('');
    setFriendEmail('');
    setShowAlreadyInInventory(false);
  };

  const handleNameBlur = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) return;
    try {
      const detectedCategory = await detectCategory(trimmed);
      setCategory(detectedCategory);
      setCategoryIsAISuggested(true);
    } catch {
      // keep current category on error
    }
  };

  const handleFetchMetadata = async () => {
    if (!productUrl) return;

    setIsLoadingMetadata(true);
    try {
      const metadata = await fetchUrlMetadata(productUrl);
      if (metadata.title) {
        setName(metadata.title);
        // Auto-detect category based on product name
        const detectedCategory = await detectCategory(metadata.title);
        setCategory(detectedCategory);
        setCategoryIsAISuggested(true);
      }
      if (metadata.image) {
        setImageUrl(metadata.image);
      } else {
        // No image from scraping — generate one with DALL-E
        const itemName = metadata.title || name;
        if (itemName) {
          setIsGeneratingImage(true);
          const generatedImage = await generateProductImage(itemName);
          if (generatedImage) {
            setImageUrl(generatedImage);
          }
          setIsGeneratingImage(false);
        }
      }
    } catch (error: any) {
      console.error('Error fetching metadata:', error);
      const msg = (error?.message ?? String(error)) || '';
      const isExtensionInvalidated =
        /Extension context invalidated/i.test(msg) ||
        /context invalidated/i.test(msg);
      if (isExtensionInvalidated) {
        alert(
          'The extension was reloaded or updated. Please refresh this page and try adding the item again.'
        );
      } else {
        alert('Failed to fetch product details. Please enter manually.');
      }
    } finally {
      setIsLoadingMetadata(false);
      setIsGeneratingImage(false);
    }
  };

  // Calculate mindfulness score from question answers and consumption score
  const calculateMindfulnessScore = (questionAnswers: Record<string, number>): number => {
    const mindfulnessValues: number[] = [];

    const consumptionMindfulness = consumptionScore * 2;
    mindfulnessValues.push(consumptionMindfulness);

    if (questions.length > 0) {
      questions.forEach((q) => {
        const answer = questionAnswers[q.id] ?? 1;

        const mindfulnessValue =
          q.mindfulEnd === 'high'
            ? (answer - 1) * 2.5
            : (5 - answer) * 2.5; // low: 1→10, 2→7.5, 3→5, 4→2.5, 5→0

        mindfulnessValues.push(mindfulnessValue);
      });
    }

    const average = mindfulnessValues.reduce((sum, val) => sum + val, 0) / mindfulnessValues.length;
    return Math.round(average);
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If name is still empty, derive from URL hostname
    const itemName = name.trim() || (() => {
      try { return new URL(productUrl).hostname.replace('www.', ''); } catch { return 'Item'; }
    })();
    if (!name.trim()) {
      setName(itemName);
    }

    // Check if this URL is already in the user's inventory (before dynamic questions)
    if (productUrl.trim() && checkUrlInInventory) {
      setIsCheckingUrl(true);
      try {
        const alreadyInInventory = await checkUrlInInventory(productUrl.trim());
        if (alreadyInInventory) {
          setShowAlreadyInInventory(true);
          return;
        }
      } catch (err) {
        console.error('Error checking URL in inventory:', err);
      } finally {
        setIsCheckingUrl(false);
      }
    }

    setIsLoadingQuestions(true);

    try {
      const { questions: generatedQuestions, usedFallback } = await generateQuestions(itemName, {
        category,
        existingItemNames: existingItemNames?.filter((n) => n.trim() && n !== itemName),
      });
      setQuestions(generatedQuestions);
      setQuestionsUsedFallback(!!usedFallback);

      const initialAnswers: Record<string, number> = {};
      generatedQuestions.forEach((q) => {
        initialAnswers[q.id] = 3;
      });
      setAnswers(initialAnswers);

      setStep(2);
    } catch (error) {
      console.error('Error generating questions:', error);
      // Still advance to step 2 with default questions (e.g. in extension content script when API fails)
      setQuestions(DEFAULT_QUESTIONS);
      const initialAnswers: Record<string, number> = {};
      DEFAULT_QUESTIONS.forEach((q) => {
        initialAnswers[q.id] = 3;
      });
      setAnswers(initialAnswers);
      setStep(2);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();

    const calculatedScore = calculateMindfulnessScore(answers);

    // Lower mindfulness score → longer wait, higher score → shorter wait
    const MIN_DAYS = 3;   // very mindful
    const MAX_DAYS = 21;  // least mindful
    const daysRange = MAX_DAYS - MIN_DAYS;
    const normalized = (10 - calculatedScore) / 9; // 0 when score=10, 1 when score=1
    const days = Math.round(MIN_DAYS + normalized * daysRange);
    const waitDate = new Date();
    waitDate.setDate(waitDate.getDate() + days);
    setWaitUntilDate(waitDate.toISOString().split('T')[0]);

    if (calculatedScore <= 3.3) {
      setDifficulty('hard');
    } else if (calculatedScore <= 6.7) {
      setDifficulty('medium');
    } else {
      setDifficulty('easy');
    }

    setStep(3);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Final submit - preparing item data');

    const questionnaire: QuestionAnswer[] = [
      {
        id: 'consumption',
        question: 'Rank your need for this item (1 = need less, 5 = need more)',
        answer: String(consumptionScore),
      },
      ...questions.map((q) => ({
        id: q.id,
        question: q.question,
        answer: String(answers[q.id] || 3),
      })),
    ];

    if (constraintType === 'goals' && goalDescription.trim()) {
      questionnaire.push({
        id: 'goal',
        question: `What ${difficulty} goal would you like to complete before purchasing this item?`,
        answer: goalDescription.trim(),
      });
    }

    const calculatedMindfulnessScore = calculateMindfulnessScore(answers);

    onSubmit({
      name,
      imageUrl: imageUrl?.trim() || undefined,
      productUrl: productUrl?.trim() || undefined,
      category,
      constraintType,
      consumptionScore: calculatedMindfulnessScore,
      ...(constraintType === 'time' ? { waitUntilDate } : { difficulty }),
      questionnaire,
      ...(constraintType === 'goals' && friendName.trim() ? {
        friendName: friendName.trim(),
        friendEmail: friendEmail.trim() || undefined,
      } : {}),
    });

    resetForm();
  };

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-serif text-foreground">
            {step === 1 && 'Add Item'}
            {step === 2 && 'Reflection Questions'}
            {step === 3 && 'Your Constraint Plan'}
            {step === 4 && 'Your Goal Plan'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Step {step} of 4
          </p>
        </div>

        {showAlreadyInInventory && (
          <div className="space-y-6 py-4">
            <p className="text-lg text-foreground">
              This item is already in your inventory!
            </p>
            <p className="text-sm text-muted-foreground">
              You've already saved this product. No need to add it again.
            </p>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
            >
              Back
            </button>
          </div>
        )}

        {!showAlreadyInInventory && step === 1 && (
          <>
          <form onSubmit={handleStep1Submit} className="space-y-6">
          {/* Product URL - Auto-fetch metadata */}
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Product URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={productUrl}
                onChange={(e) => {
                  setProductUrl(e.target.value);
                  setHasProductUrlTouched(true);
                }}
                placeholder="https://amazon.com/product/..."
                className="flex-1 px-4 py-3 border border-border bg-input-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={handleFetchMetadata}
                disabled={!productUrl || isLoadingMetadata}
                className="px-4 py-3 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoadingMetadata ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Link className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">Fetch</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Paste a product link to auto-fill name and image
            </p>
          </div>

          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Item Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameBlur}
              placeholder="Auto-filled from URL, or type manually"
              className="w-full px-4 py-3 border border-border bg-input-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Image URL (Optional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-3 border border-border bg-input-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
            />
            {(imageUrl && imageUrl.trim()) ? (
              <div className="mt-3 relative rounded-xl overflow-hidden border border-border bg-muted/20">
                <img
                  src={imageUrl.trim()}
                  alt="Product preview"
                  className="w-full max-h-96 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.innerHTML = '<p class="text-sm text-muted-foreground p-4">Invalid image URL</p>';
                    }
                  }}
                />
              </div>
            ) : null}
          </div>

          {/* Image generation loading state */}
          {isGeneratingImage && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating product image...
            </div>
          )}

          {/* Category */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium text-foreground/80">
                Category
              </label>
              {categoryIsAISuggested && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  AI Suggested
                </span>
              )}
            </div>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as ItemCategory);
                setCategoryIsAISuggested(false);
              }}
              className="w-full px-4 py-3 border border-border bg-input-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
            >
              {ITEM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoadingQuestions || isCheckingUrl || !productUrl}
              className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-primary/90 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCheckingUrl ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Checking...
                </>
              ) : isLoadingQuestions ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Questions...
                </>
              ) : (
                'Continue to Reflection'
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoadingQuestions || isCheckingUrl}
              className="px-8 py-3 border border-border text-foreground rounded-full hover:bg-muted/30 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
          </>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-6">
            {questionsUsedFallback && (
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-xl px-4 py-3 border border-border/50">
                Using default reflection questions (AI was temporarily busy). You can still continue.
              </p>
            )}
            <div className="space-y-6">
              {/* Consumption Score - Question 1 */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground/80">
                  1. Rank your need for this item (1 = need less, 5 = need more)
                </label>
                <div className="flex items-center justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setConsumptionScore(value)}
                      className={`w-10 h-10 rounded-full font-semibold text-sm transition-all ${
                        consumptionScore === value
                          ? 'bg-primary text-primary-foreground scale-110 shadow-md'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:scale-105'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Need Less</span>
                  <span>Need More</span>
                </div>
              </div>

              {/* Dynamic Questionnaire - Questions 2, 3, 4, etc. */}
              {questions.map((q, index) => {
                const currentValue = answers[q.id] || 3;
                const scaleLabels = q.placeholder.split('/');
                const leftLabel = scaleLabels[0]?.trim() || 'Low';
                const rightLabel = scaleLabels[1]?.trim() || 'High';

                return (
                  <div key={q.id} className="space-y-3">
                    <label className="block text-sm font-medium text-foreground/80">
                      {index + 2}. {q.question}
                    </label>
                    <div className="flex items-center justify-center gap-3">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setAnswers((prev) => ({ ...prev, [q.id]: value }))
                          }
                          className={`w-10 h-10 rounded-full font-semibold text-sm transition-all ${
                            currentValue === value
                              ? 'bg-primary text-primary-foreground scale-110 shadow-md'
                              : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:scale-105'
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{leftLabel}</span>
                      <span>{rightLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-8 py-3 border border-border text-foreground rounded-full hover:bg-muted/30 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
            >
              Continue to Constraint Selection
            </button>
          </div>
        </form>
        )}

        {step === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-6">
            {(() => {
              const score = calculateMindfulnessScore(answers);
              const percentage = score * 10;
              const radius = 54;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (percentage / 100) * circumference;
              const color = score < 4 ? '#dc2626' : score < 7 ? '#d97706' : '#255736';
              const label = score < 4 ? 'High impulse' : score < 7 ? 'Moderate' : 'Mindful';

              // Build breakdown of each component
              const idToLabel: Record<string, string> = {
                consumption: 'Need',
                urgency: 'Urgency',
                importance: 'Importance',
                alternatives: 'Alternatives',
                value: 'Value',
                impact: 'Impact',
                improvement: 'Improvement',
                need: 'Need',
              };
              const components: { label: string; raw: number; value: number; mindfulEnd: 'high' | 'low' }[] = [];
              const consumptionVal = Math.max(1, Math.min(10, consumptionScore * 2));
              components.push({ label: 'Need', raw: consumptionScore, value: consumptionVal, mindfulEnd: 'high' });
              questions.forEach((q) => {
                const answer = answers[q.id] || 3;
                const mindfulnessValue =
                  q.mindfulEnd === 'high'
                    ? (answer - 1) * 2.5
                    : (5 - answer) * 2.5;
                const val = Math.max(0, Math.min(10, mindfulnessValue));
                components.push({ label: idToLabel[q.id] || q.id, raw: answer, value: val, mindfulEnd: q.mindfulEnd });
              });

              return (
                <div className="mb-4 space-y-4">
                  <div className="p-6 bg-muted/30 rounded-xl space-y-5">
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-foreground/80 font-medium">Your Mindfulness Score</span>
                      <div className="relative w-28 h-28">
                        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
                          <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="10"
                            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                            style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold" style={{ color }}>{score}</span>
                          <span className="text-xs text-muted-foreground">/10</span>
                        </div>
                      </div>
                      <span className="text-sm font-medium" style={{ color }}>{label}</span>
                    </div>

                    <div className="border-t border-border/30 pt-4 space-y-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Score Breakdown</span>
                      {components.map((c, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-foreground/70">{c.label}</span>
                            <span className="text-foreground/50">{c.value}/10</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${c.value * 10}%`,
                                backgroundColor: c.mindfulEnd === 'high'
                                  ? (c.value >= 7 ? '#255736' : c.value >= 4 ? '#d97706' : '#dc2626')
                                  : (c.value >= 7 ? '#dc2626' : c.value >= 4 ? '#d97706' : '#255736'),
                              }}
                            />
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs pt-2 border-t border-border/30">
                        <span className="text-foreground/70 font-medium">Average</span>
                        <span className="font-semibold" style={{ color }}>{score}/10</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-foreground/80">
                    Based on your mindfulness score, choose your preferred constraint approach:
                  </p>
                </div>
              );
            })()}

            {/* Time-based option */}
            <label
              className={`block cursor-pointer rounded-xl border-2 p-6 transition-all ${
                constraintType === 'time'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/20'
              }`}
            >
              <div className="flex items-start gap-4">
                <input
                  type="radio"
                  value="time"
                  checked={constraintType === 'time'}
                  onChange={(e) => setConstraintType(e.target.value as 'time')}
                  className="mt-1 accent-primary"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">⏰</span>
                    <h3 className="text-lg font-semibold text-foreground">Time-based Constraint</h3>
                  </div>
                  <p className="text-foreground/80 mb-3">
                    Wait a specific period before making your purchase decision.
                  </p>
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Wait until:</p>
                    <p className="text-lg font-semibold text-primary mt-1">
                      {new Date(waitUntilDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      ({Math.ceil((new Date(waitUntilDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days from now)
                    </p>
                  </div>
                </div>
              </div>
            </label>

            {/* Goals-based option */}
            <label
              className={`block cursor-pointer rounded-xl border-2 p-6 transition-all ${
                constraintType === 'goals'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/20'
              }`}
            >
              <div className="flex items-start gap-4">
                <input
                  type="radio"
                  value="goals"
                  checked={constraintType === 'goals'}
                  onChange={(e) => setConstraintType(e.target.value as 'goals')}
                  className="mt-1 accent-primary"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🎯</span>
                    <h3 className="text-lg font-semibold text-foreground">Goals-based Constraint</h3>
                  </div>
                  <p className="text-foreground/80 mb-3">
                    Complete meaningful tasks before earning your purchase.
                  </p>
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Challenge difficulty:</p>
                    <p className="text-lg font-semibold text-primary mt-1 capitalize">
                      {difficulty === 'easy' && '✨ Easy - Complete simple daily goals'}
                      {difficulty === 'medium' && '⚡ Medium - Complete moderate weekly goals'}
                      {difficulty === 'hard' && '🔥 Hard - Complete challenging long-term goals'}
                    </p>
                  </div>
                </div>
              </div>
            </label>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-8 py-3 border border-border text-foreground rounded-full hover:bg-muted/30 transition-colors"
              >
                Back
              </button>
              {constraintType === 'time' ? (
                <button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
                >
                  Add to Reflection List
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
                >
                  Continue
                </button>
              )}
            </div>
          </form>
        )}

        {step === 4 && constraintType === 'goals' && (
          <form onSubmit={handleFinalSubmit} className="space-y-6">
            <div className="mb-4 space-y-2">
              <p className="text-foreground/80">
                <strong className="capitalize">{difficulty}</strong> goals-based constraint for{' '}
                <strong>{name}</strong>.
              </p>
              <p className="text-sm text-muted-foreground">
                What is a <span className="font-medium capitalize">{difficulty}</span> goal you would like to complete
                before purchasing this item?
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Your goal
              </label>
              <textarea
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                placeholder="For example: Save an extra $100, sell three unused items from my closet, or complete a month of tracking my spending."
                rows={4}
                className="w-full px-4 py-3 border border-border bg-input-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground resize-none"
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-border/50">
              <p className="text-sm text-foreground/80">
                Choose a friend who will receive a password to unlock this item once you complete your goal:
              </p>
              
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Friend's Name *
                </label>
                <input
                  type="text"
                  value={friendName}
                  onChange={(e) => setFriendName(e.target.value)}
                  placeholder="Enter your friend's name"
                  required={constraintType === 'goals'}
                  className="w-full px-4 py-3 border border-border bg-input-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Friend's Email *
                </label>
                <input
                  type="email"
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  placeholder="friend@example.com"
                  required={constraintType === 'goals'}
                  className="w-full px-4 py-3 border border-border bg-input-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your friend will receive an email with a link to set a password. Once you complete your goal, ask them for the password to unlock your item.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-8 py-3 border border-border text-foreground rounded-full hover:bg-muted/30 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
              >
                Add to Reflection List
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
