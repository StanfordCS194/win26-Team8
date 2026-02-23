import React, { useEffect, useState } from 'react';
import { AddItemForm } from '../../components/AddItemForm';
import { Auth } from '../../components/Auth';
import { supabase } from './supabaseClient';
import { itemToDbItem } from './itemToDbItem';
import type { Item } from '../../types/item';
import type { Session } from '@supabase/supabase-js';

export const OVERLAY_ID = 'second-thought-overlay';

export interface ContentOverlayProps {
  onClose: () => void;
  pageUrl?: string;
}

export function ContentOverlay({ onClose, pageUrl }: ContentOverlayProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleAddToMindfulCart = () => {
    setShowForm(true);
    setSubmitMessage('');
  };

  const handleSubmit = async (item: Omit<Item, 'id' | 'addedDate'>) => {
    if (!session?.user) {
      setSubmitMessage('Error: Not logged in. Please sign in to save items.');
      return;
    }

    const userId = session.user.id;
    setSubmitMessage('Saving...');

    try {
      const dbItem = itemToDbItem(item, userId);
      const { data, error: itemError } = await supabase
        .from('items')
        .insert([dbItem])
        .select();

      if (itemError) {
        setSubmitMessage(`Error: ${itemError.message}`);
        return;
      }

      setSubmitMessage('Item saved! Open the web app to view it.');
      setShowForm(false);
      onClose();
    } catch (err: any) {
      setSubmitMessage(`Error: ${err.message}`);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSubmitMessage('');
  };

  const handleSignIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  if (loading) {
    return (
      <div id={OVERLAY_ID} className="st-overlay-root">
        <div className="st-overlay-backdrop" onClick={handleBackdropClick}>
          <div className="st-overlay-card">
            <p className="st-overlay-message">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div id={OVERLAY_ID} onClick={(e) => e.stopPropagation()}>
        <div className="st-overlay-backdrop" onClick={handleBackdropClick}>
          <div className="st-overlay-card st-overlay-card-form" onClick={(e) => e.stopPropagation()}>
            <h1 className="st-overlay-title">Second Thought</h1>
            <p className="st-overlay-message">Sign in to save items to your mindful cart.</p>
            <Auth onSignIn={handleSignIn} compact />
            <button
              type="button"
              className="st-overlay-close"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
            >
              Continue without adding
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div id={OVERLAY_ID} className="st-overlay-root" onClick={(e) => e.stopPropagation()}>
        <div className="st-overlay-backdrop st-overlay-backdrop-form" onClick={handleBackdropClick}>
          <div
            className="st-overlay-card st-overlay-card-form"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {submitMessage && (
              <div className="mb-3 p-3 rounded-xl text-sm bg-primary/10 border border-primary/20 text-foreground">
                {submitMessage}
              </div>
            )}
            <AddItemForm
              onSubmit={handleSubmit}
              onCancel={handleFormCancel}
              initialUrl={pageUrl}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id={OVERLAY_ID} onClick={(e) => e.stopPropagation()}>
      <div className="st-overlay-backdrop" onClick={handleBackdropClick}>
        <div className="st-overlay-card">
          <h1 className="st-overlay-title">Second Thought</h1>
          <p className="st-overlay-message">
            Would you like to give this purchase a second thought?
          </p>
          <button type="button" className="st-overlay-btn-primary" onClick={handleAddToMindfulCart}>
            Add to mindful cart
          </button>
          <button
            type="button"
            className="st-overlay-close"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
          >
            Continue without adding
          </button>
        </div>
      </div>
    </div>
  );
}
