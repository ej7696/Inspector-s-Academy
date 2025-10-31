export interface Question {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface UserAnswer extends Question {
  userAnswer: string;
}
