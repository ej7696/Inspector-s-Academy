import { User } from '../types';
import { findUserByEmail } from './userData';

const SESSION_KEY = 'currentUser';

export const login = (email: string, password: string):User | null => {
    const user = findUserByEmail(email);
    if (user && user.password === password) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        return user;
    }
    return null;
}

export const logout = (): void => {
    localStorage.removeItem(SESSION_KEY);
}

export const getCurrentUser = (): User | null => {
    try {
        const userJson = localStorage.getItem(SESSION_KEY);
        return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
        return null;
    }
}

export const updateCurrentUser = (user: User): void => {
     localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}