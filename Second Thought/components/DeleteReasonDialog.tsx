'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

export type DeleteReason = 'dont_want' | 'purchased_early';
export type DontWantSubReason = 'dont_like' | 'not_useful' | 'found_alternative' | 'other';
export type PurchasedEarlySubReason =
  | 'dont_pursue_goal'
  | 'time_too_long'
  | 'really_wanted'
  | 'went_on_sale'
  | 'other';

interface DeleteReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (reason: DeleteReason, subReason?: DontWantSubReason | PurchasedEarlySubReason | string) => void;
  constraintType: 'time' | 'goals';
}

const buttonClass =
  'w-full py-6 px-5 text-left border rounded-md bg-background text-foreground hover:bg-green-50 hover:text-green-800 active:bg-green-50 active:text-green-800 transition-colors font-medium';

export function DeleteReasonDialog({ open, onOpenChange, onSelect, constraintType }: DeleteReasonDialogProps) {
  const [step, setStep] = useState<'initial' | 'dont_want_reason' | 'purchased_early_reason'>('initial');
  const [otherText, setOtherText] = useState('');
  const [selected, setSelected] = useState<DontWantSubReason | null>(null);
  const [purchasedOtherText, setPurchasedOtherText] = useState('');
  const [purchasedSelected, setPurchasedSelected] = useState<PurchasedEarlySubReason | null>(null);

  // Reset step when dialog closes
  useEffect(() => {
    if (!open) {
      setStep('initial');
      setOtherText('');
      setSelected(null);
      setPurchasedOtherText('');
      setPurchasedSelected(null);
    }
  }, [open]);

  const handleDontWantDelete = () => {
    const value = selected === 'other' ? (otherText.trim() || 'other') : selected!;
    onSelect('dont_want', value);
    onOpenChange(false);
  };

  const handlePurchasedEarlyDelete = () => {
    const value =
      purchasedSelected === 'other' ? (purchasedOtherText.trim() || 'other') : purchasedSelected!;
    onSelect('purchased_early', value);
    onOpenChange(false);
  };

  const selectedClass = (isSelected: boolean) =>
    isSelected ? 'border-primary bg-green-50 text-green-800' : '';

  const canDontWantDelete =
    selected === 'dont_like' ||
    selected === 'not_useful' ||
    selected === 'found_alternative' ||
    (selected === 'other' && otherText.trim().length > 0);

  const canPurchasedEarlyDelete =
    (purchasedSelected === 'dont_pursue_goal' && constraintType === 'goals') ||
    (purchasedSelected === 'time_too_long' && constraintType === 'time') ||
    purchasedSelected === 'really_wanted' ||
    purchasedSelected === 'went_on_sale' ||
    (purchasedSelected === 'other' && purchasedOtherText.trim().length > 0);

  const renderContent = () => {
    if (step === 'initial') {
      return (
          <>
            <DialogHeader>
              <DialogTitle className="text-center">
                Why did you delete this item?
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                className={buttonClass}
                onClick={() => setStep('dont_want_reason')}
              >
                I don&apos;t want it anymore
              </button>
              <button
                type="button"
                className={buttonClass}
                onClick={() => setStep('purchased_early_reason')}
              >
                I purchased it before I completed the constraint
              </button>
            </div>
          </>
      );
    }
    if (step === 'dont_want_reason') {
      return (
          <>
            <DialogHeader>
              <button
                type="button"
                onClick={() => setStep('initial')}
                className="text-sm text-muted-foreground hover:text-foreground mb-2 -ml-1"
              >
                ← Back
              </button>
              <DialogTitle className="text-center">
                Why don&apos;t you want it anymore?
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                className={`${buttonClass} border ${selectedClass(selected === 'dont_like')}`}
                onClick={() => setSelected('dont_like')}
              >
                I don&apos;t like it anymore
              </button>
              <button
                type="button"
                className={`${buttonClass} border ${selectedClass(selected === 'not_useful')}`}
                onClick={() => setSelected('not_useful')}
              >
                I realized it&apos;s not useful
              </button>
              <button
                type="button"
                className={`${buttonClass} border ${selectedClass(selected === 'found_alternative')}`}
                onClick={() => setSelected('found_alternative')}
              >
                I found an alternative
              </button>
              <div
                className={`rounded-md border p-3 cursor-pointer transition-colors ${selectedClass(selected === 'other')}`}
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
                    if (e.key === 'Enter' && canDontWantDelete) {
                      handleDontWantDelete();
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Please specify..."
                  className="w-full px-4 py-2 border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <button
                type="button"
                disabled={!canDontWantDelete}
                className={`w-full py-3 mt-2 rounded-md font-medium border border-destructive transition-colors ${
                  canDontWantDelete
                    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer'
                    : 'bg-destructive/40 text-destructive-foreground/60 cursor-not-allowed'
                }`}
                onClick={handleDontWantDelete}
              >
                Delete
              </button>
            </div>
          </>
      );
    }
    return (
          <>
            <DialogHeader>
              <button
                type="button"
                onClick={() => setStep('initial')}
                className="text-sm text-muted-foreground hover:text-foreground mb-2 -ml-1"
              >
                ← Back
              </button>
              <DialogTitle className="text-center">
                Why did you prematurely purchase this?
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3 pt-2">
              {constraintType === 'goals' ? (
                <button
                  type="button"
                  className={`${buttonClass} border ${selectedClass(purchasedSelected === 'dont_pursue_goal')}`}
                  onClick={() => setPurchasedSelected('dont_pursue_goal')}
                >
                  I do not want to pursue this goal anymore
                </button>
              ) : (
                <button
                  type="button"
                  className={`${buttonClass} border ${selectedClass(purchasedSelected === 'time_too_long')}`}
                  onClick={() => setPurchasedSelected('time_too_long')}
                >
                  The time constraint was too long
                </button>
              )}
              <button
                type="button"
                className={`${buttonClass} border ${selectedClass(purchasedSelected === 'really_wanted')}`}
                onClick={() => setPurchasedSelected('really_wanted')}
              >
                I really wanted it
              </button>
              <button
                type="button"
                className={`${buttonClass} border ${selectedClass(purchasedSelected === 'went_on_sale')}`}
                onClick={() => setPurchasedSelected('went_on_sale')}
              >
                The item went on sale
              </button>
              <div
                className={`rounded-md border p-3 cursor-pointer transition-colors ${selectedClass(purchasedSelected === 'other')}`}
                onClick={() => setPurchasedSelected('other')}
              >
                <span className="text-sm font-medium text-foreground block mb-2">Other</span>
                <input
                  type="text"
                  value={purchasedOtherText}
                  onChange={(e) => {
                    setPurchasedOtherText(e.target.value);
                    setPurchasedSelected('other');
                  }}
                  onFocus={() => setPurchasedSelected('other')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && canPurchasedEarlyDelete) {
                      handlePurchasedEarlyDelete();
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Please specify..."
                  className="w-full px-4 py-2 border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <button
                type="button"
                disabled={!canPurchasedEarlyDelete}
                className={`w-full py-3 mt-2 rounded-md font-medium border border-destructive transition-colors ${
                  canPurchasedEarlyDelete
                    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer'
                    : 'bg-destructive/40 text-destructive-foreground/60 cursor-not-allowed'
                }`}
                onClick={handlePurchasedEarlyDelete}
              >
                Delete
              </button>
            </div>
          </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
