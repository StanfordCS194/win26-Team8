import { useState, useRef, useEffect } from 'react';
import type { Item, ItemCategory } from '../types/item';
import { Calendar, Target, ShoppingBag, Plus, ChevronDown, Check, RefreshCw } from 'lucide-react';

const CATEGORY_ORDER: ItemCategory[] = ['Beauty', 'Clothes', 'Accessories', 'Sports', 'Electronics', 'Home', 'Other'];

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
        {(item.imageUrl && item.imageUrl.trim()) ? (
          <img
            src={item.imageUrl.trim()}
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
  unlockedItems?: Item[];
  onItemClick: (itemId: string) => void;
  onAddItem: () => void;
  onRefresh?: () => void;
  onRetry?: () => void;
  isRefreshing?: boolean;
  isLoading?: boolean;
  loadError?: string | null;
}

export function Home({ items, unlockedItems = [], onItemClick, onAddItem, onRefresh, onRetry, isRefreshing, isLoading, loadError }: HomeProps) {
  const [selectedCategories, setSelectedCategories] = useState<ItemCategory[] | null>(null); // null = All Categories
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'locked' | 'unlocked'>('locked');

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isTimeUnlocked = (item: Item): boolean => {
    if (item.constraintType !== 'time' || !item.waitUntilDate) return false;
    const waitDate = new Date(item.waitUntilDate);
    const waitDayStart = new Date(waitDate.getFullYear(), waitDate.getMonth(), waitDate.getDate());
    return waitDayStart.getTime() <= today.getTime();
  };

  const lockedItems = items.filter((item) => {
    if (item.constraintType === 'time' && item.waitUntilDate) {
      return !isTimeUnlocked(item);
    }
    // Goals-based items remain locked until explicitly unlocked and removed
    return true;
  });

  // For the Unlocked tab, rely primarily on archived unlocked items from Supabase
  const baseItems = activeTab === 'locked' ? lockedItems : unlockedItems;

  const filteredItems =
    selectedCategories === null || selectedCategories.length === 0
      ? baseItems
      : baseItems.filter((item) => {
          const cat = item.category || 'Other';
          return selectedCategories.includes(cat);
        });

  const itemsByCategory = filteredItems.reduce<Record<string, Item[]>>((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  const toggleCategory = (cat: ItemCategory) => {
    setSelectedCategories((prev) => {
      if (prev === null) return [cat];
      const next = prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat];
      return next.length === 0 ? null : next;
    });
  };

  const selectAllCategories = () => setSelectedCategories(null);

  const filterLabel =
    selectedCategories === null || selectedCategories.length === 0
      ? 'All Categories'
      : selectedCategories.length === 1
        ? selectedCategories[0]
        : `${selectedCategories.length} categories`;

  return (
    <div>
      {loadError && (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-destructive">
          <span className="text-sm">{loadError}</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="shrink-0 rounded-md bg-destructive/20 px-3 py-1.5 text-sm font-medium hover:bg-destructive/30"
            >
              Try again
            </button>
          )}
        </div>
      )}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl text-foreground font-serif">Your Reflection List</h2>
          <p className="text-muted-foreground mt-2">
            Take a moment to reconsider before making your purchase
          </p>
        </div>
        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              title="Refresh list from database"
            >
              <RefreshCw className={`w-4 h-4 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          )}
          {/* Category filter dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted/30 transition-colors min-w-[180px] justify-between"
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
            >
              <span className="truncate">{filterLabel}</span>
              <ChevronDown
                className={`w-4 h-4 shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {dropdownOpen && (
              <div
                className="absolute top-full left-0 mt-1 w-56 rounded-lg border border-border bg-card shadow-lg z-10 py-1"
                role="listbox"
              >
                <button
                  type="button"
                  onClick={selectAllCategories}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                >
                  {(selectedCategories === null || selectedCategories.length === 0) && (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  )}
                  <span className={selectedCategories === null ? 'font-medium' : ''}>
                    All Categories
                  </span>
                </button>
                <div className="border-t border-border my-1" />
                {CATEGORY_ORDER.map((cat) => {
                  const isChecked = selectedCategories !== null && selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                    >
                      {isChecked ? (
                        <Check className="w-4 h-4 text-primary shrink-0" />
                      ) : (
                        <span className="w-4 h-4 shrink-0" />
                      )}
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button
            onClick={onAddItem}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </button>
        </div>
      </div>

      {/* Locked / Unlocked tabs under title */}
      <div className="mb-6">
        <div className="inline-flex items-center rounded-full bg-muted/40 border border-border px-1.5 py-1 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('locked')}
            className={`px-4 py-2 text-sm sm:text-base rounded-full font-medium transition-colors ${
              activeTab === 'locked'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Locked
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('unlocked')}
            className={`px-4 py-2 text-sm sm:text-base rounded-full font-medium transition-colors ${
              activeTab === 'unlocked'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Unlocked
          </button>
        </div>
      </div>

      {baseItems.length === 0 && isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl border border-border/50 overflow-hidden bg-card animate-pulse">
              <div className="aspect-square bg-muted/40" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-muted/50 rounded w-3/4" />
                <div className="h-4 bg-muted/40 rounded w-1/2" />
                <div className="h-4 bg-muted/40 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : baseItems.length === 0 ? (
        activeTab === 'locked' ? (
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
          <div className="text-center py-16">
            <div className="text-muted-foreground/40 mb-4">
              <ShoppingBag className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl text-foreground/80 mb-2">No unlocked items yet</h3>
            <p className="text-muted-foreground">
              Once the goal is completed or the time has passed, your unlocked items will show up here.
            </p>
          </div>
        )
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-muted-foreground/40 mb-4">
            <ShoppingBag className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl text-foreground/80 mb-2">No items in selected categories</h3>
          <p className="text-muted-foreground">
            Try selecting more categories or choose All Categories to see everything.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {activeTab === 'unlocked' ? (
            <>
              {/* Goals-based unlocked items first */}
              {(() => {
                const goalsItems = filteredItems.filter((item) => item.constraintType === 'goals');
                if (!goalsItems.length) return null;
                const goalsByCategory = goalsItems.reduce<Record<string, Item[]>>((acc, item) => {
                  const category = item.category || 'Other';
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(item);
                  return acc;
                }, {});
                return (
                  <section>
                    <h2 className="text-3xl font-serif text-foreground mb-3">
                      <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-black font-semibold text-lg uppercase">
                        Goals-based items
                      </span>
                    </h2>
                    <div className="space-y-8">
                      {CATEGORY_ORDER.filter((cat) => (goalsByCategory[cat]?.length ?? 0) > 0).map((category) => (
                        <div key={category}>
                          <h3 className="text-lg font-semibold text-foreground font-serif mb-3 flex items-center gap-2">
                            <span className="text-primary">{category}</span>
                            <span className="text-sm font-normal text-muted-foreground">
                              ({goalsByCategory[category].length}{' '}
                              {goalsByCategory[category].length === 1 ? 'item' : 'items'})
                            </span>
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {goalsByCategory[category].map((item) => (
                              <ItemCard key={item.id} item={item} onItemClick={onItemClick} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })()}

              {/* Time-based unlocked items second */}
              {(() => {
                const timeItems = filteredItems.filter((item) => item.constraintType === 'time');
                if (!timeItems.length) return null;
                const timeByCategory = timeItems.reduce<Record<string, Item[]>>((acc, item) => {
                  const category = item.category || 'Other';
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(item);
                  return acc;
                }, {});
                return (
                  <section>
                    <h2 className="text-xl font-serif text-foreground mb-2">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/60 border border-border text-foreground font-semibold text-sm uppercase tracking-wide">
                        Time-based items
                      </span>
                    </h2>
                    <div className="space-y-8">
                      {CATEGORY_ORDER.filter((cat) => (timeByCategory[cat]?.length ?? 0) > 0).map((category) => (
                        <div key={category}>
                          <h3 className="text-lg font-semibold text-foreground font-serif mb-3 flex items-center gap-2">
                            <span className="text-primary">{category}</span>
                            <span className="text-sm font-normal text-muted-foreground">
                              ({timeByCategory[category].length}{' '}
                              {timeByCategory[category].length === 1 ? 'item' : 'items'})
                            </span>
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {timeByCategory[category].map((item) => (
                              <ItemCard key={item.id} item={item} onItemClick={onItemClick} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })()}
            </>
          ) : (
            CATEGORY_ORDER.filter((cat) => (itemsByCategory[cat]?.length ?? 0) > 0).map((category) => (
              <section key={category}>
                <h3 className="text-lg font-semibold text-foreground font-serif mb-4 flex items-center gap-2">
                  <span className="text-primary">{category}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    ({itemsByCategory[category].length}{' '}
                    {itemsByCategory[category].length === 1 ? 'item' : 'items'})
                  </span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {itemsByCategory[category].map((item) => (
                    <ItemCard key={item.id} item={item} onItemClick={onItemClick} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      )}
    </div>
  );
}
