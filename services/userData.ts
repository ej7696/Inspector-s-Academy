import { User, QuizResult } from '../types';

// Mock user data. In a real application, this would come from a database.
const users: User[] = [
    {
        id: 1,
        email: 'admin@test.com',
        password: 'admin123',
        role: 'ADMIN',
        isPro: true,
        history: [],
    },
    {
        id: 2,
        email: 'subadmin@test.com',
        password: 'subadmin123',
        role: 'SUB_ADMIN',
        isPro: true,
        history: [],
    },
    {
        id: 3,
        email: 'userpro@test.com',
        password: 'userpro123',
        role: 'USER',
        isPro: true,
        history: [],
    },
    {
        id: 4,
        email: 'user@test.com',
        password: 'user123',
        role: 'USER',
        isPro: false,
        history: [],
    },
];

export const findUserByEmail = (email: string): User | undefined => {
    return users.find(user => user.email === email);
}

export const getAllUsers = (): User[] => {
    // Return a deep copy to prevent direct mutation of the "database"
    return JSON.parse(JSON.stringify(users));
}


export const updateUser = (updatedUser: User): boolean => {
    const userIndex = users.findIndex(u => u.id === updatedUser.id);
    if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updatedUser };
        return true;
    }
    return false;
}
