import { User } from '../types';
import { findUserByEmail, updateUser } from './userData';

const SESSION_KEY = 'currentUser';

const checkAndUpdateSubscriptionStatus = (user: User | null): User | null => {
    if (user && user.subscriptionExpiresAt && Date.now() > user.subscriptionExpiresAt) {
        const expiredUser: User = {
            ...user,
            subscriptionTier: 'Cadet',
            unlockedExams: [],
            subscriptionExpiresAt: undefined,
        };
        // Update the "database" and the session
        updateUser(expiredUser);
        localStorage.setItem(SESSION_KEY, JSON.stringify(expiredUser));
        return expiredUser;
    }
    return user;
};

export const login = (email: string, password: string):User | null => {
    const user = findUserByEmail(email);
    if (user && user.password === password) {
        const validatedUser = checkAndUpdateSubscriptionStatus(JSON.parse(JSON.stringify(user)));
        if (validatedUser) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(validatedUser));
        }
        return validatedUser;
    }
    return null;
}

export const logout = (): void => {
    localStorage.removeItem(SESSION_KEY);
}

export const getCurrentUser = (): User | null => {
    try {
        const userJson = localStorage.getItem(SESSION_KEY);
        const user: User | null = userJson ? JSON.parse(userJson) : null;
        return checkAndUpdateSubscriptionStatus(user);
    } catch (error) {
        return null;
    }
}

export const updateCurrentUser = (user: User): void => {
     localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}