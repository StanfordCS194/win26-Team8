import { useState, useEffect } from 'react';
import { Home } from './components/Home';
import { ItemDetail } from './components/ItemDetail';
import { AddItemForm } from './components/AddItemForm';
import { TimeBasedView } from './components/TimeBasedView';
import { GoalsBasedView } from './components/GoalsBasedView';
import { Plus } from 'lucide-react';
import './styles/globals.css';

export interface Item {
  id: string;
  name: string;
  imageUrl: string;
  constraintType: 'time' | 'goals';
  consumptionScore: number;
  addedDate: string;
  // Time-based constraint
  waitUntilDate?: string;
  // Goals-based constraint
  difficulty?: 'easy' | 'medium' | 'hard';
  // Questionnaire answers
  questionnaire: {
    why: string;
    alternatives: string;
    impact: string;
    urgency: string;
  };
}

export interface Category {
  id: string;
  name: string;
  imageUrl: string;
  itemIds: string[];
}

type View = 'home' | 'item' | 'add' | 'time' | 'goals';

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Load data from localStorage
  useEffect(() => {
    const storedItems = localStorage.getItem('secondThought_items');
    const storedCategories = localStorage.getItem('secondThought_categories');
    
    if (storedItems) {
      setItems(JSON.parse(storedItems));
    }
    if (storedCategories) {
      setCategories(JSON.parse(storedCategories));
    }
  }, []);

  // Save items to localStorage
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem('secondThought_items', JSON.stringify(items));
    }
  }, [items]);

  // Save categories to localStorage
  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem('secondThought_categories', JSON.stringify(categories));
    }
  }, [categories]);

  const handleAddItem = (item: Omit<Item, 'id' | 'addedDate'>) => {
    const newItem: Item = {
      ...item,
      id: Date.now().toString(),
      addedDate: new Date().toISOString(),
    };
    setItems([...items, newItem]);
    setCurrentView('home');
  };

  const handleItemClick = (itemId: string) => {
    setSelectedItemId(itemId);
    setCurrentView('item');
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
    setCurrentView('home');
  };

  const selectedItem = items.find(item => item.id === selectedItemId);

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="relative flex justify-center items-center">
            <h1 className="text-5xl font-bold text-foreground">Second Thought</h1>
            <img 
              src="/assets/logo.png" 
              alt="Logo" 
              className="absolute right-0 top-0 h-20 w-auto"
            />
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-card/60 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentView('home')}
              className={`py-6 px-8 border-b-4 font-medium text-base transition-colors ${
                currentView === 'home'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setCurrentView('time')}
              className={`py-6 px-8 border-b-4 font-medium text-base transition-colors ${
                currentView === 'time'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setCurrentView('goals')}
              className={`py-6 px-8 border-b-4 font-medium text-base transition-colors ${
                currentView === 'goals'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
              }`}
            >
              Goals
            </button>
          </div>
        </div>
      </nav>

      {/* Add Item Button */}
      <div className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-end">
            <button
              onClick={() => setCurrentView('add')}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
            >
              <Plus className="w-5 h-5" />
              Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        {currentView === 'home' && (
          <Home items={items} onItemClick={handleItemClick} />
        )}
        {currentView === 'item' && selectedItem && (
          <ItemDetail 
            item={selectedItem} 
            onBack={() => setCurrentView('home')}
            onDelete={handleDeleteItem}
          />
        )}
        {currentView === 'add' && (
          <AddItemForm 
            onSubmit={handleAddItem}
            onCancel={() => setCurrentView('home')}
          />
        )}
        {currentView === 'time' && (
          <TimeBasedView items={items} onItemClick={handleItemClick} />
        )}
        {currentView === 'goals' && (
          <GoalsBasedView items={items} onItemClick={handleItemClick} />
        )}
      </main>
    </div>
  );
}