import { QuizSettings } from "./App";

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
export type SubscriptionTier = 'Cadet' | 'Professional' | 'Specialist';

export interface InProgressQuizState {
  quizSettings: QuizSettings;
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: (string | null)[];
  timeLeft: number | null;
  simulationPhase: 'closed_book' | 'open_book' | null;
  closedBookResults: { questions: Question[], userAnswers: (string|null)[] } | null;
}

export interface User {
  id: number;
  email: string;
  password?: string;
  role: UserRole;
  subscriptionTier: SubscriptionTier;
  unlockedExams: string[];
  history: QuizResult[];
  subscriptionExpiresAt?: number;
  inProgressQuiz?: InProgressQuizState | null;
}