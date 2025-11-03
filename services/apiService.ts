import { GoogleGenAI, Type } from "@google/genai";
import { User, QuizSettings, Question, QuizResult, InProgressQuizState, ActivityEvent } from '../types';
import { examSourceData } from './examData';

// --- DATABASE & SESSION SIMULATION ---
const USERS_KEY = 'users_db';
const SESSION_KEY = 'currentUser_session';
const ACTIVITY_FEED_KEY = 'activity_feed';
const NETWORK_DELAY = 500; // ms

const getDaysAgo = (days: number) => Date.now() - days * 24 * 60 * 60 * 1000;

// --- Seed Data ---
const getSeedUsers = (): User[] => [
    { id: '1', email: 'admin@test.com', password: 'admin123', subscriptionTier: 'Specialist', unlockedExams: ["API 510 - Pressure Vessel Inspector", "CWI - Certified Welding Inspector"], history: [{ id: 'h1', examName: 'API 510 - Pressure Vessel Inspector', score: 85, totalQuestions: 100, percentage: 85, date: getDaysAgo(2), userAnswers: [] }, { id: 'h2', examName: 'CWI - Certified Welding Inspector', score: 92, totalQuestions: 120, percentage: 76.6, date: getDaysAgo(5), userAnswers: [] }], inProgressQuiz: null, role: 'ADMIN', subscriptionExpiresAt: getDaysAgo(-120), createdAt: getDaysAgo(200), lastActive: getDaysAgo(0) },
    { id: '6', email: 'subadmin@test.com', password: 'subadmin123', subscriptionTier: 'Specialist', unlockedExams: ["API 570 - Piping Inspector"], history: [], inProgressQuiz: null, role: 'SUB_ADMIN', subscriptionExpiresAt: getDaysAgo(-90), createdAt: getDaysAgo(90), lastActive: getDaysAgo(1) },
    { id: '2', email: 'userpro@test.com', password: 'userpro123', subscriptionTier: 'Professional', unlockedExams: ["API 570 - Piping Inspector"], history: [{ id: 'h3', examName: 'API 570 - Piping Inspector', score: 68, totalQuestions: 100, percentage: 68, date: getDaysAgo(10), userAnswers: [] }], inProgressQuiz: null, role: 'USER', subscriptionExpiresAt: getDaysAgo(-60), createdAt: getDaysAgo(45), lastActive: getDaysAgo(3) },
    { id: '4', email: 'user@test.com', password: 'user123', subscriptionTier: 'Professional', unlockedExams: [], history: [], inProgressQuiz: null, role: 'USER', subscriptionExpiresAt: getDaysAgo(-15), createdAt: getDaysAgo(10), lastActive: getDaysAgo(10) },
    { id: '5', email: 'specialist@test.com', password: 'specialist123', subscriptionTier: 'Specialist', unlockedExams: ["API 653 - Aboveground Storage Tank Inspector", "SIFE - Source Inspector Fixed Equipment"], history: [{ id: 'h4', examName: 'API 653 - Aboveground Storage Tank Inspector', score: 105, totalQuestions: 120, percentage: 87.5, date: getDaysAgo(1), userAnswers: [] }], inProgressQuiz: null, role: 'USER', subscriptionExpiresAt: getDaysAgo(-110), createdAt: getDaysAgo(32), lastActive: getDaysAgo(1) },
    { id: '3', email: 'cadet@test.com', password: 'user123', subscriptionTier: 'Cadet', unlockedExams: [], history: [], inProgressQuiz: null, role: 'USER', createdAt: getDaysAgo(5), lastActive: getDaysAgo(5) },
];

const initializeDb = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(getSeedUsers()));
  }
  if (!localStorage.getItem(ACTIVITY_FEED_KEY)) {
    localStorage.setItem(ACTIVITY_FEED_KEY, JSON.stringify([]));
  }
};

initializeDb();

// --- PRIVATE HELPER FUNCTIONS ---

const getAllUsersFromDb = (): User[] => {
    try {
        const usersJson = localStorage.getItem(USERS_KEY);
        return usersJson ? JSON.parse(usersJson) : [];
    } catch (error) { return []; }
};

const findUserByEmailFromDb = (email: string): User | undefined => {
    return getAllUsersFromDb().find(u => u.email === email);
};

const updateUserInDb = (updatedUser: User): void => {
    let users = getAllUsersFromDb();
    const userIndex = users.findIndex(u => u.id === updatedUser.id);
    if (userIndex !== -1) {
        users[userIndex] = updatedUser;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
};

const checkAndUpdateSubscriptionStatus = (user: User | null): User | null => {
    if (user && user.subscriptionExpiresAt && Date.now() > user.subscriptionExpiresAt) {
        const expiredUser: User = { ...user, subscriptionTier: 'Cadet', unlockedExams: [], subscriptionExpiresAt: undefined };
        updateUserInDb(expiredUser);
        api.updateCurrentUserSession(expiredUser); // Update session too
        return expiredUser;
    }
    return user;
};


// --- PUBLIC API SERVICE ---

const api = {
    // --- AUTH ---
    async login(email: string, password: string): Promise<User> {
        await new Promise(resolve => setTimeout(resolve, NETWORK_DELAY));
        const user = findUserByEmailFromDb(email);
        if (user && user.password === password) {
            const validatedUser = checkAndUpdateSubscriptionStatus(JSON.parse(JSON.stringify(user)));
            if (validatedUser) {
                localStorage.setItem(SESSION_KEY, JSON.stringify(validatedUser));
                await this.logActivity(validatedUser.email, 'logged in.', 'login');
                return validatedUser;
            }
        }
        throw new Error("Invalid email or password.");
    },

    async logout(): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, NETWORK_DELAY / 2));
        localStorage.removeItem(SESSION_KEY);
    },

    async getCurrentUser(): Promise<User | null> {
        await new Promise(resolve => setTimeout(resolve, NETWORK_DELAY / 4));
        try {
            const userJson = localStorage.getItem(SESSION_KEY);
            const user: User | null = userJson ? JSON.parse(userJson) : null;
            return checkAndUpdateSubscriptionStatus(user);
        } catch (error) {
            return null;
        }
    },

    async updateCurrentUserSession(user: User): Promise<void> {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    },

    // --- USER DATA ---
    async fetchAllUsers(): Promise<User[]> {
        await new Promise(resolve => setTimeout(resolve, NETWORK_DELAY));
        return getAllUsersFromDb().sort((a, b) => a.email.localeCompare(b.email));
    },

    async updateUser(updatedUser: User): Promise<User> {
        await new Promise(resolve => setTimeout(resolve, NETWORK_DELAY / 2));
        updateUserInDb(updatedUser);
        
        const currentUserJson = localStorage.getItem(SESSION_KEY);
        if(currentUserJson) {
            const currentUser = JSON.parse(currentUserJson);
            if(currentUser.id === updatedUser.id) {
                localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
            }
        }
        return updatedUser;
    },
    
    // --- ACTIVITY LOGGING ---
    async logActivity(userEmail: string, message: string, type: ActivityEvent['type']): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 100)); // Quick logging
        try {
            const feedJson = localStorage.getItem(ACTIVITY_FEED_KEY);
            let feed: ActivityEvent[] = feedJson ? JSON.parse(feedJson) : [];
            
            const newEvent: ActivityEvent = {
                id: new Date().toISOString() + Math.random(),
                timestamp: Date.now(),
                userEmail,
                message,
                type
            };
            
            feed.unshift(newEvent); // Add to the top
            
            if (feed.length > 50) { // Keep the feed to a reasonable size
                feed = feed.slice(0, 50);
            }
            
            localStorage.setItem(ACTIVITY_FEED_KEY, JSON.stringify(feed));
        } catch (e) {
            console.error("Failed to log activity:", e);
        }
    },
    
    async fetchActivityFeed(): Promise<ActivityEvent[]> {
        await new Promise(resolve => setTimeout(resolve, NETWORK_DELAY / 2));
        try {
            const feedJson = localStorage.getItem(ACTIVITY_FEED_KEY);
            return feedJson ? JSON.parse(feedJson) : [];
        } catch (e) {
            return [];
        }
    },

    // --- QUIZ GENERATION (SECURE PROXY SIMULATION) ---
    async generateQuiz(settings: QuizSettings): Promise<Question[]> {
        const { examName, numQuestions, examMode, topics } = settings;
        let numQs = numQuestions;
        let modeForPrompt = examMode;

        if (examMode === 'simulation') {
            numQs = Math.floor(numQuestions / 2);
            modeForPrompt = 'closed';
        }
        
        const examData = examSourceData[examName];
        if (!examData) throw new Error(`Exam data not found for "${examName}".`);

        const prompt = `
            You are a certified API/AWS/NDT exam instructor creating official-style mock questions.
            Generate ${numQs} unique, high-quality multiple-choice questions for the "${examName}" certification exam (${modeForPrompt} mode).
            Use the official latest Body of Knowledge and Effectivity Sheet, ensuring the same difficulty and structure as the real certification. The questions must be strictly based on these source materials:
            EFFECTIVITY SHEET: ${examData.effectivitySheet}
            BODY OF KNOWLEDGE: ${examData.bodyOfKnowledge}
            - For open-book style, emphasize clause lookups and calculations.
            - For closed-book, emphasize conceptual recall and judgment.
            - Each question must be a JSON object following this exact pattern:
            {
                "question": "A concise question text.",
                "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
                "answer": "The full text of the correct option, exactly matching one of the four options.",
                "reference": "The specific code reference, e.g., 'API 510 Section 5.3.2'.",
                "explanation": "A short, clear reason why the answer is correct.",
                "category": "A relevant category from the Body of Knowledge, e.g., 'Inspection, Repairs, Corrosion'."
            }
            ${topics ? `Focus specifically on these topics: ${topics}` : ''}
            Format the final output as a valid JSON array of these question objects.
        `;
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, answer: { type: Type.STRING }, reference: { type: Type.STRING }, explanation: { type: Type.STRING }, category: { type: Type.STRING } }, required: ['question', 'options', 'answer', 'reference', 'explanation', 'category'] } }
          }
        });

        const generatedQuestions = JSON.parse(response.text);
        if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
            throw new Error("The model did not return valid questions.");
        }
        return generatedQuestions;
    },
    
    async generateFollowUp(question: Question, query: string): Promise<string> {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const prompt = `
            You are an expert AI Tutor for certification exams. A student is asking a follow-up question about a specific mock exam question.
            Original Question: "${question.question}"
            Correct Answer: "${question.answer}"
            Explanation: "${question.explanation}"
            Reference: "${question.reference}"
            Student's Query: "${query}"
            Provide a clear, concise, and helpful answer to the student's query. Address their question directly, referencing the original context.
        `;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: prompt,
        });
        return response.text;
    }
};

export default api;
