import { useState } from 'react';
import { Item } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';

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
  const [consumptionScore, setConsumptionScore] = useState(5);
  
  const [why, setWhy] = useState('');
  const [alternatives, setAlternatives] = useState('');
  const [impact, setImpact] = useState('');
  const [urgency, setUrgency] = useState('');

  const resetForm = () => {
    setStep(1);
    setName('');
    setImageUrl('');
    setConstraintType('time');
    setWaitUntilDate('');
    setDifficulty('medium');
    setConsumptionScore(5);
    setWhy('');
    setAlternatives('');
    setImpact('');
    setUrgency('');
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate time-based constraint
    const days = consumptionScore * 7; // 1 week per score point
    const waitDate = new Date();
    waitDate.setDate(waitDate.getDate() + days);
    setWaitUntilDate(waitDate.toISOString().split('T')[0]);
    
    // Calculate goals-based difficulty
    if (consumptionScore <= 3) {
      setDifficulty('easy');
    } else if (consumptionScore <= 7) {
      setDifficulty('medium');
    } else {
      setDifficulty('hard');
    }
    
    setStep(3);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📋 Final submit - preparing item data');
    
    onSubmit({
      name,
      imageUrl: imageUrl || '',
      constraintType,
      consumptionScore,
      ...(constraintType === 'time' ? { waitUntilDate } : { difficulty }),
      questionnaire: {
        why,
        alternatives,
        impact,
        urgency,
      },
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
              className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
            >
              Continue to Reflection
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-3 border border-border text-foreground rounded-full hover:bg-muted/30 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-6">
            {/* Consumption Score */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-3">
                Consumption Score: {consumptionScore}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={consumptionScore}
                onChange={(e) => setConsumptionScore(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Need Less</span>
                <span>Need More</span>
              </div>
            </div>

            {/* Questionnaire */}
          <div className="border-t border-border/50 pt-6">
            <h3 className="text-lg font-serif text-foreground mb-4">
              Reflection Questions
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Why do you want this item? *
                </label>
                <textarea
                  value={why}
                  onChange={(e) => setWhy(e.target.value)}
                  required
                  rows={3}
                  placeholder="Think about your motivations..."
                  className="w-full px-4 py-3 border border-border bg-input-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  What alternatives have you considered? *
                </label>
                <textarea
                  value={alternatives}
                  onChange={(e) => setAlternatives(e.target.value)}
                  required
                  rows={3}
                  placeholder="Could you borrow it? Do you already have something similar?"
                  className="w-full px-4 py-3 border border-border bg-input-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  What impact will this purchase have? *
                </label>
                <textarea
                  value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                  required
                  rows={3}
                  placeholder="Consider financial, environmental, and personal impact..."
                  className="w-full px-4 py-3 border border-border bg-input-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  How urgent is this purchase? *
                </label>
                <textarea
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  required
                  rows={3}
                  placeholder="Do you need it now or can it wait?"
                  className="w-full px-4 py-3 border border-border bg-input-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-foreground placeholder:text-muted-foreground"
                />
              </div>
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
                Based on your consumption score of <strong>{consumptionScore}/10</strong>, choose your preferred constraint approach:
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