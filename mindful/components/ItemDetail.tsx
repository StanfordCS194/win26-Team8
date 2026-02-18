import { Item, QuestionAnswer } from '../App';
import { ArrowLeft, Calendar, Target, Trash2 } from 'lucide-react';

interface ItemDetailProps {
  item: Item;
  onBack: () => void;
  onDelete: (itemId: string) => void;
}

// Get a short label for a question based on its id and text
function getFactorLabel(id: string, questionText: string): string {
  if (id === 'consumption') return 'Need Awareness';
  if (id === 'urgency') return 'Patience';
  const qLower = questionText.toLowerCase();
  if (qLower.includes('essential') || qLower.includes('important')) return 'Importance';
  if (qLower.includes('alternative') || qLower.includes('satisfied')) return 'Alternatives';
  if (qLower.includes('impact') || qLower.includes('consequence') || qLower.includes('significant')) return 'Impact Awareness';
  if (qLower.includes('integrat') || qLower.includes('confident') || qLower.includes('expect')) return 'Confidence';
  return questionText.split(' ').slice(0, 3).join(' ');
}

// Score breakdown from saved questionnaire data
function ScoreBreakdownFromQuestionnaire({ questionnaire, finalScore }: { questionnaire: QuestionAnswer[]; finalScore: number }) {
  const factors: { label: string; value: number; delta: number }[] = [];

  questionnaire.forEach((qa) => {
    const numericAnswer = parseInt(qa.answer, 10);
    if (isNaN(numericAnswer) || numericAnswer < 1 || numericAnswer > 5) return;

    let value: number;
    if (qa.id === 'urgency') {
      value = 12 - (numericAnswer * 2);
    } else {
      value = numericAnswer * 2;
    }
    value = Math.max(1, Math.min(10, value));
    const label = getFactorLabel(qa.id, qa.question);
    factors.push({ label, value, delta: value - finalScore });
  });

  if (factors.length === 0) return null;

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

export function ItemDetail({ item, onBack, onDelete }: ItemDetailProps) {
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      onDelete(item.id);
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
                    <ScoreBreakdownFromQuestionnaire
                      questionnaire={item.questionnaire}
                      finalScore={item.consumptionScore}
                    />
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