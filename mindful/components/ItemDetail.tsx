import { Item, QuestionAnswer } from '../App';
import { ArrowLeft, Calendar, Target, Trash2, Lock } from 'lucide-react';
import { useState } from 'react';
import { unlockItem } from '../lib/database';

interface ItemDetailProps {
  item: Item;
  onBack: () => void;
  onDelete: (itemId: string) => void;
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

export function ItemDetail({ item, onBack, onDelete }: ItemDetailProps) {
  const [unlockPassword, setUnlockPassword] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlockSuccess, setUnlockSuccess] = useState(false);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      onDelete(item.id);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!unlockPassword.trim()) {
      setUnlockError('Please enter the unlock password');
      return;
    }

    setIsUnlocking(true);
    setUnlockError(null);

    const result = await unlockItem(item.id, unlockPassword.trim().toUpperCase());

    setIsUnlocking(false);

    if (result.success) {
      setUnlockSuccess(true);
      setUnlockPassword('');
      // Refresh the page or update the item state
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      setUnlockError(result.error?.message || 'Incorrect password. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
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
          <div className="aspect-square bg-muted/30 rounded-xl overflow-hidden">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
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
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-5 bg-secondary/30 rounded-xl border border-secondary/40">
                      <Target className="w-5 h-5 text-accent" />
                      <div className="flex-1">
                        <div className="text-sm text-foreground/80 font-medium">Goals-Based Constraint</div>
                        <div className="text-accent font-medium capitalize">
                          {item.difficulty} difficulty
                        </div>
                        {item.isUnlocked && (
                          <div className="text-xs text-primary font-medium mt-1">
                            ✓ Unlocked - Ready to purchase
                          </div>
                        )}
                      </div>
                    </div>
                    {item.friendName && !item.isUnlocked && (
                      <div className="p-4 bg-muted/20 rounded-xl border border-border/30 space-y-3">
                        <div>
                          <p className="text-sm text-foreground/80 mb-1">
                            <strong>{item.friendName}</strong> will unlock this item once you complete your goal.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            The unlock password has been sent to {item.friendEmail || 'your friend'}. They can enter it below to unlock this item.
                          </p>
                        </div>
                        
                        {unlockSuccess ? (
                          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                            <p className="text-sm text-primary font-medium">
                              ✓ Item unlocked successfully! You can now purchase this item.
                            </p>
                          </div>
                        ) : (
                          <form onSubmit={handleUnlock} className="space-y-2">
                            <div>
                              <label className="block text-xs font-medium text-foreground/80 mb-1">
                                Enter unlock password (sent to {item.friendName})
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={unlockPassword}
                                  onChange={(e) => {
                                    setUnlockPassword(e.target.value.toUpperCase());
                                    setUnlockError(null);
                                  }}
                                  placeholder="Enter password"
                                  className="flex-1 px-3 py-2 border border-border bg-input-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground font-mono text-center text-sm tracking-wider"
                                  maxLength={6}
                                  disabled={isUnlocking}
                                />
                                <button
                                  type="submit"
                                  disabled={isUnlocking || !unlockPassword.trim()}
                                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                  <Lock className="w-4 h-4" />
                                  {isUnlocking ? 'Unlocking...' : 'Unlock'}
                                </button>
                              </div>
                            </div>
                            {unlockError && (
                              <p className="text-xs text-destructive">{unlockError}</p>
                            )}
                          </form>
                        )}
                      </div>
                    )}
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
              Delete Item
            </button>
          </div>
        </div>

        {/* Questionnaire Answers */}
        <div className="border-t border-border/50 p-8">
          <h2 className="text-2xl font-serif text-foreground mb-6">
            Your Reflections
          </h2>

          <div className="space-y-6">
            {item.questionnaire.map((qa, index) => {
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
    </div>
  );
}