export interface QuestionAnswer {
  id: string;
  question: string;
  answer: string;
}

export type ItemCategory = 'Beauty' | 'Clothes' | 'Sports' | 'Electronics' | 'Home' | 'Other';

export interface Item {
  id: string;
  name: string;
  imageUrl: string;
  category?: ItemCategory;
  constraintType: 'time' | 'goals';
  consumptionScore: number;
  addedDate: string;
  waitUntilDate?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionnaire: QuestionAnswer[];
}
