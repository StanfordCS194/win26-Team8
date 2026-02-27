export interface QuestionAnswer {
  id: string;
  question: string;
  answer: string;
}

export type ItemCategory = 'Beauty' | 'Clothes' | 'Accessories' | 'Sports' | 'Electronics' | 'Home' | 'Other';

export interface Item {
  id: string;
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
  /** True when a goals-based item was unlocked via password (item still in items table). */
  isUnlocked?: boolean;
}
