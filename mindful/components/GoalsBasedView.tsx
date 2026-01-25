import { Item } from '../App';
import { Target } from 'lucide-react';

interface GoalsBasedViewProps {
  items: Item[];
  onItemClick: (itemId: string) => void;
}

export function GoalsBasedView({ items, onItemClick }: GoalsBasedViewProps) {
  const goalsBasedItems = items.filter(item => item.constraintType === 'goals');

  const easyItems = goalsBasedItems.filter(item => item.difficulty === 'easy');
  const mediumItems = goalsBasedItems.filter(item => item.difficulty === 'medium');
  const hardItems = goalsBasedItems.filter(item => item.difficulty === 'hard');

  if (goalsBasedItems.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-muted-foreground/40 mb-4">
          <Target className="w-16 h-16 mx-auto" />
        </div>
        <h2 className="text-xl text-foreground/80 mb-2">No goals-based items</h2>
        <p className="text-muted-foreground">
          Items with goal constraints will appear here organized by difficulty.
        </p>
      </div>
    );
  }

  const renderSection = (
    title: string, 
    items: Item[], 
    color: string,
    bgColor: string,
    borderColor: string
  ) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-3 h-3 rounded-full ${bgColor}`} />
          <h3 className={`text-xl font-serif ${color}`}>
            {title} ({items.length})
          </h3>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={`bg-card rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 ${borderColor} p-5`}
            >
              <div className="flex gap-4">
                <div className="w-20 h-20 flex-shrink-0 bg-muted/30 rounded-xl overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground mb-2 font-serif">
                    {item.name}
                  </h4>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Score:</span>
                      <span className={`font-semibold ${
                        item.consumptionScore >= 7 ? 'text-destructive' : 
                        item.consumptionScore >= 4 ? 'text-accent' : 
                        'text-primary'
                      }`}>
                        {item.consumptionScore}/10
                      </span>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Added {new Date(item.addedDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl text-foreground font-serif">Goals-Based Items</h2>
        <p className="text-muted-foreground mt-2">
          Organized by difficulty level
        </p>
      </div>

      {renderSection(
        'Easy',
        easyItems,
        'text-primary',
        'bg-primary',
        'border-primary'
      )}

      {renderSection(
        'Medium',
        mediumItems,
        'text-accent',
        'bg-accent',
        'border-accent'
      )}

      {renderSection(
        'Hard',
        hardItems,
        'text-destructive',
        'bg-destructive',
        'border-destructive'
      )}
    </div>
  );
}