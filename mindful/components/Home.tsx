import { Item } from '../App';
import { Calendar, Target, ShoppingBag, Plus } from 'lucide-react';

interface HomeProps {
  items: Item[];
  onItemClick: (itemId: string) => void;
  onAddItem: () => void;
}

export function Home({ items, onItemClick, onAddItem }: HomeProps) {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl text-foreground font-serif">Your Reflection List</h2>
          <p className="text-muted-foreground mt-2">
            Take a moment to reconsider before making your purchase
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

      {items.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-muted-foreground/40 mb-4">
            <ShoppingBag className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl text-foreground/80 mb-2">No items yet</h3>
          <p className="text-muted-foreground">
            Start adding items you're considering purchasing to reflect on your decisions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className="bg-card rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border border-border/50 hover:border-primary/30"
            >
              <div className="aspect-square bg-muted/30 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-5">
                <h3 className="font-medium text-foreground mb-3 line-clamp-2 font-serif">
                  {item.name}
                </h3>
                
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Consumption Score</span>
                  <span className={`font-semibold text-lg ${
                    item.consumptionScore >= 7 ? 'text-destructive' : 
                    item.consumptionScore >= 4 ? 'text-accent' : 
                    'text-primary'
                  }`}>
                    {item.consumptionScore}/10
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {item.constraintType === 'time' && item.waitUntilDate && (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Wait until {new Date(item.waitUntilDate).toLocaleDateString()}</span>
                    </>
                  )}
                  {item.constraintType === 'goals' && item.difficulty && (
                    <>
                      <Target className="w-4 h-4" />
                      <span className="capitalize">{item.difficulty} goal</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}