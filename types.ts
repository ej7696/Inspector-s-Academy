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

export interface QuizResult {
  id: string;
  examName: string;
  date: number;
  score: number;
  percentage: number;
  totalQuestions: number;
  userAnswers: UserAnswer[];
}
