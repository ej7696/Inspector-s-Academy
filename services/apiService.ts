import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { 
    User, Question, QuizSettings, QuizResult, UserAnswer, InProgressQuizState, ActivityEvent, ActivityEventType, Exam, Announcement,
    SubscriptionTier, Role 
} from '../types';
import { examSourceData } from './examData';

// --- MOCK DATABASE (using localStorage) ---

const DB_USERS_KEY = 'academy_users';
const DB_ACTIVITY_KEY = 'academy_activity';
const DB_EXAMS_KEY = 'academy_exams';
const DB_ANNOUNCEMENTS_KEY = 'academy_announcements';
const SESSION_KEY = 'currentUser';

let ai: GoogleGenAI;

// Initialize and seed data if DB is empty
const initializeData = () => {
    if (!localStorage.getItem(DB_USERS_KEY)) {
        const now = Date.now();
        const initialUsers: User[] = [
            { id: '1', fullName: 'Admin User', email: 'admin@test.com', phoneNumber: '555-0101', password: 'admin123', role: 'ADMIN', subscriptionTier: 'Specialist', unlockedExams: [], history: [], createdAt: now, lastActive: now, permissions: { canEditUserDetails: true, canSendPasswordResets: true, canManageSubscriptions: true, canSuspendUsers: true, canManageAnnouncements: true }, isSuspended: false },
            { id: '2', fullName: 'Sub Admin', email: 'subadmin@test.com', phoneNumber: '555-0102', password: 'subadmin123', role: 'SUB_ADMIN', subscriptionTier: 'Specialist', unlockedExams: [], history: [], createdAt: now, lastActive: now, permissions: { canEditUserDetails: true, canSendPasswordResets: true, canManageSubscriptions: false, canSuspendUsers: false, canManageAnnouncements: false }, isSuspended: false },
            { id: '3', fullName: 'Pro User', email: 'pro@test.com', phoneNumber: '555-0103', password: 'pro123', role: 'USER', subscriptionTier: 'Professional', unlockedExams: [], history: [], createdAt: now, lastActive: now, isSuspended: false },
            { id: '4', fullName: 'Specialist User', email: 'specialist@test.com', phoneNumber: '555-0104', password: 'specialist123', role: 'USER', subscriptionTier: 'Specialist', unlockedExams: [], history: [], createdAt: now, lastActive: now, isSuspended: false },
            { id: '5', fullName: 'Cadet User', email: 'cadet@test.com', phoneNumber: '555-0105', password: 'user123', role: 'USER', subscriptionTier: 'Cadet', unlockedExams: [], history: [], createdAt: now, lastActive: now, isSuspended: false },
        ];
        localStorage.setItem(DB_USERS_KEY, JSON.stringify(initialUsers));
    }
    if (!localStorage.getItem(DB_EXAMS_KEY)) {
        const initialExams: Exam[] = Object.keys(examSourceData).map((examName, index) => ({
            id: `exam_${index + 1}`,
            name: examName,
            effectivitySheet: examSourceData[examName].effectivitySheet,
            bodyOfKnowledge: examSourceData[examName].bodyOfKnowledge,
            isActive: true,
        }));
        localStorage.setItem(DB_EXAMS_KEY, JSON.stringify(initialExams));
    }
    if (!localStorage.getItem(DB_ANNOUNCEMENTS_KEY)) {
        const initialAnnouncements: Announcement[] = [
            { id: 'announce_1', message: 'Welcome to the new Inspector\'s Academy! We have updated our exam content for 2026.', isActive: true, createdAt: Date.now() }
        ];
        localStorage.setItem(DB_ANNOUNCEMENTS_KEY, JSON.stringify(initialAnnouncements));
    }
    if (!localStorage.getItem(DB_ACTIVITY_KEY)) {
        localStorage.setItem(DB_ACTIVITY_KEY, JSON.stringify([]));
    }
};


// --- API Service Definition ---

const api = {
    // --- Initialization ---
    initialize: () => {
        initializeData();
        // The API key is managed by the execution environment.
        // It's retrieved from `process.env.API_KEY`.
        // This setup simulates a secure backend where the key is not exposed client-side.
        if (process.env.API_KEY) {
           ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        } else {
           console.error("API_KEY environment variable not set. Quiz generation will fail.");
        }
    },

    // --- User & Auth ---
    
    login: async (email: string, password?: string): Promise<User> => {
        await new Promise(res => setTimeout(res, 500)); // Simulate network latency
        const users: User[] = JSON.parse(localStorage.getItem(DB_USERS_KEY) || '[]');
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!user || (password && user.password !== password)) {
            throw new Error('Invalid email or password.');
        }
        
        if (user.isSuspended) {
            throw new Error('This account has been suspended.');
        }

        sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
        await api.logActivity(user.id, 'login', `User logged in successfully.`);
        
        // Update last active time
        const updatedUser = { ...user, lastActive: Date.now() };
        api.updateUser(user.id, { lastActive: Date.now() });

        return updatedUser;
    },

    logout: async (): Promise<void> => {
        sessionStorage.removeItem(SESSION_KEY);
    },

    sendPasswordReset: async (email: string): Promise<void> => {
        await new Promise(res => setTimeout(res, 500));
        const users: User[] = JSON.parse(localStorage.getItem(DB_USERS_KEY) || '[]');
        const userExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
        if (!userExists) {
            throw new Error("No account found with that email address.");
        }
        // In a real Firebase app, this would trigger a Firebase Auth email. Here we simulate it.
        console.log(`Password reset email sent to ${email}`);
        alert(`A password reset link has been sent to ${email}.`);
    },

    checkSession: async (): Promise<User | null> => {
        const userJson = sessionStorage.getItem(SESSION_KEY);
        if (!userJson) return null;
        
        // Re-fetch user data to ensure it's up-to-date
        const sessionUser = JSON.parse(userJson);
        const users: User[] = JSON.parse(localStorage.getItem(DB_USERS_KEY) || '[]');
        const currentUser = users.find(u => u.id === sessionUser.id);
        
        if (currentUser && currentUser.isSuspended) {
            await api.logout();
            return null;
        }

        return currentUser || null;
    },

    getAllUsers: async (): Promise<User[]> => {
        return JSON.parse(localStorage.getItem(DB_USERS_KEY) || '[]');
    },

    updateUser: async (userId: string, updatedData: Partial<User>): Promise<User> => {
        let users: User[] = JSON.parse(localStorage.getItem(DB_USERS_KEY) || '[]');
        let userToUpdate: User | undefined;
        
        users = users.map(u => {
            if (u.id === userId) {
                const wasNotSubAdmin = u.role !== 'SUB_ADMIN';
                const isNowSubAdmin = updatedData.role === 'SUB_ADMIN';
                const finalData = { ...u, ...updatedData };

                if(wasNotSubAdmin && isNowSubAdmin && !finalData.permissions) {
                    finalData.permissions = {
                        canEditUserDetails: false,
                        canSendPasswordResets: false,
                        canManageSubscriptions: false,
                        canSuspendUsers: false,
                        canManageAnnouncements: false,
                    };
                }

                userToUpdate = finalData;
                return userToUpdate;
            }
            return u;
        });

        if (!userToUpdate) throw new Error('User not found.');

        localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
        
        // If the updated user is the current session user, update the session
        const sessionUser = await api.checkSession();
        if (sessionUser && sessionUser.id === userId) {
             sessionStorage.setItem(SESSION_KEY, JSON.stringify(userToUpdate));
        }

        return userToUpdate;
    },

    addUser: async (newUser: Omit<User, 'id' | 'subscriptionTier' | 'unlockedExams' | 'history' | 'inProgressQuiz' | 'createdAt' | 'lastActive'>): Promise<User> => {
        let users: User[] = JSON.parse(localStorage.getItem(DB_USERS_KEY) || '[]');
        if (users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase())) {
            throw new Error('An account with this email already exists.');
        }
        const now = Date.now();
        const user: User = {
            ...newUser,
            id: `user_${now}`,
            subscriptionTier: 'Cadet',
            unlockedExams: [],
            history: [],
            createdAt: now,
            lastActive: now,
            isSuspended: false,
        };
        users.push(user);
        localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
        return user;
    },

    // --- Quiz Logic ---

    generateQuiz: async (settings: QuizSettings): Promise<Question[]> => {
        if (!ai) throw new Error("AI Client not initialized. Check API Key.");
        
        const { examName, numQuestions, examMode, topics } = settings;
        const source = examSourceData[examName] || { effectivitySheet: 'General Knowledge', bodyOfKnowledge: 'General Knowledge' };
        
        const modeForPrompt = examMode === 'simulation' ? 'closed-book' : examMode;

        const prompt = `
        You are a certified API/AWS/NDT exam instructor creating official-style mock questions.
        Generate ${numQuestions} unique, high-quality multiple-choice questions for the "${examName}" certification exam (${modeForPrompt} mode).
        Use the official latest Body of Knowledge and Effectivity Sheet provided below, ensuring the same difficulty and structure as the real certification.
        ${topics ? `The user wants to focus specifically on these topics: ${topics}. Ensure a significant portion of the questions target these areas.` : ''}

        - For open-book style, emphasize clause lookups and calculations (show formula or step-based logic in explanation).
        - For closed-book, emphasize conceptual recall and judgment.
        - Each question must be distinct and challenging.
        - The "answer" field must EXACTLY match one of the four options, including the leading "A) ", "B) ", etc.
        - Provide a concise but thorough "explanation".
        - Provide a specific "reference" from the source documents.
        - Provide a relevant "category" for the question.

        SOURCE DOCUMENTS:
        ---
        Effectivity Sheet:
        ${source.effectivitySheet}
        ---
        Body of Knowledge:
        ${source.bodyOfKnowledge}
        ---
        `;

        const responseSchema = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              answer: { type: Type.STRING },
              reference: { type: Type.STRING },
              explanation: { type: Type.STRING },
              category: { type: Type.STRING },
            },
            required: ["question", "options", "answer", "explanation", "reference", "category"]
          }
        };

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: prompt,
          config: {
              responseMimeType: "application/json",
              responseSchema,
          }
        });

        const jsonText = response.text.trim();
        const generatedQuestions = JSON.parse(jsonText);
        
        if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
            throw new Error("The AI failed to generate a valid set of questions. Please try again.");
        }
        
        return generatedQuestions;
    },
    
    generateFollowUp: async (question: Question, query: string): Promise<string> => {
        if (!ai) throw new Error("AI Client not initialized.");
        const prompt = `
            Context: A user is studying for an inspection certification exam.
            They just answered the following question:
            Question: "${question.question}"
            Correct Answer: "${question.answer}"
            Explanation: "${question.explanation}"
            Reference: "${question.reference}"

            The user has a follow-up question: "${query}"

            Please provide a clear, concise, and helpful answer to their follow-up question, acting as a friendly and knowledgeable tutor.
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        return response.text;
    },

    saveQuizResult: async (userId: string, result: Omit<QuizResult, 'id' | 'userId'>): Promise<QuizResult> => {
        const newResult: QuizResult = { ...result, id: `result_${Date.now()}`, userId };
        const user = await api.updateUser(userId, { history: [...(await api.checkSession())!.history, newResult] });
        return newResult;
    },
    
    saveInProgressQuiz: async (userId: string, progress: InProgressQuizState): Promise<User> => {
        return await api.updateUser(userId, { inProgressQuiz: progress });
    },
    
    clearInProgressQuiz: async (userId: string): Promise<User> => {
        return await api.updateUser(userId, { inProgressQuiz: null });
    },

    // --- Activity Feed ---
    
    logActivity: async (userId: string, type: ActivityEventType, message: string): Promise<void> => {
        const users = await api.getAllUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return;

        let feed: ActivityEvent[] = JSON.parse(localStorage.getItem(DB_ACTIVITY_KEY) || '[]');
        const event: ActivityEvent = {
            id: `event_${Date.now()}`,
            userId,
            userEmail: user.email,
            type,
            message,
            timestamp: Date.now()
        };
        feed.unshift(event); // Add to the top
        if (feed.length > 100) feed.pop(); // Keep feed size manageable
        localStorage.setItem(DB_ACTIVITY_KEY, JSON.stringify(feed));
    },

    fetchActivityFeed: async (): Promise<ActivityEvent[]> => {
        return JSON.parse(localStorage.getItem(DB_ACTIVITY_KEY) || '[]');
    },

    fetchUserActivity: async(userId: string): Promise<ActivityEvent[]> => {
        const feed: ActivityEvent[] = JSON.parse(localStorage.getItem(DB_ACTIVITY_KEY) || '[]');
        return feed.filter(event => event.userId === userId);
    },

    // --- Content Management (Exams) ---
    getExams: async (): Promise<Exam[]> => {
        return JSON.parse(localStorage.getItem(DB_EXAMS_KEY) || '[]');
    },
    addExam: async (exam: Omit<Exam, 'id'>): Promise<Exam> => {
        const exams = await api.getExams();
        const newExam: Exam = { ...exam, id: `exam_${Date.now()}` };
        exams.push(newExam);
        localStorage.setItem(DB_EXAMS_KEY, JSON.stringify(exams));
        return newExam;
    },
    updateExam: async (examId: string, updatedData: Partial<Exam>): Promise<Exam> => {
        let exams = await api.getExams();
        let examToUpdate: Exam | undefined;
        exams = exams.map(e => {
            if (e.id === examId) {
                examToUpdate = { ...e, ...updatedData };
                return examToUpdate;
            }
            return e;
        });
        if (!examToUpdate) throw new Error('Exam not found');
        localStorage.setItem(DB_EXAMS_KEY, JSON.stringify(exams));
        return examToUpdate;
    },
    deleteExam: async (examId: string): Promise<void> => {
        let exams = await api.getExams();
        exams = exams.filter(e => e.id !== examId);
        localStorage.setItem(DB_EXAMS_KEY, JSON.stringify(exams));
    },
    getExamBodyOfKnowledge: (examName: string): string => {
        return examSourceData[examName]?.bodyOfKnowledge || "No specific knowledge areas defined for this exam.";
    },

    // --- Content Management (Announcements) ---
    getAnnouncements: async (): Promise<Announcement[]> => {
        return JSON.parse(localStorage.getItem(DB_ANNOUNCEMENTS_KEY) || '[]');
    },
    addAnnouncement: async (ann: Omit<Announcement, 'id'|'createdAt'>): Promise<Announcement> => {
        const announcements = await api.getAnnouncements();
        const newAnn: Announcement = { ...ann, id: `ann_${Date.now()}`, createdAt: Date.now() };
        announcements.push(newAnn);
        localStorage.setItem(DB_ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
        return newAnn;
    },
    updateAnnouncement: async (id: string, updatedData: Partial<Announcement>): Promise<Announcement> => {
        let announcements = await api.getAnnouncements();
        let annToUpdate: Announcement | undefined;
        announcements = announcements.map(a => {
            if (a.id === id) {
                annToUpdate = { ...a, ...updatedData };
                return annToUpdate;
            }
            return a;
        });
        if (!annToUpdate) throw new Error('Announcement not found');
        localStorage.setItem(DB_ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
        return annToUpdate;
    },
    deleteAnnouncement: async (id: string): Promise<void> => {
        let announcements = await api.getAnnouncements();
        announcements = announcements.filter(a => a.id !== id);
        localStorage.setItem(DB_ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
    },
};

api.initialize();

export default api;