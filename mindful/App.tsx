import { useState, useEffect } from 'react';
import { Home } from './components/Home';
import { ItemDetail } from './components/ItemDetail';
import { AddItemForm } from './components/AddItemForm';
import { TimeBasedView } from './components/TimeBasedView';
import { GoalsBasedView } from './components/GoalsBasedView';
import { OurMission } from './components/OurMission';
import { Profile } from './components/Profile';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { fetchItems, deleteItem as deleteItemDb, updateItemUnlocked } from './lib/database';
import { saveItemDirect, saveDeletionReasonDirect } from './lib/database-alt';
import { normalizeProductUrl } from './lib/urlUtils';
import { Plus, User } from 'lucide-react';
import './styles/globals.css';
import logoImage from './assets/logo.png';
import type { Item } from './types/item';
import type { DeletionReasonData } from './components/ItemDetail';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';


const FETCH_ITEMS_TIMEOUT_MS = 20000;

type View = 'home' | 'item' | 'add' | 'time' | 'goals' | 'mission' | 'profile';

function AppContent() {
  const { user, session, loading } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [currentView, setCurrentView] = useState<View>('mission');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [homeSubtab, setHomeSubtab] = useState<'locked' | 'unlocked'>('locked');
  const [refreshingItems, setRefreshingItems] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsLoadError, setItemsLoadError] = useState<string | null>(null);

  const lockedItems = items.filter((i) => !i.isUnlocked);
  const unlockedItems = items.filter((i) => i.isUnlocked);

  const isTimeUnlocked = (item: Item): boolean => {
    if (item.constraintType !== 'time' || !item.waitUntilDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const waitDate = new Date(item.waitUntilDate);
    const waitDayStart = new Date(waitDate.getFullYear(), waitDate.getMonth(), waitDate.getDate());
    return waitDayStart.getTime() <= today.getTime();
  };

  const [unlockingTodayItemIds, setUnlockingTodayItemIds] = useState<string[]>([]);
  const [showUnlockingTodayPopup, setShowUnlockingTodayPopup] = useState(false);

  // Load items when user logs in
  useEffect(() => {
    if (user) {
      loadItems();
    } else if (!loading) {
      setItems([]);
      setCurrentView('mission');
      setItemsLoadError(null);
    }
  }, [user, loading]);

  const fetchItemsWithTimeout = (): Promise<{ items: Item[]; error: unknown }> => {
    if (!user) return Promise.resolve({ items: [], error: null });
    return Promise.race([
      fetchItems(user.id),
      new Promise<{ items: Item[]; error: unknown }>((_, reject) =>
        setTimeout(() => reject(new Error('Connection timed out. Check your network and try again.')), FETCH_ITEMS_TIMEOUT_MS)
      ),
    ]).then(
      (r) => r,
      (err) => ({ items: [] as Item[], error: err })
    );
  };

  const loadItems = async () => {
    if (!user) return;

    setItemsLoadError(null);
    setItemsLoading(true);

    const localStorageKey = `secondThought_user_${user.id}_items`;
    const storedItems = localStorage.getItem(localStorageKey);
    if (storedItems) {
      try {
        const parsedItems = JSON.parse(storedItems);
        setItems(parsedItems);
      } catch {
        // ignore parse errors
      }
    }

    let result = await fetchItemsWithTimeout();
    if (result.error && !result.items?.length) {
      await new Promise((r) => setTimeout(r, 1500));
      result = await fetchItemsWithTimeout();
    }

    setItemsLoading(false);

    if (!result.error && result.items) {
      const toUnlock = result.items.filter(
        (item) =>
          item.constraintType === 'time' &&
          item.waitUntilDate &&
          !item.isUnlocked &&
          isTimeUnlocked(item)
      );
      if (toUnlock.length > 0 && user) {
        await Promise.all(toUnlock.map((item) => updateItemUnlocked(item.id, user!.id, true)));
        const updated = result.items.map((i) =>
          toUnlock.some((u) => u.id === i.id) ? { ...i, isUnlocked: true } : i
        );
        setItems(updated);
        localStorage.setItem(localStorageKey, JSON.stringify(updated));
      } else {
        setItems(result.items);
        localStorage.setItem(localStorageKey, JSON.stringify(result.items));
      }
    } else if (result.error) {
      const message = result.error instanceof Error ? result.error.message : 'Could not load items. Try again.';
      setItemsLoadError(message);
      if (result.items?.length) setItems(result.items);
    }
  };

  const handleRefreshItems = async () => {
    if (!user) return;
    setItemsLoadError(null);
    setRefreshingItems(true);
    try {
      let result = await fetchItemsWithTimeout();
      if (result.error && !result.items?.length) {
        await new Promise((r) => setTimeout(r, 1500));
        result = await fetchItemsWithTimeout();
      }
      if (!result.error && result.items) {
        const toUnlock = result.items.filter(
          (item) =>
            item.constraintType === 'time' &&
            item.waitUntilDate &&
            !item.isUnlocked &&
            isTimeUnlocked(item)
        );
        if (toUnlock.length > 0 && user) {
          await Promise.all(toUnlock.map((item) => updateItemUnlocked(item.id, user.id, true)));
          const updated = result.items.map((i) =>
            toUnlock.some((u) => u.id === i.id) ? { ...i, isUnlocked: true } : i
          );
          setItems(updated);
          localStorage.setItem(`secondThought_user_${user.id}_items`, JSON.stringify(updated));
        } else {
          setItems(result.items);
          localStorage.setItem(`secondThought_user_${user.id}_items`, JSON.stringify(result.items));
        }
      } else if (result.error) {
        const message = result.error instanceof Error ? result.error.message : 'Could not refresh. Try again.';
        setItemsLoadError(message);
      }
    } finally {
      setRefreshingItems(false);
    }
  };

  const handleAddItem = async (item: Omit<Item, 'id' | 'addedDate'>) => {
    if (!user) {
      alert('You must be logged in to add items');
      return;
    }

    console.log('Adding item:', item.name);
    console.log('Constraint type:', item.constraintType);
    console.log('Image URL:', item.imageUrl);
    console.log('Image URL length:', item.imageUrl?.length || 0);
    console.log('Questions:', item.questionnaire.length);
    console.log('Full item from form:', JSON.stringify(item, null, 2));

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

    console.log('Created item (full):', JSON.stringify(newItem, null, 2));

    // Optimistic UI update
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    setCurrentView('home');

    // Save to Supabase - Use token we already have so we don't call getSession() (it can hang)
    console.log('Saving to Supabase using direct REST API...');
    const accessToken = session?.access_token ?? null;
    const { success, error } = await saveItemDirect(newItem, user.id, accessToken);

    if (success) {
      console.log('Item saved to Supabase');

      // Store friend unlock email information if this is a goals-based constraint with a friend
      if (item.constraintType === 'goals' && item.friendName && item.friendEmail && item.unlockPassword) {
        const { createFriendUnlockEmail } = await import('./lib/friendUnlockService');
        const emailRecord = await createFriendUnlockEmail(
          newItem.id,
          item.friendEmail,
          item.unlockPassword
        );

        if (emailRecord.success) {
          console.log('Friend unlock email record created in database');
        } else {
          console.warn('Failed to create friend unlock email record:', emailRecord.error);
        }
      }

      // Update localStorage
      const localKey = `secondThought_user_${user.id}_items`;
      localStorage.setItem(localKey, JSON.stringify(updatedItems));
      console.log('Saved to localStorage');

      alert(`${item.name} added successfully!`);
    } else {
      console.error('Failed to save:', error);

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

  const handleUnlockItem = async (itemId: string) => {
    if (!user) return;
    const item = items.find((i) => i.id === itemId);
    const { success, error } = await updateItemUnlocked(itemId, user.id, true);
    if (success) {
      const updated = items.map((i) => (i.id === itemId ? { ...i, isUnlocked: true } : i));
      setItems(updated);
      const localKey = `secondThought_user_${user.id}_items`;
      localStorage.setItem(localKey, JSON.stringify(updated));
      setCurrentView('home');
      setHomeSubtab('unlocked');
      setSelectedItemId(null);
      if (item?.constraintType === 'goals') {
        alert(`Congratulations, you completed your goal and have unlocked "${item.name}".`);
      }
    } else {
      const errorMsg = error?.message || error?.toString() || 'Unknown error';
      alert(`Failed to unlock item.\n\nError: ${errorMsg}`);
    }
  };

  const handleDeleteItem = async (itemId: string, deletionReason?: DeletionReasonData) => {
    if (!user) return;

    const item = items.find((i) => i.id === itemId);

    if (item && deletionReason) {
      const accessToken = session?.access_token ?? null;
      const { success: saveSuccess, error: saveError } = await saveDeletionReasonDirect(
        {
          itemId,
          itemName: item.name,
          userId: user.id,
          reason: deletionReason.reason,
          subReason: deletionReason.subReason ?? '',
          constraintType: item.constraintType,
        },
        accessToken
      );
      if (!saveSuccess) {
        console.error('Failed to save deletion reason:', saveError);
        console.error('Error details:', saveError?.message, saveError?.code, saveError?.details);
      }
    }

    const { success, error } = await deleteItemDb(itemId, user.id);

    if (success) {
      const updatedItems = items.filter((i) => i.id !== itemId);
      setItems(updatedItems);
      const localKey = `secondThought_user_${user.id}_items`;
      localStorage.setItem(localKey, JSON.stringify(updatedItems));
      setCurrentView('home');
      setSelectedItemId(null);
      if (item && deletionReason) {
        // already showed DeleteReasonDialog
      } else {
        alert('Item deleted.');
      }
    } else {
      const errorMsg = error?.message || error?.toString() || 'Unknown error';
      alert(`Failed to delete item.\n\nError: ${errorMsg}`);
    }
  };

  const selectedItem = items.find((i) => i.id === selectedItemId);
  const isSelectedUnlockedItem = selectedItem?.isUnlocked === true;

  const handleRemoveUnlockedItem = async (itemId: string, subReason?: string) => {
    if (!user) return;

    // Log deletion reason for unlocked items as a "dont_want" reason with detailed subReason
    const item = items.find((i) => i.id === itemId);
    if (item && subReason) {
      const accessToken = session?.access_token ?? null;
      const { success: saveSuccess, error: saveError } = await saveDeletionReasonDirect(
        {
          itemId,
          itemName: item.name,
          userId: user.id,
          reason: 'dont_want',
          subReason,
          constraintType: item.constraintType,
        },
        accessToken
      );
      if (!saveSuccess) {
        console.error('Failed to save deletion reason for unlocked item:', saveError);
        console.error('Error details:', saveError?.message, saveError?.code, saveError?.details);
      }
    }

    const { success, error } = await deleteItemDb(itemId, user.id);
    if (success) {
      const updated = items.filter((i) => i.id !== itemId);
      setItems(updated);
      const localKey = `secondThought_user_${user.id}_items`;
      localStorage.setItem(localKey, JSON.stringify(updated));
      setCurrentView('home');
      setSelectedItemId(null);
    } else {
      const errorMsg = error?.message || error?.toString() || 'Unknown error';
      alert(`Failed to remove item.\n\nError: ${errorMsg}`);
    }
  };

  const handleBackFromItem = () => {
    setHomeSubtab(selectedItem?.isUnlocked ? 'unlocked' : 'locked');
    setCurrentView('home');
    setSelectedItemId(null);
  };

  // Detect time-based items that unlock today and show a celebratory popup
  useEffect(() => {
    if (!user || !items.length) {
      setShowUnlockingTodayPopup(false);
      setUnlockingTodayItemIds([]);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const localKey = `secondThought_user_${user.id}_unlocking_today_${today}`;

    let dismissedIds: string[] = [];
    try {
      const stored = localStorage.getItem(localKey);
      if (stored) {
        dismissedIds = JSON.parse(stored);
      }
    } catch {
      // ignore parse errors
    }

    const unlockingToday = items.filter(
      (item) =>
        item.constraintType === 'time' &&
        item.waitUntilDate === today &&
        !dismissedIds.includes(item.id)
    );

    if (unlockingToday.length) {
      setUnlockingTodayItemIds(unlockingToday.map((i) => i.id));
      setShowUnlockingTodayPopup(true);
    } else {
      setUnlockingTodayItemIds([]);
      setShowUnlockingTodayPopup(false);
    }
  }, [items, user]);

  const handleDismissUnlockingTodayPopup = () => {
    if (!user) {
      setShowUnlockingTodayPopup(false);
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const localKey = `secondThought_user_${user.id}_unlocking_today_${today}`;
    try {
      localStorage.setItem(localKey, JSON.stringify(unlockingTodayItemIds));
    } catch {
      // ignore storage errors
    }
    setShowUnlockingTodayPopup(false);
  };

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
  const SignInRequired = () => {
    const handleGoToSignIn = () => {
      setCurrentView('mission');
      // Scroll to onboarding section after a short delay to allow the view to render
      setTimeout(() => {
        const onboardingSection = document.getElementById('onboarding-section');
        if (onboardingSection) {
          onboardingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    };

    return (
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
            onClick={handleGoToSignIn}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-primary/90 transition-all shadow-md mt-4"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-background overflow-y-auto relative">
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
                title="Profile"
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
        {currentView === 'mission' && (
          <OurMission onGetStarted={() => setCurrentView('home')} userEmail={user?.email} />
        )}
        {currentView === 'home' && (
          user ? (
            <Home 
              items={items}
              activeSubtab={homeSubtab}
              onSubtabChange={setHomeSubtab}
              onItemClick={handleItemClick}
              onAddItem={() => setCurrentView('add')}
              onRefresh={handleRefreshItems}
              onRetry={loadItems}
              isRefreshing={refreshingItems}
              isLoading={itemsLoading}
              loadError={itemsLoadError}
            />
          ) : (
            <SignInRequired />
          )
        )}
        {currentView === 'item' && (
          user && selectedItem ? (
            <ItemDetail
              item={selectedItem}
              onBack={handleBackFromItem}
              onDelete={handleDeleteItem}
              onUnlock={handleUnlockItem}
              isUnlockedItem={isSelectedUnlockedItem}
              onRemoveUnlocked={handleRemoveUnlockedItem}
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
              checkUrlInInventory={async (url) => {
                const normalized = normalizeProductUrl(url);
                return items.some((i) => i.productUrl && normalizeProductUrl(i.productUrl) === normalized);
              }}
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

      {showUnlockingTodayPopup && unlockingTodayItemIds.length > 0 && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card rounded-3xl shadow-xl border border-primary/40 max-w-md w-full mx-4 p-8 relative">
            <button
              type="button"
              onClick={handleDismissUnlockingTodayPopup}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground text-sm"
            >
              Dismiss
            </button>
            <p className="text-xs uppercase tracking-[0.2em] text-accent mb-2">
              Exciting News
            </p>
            <h2 className="text-2xl font-serif text-foreground mb-3">
              Your item is unlocking today!
            </h2>
            <div className="space-y-1 mb-4">
              {unlockingTodayItemIds.map((id) => {
                const item = items.find((i) => i.id === id);
                if (!item) return null;
                return (
                  <p key={id} className="text-sm text-foreground/85">
                    Exciting news: your <span className="font-semibold text-primary">{item.name}</span> is unlocking today!
                  </p>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              You can now revisit this item in your timeline and decide how you&apos;d like to move forward.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Analytics />
      <SpeedInsights />
    </AuthProvider>
  );
}
