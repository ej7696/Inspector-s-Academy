import { User, QuizResult } from '../types';

// In a real application, this data would be in a database.
// Passwords are plaintext for this simulation. In production, they MUST be hashed.
// admin@test.com / admin123
// subadmin@test.com / subadmin123
// user@test.com / user123
// userpro@test.com / userpro123

const users: User[] = [
  { id: 1, email: 'admin@test.com', password: 'admin123', role: 'ADMIN', isPro: true },
  { id: 2, email: 'subadmin@test.com', password: 'subadmin123', role: 'SUB_ADMIN', isPro: true },
  { id: 3, email: 'user@test.com', password: 'user123', role: 'USER', isPro: false },
  { id: 4, email: 'userpro@test.com', password: 'userpro123', role: 'USER', isPro: true },
];

let quizResults: QuizResult[] = [
    { 
        id: '1', userId: 4, examName: 'API 653 - Aboveground Storage Tank Inspector', date: Date.now() - 86400000 * 2, 
        score: 8, totalQuestions: 10, percentage: 80, userAnswers: [] 
    },
    { 
        id: '2', userId: 4, examName: 'API 653 - Aboveground Storage Tank Inspector', date: Date.now() - 86400000, 
        score: 9, totalQuestions: 10, percentage: 90, userAnswers: [] 
    },
    { 
        id: '3', userId: 3, examName: 'API 570 - Piping Inspector', date: Date.now() - 86400000 * 3, 
        score: 6, totalQuestions: 10, percentage: 60, userAnswers: [] 
    },
];

// Simulate API calls to a backend database

export const findUserByEmail = (email: string): User | undefined => {
  return users.find(user => user.email === email);
};

export const getAllUsers = (): User[] => {
    return [...users];
};

export const updateUser = (updatedUser: User): User => {
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
        users[index] = updatedUser;
        return users[index];
    }
    throw new Error("User not found");
};


export const getUserHistory = (userId: number): QuizResult[] => {
  return quizResults.filter(result => result.userId === userId).sort((a, b) => b.date - a.date);
};

export const saveUserHistory = (newResult: QuizResult): void => {
  quizResults.unshift(newResult);
};

export const getAllHistory = (): QuizResult[] => {
    return [...quizResults];
}