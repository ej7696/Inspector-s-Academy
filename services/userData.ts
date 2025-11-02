import { User } from '../types';

const USERS_KEY = 'users_db';

const getDaysAgo = (days: number) => Date.now() - days * 24 * 60 * 60 * 1000;

const getSeedUsers = (): User[] => [
  {
    id: '1',
    email: 'admin@test.com',
    password: 'admin123',
    subscriptionTier: 'Specialist',
    unlockedExams: ["API 510 - Pressure Vessel Inspector", "CWI - Certified Welding Inspector"],
    history: [
        { id: 'h1', examName: 'API 510 - Pressure Vessel Inspector', score: 85, totalQuestions: 100, percentage: 85, date: getDaysAgo(2), userAnswers: [] },
        { id: 'h2', examName: 'CWI - Certified Welding Inspector', score: 92, totalQuestions: 120, percentage: 76.6, date: getDaysAgo(5), userAnswers: [] },
    ],
    inProgressQuiz: null,
    role: 'ADMIN',
    subscriptionExpiresAt: getDaysAgo(-120),
    createdAt: getDaysAgo(200),
    lastActive: getDaysAgo(0),
  },
  {
    id: '6',
    email: 'subadmin@test.com',
    password: 'subadmin123',
    subscriptionTier: 'Specialist',
    unlockedExams: ["API 570 - Piping Inspector"],
    history: [],
    inProgressQuiz: null,
    role: 'SUB_ADMIN',
    subscriptionExpiresAt: getDaysAgo(-90),
    createdAt: getDaysAgo(90),
    lastActive: getDaysAgo(1),
  },
  {
    id: '2',
    email: 'userpro@test.com',
    password: 'userpro123',
    subscriptionTier: 'Professional',
    unlockedExams: ["API 570 - Piping Inspector"],
    history: [
        { id: 'h3', examName: 'API 570 - Piping Inspector', score: 68, totalQuestions: 100, percentage: 68, date: getDaysAgo(10), userAnswers: [] },
    ],
    inProgressQuiz: null,
    role: 'USER',
    subscriptionExpiresAt: getDaysAgo(-60),
    createdAt: getDaysAgo(45),
    lastActive: getDaysAgo(3),
  },
   {
    id: '4',
    email: 'user@test.com',
    password: 'user123',
    subscriptionTier: 'Professional',
    unlockedExams: [],
    history: [],
    inProgressQuiz: null,
    role: 'USER',
    subscriptionExpiresAt: getDaysAgo(-15),
    createdAt: getDaysAgo(10),
    lastActive: getDaysAgo(10),
  },
  {
    id: '5',
    email: 'specialist@test.com',
    password: 'specialist123',
    subscriptionTier: 'Specialist',
    unlockedExams: ["API 653 - Aboveground Storage Tank Inspector", "SIFE - Source Inspector Fixed Equipment"],
    history: [
      { id: 'h4', examName: 'API 653 - Aboveground Storage Tank Inspector', score: 105, totalQuestions: 120, percentage: 87.5, date: getDaysAgo(1), userAnswers: [] }
    ],
    inProgressQuiz: null,
    role: 'USER',
    subscriptionExpiresAt: getDaysAgo(-110),
    createdAt: getDaysAgo(32),
    lastActive: getDaysAgo(1),
  },
  {
    id: '3',
    email: 'cadet@test.com',
    password: 'user123',
    subscriptionTier: 'Cadet',
    unlockedExams: [],
    history: [],
    inProgressQuiz: null,
    role: 'USER',
    createdAt: getDaysAgo(5),
    lastActive: getDaysAgo(5),
  },
];

const initializeUsers = (): void => {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(getSeedUsers()));
  }
};

initializeUsers();

const getAllUsers = (): User[] => {
  try {
    const usersJson = localStorage.getItem(USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  } catch (error) {
    return [];
  }
};

export const findUserByEmail = (email: string): User | undefined => {
  const users = getAllUsers();
  return users.find(u => u.email === email);
};

export const updateUser = (updatedUser: User): void => {
  let users = getAllUsers();
  const userIndex = users.findIndex(u => u.id === updatedUser.id);
  if (userIndex !== -1) {
    users[userIndex] = updatedUser;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
};

export const fetchAllUsers = (): User[] => {
    return getAllUsers().sort((a, b) => a.email.localeCompare(b.email));
}