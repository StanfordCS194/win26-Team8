import type { Item, ItemCategory } from '../types/item';
import { Calendar, Target, ShoppingBag, Plus } from 'lucide-react';

const CATEGORY_ORDER: ItemCategory[] = ['Food', 'Clothes', 'Sports', 'Electronics', 'Home', 'Other'];

function ItemCard({
  item,
  onItemClick,
}: {
  item: Item;
  onItemClick: (itemId: string) => void;
}) {
  return (
    <div
      onClick={() => onItemClick(item.id)}
      className="bg-card rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border border-border/50 hover:border-primary/30"
    >
      <div className="aspect-square bg-muted/30 overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/400/e5e7eb/9ca3af?text=No+Image';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/50">
            <ShoppingBag className="w-16 h-16 text-muted-foreground/30" />
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-medium text-foreground mb-3 line-clamp-2 font-serif">
          {item.name}
        </h3>

        <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/50">
          <span className="text-sm text-muted-foreground">Consumption Score</span>
          <span
            className={`font-semibold text-lg ${
              item.consumptionScore >= 7
                ? 'text-destructive'
                : item.consumptionScore >= 4
                  ? 'text-accent'
                  : 'text-primary'
            }`}
          >
            {item.consumptionScore}/10
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {item.constraintType === 'time' && item.waitUntilDate && (
            <>
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Wait until {new Date(item.waitUntilDate).toLocaleDateString()}</span>
            </>
          )}
          {item.constraintType === 'goals' && item.difficulty && (
            <>
              <Target className="w-4 h-4 shrink-0" />
              <span className="capitalize">{item.difficulty} goal</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface HomeProps {
  items: Item[];
  onItemClick: (itemId: string) => void;
  onAddItem: () => void;
}

export function Home({ items, onItemClick, onAddItem }: HomeProps) {
  const itemsByCategory = items.reduce<Record<string, Item[]>>((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

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
        <div className="space-y-10">
          {CATEGORY_ORDER.filter((cat) => (itemsByCategory[cat]?.length ?? 0) > 0).map((category) => (
            <section key={category}>
              <h3 className="text-lg font-semibold text-foreground font-serif mb-4 flex items-center gap-2">
                <span className="text-primary">{category}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  ({itemsByCategory[category].length} {itemsByCategory[category].length === 1 ? 'item' : 'items'})
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {itemsByCategory[category].map((item) => (
                  <ItemCard key={item.id} item={item} onItemClick={onItemClick} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
