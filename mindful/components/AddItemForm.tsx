import { useEffect, useState, useRef } from 'react';
import type { Item, ItemCategory, QuestionAnswer } from '../types/item';
import { generateQuestions, GeneratedQuestion } from '../services/questionGenerator';
import { detectCategory } from '../services/categoryDetector';
import { fetchUrlMetadata } from '../services/urlMetadata';
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
}

export function AddItemForm({ onSubmit, onCancel }: AddItemFormProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [productUrl, setProductUrl] = useState('');
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Other');
  const [categoryIsAISuggested, setCategoryIsAISuggested] = useState(false);
  const [hasUrlTouched, setHasUrlTouched] = useState(false);
  const [constraintType, setConstraintType] = useState<'time' | 'goals'>('time');
  const [waitUntilDate, setWaitUntilDate] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [consumptionScore, setConsumptionScore] = useState(1);
  const [goalDescription, setGoalDescription] = useState('');
  const [friendName, setFriendName] = useState('');
  const [friendEmail, setFriendEmail] = useState('');

  // Dynamic questions state
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [questionsUsedFallback, setQuestionsUsedFallback] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  const resetForm = () => {
    setStep(1);
    setProductUrl('');
    setName('');
    setImageUrl('');
    setCategory('Other');
    setCategoryIsAISuggested(false);
    setHasUrlTouched(false);
    setConstraintType('time');
    setWaitUntilDate('');
    setDifficulty('medium');
    setConsumptionScore(1);
    setQuestions([]);
    setQuestionsUsedFallback(false);
    setAnswers({});
    setGoalDescription('');
    setFriendName('');
    setFriendEmail('');
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
      }
    } catch (error) {
      console.error('Error fetching metadata:', error);
      alert('Failed to fetch product details. Please enter manually.');
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  // Calculate mindfulness score from question answers and consumption score
  const calculateMindfulnessScore = (questionAnswers: Record<string, number>): number => {
    const mindfulnessValues: number[] = [];

    const consumptionMindfulness = consumptionScore * 2;
    mindfulnessValues.push(consumptionMindfulness);

    if (questions.length > 0) {
      questions.forEach((q) => {
        const answer = questionAnswers[q.id] || 1;

        let mindfulnessValue: number;

        switch (q.id) {
          case 'urgency':
            mindfulnessValue = 12 - (answer * 2);
            break;
          case 'importance':
          case 'alternatives':
          case 'impact':
          default:
            mindfulnessValue = (answer * 2);
            break;
        }

        mindfulnessValue = Math.max(1, Math.min(10, mindfulnessValue));
        mindfulnessValues.push(mindfulnessValue);
      });
    }

    const average = mindfulnessValues.reduce((sum, val) => sum + val, 0) / mindfulnessValues.length;
    return Math.round(average);
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingQuestions(true);

    try {
      const { questions: generatedQuestions, usedFallback } = await generateQuestions(name);
      setQuestions(generatedQuestions);
      setQuestionsUsedFallback(!!usedFallback);

      const initialAnswers: Record<string, number> = {};
      generatedQuestions.forEach((q) => {
        initialAnswers[q.id] = 1;
      });
      setAnswers(initialAnswers);

      setStep(2);
    } catch (error) {
      console.error('Error generating questions:', error);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();

    const calculatedScore = calculateMindfulnessScore(answers);

    const days = calculatedScore * 7;
    const waitDate = new Date();
    waitDate.setDate(waitDate.getDate() + days);
    setWaitUntilDate(waitDate.toISOString().split('T')[0]);

    if (calculatedScore <= 3) {
      setDifficulty('easy');
    } else if (calculatedScore <= 7) {
      setDifficulty('medium');
    } else {
      setDifficulty('hard');
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
        answer: String(answers[q.id] || 1),
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

        {step === 1 && (
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
                onChange={(e) => setProductUrl(e.target.value)}
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
              Item Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Wireless Headphones"
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
                    e.currentTarget.parentElement!.innerHTML = '<p class="text-sm text-muted-foreground p-4">Invalid image URL</p>';
                  }}
                />
              </div>
            ) : null}
          </div>

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
              disabled={isLoadingQuestions}
              className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-primary/90 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoadingQuestions ? (
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
              disabled={isLoadingQuestions}
              className="px-8 py-3 border border-border text-foreground rounded-full hover:bg-muted/30 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
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
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-foreground/80">
                    1. Rank your need for this item (1 = need less, 5 = need more)
                  </label>
                  <span className="text-lg font-semibold text-primary">
                    {consumptionScore}/5
                  </span>
                </div>
                <Slider
                  value={[consumptionScore]}
                  onValueChange={(value) => setConsumptionScore(value[0])}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 - Need Less</span>
                  <span>5 - Need More</span>
                </div>
              </div>

              {/* Dynamic Questionnaire - Questions 2, 3, 4, etc. */}
              {questions.map((q, index) => {
                const currentValue = answers[q.id] || 1;
                const scaleLabels = q.placeholder.split('/');
                const leftLabel = scaleLabels[0]?.trim() || 'Low';
                const rightLabel = scaleLabels[1]?.trim() || 'High';

                return (
                  <div key={q.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-foreground/80">
                        {index + 2}. {q.question}
                      </label>
                      <span className="text-lg font-semibold text-primary">
                        {currentValue}/5
                      </span>
                    </div>
                    <Slider
                      value={[currentValue]}
                      onValueChange={(value) =>
                        setAnswers((prev) => ({ ...prev, [q.id]: value[0] }))
                      }
                      min={1}
                      max={5}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 - {leftLabel}</span>
                      <span>5 - {rightLabel}</span>
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
            <div className="mb-4 space-y-3">
              <div className="p-5 bg-muted/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-foreground/80 font-medium">Your Mindfulness Score</span>
                  <span className={`text-2xl font-semibold font-serif ${
                    calculateMindfulnessScore(answers) >= 7 ? 'text-destructive' :
                    calculateMindfulnessScore(answers) >= 4 ? 'text-accent' :
                    'text-primary'
                  }`}>
                    {calculateMindfulnessScore(answers)}/10
                  </span>
                </div>
                {(() => {
                  const tempQuestionnaire: QuestionAnswer[] = [
                    {
                      id: 'consumption',
                      question: 'Rank your need for this item',
                      answer: String(consumptionScore),
                    },
                    ...questions.map((q) => ({
                      id: q.id,
                      question: q.question,
                      answer: String(answers[q.id] || 1),
                    })),
                  ];
                  return (
                    <p className="text-sm text-foreground/70 leading-relaxed pt-2 border-t border-border/30">
                      {generateMindfulnessExplanation(tempQuestionnaire, calculateMindfulnessScore(answers))}
                    </p>
                  );
                })()}
              </div>
              <p className="text-foreground/80">
                Based on your mindfulness score, choose your preferred constraint approach:
              </p>
            </div>

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
                  Your friend will receive an email with a password to unlock this item once you complete your goal.
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
