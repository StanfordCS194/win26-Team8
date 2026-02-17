import React, { useState } from 'react';
import { AddItemForm } from '../../components/AddItemForm';
import type { Item } from '../../types/item';

export const OVERLAY_ID = 'second-thought-overlay';

export interface ContentOverlayProps {
  onClose: () => void;
  pageUrl?: string;
}

export function ContentOverlay({ onClose, pageUrl }: ContentOverlayProps) {
  const [showForm, setShowForm] = useState(false);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleAddToMindfulCart = () => {
    setShowForm(true);
  };

  const handleSubmit = (item: Omit<Item, 'id' | 'addedDate'>) => {
    console.log('🧾 Content overlay add item submission:', item);
    setShowForm(false);
    onClose();
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  if (showForm) {
    return (
      <div id={OVERLAY_ID} className="st-overlay-root" onClick={(e) => e.stopPropagation()}>
        <div className="st-overlay-backdrop st-overlay-backdrop-form" onClick={handleBackdropClick}>
          <div
            className="st-overlay-card st-overlay-card-form"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
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
