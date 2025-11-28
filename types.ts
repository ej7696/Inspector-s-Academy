export type SubscriptionTier = "Starter" | "Professional" | "Specialist";
export type UserRole = "user" | "admin";
export type ExamMode = "open-book" | "closed-book" | "simulation";
export type QuestionDifficulty = "easy" | "medium" | "hard";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  subscriptionTier: SubscriptionTier;
  paidUnlockSlots: number;
  monthlyQuestionRemaining: number;
  monthlyExamUsage: Record<string, number>;
  createdAt: number;
  lastLoginAt: number;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  category: string;
  difficulty?: QuestionDifficulty;
  codeReference?: string;
  examName?: string;
}

export interface QuizSettings {
  examName: string;
  numQuestions: number;
  examMode: ExamMode;
  timeLimit?: number;
  allowCalculator: boolean;
  allowCodeReference: boolean;
}

export interface QuizResult {
  id: string;
  userId: string;
  examName: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent?: number;
  timestamp: number;
  answers: string[];
  examMode: ExamMode;
  categoryScores?: Record<string, { correct: number; total: number }>;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalExams: number;
  averageScore: number;
  revenueThisMonth: number;
  subscriptionBreakdown: Record<SubscriptionTier, number>;
}
