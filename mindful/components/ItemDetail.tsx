import type { Item, QuestionAnswer } from '../types/item';
import { ArrowLeft, Calendar, Target, Trash2, ShoppingBag, Lock } from 'lucide-react';
import { useState } from 'react';
import { DeleteReasonDialog } from './DeleteReasonDialog';
import { UnlockedItemRemoveDialog } from './UnlockedItemRemoveDialog';
import type { DidntBuySubReason } from './UnlockedItemRemoveDialog';

export interface DeletionReasonData {
  reason: 'dont_want' | 'purchased_early';
  subReason?: string;
}

interface ItemDetailProps {
  item: Item;
  onBack: () => void;
  onDelete: (itemId: string, deletionReason?: DeletionReasonData) => void;
  /** When true, this item is from the Unlocked tab; Delete shows reconsideration dialog and calls onRemoveUnlocked instead of onDelete. */
  isUnlockedItem?: boolean;
  onRemoveUnlocked?: (itemId: string, subReason: DidntBuySubReason | string) => void;
}

// Check if the item's constraint (time or goal) has been completed
function isConstraintComplete(item: Item): boolean {
  if (item.constraintType === 'time' && item.waitUntilDate) {
    const today = new Date().toISOString().split('T')[0];
    return today >= item.waitUntilDate;
  }
  // Goals-based: constraint is only "complete" when they unlock (separate flow).
  // When using Delete button, they haven't completed the goal.
  return false;
}

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

export function ItemDetail({ item, onBack, onDelete, isUnlockedItem, onRemoveUnlocked }: ItemDetailProps) {
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [unlockSuccess, setUnlockSuccess] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showDeleteReasonDialog, setShowDeleteReasonDialog] = useState(false);
  const [showUnlockedRemoveDialog, setShowUnlockedRemoveDialog] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleDelete = () => {
    if (isUnlockedItem && onRemoveUnlocked) {
      setShowUnlockedRemoveDialog(true);
      return;
    }
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }
    if (isConstraintComplete(item)) {
      onDelete(item.id);
    } else {
      setShowDeleteReasonDialog(true);
    }
  };

  const handleUnlockedRemoveConfirm = (subReason: DidntBuySubReason | string) => {
    onRemoveUnlocked?.(item.id, subReason);
  };

  const handleDeleteReasonSelected = (
    reason: 'dont_want' | 'purchased_early',
    subReason?: string
  ) => {
    setShowDeleteReasonDialog(false);
    onDelete(item.id, { reason, subReason });
  };

  const handlePasswordChange = (value: string) => {
    setUnlockPassword(value);
    setUnlockError('');
    setUnlockSuccess(false);
    setShowCelebration(false);
    
    // Real-time validation if password is set
    if (item.unlockPassword && value.trim()) {
      if (value.trim() === item.unlockPassword) {
        setUnlockSuccess(true);
        setUnlockError('');
      } else if (value.trim().length >= item.unlockPassword.length) {
        setUnlockError('Incorrect password');
        setUnlockSuccess(false);
      }
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError('');
    setUnlockSuccess(false);
    
    if (!unlockPassword.trim()) {
      setUnlockError('Please enter the unlock password');
      return;
    }

    if (!item.unlockPassword) {
      setUnlockError('This item does not have an unlock password set');
      return;
    }

    if (unlockPassword.trim() === item.unlockPassword) {
      // Password matches - unlock by deleting the item
      setUnlockSuccess(true);
      setIsUnlocking(true);
      setShowCelebration(true);
      // Small delay for better UX
      setTimeout(() => {
        onDelete(item.id);
      }, 1500);
    } else {
      setUnlockError('Incorrect password. Please check with your friend.');
      setUnlockSuccess(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <DeleteReasonDialog
        open={showDeleteReasonDialog}
        onOpenChange={setShowDeleteReasonDialog}
        onSelect={handleDeleteReasonSelected}
        constraintType={item.constraintType}
      />
      <UnlockedItemRemoveDialog
        open={showUnlockedRemoveDialog}
        onOpenChange={setShowUnlockedRemoveDialog}
        onConfirm={handleUnlockedRemoveConfirm}
      />
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to list
      </button>

      <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
        <div className="grid md:grid-cols-2 gap-6 p-8">
          {/* Image */}
          <div className="aspect-square bg-muted/30 rounded-xl overflow-hidden flex items-center justify-center">
            {(item.imageUrl && item.imageUrl.trim()) ? (
              <img
                src={item.imageUrl.trim()}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/400/e5e7eb/9ca3af?text=No+Image';
                }}
              />
            ) : (
              <ShoppingBag className="w-20 h-20 text-muted-foreground/30" />
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <div className="flex-1">
              <h1 className="text-3xl font-serif text-foreground mb-6">
                {item.name}
              </h1>

              <div className="space-y-4 mb-6">
                <div className="p-5 bg-muted/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/80">Mindfulness Score</span>
                    <span className={`text-2xl font-semibold font-serif ${
                      item.consumptionScore >= 7 ? 'text-destructive' : 
                      item.consumptionScore >= 4 ? 'text-accent' : 
                      'text-primary'
                    }`}>
                      {item.consumptionScore}/10
                    </span>
                  </div>
                  {item.questionnaire && item.questionnaire.length > 0 && (
                    <p className="text-sm text-foreground/70 leading-relaxed pt-2 border-t border-border/30">
                      {generateMindfulnessExplanation(item.questionnaire, item.consumptionScore)}
                    </p>
                  )}
                </div>

                {/* Goal description for goals-based items */}
                {item.constraintType === 'goals' && (() => {
                  const goalQuestion = item.questionnaire?.find(qa => qa.id === 'goal');
                  return (
                    <div className="space-y-4">
                      {goalQuestion && goalQuestion.answer && (
                        <div className="p-5 bg-secondary/20 rounded-xl border border-secondary/30">
                          <div className="flex items-start gap-3">
                            <Target className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="text-sm text-foreground/80 font-medium mb-2">Your Goal</div>
                              <p className="text-foreground/90 leading-relaxed mb-3">
                                {goalQuestion.answer}
                              </p>
                              {item.friendName && (
                                <div className="pt-3 border-t border-secondary/30">
                                  <div className="text-xs text-foreground/70 mb-1">Unlock Guardian</div>
                                  <div className="text-sm font-medium text-accent">
                                    {item.friendName}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Unlock Password Input - hide when viewing from Unlocked tab (already unlocked) */}
                      {!isUnlockedItem && (
                      <form onSubmit={handleUnlock} className="p-5 bg-primary/10 rounded-xl border border-primary/20">
                        <div className="flex items-start gap-3">
                          <Lock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm text-foreground/80 font-medium mb-2">Unlock Item</div>
                            <p className="text-xs text-muted-foreground mb-3">
                              {item.friendName 
                                ? `Enter the password sent to ${item.friendName} to unlock this item and mark your goal as complete.`
                                : 'Enter the unlock password to unlock this item and mark your goal as complete.'}
                            </p>
                            <div className="flex gap-2">
                              <div className="flex-1 relative">
                                <input
                                  type="text"
                                  value={unlockPassword}
                                  onChange={(e) => handlePasswordChange(e.target.value)}
                                  placeholder="Enter unlock password"
                                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 text-foreground placeholder:text-muted-foreground transition-colors ${
                                    unlockSuccess
                                      ? 'border-green-500 bg-green-50/50 focus:ring-green-500/50'
                                      : unlockError
                                      ? 'border-destructive bg-destructive/10 focus:ring-destructive/50'
                                      : 'border-border bg-input-background focus:ring-primary/50'
                                  }`}
                                  disabled={isUnlocking}
                                />
                                {unlockPassword.trim() && item.unlockPassword && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {unlockSuccess ? (
                                      <span className="text-green-600 text-sm font-medium">✓ Correct</span>
                                    ) : unlockError && unlockPassword.trim().length >= item.unlockPassword.length ? (
                                      <span className="text-destructive text-sm font-medium">✗ Incorrect</span>
                                    ) : null}
                                  </div>
                                )}
                              </div>
                              <button
                                type="submit"
                                disabled={isUnlocking || !unlockPassword.trim() || !item.unlockPassword}
                                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                              >
                                {isUnlocking ? 'Unlocking...' : 'Unlock'}
                              </button>
                            </div>
                            {unlockError && !unlockSuccess && (
                              <p className="text-sm text-destructive mt-2">
                                {unlockError}
                              </p>
                            )}
                            {unlockSuccess && (
                              <p className="text-sm text-green-600 mt-2 font-medium">
                                Password correct! Unlocking item...
                              </p>
                            )}
                            {!item.unlockPassword && (
                              <p className="text-xs text-muted-foreground mt-2">
                                No unlock password is set for this item.
                              </p>
                            )}
                          </div>
                        </div>
                      </form>
                      )}
                    </div>
                  );
                })()}

                {item.constraintType === 'time' && item.waitUntilDate && (
                  <div className="flex items-center gap-3 p-5 bg-primary/10 rounded-xl border border-primary/20">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <div className="text-sm text-foreground/80 font-medium">Time-Based Constraint</div>
                      <div className="text-primary font-medium">
                        Wait until {new Date(item.waitUntilDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {item.constraintType === 'goals' && item.difficulty && (
                  <div className="flex items-center gap-3 p-5 bg-secondary/30 rounded-xl border border-secondary/40">
                    <Target className="w-5 h-5 text-accent" />
                    <div>
                      <div className="text-sm text-foreground/80 font-medium">Goals-Based Constraint</div>
                      <div className="text-accent font-medium capitalize">
                        {item.difficulty} difficulty
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  Added on {new Date(item.addedDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={handleDelete}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-destructive/30 text-destructive rounded-xl hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {isUnlockedItem ? 'Remove from list' : 'Delete Item'}
            </button>
          </div>
        </div>

        {/* Questionnaire Answers */}
        <div className="border-t border-border/50 p-8">
          <h2 className="text-2xl font-serif text-foreground mb-6">
            Your Reflections
          </h2>

          <div className="space-y-6">
            {item.questionnaire
              .filter(qa => qa.id !== 'goal') // Exclude goal from reflections section since it's shown at top
              .map((qa, index) => {
                // Check if answer is a numeric value (1-5 scale)
                const numericAnswer = parseInt(qa.answer, 10);
                const isNumericAnswer = !isNaN(numericAnswer) && numericAnswer >= 1 && numericAnswer <= 5;
                
                return (
                  <div key={qa.id} className="p-5 bg-muted/20 rounded-xl">
                    <h3 className="font-medium text-foreground mb-3 font-serif">
                      {index + 1}. {qa.question}
                    </h3>
                    {isNumericAnswer ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-semibold text-primary">
                            {numericAnswer}/5
                          </span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${(numericAnswer / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-foreground/80 leading-relaxed">
                        {qa.answer}
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="relative max-w-md w-full mx-4 bg-card rounded-3xl shadow-xl border border-primary/30 px-8 py-10 text-center overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="confetti-container">
                {Array.from({ length: 80 }).map((_, index) => (
                  <span
                    key={index}
                    className="confetti-piece"
                    style={{
                      left: `${(index / 80) * 100}%`,
                      animationDelay: `${(index % 10) * -0.25}s`,
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="relative">
              <p className="text-sm uppercase tracking-[0.2em] text-accent mb-2">
                Goal Completed
              </p>
              <h2 className="text-2xl font-serif text-foreground mb-3">
                Congratulations!
              </h2>
              <p className="text-sm text-foreground/80 leading-relaxed">
                You completed your goal and have unlocked{' '}
                <span className="font-semibold text-primary">{item.name}</span>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}