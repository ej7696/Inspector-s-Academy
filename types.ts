export interface UserAnswer {
  question: string;
  answer: string;
  userAnswer: string;
  isCorrect: boolean;
  category?: string;
  options: string[];
  reference?: string;
  quote?: string;
  explanation?: string;
}

export interface QuizResult {
  id: string;
  examName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  date: number;
  userAnswers: UserAnswer[];
}

export interface Question {
  question: string;
  options: string[];
  answer: string;
  reference?: string;
  quote?: string;
  explanation?: string;
  category?: string;
}

export type UserRole = 'USER' | 'SUB_ADMIN' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  password?: string;
  role: UserRole;
  isPro: boolean;
  history: QuizResult[];
}
