export interface QuestionAnswer {
  id: string;
  question: string;
  answer: string;
}

export interface Item {
  id: string;
  name: string;
  imageUrl: string;
  constraintType: 'time' | 'goals';
  consumptionScore: number;
  addedDate: string;
  waitUntilDate?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionnaire: QuestionAnswer[];
}
