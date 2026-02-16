import { useState, useEffect } from 'react';
import { unlockItem } from '../lib/database';
import { CheckCircle, XCircle, Lock } from 'lucide-react';

interface UnlockItemProps {
  itemId?: string;
  onUnlockSuccess?: () => void;
}

export function UnlockItem({ itemId: propItemId, onUnlockSuccess }: UnlockItemProps) {
  const [itemId, setItemId] = useState<string | null>(propItemId || null);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [itemName, setItemName] = useState<string>('');
  const [isLoadingItem, setIsLoadingItem] = useState(true);

  // Extract itemId from URL if not provided as prop
  useEffect(() => {
    if (!propItemId && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlItemId = params.get('itemId');
      if (urlItemId) {
        setItemId(urlItemId);
      }
    }
  }, [propItemId]);

  // Fetch item name for display
  useEffect(() => {
    const loadItem = async () => {
      if (!itemId) {
        setIsLoadingItem(false);
        return;
      }
      
      setIsLoadingItem(true);
      try {
        // We only need the item name, not the password
        // The password should only be in the email
        const response = await fetch(`https://mohgivduzthccoybnbnr.supabase.co/rest/v1/items?id=eq.${itemId}&select=name`, {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaGdpdmR1enRoY2NveWJuYm5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTA1MDUsImV4cCI6MjA4NTI4NjUwNX0.eoiFJ4fvJnIrV16uwL6Blr2rgMsXwoDE-vNPmY4K4d4',
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setItemName(data[0].name);
          }
        }
      } catch (error) {
        console.error('Error loading item:', error);
      } finally {
        setIsLoadingItem(false);
      }
    };
    
    loadItem();
  }, [itemId]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemId) {
      setResult({ success: false, message: 'Item ID is missing' });
      return;
    }
    
    if (!password.trim()) {
      setResult({ success: false, message: 'Please enter the unlock password' });
      return;
    }
    
    setIsLoading(true);
    setResult(null);
    
    const unlockResult = await unlockItem(itemId, password.trim());
    
    setIsLoading(false);
    
    if (unlockResult.success) {
      setResult({ success: true, message: 'Item unlocked successfully! The user can now purchase this item.' });
      setPassword('');
      if (onUnlockSuccess) {
        setTimeout(() => onUnlockSuccess(), 2000);
      }
    } else {
      setResult({ 
        success: false, 
        message: unlockResult.error?.message || 'Failed to unlock item. Please check the password and try again.' 
      });
    }
  };

  if (!itemId) {
    return (
      <div className="max-w-md mx-auto mt-12 p-8 bg-card rounded-2xl shadow-sm border border-border/50">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-serif text-foreground mb-2">Invalid Link</h2>
          <p className="text-muted-foreground">No item ID provided in the link.</p>
        </div>
      </div>
    );
  }

  // Fetch item name for display
  useEffect(() => {
    const loadItem = async () => {
      if (!itemId) {
        setIsLoadingItem(false);
        return;
      }
      
      setIsLoadingItem(true);
      try {
        // We only need the item name, not the password
        // The password should only be in the email
        const response = await fetch(`https://mohgivduzthccoybnbnr.supabase.co/rest/v1/items?id=eq.${itemId}&select=name`, {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaGdpdmR1enRoY2NveWJuYm5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTA1MDUsImV4cCI6MjA4NTI4NjUwNX0.eoiFJ4fvJnIrV16uwL6Blr2rgMsXwoDE-vNPmY4K4d4',
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setItemName(data[0].name);
          }
        }
      } catch (error) {
        console.error('Error loading item:', error);
      } finally {
        setIsLoadingItem(false);
      }
    };
    
    loadItem();
  }, [itemId]);

  if (isLoadingItem) {
    return (
      <div className="max-w-md mx-auto mt-12 p-8 bg-card rounded-2xl shadow-sm border border-border/50">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12 p-8 bg-card rounded-2xl shadow-sm border border-border/50">
      <div className="text-center mb-6">
        <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-serif text-foreground mb-2">Unlock Item</h2>
        {itemName && (
          <p className="text-sm font-medium text-foreground/80 mb-2">
            Item: {itemName}
          </p>
        )}
        <p className="text-sm text-muted-foreground mb-4">
          Enter the unlock password that was sent to your email to verify the goal has been completed.
        </p>
        <div className="p-3 bg-muted/30 rounded-lg mb-4">
          <p className="text-xs text-muted-foreground">
            If you haven't received the password, please check your email or contact your friend.
          </p>
        </div>
      </div>

      <form onSubmit={handleUnlock} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-2">
            Unlock Password
          </label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value.toUpperCase())}
            placeholder="Enter password"
            className="w-full px-4 py-3 border border-border bg-input-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground font-mono text-center text-lg tracking-wider"
            maxLength={6}
            disabled={isLoading}
          />
        </div>

        {result && (
          <div className={`p-4 rounded-xl border ${
            result.success 
              ? 'bg-primary/10 border-primary/20 text-primary' 
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <p className="text-sm font-medium">{result.message}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !password.trim()}
          className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Unlocking...' : 'Unlock Item'}
        </button>
      </form>
    </div>
  );
}
