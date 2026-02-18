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
import { saveItemDirect } from './lib/database-alt';
import { Plus, User } from 'lucide-react';
import './styles/globals.css';
import logoImage from './assets/logo.png';
import type { Item } from './types/item';

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
      setCurrentView('mission');
    }
  }, [user, loading]);

  const loadItems = async () => {
    if (!user) return;
    
    // First, load from localStorage (instant)
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
    
    // Then, try to sync with Supabase (in background)
    console.log('🌐 Syncing with Supabase...');
    const { items: loadedItems, error } = await fetchItems(user.id);
    
    if (!error && loadedItems) {
      setItems(loadedItems);
      // Update localStorage with Supabase data
      localStorage.setItem(localStorageKey, JSON.stringify(loadedItems));
      console.log('✅ Synced', loadedItems.length, 'items from Supabase');
    } else if (error) {
      console.warn('⚠️ Supabase sync failed (using localStorage):', error);
    }
  };

  const handleAddItem = async (item: Omit<Item, 'id' | 'addedDate'>) => {
    if (!user) {
      alert('You must be logged in to add items');
      return;
    }
    
    console.log('➕ Adding item:', item.name);
    console.log('📋 Constraint type:', item.constraintType);
    console.log('📋 Image URL:', item.imageUrl);
    console.log('📋 Image URL length:', item.imageUrl?.length || 0);
    console.log('📋 Questions:', item.questionnaire.length);
    console.log('📋 Full item from form:', JSON.stringify(item, null, 2));
    
    // Generate UUID
    const generateId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
    
    // Create complete item
    const newItem: Item = {
      ...item,
      id: generateId(),
      addedDate: new Date().toISOString(),
    };
    
    console.log('🆕 Created item (full):', JSON.stringify(newItem, null, 2));
    
    // Optimistic UI update
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    setCurrentView('home');
    
    // Save to Supabase - Using direct REST API (bypasses hanging client issue)
    console.log('💾 Saving to Supabase using direct REST API...');
    const { success, error } = await saveItemDirect(newItem, user.id);
    
    if (success) {
      console.log('✅ Item saved to Supabase');
      
      // Update localStorage
      const localKey = `secondThought_user_${user.id}_items`;
      localStorage.setItem(localKey, JSON.stringify(updatedItems));
      console.log('✅ Saved to localStorage');
      
      alert(`✅ ${item.name} added successfully!`);
    } else {
      console.error('❌ Failed to save:', error);
      
      // Rollback UI
      setItems(items);
      
      // Show error details
      const errorMsg = error?.message || error?.toString() || 'Unknown error';
      alert(`Failed to save item\n\nError: ${errorMsg}\n\nCheck console (F12) for details.`);
    }
  };

  const handleItemClick = (itemId: string) => {
    setSelectedItemId(itemId);
    setCurrentView('item');
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }
    
    console.log('🗑️ Deleting item:', itemId);
    
    // Delete from Supabase
    const { success, error } = await deleteItemDb(itemId, user.id);
    
    if (success) {
      console.log('✅ Item deleted from Supabase');
      
      // Update UI
      const updatedItems = items.filter(item => item.id !== itemId);
      setItems(updatedItems);
      
      // Update localStorage
      const localKey = `secondThought_user_${user.id}_items`;
      localStorage.setItem(localKey, JSON.stringify(updatedItems));
      
      setCurrentView('home');
      alert('✅ Item deleted successfully!');
    } else {
      console.error('❌ Delete failed:', error);
      const errorMsg = error?.message || error?.toString() || 'Unknown error';
      alert(`Failed to delete item\n\nError: ${errorMsg}`);
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

  // Sign In Required Message Component
  const SignInRequired = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="max-w-md text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Sign In Required</h2>
        <p className="text-muted-foreground">
          You need to be logged in to access this feature. Please sign in or create an account to continue.
        </p>
        <button
          onClick={() => setCurrentView('mission')}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-primary/90 transition-all shadow-md mt-4"
        >
          Go to Sign In
        </button>
      </div>
    </div>
  );

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
              {user ? (
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
              ) : (
                <button
                  onClick={() => setCurrentView('mission')}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16">
        {currentView === 'mission' && (
          <OurMission onGetStarted={() => setCurrentView('home')} userEmail={user?.email} />
        )}
        {currentView === 'home' && (
          user ? (
            <Home 
              items={items} 
              onItemClick={handleItemClick}
              onAddItem={() => setCurrentView('add')}
            />
          ) : (
            <SignInRequired />
          )
        )}
        {currentView === 'item' && (
          user && selectedItem ? (
            <ItemDetail 
              item={selectedItem} 
              onBack={() => setCurrentView('home')}
              onDelete={handleDeleteItem}
            />
          ) : (
            <SignInRequired />
          )
        )}
        {currentView === 'add' && (
          user ? (
            <AddItemForm 
              onSubmit={handleAddItem}
              onCancel={() => setCurrentView('home')}
            />
          ) : (
            <SignInRequired />
          )
        )}
        {currentView === 'time' && (
          user ? (
            <TimeBasedView 
              items={items} 
              onItemClick={handleItemClick}
              onAddItem={() => setCurrentView('add')}
            />
          ) : (
            <SignInRequired />
          )
        )}
        {currentView === 'goals' && (
          user ? (
            <GoalsBasedView 
              items={items} 
              onItemClick={handleItemClick}
              onAddItem={() => setCurrentView('add')}
            />
          ) : (
            <SignInRequired />
          )
        )}
        {currentView === 'profile' && (
          user ? (
            <Profile items={items} />
          ) : (
            <SignInRequired />
          )
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
