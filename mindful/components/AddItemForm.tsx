import { useState } from 'react';
import { Item, QuestionAnswer } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { generateQuestions, GeneratedQuestion } from '../services/questionGenerator';
import { Loader2 } from 'lucide-react';
import { Slider } from './ui/slider';

interface AddItemFormProps {
  onSubmit: (item: Omit<Item, 'id' | 'addedDate'>) => void;
  onCancel: () => void;
}

export function AddItemForm({ onSubmit, onCancel }: AddItemFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [constraintType, setConstraintType] = useState<'time' | 'goals'>('time');
  const [waitUntilDate, setWaitUntilDate] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [consumptionScore, setConsumptionScore] = useState(1);

  // Dynamic questions state
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  const resetForm = () => {
    setStep(1);
    setName('');
    setImageUrl('');
    setConstraintType('time');
    setWaitUntilDate('');
    setDifficulty('medium');
    setConsumptionScore(1);
    setQuestions([]);
    setAnswers({});
  };

  // Calculate mindfulness score from question answers and consumption score
  // Questions and consumption score are on 1-5 scale, we normalize to 1-10 scale
  const calculateMindfulnessScore = (questionAnswers: Record<string, number>): number => {
    const mindfulnessValues: number[] = [];
    
    // Include consumption score (inverted, like importance: higher need = less mindful)
    // Consumption score is 1-5, invert then scale to 1-10: 1 (need less) = 10, 5 (need more) = 2
    const consumptionMindfulness = (6 - consumptionScore) * 2;
    mindfulnessValues.push(consumptionMindfulness);
    
    // Process question answers if available
    if (questions.length > 0) {
      questions.forEach((q) => {
        const answer = questionAnswers[q.id] || 1;
        
        // Normalize answers based on question type for mindfulness
        // Lower importance/urgency = more mindful
        // Higher alternatives/impact = more mindful
        let mindfulnessValue: number;
        
        switch (q.id) {
          case 'importance':
            // Invert: 1 (not important) = 10, 5 (very important) = 2
            mindfulnessValue = 12 - (answer * 2);
            break;
          case 'urgency':
            // Invert: 1 (not urgent) = 10, 5 (very urgent) = 2
            mindfulnessValue = 12 - (answer * 2);
            break;
          case 'alternatives':
            // Direct: 1 (not satisfied) = 2, 5 (very satisfied) = 10
            mindfulnessValue = (answer * 2);
            break;
          case 'impact':
            // Direct: 1 (no impact) = 2, 5 (significant impact) = 10
            mindfulnessValue = (answer * 2);
            break;
          default:
            // For other question types, use direct mapping (1-5 -> 2-10)
            mindfulnessValue = (answer * 2);
        }
        
        // Ensure value is within 1-10 range
        mindfulnessValue = Math.max(1, Math.min(10, mindfulnessValue));
        mindfulnessValues.push(mindfulnessValue);
      });
    }
    
    // Calculate average and round to nearest integer
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
    // Convert numeric answers (1-5) to strings for storage
    const questionnaire: QuestionAnswer[] = questions.map((q) => ({
      id: q.id,
      question: q.question,
      answer: String(answers[q.id] || 1),
    }));

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
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Step {step} of 3
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
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
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
            {/* Consumption Score */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-foreground/80">
                  Rank your need for this item (1 = need less, 5 = need more)
                </label>
                <span className="text-lg font-semibold text-primary">
                  {consumptionScore}/5
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={consumptionScore}
                onChange={(e) => setConsumptionScore(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Need Less</span>
                <span>Need More</span>
              </div>
            </div>

            {/* Dynamic Questionnaire */}
          <div className="border-t border-border/50 pt-6">
            <div className="space-y-6">
              {questions.map((q, index) => {
                const currentValue = answers[q.id] || 1;
                const scaleLabels = q.placeholder.split('/');
                const leftLabel = scaleLabels[0]?.trim() || 'Low';
                const rightLabel = scaleLabels[1]?.trim() || 'High';
                
                return (
                  <div key={q.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-foreground/80">
                        {index + 1}. {q.question}
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
            <div className="mb-4">
              <p className="text-foreground/80">
                Based on your mindfulness score of <strong>{calculateMindfulnessScore(answers)}/10</strong>, choose your preferred constraint approach:
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