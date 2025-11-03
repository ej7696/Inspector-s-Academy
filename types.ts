import { GoogleGenAI } from "@google/genai";

export type SubscriptionTier = 'Cadet' | 'Professional' | 'Specialist';
export type Role = 'USER' | 'SUB_ADMIN' | 'ADMIN';

export interface Question {
  question: string;
  options: string[];
  answer: string;
  reference?: string;
  explanation?: string;
  category?: string;
}

export interface QuizSettings {
  examName: string;
  numQuestions: number;
  isTimed: boolean;
  examMode: 'open' | 'closed' | 'simulation';
  topics?: string;
}

export interface UserAnswer {
  question: string;
  options: string[];
  answer: string;
  userAnswer: string;
  isCorrect: boolean;
  category?: string;
  confidence?: 'guess' | 'sure' | 'confident';
}

export interface QuizResult {
  id: string;
  userId: string;
  examName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  date: number; // timestamp
  userAnswers: UserAnswer[];
}

export interface InProgressQuizState {
  questions: Question[];
  userAnswers: UserAnswer[];
  currentQuestionIndex: number;
  quizSettings: QuizSettings;
  startTime: number;
  timeRemaining: number;
  isSimulationIntermission: boolean;
}

export interface SubAdminPermissions {
    canEditUsers: boolean;
    canResetPasswords: boolean;
}

export interface User {
  id: string;
  fullName?: string;
  email: string;
  phoneNumber?: string;
  password?: string; // Should be handled securely on a real backend
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt?: number;
  unlockedExams: string[];
  history: QuizResult[];
  inProgressQuiz?: InProgressQuizState | null;
  role: Role;
  permissions?: SubAdminPermissions;
  createdAt: number;
  lastActive: number;
  isSuspended?: boolean;
}

export type ActivityEventType = 'login' | 'upgrade' | 'unlock' | 'one_time_unlock' | 'quiz_complete';

export interface ActivityEvent {
  id: string;
  userId: string;
  userEmail: string;
  type: ActivityEventType;
  message: string;
  timestamp: number;
}

export interface Exam {
    id: string;
    name: string;
    effectivitySheet: string;
    bodyOfKnowledge: string;
    isActive: boolean;
}

export interface Announcement {
    id: string;
    message: string;
    isActive: boolean;
    createdAt: number;
}