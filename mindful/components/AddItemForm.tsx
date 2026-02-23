import { useState } from 'react';
import { Item, QuestionAnswer } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { fetchUrlMetadata } from '../services/urlMetadata';
import { generateQuestions, GeneratedQuestion } from '../services/questionGenerator';
import { Loader2, Calendar, Link } from 'lucide-react';
import { generateGoogleCalendarUrl } from '../services/googleCalendar';
import { Slider } from './ui/slider';

// Get a short label for a question based on its id and text
function getFactorLabel(id: string, questionText: string): string {
  if (id === 'consumption') return 'Need Awareness';
  if (id === 'urgency') return 'Patience';
  const qLower = questionText.toLowerCase();
  if (qLower.includes('essential') || qLower.includes('important')) return 'Importance';
  if (qLower.includes('alternative') || qLower.includes('satisfied')) return 'Alternatives';
  if (qLower.includes('impact') || qLower.includes('consequence') || qLower.includes('significant')) return 'Impact Awareness';
  if (qLower.includes('integrat') || qLower.includes('confident') || qLower.includes('expect')) return 'Confidence';
  // Fallback: use first few words of the question
  return questionText.split(' ').slice(0, 3).join(' ');
}

// Score breakdown component showing per-factor contribution
function ScoreBreakdown({
  consumptionScore,
  questions,
  answers,
  finalScore
}: {
  consumptionScore: number;
  questions: GeneratedQuestion[];
  answers: Record<string, number>;
  finalScore: number;
}) {
  // Build per-factor data (same logic as calculateMindfulnessScore)
  const factors: { label: string; value: number; delta: number }[] = [];

  // Consumption score
  const consumptionValue = consumptionScore * 2;
  factors.push({ label: 'Need Awareness', value: consumptionValue, delta: consumptionValue - finalScore });

  // Question-based factors
  questions.forEach((q) => {
    const answer = answers[q.id] || 1;
    let value: number;
    if (q.id === 'urgency') {
      value = 12 - (answer * 2);
    } else {
      value = answer * 2;
    }
    value = Math.max(1, Math.min(10, value));
    const label = getFactorLabel(q.id, q.question);
    factors.push({ label, value, delta: value - finalScore });
  });

  return (
    <div className="space-y-3 pt-2 border-t border-border/30">
      {factors.map((factor, i) => {
        const barPercent = (factor.value / 10) * 100;
        const isPositive = factor.delta > 0;
        const isNeutral = factor.delta === 0;
        const barColor = isPositive ? 'bg-primary' : isNeutral ? 'bg-muted-foreground' : 'bg-destructive';
        const deltaColor = isPositive ? 'text-primary' : isNeutral ? 'text-muted-foreground' : 'text-destructive';

        return (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/80 font-medium">{factor.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-foreground/60 text-xs">{factor.value}/10</span>
                <span className={`font-semibold text-xs min-w-[40px] text-right ${deltaColor}`}>
                  {isPositive ? '+' : ''}{factor.delta}
                </span>
              </div>
            </div>
            <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${barPercent}%` }}
              />
            </div>
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground pt-1">
        +/- shows each factor's deviation from your overall score
      </p>
    </div>
  );
}

interface AddItemFormProps {
  onSubmit: (item: Omit<Item, 'id' | 'addedDate'>) => void;
  onCancel: () => void;
}

export function AddItemForm({ onSubmit, onCancel }: AddItemFormProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [constraintType, setConstraintType] = useState<'time' | 'goals'>('time');
  const [waitUntilDate, setWaitUntilDate] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [consumptionScore, setConsumptionScore] = useState(1);
  const [goalDescription, setGoalDescription] = useState('');

  // URL metadata fetching state
  const [productUrl, setProductUrl] = useState('');
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  // Dynamic questions state
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  const handleFetchMetadata = async () => {
    if (!productUrl) return;

    setIsLoadingMetadata(true);
    try {
      const metadata = await fetchUrlMetadata(productUrl);
      if (metadata.title) {
        setName(metadata.title);
      }
    } catch (error) {
      console.error('Error fetching metadata:', error);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setProductUrl('');
    setName('');
    setImageUrl('');
    setConstraintType('time');
    setWaitUntilDate('');
    setDifficulty('medium');
    setConsumptionScore(1);
    setQuestions([]);
    setAnswers({});
    setGoalDescription('');
  };

  // Calculate mindfulness score from question answers and consumption score
  // The mindfulness score measures intentional, aware decision-making, not the absence of need.
  // It penalizes impulsivity and unexamined urgency, while rewarding reflection, flexibility, and impact awareness.
  // Questions and consumption score are on 1-5 scale, we normalize to 1-10 scale
  const calculateMindfulnessScore = (questionAnswers: Record<string, number>): number => {
    const mindfulnessValues: number[] = [];
    
    // Include consumption score (neutral context: strong need can still be handled mindfully)
    // Consumption score is 1-5, scale directly to 1-10: 1 = 2, 5 = 10
    const consumptionMindfulness = consumptionScore * 2;
    mindfulnessValues.push(consumptionMindfulness);
    
    // Process question answers if available
    if (questions.length > 0) {
      questions.forEach((q) => {
        const answer = questionAnswers[q.id] || 1;
        
        // Normalize answers based on question type for mindfulness
        // Only urgency is inverted (high = impulsive/unexamined = less mindful)
        // All other questions are direct (high = reflective/aware = more mindful)
        // This rewards reflection, awareness, and thoughtful consideration regardless of the conclusion
        let mindfulnessValue: number;
        
        switch (q.id) {
          case 'urgency':
            // Invert: high urgency signals impulsivity and unexamined urgency
            // Low urgency shows patience and reflection
            // 1 (not urgent) = 10, 5 (very urgent) = 2
            mindfulnessValue = 12 - (answer * 2);
            break;
          case 'importance':
          case 'alternatives':
          case 'impact':
          default:
            // Direct mapping: high scores indicate reflection and awareness
            // For importance: recognizing something is essential through reflection is mindful
            // For alternatives: considering alternatives (whether satisfied or not) shows reflection
            // For impact: understanding outcomes shows awareness
            // For other questions: any thoughtful consideration is rewarded
            // 1 = 2, 5 = 10
            mindfulnessValue = (answer * 2);
            break;
        }
        
        // Ensure value is within 1-10 range
        mindfulnessValue = Math.max(1, Math.min(10, mindfulnessValue));
        mindfulnessValues.push(mindfulnessValue);
      });
    }
    
    // Calculate average and round to nearest integer
    // All inputs normalized to 1-10 scale, averaged to produce final mindfulness score
    const average = mindfulnessValues.reduce((sum, val) => sum + val, 0) / mindfulnessValues.length;
    return Math.round(average);
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingQuestions(true);

    try {
      // Generate contextual questions based on the product name
      const generatedQuestions = await generateQuestions(name);
      setQuestions(generatedQuestions);

      // Initialize answers object with default value of 1 for each question
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
    
    // Calculate mindfulness score from question answers
    const calculatedScore = calculateMindfulnessScore(answers);
    
    // Calculate time-based constraint based on mindfulness score
    const days = calculatedScore * 7; // 1 week per score point
    const waitDate = new Date();
    waitDate.setDate(waitDate.getDate() + days);
    setWaitUntilDate(waitDate.toISOString().split('T')[0]);
    
    // Calculate goals-based difficulty based on mindfulness score
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

    // Convert questions and answers to QuestionAnswer array
    // Consumption score as question 1
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

    // If the user chose a goals-based constraint, capture their specific goal
    if (constraintType === 'goals' && goalDescription.trim()) {
      questionnaire.push({
        id: 'goal',
        question: `What ${difficulty} goal would you like to complete before purchasing this item?`,
        answer: goalDescription.trim(),
      });
    }

    // Calculate mindfulness score from question answers
    const calculatedMindfulnessScore = calculateMindfulnessScore(answers);

    onSubmit({
      name,
      imageUrl: imageUrl || '',
      constraintType,
      consumptionScore: calculatedMindfulnessScore,
      ...(constraintType === 'time' ? { waitUntilDate } : { difficulty }),
      questionnaire,
    });
    
    // Reset form for next item
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
          {/* Product URL with auto-fetch */}
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Product URL
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Paste a product link to auto-fill the item name
            </p>
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
                className="px-4 py-3 bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoadingMetadata ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Link className="w-4 h-4" />
                )}
                Fetch
              </button>
            </div>
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
                <ScoreBreakdown
                  consumptionScore={consumptionScore}
                  questions={questions}
                  answers={answers}
                  finalScore={calculateMindfulnessScore(answers)}
                />
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
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(generateGoogleCalendarUrl(name, waitUntilDate), '_blank', 'noopener,noreferrer');
                      }}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-primary/30 text-primary rounded-xl hover:bg-primary/10 transition-colors text-sm font-medium"
                    >
                      <Calendar className="w-4 h-4" />
                      Add to Google Calendar
                    </button>
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