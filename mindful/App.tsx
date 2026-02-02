import { useState, useEffect } from 'react';
import { Home } from './components/Home';
import { ItemDetail } from './components/ItemDetail';
import { AddItemForm } from './components/AddItemForm';
import { TimeBasedView } from './components/TimeBasedView';
import { GoalsBasedView } from './components/GoalsBasedView';
import { OurMission } from './components/OurMission';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { Profile } from './components/Profile';
import { Plus, User } from 'lucide-react';
import './styles/globals.css';
import logoImage from './assets/logo.png';
import { fetchItems, saveItem, deleteItem as deleteItemDb } from './lib/database';

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

type View = 'home' | 'item' | 'add' | 'time' | 'goals' | 'mission' | 'profile';

function AppContent() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentView, setCurrentView] = useState<View>('mission');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Load items from Supabase when user is authenticated
  useEffect(() => {
    if (user) {
      loadItems();
    } else if (!loading) {
      // User not authenticated, clear items
      setItems([]);
    }
  }, [user, loading]);

  const loadItems = async () => {
    // Try user-specific localStorage first
    const userKey = `secondThought_user_${user?.id}_items`;
    const userItems = localStorage.getItem(userKey);
    
    if (userItems) {
      console.log('✅ Loaded items from user-specific localStorage');
      setItems(JSON.parse(userItems));
      return;
    }
    
    // Try general localStorage
    const generalItems = localStorage.getItem('secondThought_items');
    if (generalItems) {
      console.log('✅ Loaded items from general localStorage');
      setItems(JSON.parse(generalItems));
      return;
    }
    
    // Try Supabase last (as it's timing out)
    console.log('🌐 Attempting to load from Supabase...');
    try {
      const { items: loadedItems, error } = await fetchItems();
      if (!error && loadedItems && loadedItems.length > 0) {
        setItems(loadedItems);
        console.log('✅ Loaded items from Supabase');
      }
    } catch (err) {
      console.warn('⚠️ Supabase load failed:', err);
    }
  };

  const handleAddItem = async (item: Omit<Item, 'id' | 'addedDate'>) => {
    console.log('📋 handleAddItem called with:', item);
    
    // IMMEDIATELY switch to home view first
    setCurrentView('home');
    console.log('🔄 Switched to All Items view');
    
    // Generate UUID (with fallback)
    const generateId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      // Fallback UUID generation
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
    
    const newItem: Item = {
      ...item,
      id: generateId(),
      addedDate: new Date().toISOString(),
    };
    
    console.log('🆕 Created new item with ID:', newItem.id);
    
    // Update state immediately
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    
    // Save to localStorage first (guaranteed to work)
    console.log('💾 Saving to localStorage...');
    localStorage.setItem('secondThought_items', JSON.stringify(updatedItems));
    localStorage.setItem(`secondThought_user_${user?.id}_items`, JSON.stringify(updatedItems));
    console.log('✅ Item saved to localStorage');
    
    // Try to save to Supabase in the background (non-blocking)
    console.log('🌐 Attempting Supabase save in background...');
    saveItem(newItem).then(({ success, error }) => {
      if (success) {
        console.log('✅ Also saved to Supabase successfully');
      } else {
        console.warn('⚠️ Supabase save failed (using localStorage only):', error?.message || error);
      }
    }).catch(err => {
      console.warn('⚠️ Supabase save error (using localStorage only):', err);
    });
  };

  const handleItemClick = (itemId: string) => {
    setSelectedItemId(itemId);
    setCurrentView('item');
  };

  const handleDeleteItem = async (itemId: string) => {
    // Optimistically update UI
    const originalItems = items;
    setItems(items.filter(item => item.id !== itemId));
    
    // Delete from Supabase
    const { success, error } = await deleteItemDb(itemId);
    
    if (!success) {
      console.error('Failed to delete item:', error);
      // Rollback optimistic update on error
      setItems(originalItems);
      alert('Failed to delete item. Please try again.');
      return;
    }
    
    setCurrentView('home');
  };

  const selectedItem = items.find(item => item.id === selectedItemId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="w-full min-h-screen bg-background overflow-y-auto">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <img 
            /*
            If the imported logo is already a string URL, just use it directly.
            Otherwise, if it’s an object and has a .default property, use that.
            If there’s no .default, but there is a .uri, use that instead.
            Else: just return whatever it is
            */
              src={typeof logoImage === 'string' ? logoImage : (logoImage as any).default || (logoImage as any).uri || logoImage}
              alt="Second Thought Logo" 
              className="h-32 w-auto cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setCurrentView('mission')}
            />
            <div className="flex items-center gap-6">
              {/* Navigation Tabs */}
              <nav className="flex gap-1">
                <button
                  onClick={() => setCurrentView('mission')}
                  className={`px-4 py-2 font-medium text-sm transition-colors rounded-lg ${
                    currentView === 'mission'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-[#255736] hover:bg-muted/30'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => setCurrentView('home')}
                  className={`px-4 py-2 font-medium text-sm transition-colors rounded-lg ${
                    currentView === 'home'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-[#255736] hover:bg-muted/30'
                  }`}
                >
                  All Items
                </button>
                <button
                  onClick={() => setCurrentView('time')}
                  className={`px-4 py-2 font-medium text-sm transition-colors rounded-lg ${
                    currentView === 'time'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-[#255736] hover:bg-muted/30'
                  }`}
                >
                  Timeline
                </button>
                <button
                  onClick={() => setCurrentView('goals')}
                  className={`px-4 py-2 font-medium text-sm transition-colors rounded-lg ${
                    currentView === 'goals'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-[#255736] hover:bg-muted/30'
                  }`}
                >
                  Goals
                </button>
              </nav>

              {/* Profile Button */}
              <button
                onClick={() => setCurrentView('profile')}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
                title="View Profile"
              >
                <User className="w-5 h-5" />
                <span className="hidden sm:inline">Profile</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16">
        {currentView === 'home' && (
          <Home 
            items={items} 
            onItemClick={handleItemClick}
            onAddItem={() => setCurrentView('add')}
          />
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
          <TimeBasedView 
            items={items} 
            onItemClick={handleItemClick}
            onAddItem={() => setCurrentView('add')}
          />
        )}
        {currentView === 'goals' && (
          <GoalsBasedView 
            items={items} 
            onItemClick={handleItemClick}
            onAddItem={() => setCurrentView('add')}
          />
        )}
        {currentView === 'mission' && (
          <OurMission onGetStarted={() => setCurrentView('home')} />
        )}
        {currentView === 'profile' && (
          <Profile items={items} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}