import { QuizResult } from '../types';

const HISTORY_KEY = 'quizHistory';
const PRO_STATUS_KEY = 'isProUser';

export const getHistory = (): QuizResult[] => {
  try {
    const historyJson = localStorage.getItem(HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error("Failed to parse quiz history:", error);
    return [];
  }
};

export const saveHistory = (history: QuizResult[]): void => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

export const getProStatus = (): boolean => {
  return localStorage.getItem(PRO_STATUS_KEY) === 'true';
};

export const saveProStatus = (isPro: boolean): void => {
  localStorage.setItem(PRO_STATUS_KEY, String(isPro));
};
