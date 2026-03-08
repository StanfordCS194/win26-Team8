'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

export type DidntBuySubReason = 'dont_need' | 'found_alternative' | 'budget' | 'changed_mind' | 'other';

interface UnlockedItemRemoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when user confirms; they didn't buy the item. Passes the chosen reason. */
  onConfirm: (subReason: DidntBuySubReason | string) => void;
}

const buttonClass =
  'w-full py-5 px-4 text-left border rounded-lg bg-background text-foreground hover:bg-primary/5 hover:border-primary/30 transition-colors font-medium';

export function UnlockedItemRemoveDialog({
  open,
  onOpenChange,
  onConfirm,
}: UnlockedItemRemoveDialogProps) {
  const [selected, setSelected] = useState<DidntBuySubReason | null>(null);
  const [otherText, setOtherText] = useState('');

  useEffect(() => {
    if (!open) {
      setSelected(null);
      setOtherText('');
    }
  }, [open]);

  const canConfirm =
    selected === 'dont_need' ||
    selected === 'found_alternative' ||
    selected === 'budget' ||
    selected === 'changed_mind' ||
    (selected === 'other' && otherText.trim().length > 0);

  const handleConfirm = () => {
    if (!canConfirm) return;
    const subReason = selected === 'other' ? (otherText.trim() || 'other') : selected!;
    onConfirm(subReason);
    onOpenChange(false);
  };

  const selectedClass = (isSelected: boolean) =>
    isSelected ? 'border-primary bg-primary/10' : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Why did you not buy it?
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-center pt-1">
            This will remove it from your unlocked list.
          </p>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-2">
          <button
            type="button"
            className={`${buttonClass} border ${selectedClass(selected === 'dont_need')}`}
            onClick={() => setSelected('dont_need')}
          >
            Decided I don&apos;t need it anymore
          </button>
          <button
            type="button"
            className={`${buttonClass} border ${selectedClass(selected === 'found_alternative')}`}
            onClick={() => setSelected('found_alternative')}
          >
            Found a better alternative
          </button>
          <button
            type="button"
            className={`${buttonClass} border ${selectedClass(selected === 'budget')}`}
            onClick={() => setSelected('budget')}
          >
            No longer fits my budget
          </button>
          <button
            type="button"
            className={`${buttonClass} border ${selectedClass(selected === 'changed_mind')}`}
            onClick={() => setSelected('changed_mind')}
          >
            Changed my mind after waiting
          </button>
          <div
            className={`rounded-lg border p-3 cursor-pointer transition-colors ${selectedClass(selected === 'other')}`}
            onClick={() => setSelected('other')}
          >
            <span className="text-sm font-medium text-foreground block mb-2">Other</span>
            <input
              type="text"
              value={otherText}
              onChange={(e) => {
                setOtherText(e.target.value);
                setSelected('other');
              }}
              onFocus={() => setSelected('other')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canConfirm) handleConfirm();
              }}
              onClick={(e) => e.stopPropagation()}
              placeholder="Please specify..."
              className="w-full px-4 py-2 border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            type="button"
            disabled={!canConfirm}
            className={`w-full py-3 mt-2 rounded-lg font-medium border transition-colors ${
              canConfirm
                ? 'bg-destructive text-destructive-foreground border-destructive/30 hover:bg-destructive/90 cursor-pointer'
                : 'bg-destructive/40 text-destructive-foreground/60 cursor-not-allowed border-transparent'
            }`}
            onClick={handleConfirm}
          >
            Remove from list
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
