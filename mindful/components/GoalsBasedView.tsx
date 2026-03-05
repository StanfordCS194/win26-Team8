import { useState } from 'react';
import type { Item } from '../types/item';
import { Target, Plus } from 'lucide-react';

interface GoalsBasedViewProps {
  items: Item[];
  activeSubtab?: 'locked' | 'unlocked';
  onSubtabChange?: (tab: 'locked' | 'unlocked') => void;
  onItemClick: (itemId: string) => void;
  onAddItem: () => void;
}

export function GoalsBasedView({ items, activeSubtab, onSubtabChange, onItemClick, onAddItem }: GoalsBasedViewProps) {
  const goalsBasedItems = items.filter(item => item.constraintType === 'goals');
  const [internalTab, setInternalTab] = useState<'locked' | 'unlocked'>('locked');
  const isControlled = activeSubtab !== undefined && onSubtabChange !== undefined;
  const activeTab = isControlled ? activeSubtab : internalTab;
  const setActiveTab = (tab: 'locked' | 'unlocked') => {
    if (isControlled) onSubtabChange?.(tab);
    else setInternalTab(tab);
  };

  const lockedItems = goalsBasedItems.filter((item) => !item.isUnlocked);
  const unlockedItems = goalsBasedItems.filter((item) => item.isUnlocked);
  const visibleItems = activeTab === 'locked' ? lockedItems : unlockedItems;

  const easyItems = visibleItems.filter(item => item.difficulty === 'easy');
  const mediumItems = visibleItems.filter(item => item.difficulty === 'medium');
  const hardItems = visibleItems.filter(item => item.difficulty === 'hard');

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
          {items.map((item) => {
            const goalText = item.questionnaire?.find((qa) => qa.id === 'goal')?.answer?.trim();
            return (
              <div
                key={item.id}
                onClick={() => onItemClick(item.id)}
                className={`bg-card rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 ${borderColor} p-5`}
              >
                <div className="flex gap-4">
                  <div className="w-20 h-20 flex-shrink-0 bg-muted/30 rounded-xl overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/100/e5e7eb/9ca3af?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted/50">
                        <Target className="w-6 h-6 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground mb-2 font-serif line-clamp-2">
                      {goalText || 'Goal not set'}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      <span className="text-foreground/90">{item.name}</span>
                    </p>
                    
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
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl text-foreground font-serif">Goal-Based Items</h2>
          <p className="text-muted-foreground mt-2">
            Complete your goals and unlock items as rewards
          </p>
        </div>
        <button
          onClick={onAddItem}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>

      {/* Locked / Unlocked tabs */}
      <div className="mb-6 border-b border-border">
        <div className="flex items-center gap-6 sm:gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('locked')}
            className={`relative pb-3 pt-0.5 text-sm sm:text-base transition-colors ${
              activeTab === 'locked'
                ? 'text-foreground font-semibold'
                : 'text-muted-foreground font-medium hover:text-foreground'
            }`}
          >
            Locked
            {activeTab === 'locked' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('unlocked')}
            className={`relative pb-3 pt-0.5 text-sm sm:text-base transition-colors ${
              activeTab === 'unlocked'
                ? 'text-foreground font-semibold'
                : 'text-muted-foreground font-medium hover:text-foreground'
            }`}
          >
            Unlocked
            {activeTab === 'unlocked' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
            )}
          </button>
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-muted-foreground/40 mb-4">
            <Target className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl text-foreground/80 mb-2">
            {activeTab === 'locked' ? 'No locked goals-based items' : 'No unlocked goals-based items'}
          </h3>
          <p className="text-muted-foreground">
            {activeTab === 'locked'
              ? 'Items with goal constraints will appear here organized by difficulty.'
              : 'Once your goals are completed, your unlocked goals-based items will appear here.'}
          </p>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
