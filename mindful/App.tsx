import { useState, useEffect } from 'react';
import { Home } from './components/Home';
import { ItemDetail } from './components/ItemDetail';
import { AddItemForm } from './components/AddItemForm';
import { TimeBasedView } from './components/TimeBasedView';
import { GoalsBasedView } from './components/GoalsBasedView';
import { OurMission } from './components/OurMission';
import { Auth } from './components/Auth';
import { Profile } from './components/Profile';
import { UnlockItem } from './components/UnlockItem';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { fetchItems, saveItem, deleteItem as deleteItemDb } from './lib/database';
import { sendUnlockPasswordEmail } from './services/emailService';
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
  // Friend unlock for goals-based constraints
  friendName?: string;
  friendEmail?: string;
  unlockPassword?: string;
  isUnlocked?: boolean;
}

type View = 'home' | 'item' | 'add' | 'time' | 'goals' | 'mission' | 'profile' | 'unlock';

function AppContent() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [currentView, setCurrentView] = useState<View>('mission');
  
  // Check URL for unlock view on mount and when URL changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('itemId')) {
        setCurrentView('unlock');
      }
    }
  }, []);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Check URL for unlock view on mount and when URL changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkUnlockPage = () => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('itemId')) {
          setCurrentView('unlock');
        }
      };
      
      // Check immediately
      checkUnlockPage();
      
      // Also listen for popstate (back/forward navigation)
      window.addEventListener('popstate', checkUnlockPage);
      
      return () => {
        window.removeEventListener('popstate', checkUnlockPage);
      };
    }
  }, []);

  // Load items when user logs in
  useEffect(() => {
    if (user) {
      loadItems();
    } else if (!loading) {
      setItems([]);
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
    if (!user) return;
    
    console.log('➕ Adding item:', item.name);
    setCurrentView('home');
    
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
    
    const newItem: Item = {
      ...item,
      id: generateId(),
      addedDate: new Date().toISOString(),
    };
    
    // Optimistic UI update
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    
    // Save to Supabase and wait for it
    console.log('💾 Saving to Supabase (please wait)...');
    const { success, error } = await saveItem(newItem, user.id);
    
    if (success) {
      console.log('✅ Item saved to Supabase');
      
      // Send unlock password email if this is a goals-based constraint with a friend
      if (item.constraintType === 'goals' && item.friendName && item.friendEmail && item.unlockPassword) {
        // No unlock link needed - friend will enter password on item detail page
        const itemDetailLink = typeof window !== 'undefined' 
          ? `${window.location.origin}?view=item&id=${newItem.id}`
          : `?view=item&id=${newItem.id}`;
        
        const emailResult = await sendUnlockPasswordEmail({
          friendName: item.friendName,
          friendEmail: item.friendEmail,
          itemName: item.name,
          unlockPassword: item.unlockPassword,
          unlockLink: itemDetailLink, // Link to item detail page where they can enter password
          userName: user.email || undefined,
        });
        
        if (emailResult.success) {
          console.log('✅ Unlock password email sent to friend');
        } else {
          console.warn('⚠️ Failed to send unlock password email:', emailResult.error);
          // Still continue - the item is saved, just the email failed
        }
      }
      
      // Also save to localStorage as backup
      localStorage.setItem('secondThought_items', JSON.stringify(updatedItems));
      localStorage.setItem(`secondThought_user_${user.id}_items`, JSON.stringify(updatedItems));
      console.log('✅ Also saved to localStorage');
    } else {
      console.error('❌ Failed to save to Supabase:', error);
      // Rollback UI
      setItems(items);
      const errorMsg = error?.message || 'Unknown error';
      
      // Show detailed error
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

  // Check if we're on the unlock page - it should be accessible without login
  // Check URL params to ensure we catch the unlock page even if currentView isn't set yet
  const checkUnlockFromURL = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('itemId') !== null;
    }
    return false;
  };
  
  const isUnlockPage = currentView === 'unlock' || checkUnlockFromURL();

  // Show unlock page without requiring auth - must be before auth check
  if (isUnlockPage) {
    // Make sure currentView is set to unlock
    if (currentView !== 'unlock') {
      setCurrentView('unlock');
    }
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <UnlockItem 
          onUnlockSuccess={() => {
            // After unlock, show success message
            alert('Item unlocked successfully! The user can now purchase this item.');
          }}
        />
      </div>
    );
  }

  // Show loading spinner (but not for unlock page)
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

  // Show auth screen if not logged in (for all other pages)
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
