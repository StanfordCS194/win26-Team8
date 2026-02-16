import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AddItemForm } from '../../components/AddItemForm';
import { supabase } from './supabaseClient';
import type { Item, QuestionAnswer } from '../../types/item';
import type { Session } from '@supabase/supabase-js';

declare const chrome: any;

// --- Duplicated pure transform functions from services/itemService.ts ---
// Kept here to avoid transitively bundling the web app's Supabase client.

function itemToDbItem(
  item: Omit<Item, 'id' | 'addedDate'>,
  userId: string
): { user_id: string; name: string; url: string | null; image_url: string; cost: number } {
  return {
    user_id: userId,
    name: item.name,
    url: null,
    image_url: item.imageUrl,
    cost: item.consumptionScore * 10,
  };
}

function createReflectionEntries(itemId: string, questionnaire: QuestionAnswer[]) {
  return questionnaire.map((qa) => ({
    item_id: itemId,
    question: qa.id,
    response: parseInt(qa.answer) || 3,
  }));
}

// --- Login form ---

function LoginForm({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        onSignedIn();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Second Thought</h1>
        <p className="text-sm text-muted-foreground">Sign in to save items</p>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="w-full px-4 py-3 border border-border bg-input-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
              className="w-full px-4 py-3 border border-border bg-input-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-primary/90 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Main app ---

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeUrl, setActiveUrl] = useState('');
  const [urlStatus, setUrlStatus] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');

  // Check existing session & listen for auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Get active tab URL
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
        const currentUrl = tabs && tabs[0] && tabs[0].url;
        if (currentUrl) {
          setActiveUrl(currentUrl);
        } else {
          setUrlStatus('Unable to read the active tab URL.');
        }
      });
    }
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setSubmitMessage('');
  };

  const handleSubmit = async (item: Omit<Item, 'id' | 'addedDate'>) => {
    if (!session?.user) return;
    const userId = session.user.id;

    setSubmitMessage('');

    try {
      const dbItem = itemToDbItem(item, userId);

      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .insert([dbItem])
        .select()
        .single();

      if (itemError) {
        setSubmitMessage(`Error saving item: ${itemError.message}`);
        return;
      }

      const reflectionEntries = createReflectionEntries(itemData.id, item.questionnaire);
      const { error: reflError } = await supabase
        .from('item_reflections')
        .insert(reflectionEntries);

      if (reflError) {
        console.error('Error saving reflections:', reflError);
      }

      setSubmitMessage('Item saved! Open the web app to view it.');
    } catch (err: any) {
      setSubmitMessage(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return <LoginForm onSignedIn={() => {}} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold text-foreground">Second Thought</h1>
        <button
          onClick={handleSignOut}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign out
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-4">{session.user.email}</p>

      {urlStatus && <p className="text-sm text-muted-foreground mb-2">{urlStatus}</p>}
      {submitMessage && (
        <div className="bg-primary/10 border border-primary/20 text-foreground rounded-xl p-3 text-sm mb-4">
          {submitMessage}
        </div>
      )}

      <AddItemForm
        onSubmit={handleSubmit}
        onCancel={() => window.close()}
        initialUrl={activeUrl}
      />
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
