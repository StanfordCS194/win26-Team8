import { Item } from '../App';
import { Calendar, Clock } from 'lucide-react';

interface TimeBasedViewProps {
  items: Item[];
  onItemClick: (itemId: string) => void;
}

export function TimeBasedView({ items, onItemClick }: TimeBasedViewProps) {
  const timeBasedItems = items
    .filter(item => item.constraintType === 'time')
    .sort((a, b) => {
      const dateA = new Date(a.waitUntilDate || 0).getTime();
      const dateB = new Date(b.waitUntilDate || 0).getTime();
      return dateA - dateB;
    });

  if (timeBasedItems.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-muted-foreground/40 mb-4">
          <Clock className="w-16 h-16 mx-auto" />
        </div>
        <h2 className="text-xl text-foreground/80 mb-2">No time-based items</h2>
        <p className="text-muted-foreground">
          Items with time constraints will appear here in chronological order.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl text-foreground font-serif">Time-Based Items</h2>
        <p className="text-muted-foreground mt-2">
          Sorted by wait date (earliest first)
        </p>
      </div>

      <div className="space-y-4">
        {timeBasedItems.map((item) => {
          const waitDate = new Date(item.waitUntilDate || '');
          const today = new Date();
          const daysRemaining = Math.ceil((waitDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const isPast = daysRemaining < 0;

          return (
            <div
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className="bg-card rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-border/50 hover:border-primary/30 p-5"
            >
              <div className="flex gap-4">
                <div className="w-24 h-24 flex-shrink-0 bg-muted/30 rounded-xl overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground mb-2 font-serif">
                    {item.name}
                  </h3>
                  
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground/80">
                        {waitDate.toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    
                    <div className={`text-sm font-medium ${
                      isPast ? 'text-primary' : 
                      daysRemaining <= 7 ? 'text-accent' : 
                      'text-muted-foreground'
                    }`}>
                      {isPast ? 
                        'Ready to purchase' : 
                        `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`
                      }
                    </div>
                  </div>

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
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}