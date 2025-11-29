export type SubscriptionTier = "STARTER" | "PROFESSIONAL" | "SPECIALIST";
export type Role = "USER" | "ADMIN" | "SUB_ADMIN";
export type ExamMode = "open-book" | "closed-book" | "simulation";
export type QuestionDifficulty = "easy" | "medium" | "hard";

export interface Question {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  reference: string;
  category: string;
}

export interface UserAnswer {
  questionIndex: number;
  selectedAnswer: string;
  isCorrect: boolean;
  timeSpent?: number;
}

export interface InProgressAnswer {
  questionIndex: number;
  selectedAnswer: string | null;
  flagged: boolean;
}

export interface QuizSettings {
  examName: string;
  numQuestions: number;
  examMode: ExamMode;
  timeLimit?: number;
  topics?: string;
}

export interface InProgressQuizState {
  questions: Question[];
  answers: InProgressAnswer[];
  currentQuestionIndex: number;
  quizSettings: QuizSettings;
  startTime: number;
  timeRemaining: number;
  isSimulationIntermission: boolean;
}

export interface SubAdminPermissions {
  canViewUserList: boolean;
  canEditUsers: boolean;
  canSendPasswordResets: boolean;
  canManageAnnouncements: boolean;
  canManageExams: boolean;
  canAccessPerformanceAnalytics: boolean;
  canViewBillingSummary: boolean;
  canManageSubscriptions: boolean;
  canViewActivityLogs: boolean;
  canSuspendUsers: boolean;
}

export interface User {
  id: string;
  fullName?: string;
  email: string;
  phoneNumber?: string;
  password?: string;
  mustChangePassword?: boolean;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt?: number | null;
  unlockedExams: string[];
  history: QuizResult[];
  inProgressQuiz?: InProgressQuizState | null;
  role: Role;
  permissions?: SubAdminPermissions;
  createdAt: number;
  lastActive: number;
  isSuspended?: boolean;
  isNewUser?: boolean;
  referralCode?: string;
  accountCredit?: number;
  monthlyQuestionRemaining: number | null;
  monthlyExamUsage: { [examName: string]: number } | null;
  monthlyResetDate: number | null;
}

export interface QuizResult {
  id: string;
  userId: string;
  examName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  date: number;
  userAnswers: UserAnswer[];
  examMode: ExamMode;
  categoryScores?: Record<string, { correct: number; total: number }>;
}

export type ActivityEventType =
  | "login"
  | "user_signup"
  | "upgrade"
  | "unlock"
  | "one_time_unlock"
  | "quiz_complete"
  | "quiz_start"
  | "view_paywall"
  | "lead_captured"
  | "sample_quiz_completed";

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

export interface SubscriptionTierDetails {
  tier: SubscriptionTier;
  name: string;
  price: string;
  description: string;
  features: string[];
  cta?: string;
  isPopular?: boolean;
  isDeemphasized?: boolean;
}

export interface Testimonial {
  id: string;
  author: string;
  quote: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  author: string;
  date: string;
  excerpt: string;
  content: string;
  tags: string[];
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalExams: number;
  averageScore: number;
  revenueThisMonth: number;
  subscriptionBreakdown: Record<SubscriptionTier, number>;
}
