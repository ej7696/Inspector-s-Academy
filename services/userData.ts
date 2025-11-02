import { User } from '../types';

// Mock user data. In a real application, this would come from a database.
const users: User[] = [
    {
        id: 1,
        email: 'admin@test.com',
        password: 'admin123',
        role: 'ADMIN',
        subscriptionTier: 'Specialist', // Admins have top tier
        unlockedExams: [], // Admins have access to all, so this is irrelevant
        history: [],
    },
    {
        id: 2,
        email: 'subadmin@test.com',
        password: 'subadmin123',
        role: 'SUB_ADMIN',
        subscriptionTier: 'Specialist',
        unlockedExams: [],
        history: [],
    },
    {
        id: 3,
        email: 'userpro@test.com',
        password: 'userpro123',
        role: 'USER',
        subscriptionTier: 'Professional',
        unlockedExams: ["API 510 - Pressure Vessel Inspector"],
        history: [],
        subscriptionExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // Expires in 30 days for demo
    },
    {
        id: 4,
        email: 'user@test.com',
        password: 'user123',
        role: 'USER',
        subscriptionTier: 'Cadet',
        unlockedExams: [],
        history: [],
    },
     {
        id: 5,
        email: 'specialist@test.com',
        password: 'specialist123',
        role: 'USER',
        subscriptionTier: 'Specialist',
        unlockedExams: ["API 570 - Piping Inspector", "API 653 - Aboveground Storage Tank Inspector"],
        history: [],
        subscriptionExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // Expires in 30 days for demo
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