
// FIX: Defined the QuizSettings interface and removed the circular self-import.
export interface QuizSettings {
  examName: string;
  numQuestions: number;
  isTimed: boolean;
  examMode: 'open' | 'closed' | 'simulation';
  topics?: string;
}

export interface Question {
  question: string;
  options: string[];
  answer: string;
  reference: string;
  explanation: string;
  category: string;
}

export interface UserAnswer {
  question: string;
  options: string[];
  answer: string;
  userAnswer: string;
  isCorrect: boolean;
  category: string;
  reference: string;
  explanation: string;
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

export type SubscriptionTier = 'Cadet' | 'Professional' | 'Specialist';

export type UserRole = 'USER' | 'ADMIN' | 'SUB_ADMIN';

export interface InProgressQuizState {
    quizSettings: QuizSettings;
    questions: Question[];
    currentQuestionIndex: number;
    userAnswers: (string | null)[];
    timeLeft: number | null;
    simulationPhase: 'closed_book' | 'open_book' | null;
    closedBookResults: {
        questions: Question[];
        userAnswers: (string | null)[];
    } | null;
}

export interface User {
  id: string;
  email: string;
  password: string;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt?: number;
  unlockedExams: string[];
  history: QuizResult[];
  inProgressQuiz: InProgressQuizState | null;
  role: UserRole;
  createdAt: number;
  lastActive: number;
}

export interface ActivityEvent {
  id: string;
  timestamp: number;
  userEmail: string;
  message: string;
  type: 'login' | 'upgrade' | 'quiz_completion' | 'exam_unlock' | 'one_time_unlock';
}