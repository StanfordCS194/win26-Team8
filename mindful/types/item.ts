export interface QuestionAnswer {
  id: string;
  question: string;
  answer: string;
}

export type ItemCategory = 'Beauty' | 'Clothes' | 'Accessories' | 'Sports' | 'Electronics' | 'Home' | 'Other';

export interface Item {
  id: string;
  /** True when user has completed the constraint (time passed or goal password entered). */
  isUnlocked?: boolean;
  name: string;
  imageUrl?: string;
  productUrl?: string;
  category?: ItemCategory;
  constraintType: 'time' | 'goals';
  consumptionScore: number;
  addedDate: string;
  waitUntilDate?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionnaire: QuestionAnswer[];
  friendName?: string;
  friendEmail?: string;
  unlockPassword?: string;
  /** Whether the friend has set a password (without exposing the actual hash) */
  hasUnlockPassword?: boolean;
}
