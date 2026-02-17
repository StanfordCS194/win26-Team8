import { useEffect, useState, useRef } from 'react';
import type { Item, ItemCategory, QuestionAnswer } from '../types/item';

const ITEM_CATEGORIES: ItemCategory[] = ['Beauty', 'Clothes', 'Sports', 'Electronics', 'Home', 'Other'];
import { generateQuestions, GeneratedQuestion } from '../services/questionGenerator';
import { detectCategory } from '../services/categoryDetector';
import { Loader2 } from 'lucide-react';
import { Slider } from './ui/slider';

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
      // Extract question meaning from text
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
}

export function AddItemForm({ onSubmit, onCancel, initialUrl }: AddItemFormProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState(initialUrl ?? '');
  const [category, setCategory] = useState<ItemCategory>('Other');
  const [hasUrlTouched, setHasUrlTouched] = useState(false);
  const [constraintType, setConstraintType] = useState<'time' | 'goals'>('time');
  const [waitUntilDate, setWaitUntilDate] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [consumptionScore, setConsumptionScore] = useState(1);
  const [goalDescription, setGoalDescription] = useState('');

  // Dynamic questions state
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  useEffect(() => {
    if (initialUrl && !hasUrlTouched) {
      setImageUrl(initialUrl);
    }
  }, [initialUrl, hasUrlTouched]);

  // Auto-detect category when item name changes (with debouncing for AI calls)
  const categoryDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isDetectingCategory, setIsDetectingCategory] = useState(false);

  useEffect(() => {
    // Clear any pending detection
    if (categoryDetectionTimeoutRef.current) {
      clearTimeout(categoryDetectionTimeoutRef.current);
    }

    if (name.trim().length === 0) {
      setCategory('Other');
      setIsDetectingCategory(false);
      return;
    }

    // Debounce AI calls - wait 500ms after user stops typing
    setIsDetectingCategory(true);
    categoryDetectionTimeoutRef.current = setTimeout(async () => {
      try {
        const detectedCategory = await detectCategory(name);
        setCategory(detectedCategory);
      } catch (error) {
        console.error('Error detecting category:', error);
        // Fallback to 'Other' on error
        setCategory('Other');
      } finally {
        setIsDetectingCategory(false);
      }
    }, 500);

    // Cleanup on unmount or when name changes
    return () => {
      if (categoryDetectionTimeoutRef.current) {
        clearTimeout(categoryDetectionTimeoutRef.current);
      }
    };
  }, [name]);

  const resetForm = () => {
    setStep(1);
    setName('');
    setImageUrl(initialUrl ?? '');
    setCategory('Other');
    setHasUrlTouched(false);
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
      category,
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
          {/* Basic Information */}
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

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
               URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setHasUrlTouched(true);
              }}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-3 border border-border bg-input-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2 flex items-center gap-2">
              Category 
              {isDetectingCategory && (
                <Loader2 className="w-3 h-3 animate-spin text-primary" />
              )}
              {name.trim().length > 0 && !isDetectingCategory && (
                <span className="text-xs font-normal text-primary">(AI-detected)</span>
              )}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ItemCategory)}
              disabled={isDetectingCategory}
              className="w-full px-4 py-3 border border-border bg-input-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ITEM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              {isDetectingCategory 
                ? 'Detecting category...'
                : name.trim().length > 0 
                  ? 'Category detected using AI. You can change it if needed.'
                  : 'Organize your items for easier browsing on the All Items page'}
            </p>
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
                {(() => {
                  // Build questionnaire array for explanation
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