import { useMemo, useState } from 'react';
import type { Item } from '../types/item';
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';

interface TimeBasedViewProps {
  items: Item[];
  onItemClick: (itemId: string) => void;
  onAddItem: () => void;
}

export function TimeBasedView({ items, onItemClick, onAddItem }: TimeBasedViewProps) {
  const timeBasedItems = items
    .filter(item => item.constraintType === 'time')
    .sort((a, b) => {
      const dateA = new Date(a.waitUntilDate || 0).getTime();
      const dateB = new Date(b.waitUntilDate || 0).getTime();
      return dateA - dateB;
    });

  const [monthOffset, setMonthOffset] = useState(0);

  const calendarMonths = useMemo(() => {
    const today = new Date();
    const baseMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const months = [];

    // Build calendar months for the next 12 months (including current)
    for (let i = 0; i < 12; i++) {
      const current = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + i, 1);

      const firstDayOfWeek = current.getDay(); // 0 (Sun) - 6 (Sat)
      const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();

      const weeks: { date: Date; isCurrentMonth: boolean }[][] = [];
      let currentWeek: { date: Date; isCurrentMonth: boolean }[] = [];

      // Leading days from previous month
      for (let i = 0; i < firstDayOfWeek; i++) {
        const date = new Date(current.getFullYear(), current.getMonth(), i - firstDayOfWeek + 1);
        currentWeek.push({ date, isCurrentMonth: false });
      }

      // Days in current month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(current.getFullYear(), current.getMonth(), day);
        currentWeek.push({ date, isCurrentMonth: true });
        if (currentWeek.length === 7) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
      }

      // Trailing days from next month
      if (currentWeek.length > 0) {
        const remaining = 7 - currentWeek.length;
        const lastDay = new Date(current.getFullYear(), current.getMonth(), daysInMonth);
        for (let i = 1; i <= remaining; i++) {
          const date = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() + i);
          currentWeek.push({ date, isCurrentMonth: false });
        }
        weeks.push(currentWeek);
      }

      months.push({
        key: `${current.getFullYear()}-${current.getMonth()}`,
        monthLabel: current.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        }),
        weeks,
      });
    }

    return months;
  }, []);

  const currentCalendar = calendarMonths[Math.min(Math.max(monthOffset, 0), 11)];

  const itemsByDate = useMemo(() => {
    const map = new Map<string, Item[]>();
    timeBasedItems.forEach((item) => {
      if (!item.waitUntilDate) return;
      const key = new Date(item.waitUntilDate).toISOString().split('T')[0];
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(item);
    });
    return map;
  }, [timeBasedItems]);

  return (
    <div>
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl text-foreground font-serif">
            Time-Based Timeline
          </h2>
          <button
            onClick={onAddItem}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </button>
        </div>

        <h3 className="text-lg font-semibold text-foreground">
          My Calendar
        </h3>

        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setMonthOffset((prev) => Math.max(prev - 1, 0))}
              disabled={monthOffset === 0}
              className="inline-flex items-center justify-center rounded-full p-1.5 border border-border text-muted-foreground hover:bg-muted/40 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground">
                {currentCalendar.monthLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMonthOffset((prev) => Math.min(prev + 1, 11))}
              disabled={monthOffset === 11}
              className="inline-flex items-center justify-center rounded-full p-1.5 border border-border text-muted-foreground hover:bg-muted/40 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 text-xs text-muted-foreground mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="space-y-1">
            {currentCalendar.weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-1">
                {week.map(({ date, isCurrentMonth }) => {
                  const key = date.toISOString().split('T')[0];
                  const itemsForDay = itemsByDate.get(key) || [];
                  const hasItems = itemsForDay.length > 0;
                  const unlockedCount = itemsForDay.length;
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                  const isFutureDay = dayStart.getTime() > today.getTime();
                  const isToday = (
                    date.getFullYear() === today.getFullYear() &&
                    date.getMonth() === today.getMonth() &&
                    date.getDate() === today.getDate()
                  );
                  const daysUntilUnlock = isFutureDay
                    ? Math.ceil((dayStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                    : 0;
                  const showUnlockPreview = hasItems && isFutureDay;

                  const dayButton = (
                    <button
                      key={key}
                      type="button"
                      className={[
                        'relative aspect-square rounded-lg border text-xs flex flex-col items-center justify-center',
                        isCurrentMonth ? 'border-border bg-background' : 'border-transparent text-muted-foreground/60',
                        hasItems ? 'border-primary/60 bg-primary/5' : '',
                        isToday ? 'ring-2 ring-primary/60' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => {
                        if (showUnlockPreview) {
                          // Popover handles the click; don't navigate
                          return;
                        }
                        if (itemsForDay.length === 1) {
                          onItemClick(itemsForDay[0].id);
                        }
                      }}
                    >
                      <span className="text-xs">
                        {date.getDate()}
                      </span>
                      {hasItems && (
                        <div className="mt-1 flex flex-col items-center gap-0.5">
                          <div className="flex gap-0.5 items-center justify-center">
                            {itemsForDay.slice(0, 3).map((item) => (
                              <span
                                key={item.id}
                                className="inline-block w-1.5 h-1.5 rounded-full bg-primary"
                              />
                            ))}
                            {itemsForDay.length > 3 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{itemsForDay.length - 3}
                              </span>
                            )}
                            {showUnlockPreview && (
                              <Clock className="w-3 h-3 text-amber-600 flex-shrink-0" aria-hidden />
                            )}
                          </div>
                          {hasItems && !isFutureDay && (
                            <span className="text-[11px] font-semibold text-emerald-700 text-center px-1 truncate max-w-full">
                              {unlockedCount} item{unlockedCount !== 1 ? 's' : ''} unlocked!
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );

                  if (showUnlockPreview) {
                    return (
                      <Popover key={key}>
                        <PopoverTrigger asChild>
                          {dayButton}
                        </PopoverTrigger>
                        <PopoverContent
                          side="top"
                          align="center"
                          className="max-w-[min(280px,90vw)] bg-green-50 border-green-200 text-foreground shadow-md"
                        >
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-green-800 border-b border-green-200 pb-2">
                              {daysUntilUnlock} day{daysUntilUnlock !== 1 ? 's' : ''} until unlocked
                            </p>
                            <ul className="space-y-1.5 text-sm text-green-900/90">
                              {itemsForDay.map((item) => (
                                <li key={item.id} className="leading-tight">
                                  {item.name}
                                </li>
                              ))}
                            </ul>
                            <p className="text-xs text-green-700 pt-0.5">
                              {itemsForDay.length === 1 ? 'This item' : 'These items'} will be unlocked on this day.
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    );
                  }

                  return dayButton;
                })}
              </div>
            ))}
          </div>

          {timeBasedItems.length === 0 && (
            <p className="mt-3 text-xs text-muted-foreground text-center">
              No time-based items yet. Add an item to see it on the calendar.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-foreground mb-3">
          Items
        </h3>

        {timeBasedItems.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-muted-foreground/40 mb-4">
              <Clock className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-muted-foreground">
              Items with time constraints will appear here in chronological order.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {timeBasedItems.map((item) => {
              const waitDate = new Date(item.waitUntilDate || '');
              const today = new Date();
              const daysRemaining = Math.ceil((waitDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const isPast = daysRemaining < 0;

              return (
                <div
                  key={item.id}
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
                        <Clock className="w-16 h-16 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-medium text-foreground mb-3 line-clamp-2 font-serif">
                      {item.name}
                    </h3>

                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Score</span>
                      <span className={`font-semibold text-lg ${
                        item.consumptionScore >= 7 ? 'text-destructive' :
                        item.consumptionScore >= 4 ? 'text-accent' :
                        'text-primary'
                      }`}>
                        {item.consumptionScore}/10
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>
                          {waitDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className={`font-medium ${
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
