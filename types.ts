export interface Question {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  reference: string;
  quote: string;
  category: string;
}

export interface UserAnswer extends Question {
  userAnswer: string;
}

export type UserRole = 'USER' | 'SUB_ADMIN' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  password; // In a real app, this would be a hash
  role: UserRole;
  isPro: boolean;
}

export interface QuizResult {
  id: string;
  userId: number;
  examName: string;
  date: number;
  score: number;
  percentage: number;
  totalQuestions: number;
  userAnswers: UserAnswer[];
}
