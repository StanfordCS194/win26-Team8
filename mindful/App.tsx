import { useState, useEffect } from 'react';
import { Home } from './components/Home';
import { ItemDetail } from './components/ItemDetail';
import { AddItemForm } from './components/AddItemForm';
import { TimeBasedView } from './components/TimeBasedView';
import { GoalsBasedView } from './components/GoalsBasedView';
import { OurMission } from './components/OurMission';
import { Auth } from './components/Auth';
import { Profile } from './components/Profile';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { fetchItems, saveItem, deleteItem as deleteItemDb } from './lib/database';
import { Plus, User } from 'lucide-react';
import './styles/globals.css';
import logoImage from './assets/logo.png';

// Question-answer pair for dynamic questionnaire
export interface QuestionAnswer {
  id: string;
  question: string;
  answer: string;
}

export interface Item {
  id: string;
  name: string;
  imageUrl: string;
  constraintType: 'time' | 'goals';
  consumptionScore: number;
  addedDate: string;
  waitUntilDate?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  // Dynamic questionnaire answers
  questionnaire: QuestionAnswer[];
}

type View = 'home' | 'item' | 'add' | 'time' | 'goals' | 'mission' | 'profile';

function AppContent() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [currentView, setCurrentView] = useState<View>('mission');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Load items when user logs in
  useEffect(() => {
    if (user) {
      loadItems();
    } else if (!loading) {
      setItems([]);
    }
  }, [user, loading]);

  /**
   * LOAD ITEMS FROM DATABASE
   * 
   * This function loads the user's items when they log in or refresh the page.
   * 
   * Two-step loading strategy:
   * 1. FAST: Load from localStorage first (instant, works offline)
   * 2. SYNC: Load from Supabase database (authoritative source, syncs across devices)
   * 
   * This approach ensures:
   * - Users see their items immediately (localStorage)
   * - Data stays synchronized with the database (Supabase)
   * - App works even if Supabase is slow or offline
   * 
   * Database query details:
   * - Calls fetchItems(user.id) from lib/database.ts
   * - Fetches all items where user_id matches logged-in user
   * - Returns items sorted by creation date (newest first)
   * - RLS policies ensure users only see their own items
   */
  const loadItems = async () => {
    if (!user) return;
    
    // STEP 1: Load from localStorage (instant, offline-capable)
    // This provides immediate UI feedback while we wait for Supabase
    console.log('💾 Loading from localStorage...');
    const localStorageKey = `secondThought_user_${user.id}_items`;
    const storedItems = localStorage.getItem(localStorageKey);
    
    if (storedItems) {
      try {
        const parsedItems = JSON.parse(storedItems);
        setItems(parsedItems);
        console.log('✅ Loaded', parsedItems.length, 'items from localStorage');
      } catch (err) {
        console.error('❌ Failed to parse localStorage items:', err);
      }
    }
    
    // STEP 2: Sync with Supabase database (authoritative source)
    // This ensures we have the latest data from the server
    // If user added items on another device, we'll get them here
    console.log('🌐 Syncing with Supabase...');
    const { items: loadedItems, error } = await fetchItems(user.id);
    
    if (!error && loadedItems) {
      // Update UI with fresh data from database
      setItems(loadedItems);
      // Update localStorage to match database (for next time)
      localStorage.setItem(localStorageKey, JSON.stringify(loadedItems));
      console.log('✅ Synced', loadedItems.length, 'items from Supabase');
    } else if (error) {
      console.warn('⚠️ Supabase sync failed (using localStorage):', error);
      // If Supabase fails, we still have localStorage data from Step 1
    }
  };

  /**
   * ADD NEW ITEM TO DATABASE
   * 
   * This function handles adding a new item when the user completes the form.
   * 
   * Process:
   * 1. Generate a unique ID (UUID) for the item
   * 2. Create complete Item object with all fields
   * 3. Optimistically update UI (show item immediately)
   * 4. Save to Supabase database (wait for confirmation)
   * 5. If success: Also save to localStorage as backup
   * 6. If failure: Rollback UI and show error
   * 
   * Database operation:
   * - Calls saveItem(newItem, user.id) from lib/database.ts
   * - Inserts into 'items' table with all item data
   * - user_id associates item with logged-in user
   * - RLS policies ensure users can only insert their own items
   * - Returns success/failure status
   * 
   * @param item - Item data from the form (without id and addedDate)
   */
  const handleAddItem = async (item: Omit<Item, 'id' | 'addedDate'>) => {
    if (!user) return;
    
    console.log('➕ Adding item:', item.name);
    setCurrentView('home'); // Navigate back to list view
    
    // Generate a unique ID (UUID) for this item
    // UUID format: "550e8400-e29b-41d4-a716-446655440000"
    const generateId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        // Use browser's built-in UUID generator if available
        return crypto.randomUUID();
      }
      // Fallback: Generate UUID manually
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
    
    // Create the complete item object with generated fields
    const newItem: Item = {
      ...item, // Spread all form data (name, imageUrl, constraintType, etc.)
      id: generateId(), // Add unique ID
      addedDate: new Date().toISOString(), // Add timestamp
    };
    
    // OPTIMISTIC UI UPDATE
    // Show the item immediately for better UX (we'll rollback if save fails)
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    
    // SAVE TO DATABASE
    // Wait for Supabase to confirm the item was saved
    // Calls: INSERT INTO items (...) VALUES (...) in Supabase
    console.log('💾 Saving to Supabase (please wait)...');
    const { success, error } = await saveItem(newItem, user.id);
    
    if (success) {
      // SUCCESS: Item is now in the database
      console.log('✅ Item saved to Supabase');
      
      // Also save to localStorage as backup/cache
      // This allows offline access and faster loading
      localStorage.setItem('secondThought_items', JSON.stringify(updatedItems));
      localStorage.setItem(`secondThought_user_${user.id}_items`, JSON.stringify(updatedItems));
      console.log('✅ Also saved to localStorage');
    } else {
      // FAILURE: Database save failed
      console.error('❌ Failed to save to Supabase:', error);
      
      // Rollback the optimistic UI update
      setItems(items); // Remove the item from the list
      
      const errorMsg = error?.message || 'Unknown error';
      
      // Show user-friendly error message
      if (errorMsg.includes('timeout')) {
        alert(`Supabase connection timeout.\n\nThis is a browser/network issue blocking API calls.\n\nTry:\n1. Different browser\n2. Disable VPN/extensions\n3. Different network\n\nYour items are saved in localStorage for now.`);
      } else {
        alert(`Failed to save item: ${errorMsg}\n\nCheck the console (F12) for details.`);
      }
    }
  };

  const handleItemClick = (itemId: string) => {
    setSelectedItemId(itemId);
    setCurrentView('item');
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!user) return;
    
    console.log('🗑️ Deleting item from Supabase...');
    
    // Delete from Supabase first (with longer timeout)
    const { success, error } = await deleteItemDb(itemId, user.id);
    
    if (success) {
      console.log('✅ Item deleted from Supabase');
      
      // Update UI after successful delete
      const updatedItems = items.filter(item => item.id !== itemId);
      setItems(updatedItems);
      
      // Update localStorage
      const localStorageKey = `secondThought_user_${user.id}_items`;
      localStorage.setItem(localStorageKey, JSON.stringify(updatedItems));
      console.log('✅ Item deleted from localStorage');
      
      setCurrentView('home');
    } else {
      console.error('❌ Failed to delete from Supabase:', error);
      const errorMsg = error?.message || 'Unknown error';
      
      if (errorMsg.includes('timeout')) {
        alert(`Supabase connection timeout.\n\nThis is a browser/network issue.\n\nThe item is still in localStorage.\n\nTry a different browser or network.`);
      } else {
        alert(`Failed to delete item: ${errorMsg}`);
      }
    }
  };

  const selectedItem = items.find(item => item.id === selectedItemId);

  // Show loading spinner
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth screen if not logged in
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
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all shadow-sm hover:shadow-md ${
                  currentView === 'profile'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
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
