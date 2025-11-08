import { GoogleGenAI, Type } from "@google/genai";
import { User, Question, ActivityEvent, Exam, Announcement, SubscriptionTierDetails, Role, QuizResult, InProgressQuizState, InProgressAnswer, UserAnswer, SubscriptionTier } from '../types';
import { seedData } from './seedData';
import { examSourceData } from './examData';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const LOCAL_STORAGE_KEYS = {
  USERS: 'inspectors_academy_users',
  ANNOUNCEMENTS: 'inspectors_academy_announcements',
  EXAMS: 'inspectors_academy_exams',
  ACTIVITY: 'inspectors_academy_activity',
  LOGGED_IN_USER: 'inspectors_academy_logged_in_user',
  SUBSCRIPTION_TIERS: 'inspectors_academy_subscription_tiers',
};

class ApiService {
  constructor() {
    this.initializeData();
  }

  initializeData() {
    if (!localStorage.getItem(LOCAL_STORAGE_KEYS.USERS)) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.USERS, JSON.stringify(seedData.users));
    }
    if (!localStorage.getItem(LOCAL_STORAGE_KEYS.ANNOUNCEMENTS)) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(seedData.announcements));
    }
    if (!localStorage.getItem(LOCAL_STORAGE_KEYS.EXAMS)) {
       const examsFromSource = Object.entries(examSourceData).map(([name, data], index) => ({
          id: `exam-${index + 1}`,
          name,
          ...data,
          isActive: true
       }));
       localStorage.setItem(LOCAL_STORAGE_KEYS.EXAMS, JSON.stringify(examsFromSource));
    }
    if (!localStorage.getItem(LOCAL_STORAGE_KEYS.ACTIVITY)) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVITY, JSON.stringify(seedData.activityFeed));
    }
     if (!localStorage.getItem(LOCAL_STORAGE_KEYS.SUBSCRIPTION_TIERS)) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.SUBSCRIPTION_TIERS, JSON.stringify(seedData.subscriptionTiers));
    }
  }

  checkAndResetMonthlyLimits(user: User): User {
    if (user.subscriptionTier !== 'STARTER' || !user.monthlyResetDate || Date.now() < user.monthlyResetDate) {
      return user;
    }
    
    // Time to reset
    console.log(`Resetting monthly limits for ${user.email}`);
    const updates = {
      monthlyQuestionRemaining: 15,
      monthlyExamUsage: {},
      monthlyResetDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };
    return this.updateUser(user.id, updates);
  }

  recordStarterUsage(userId: string, examName: string, numQuestions: number): User {
    const users = this.getAllUsers();
    const user = users.find(u => u.id === userId);

    if (!user || user.subscriptionTier !== 'STARTER') {
      return user || this.getCurrentUser()!;
    }
    
    const newRemaining = (user.monthlyQuestionRemaining || 0) - numQuestions;
    const newExamUsage = { 
      ...user.monthlyExamUsage, 
      [examName]: (user.monthlyExamUsage?.[examName] || 0) + numQuestions 
    };

    return this.updateUser(userId, {
      monthlyQuestionRemaining: newRemaining,
      monthlyExamUsage: newExamUsage,
    });
  }
  
  // --- Auth ---
  async login(email: string, password: string): Promise<User> {
    const users = this.getAllUsers();
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) {
      throw new Error('Invalid email or password.');
    }
    if (user.isSuspended) {
      throw new Error('This account has been suspended.');
    }

    user = this.checkAndResetMonthlyLimits(user);

    user.lastActive = Date.now();
    this.updateUser(user.id, { lastActive: user.lastActive });
    localStorage.setItem(LOCAL_STORAGE_KEYS.LOGGED_IN_USER, user.id);
    this.logActivity('login', 'logged in.', user.id, user.email);
    return user;
  }

  logout() {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.LOGGED_IN_USER);
  }

  getCurrentUser(): User | null {
    const userId = localStorage.getItem(LOCAL_STORAGE_KEYS.LOGGED_IN_USER);
    if (!userId) return null;
    const users = this.getAllUsers();
    return users.find(u => u.id === userId) || null;
  }

  // --- Users ---
  getAllUsers(): User[] {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.USERS) || '[]');
  }
  
  updateUser(userId: string, updates: Partial<User>, silent: boolean = false): User {
    let users = this.getAllUsers();
    let userToUpdate: User | undefined;
    users = users.map(u => {
      if (u.id === userId) {
        userToUpdate = { ...u, ...updates };
        return userToUpdate;
      }
      return u;
    });
    if (!userToUpdate) throw new Error('User not found');
    localStorage.setItem(LOCAL_STORAGE_KEYS.USERS, JSON.stringify(users));

    // If updating the currently logged-in user, also update their session marker
    // unless it's a silent background update.
    const loggedInId = localStorage.getItem(LOCAL_STORAGE_KEYS.LOGGED_IN_USER);
    if (!silent && loggedInId === userId) {
        // This part is tricky in a localStorage setup. Re-serializing the user isn't ideal.
        // The App component should handle updating its own state.
    }

    return userToUpdate;
  }

  addUser(newUser: Omit<User, 'id' | 'subscriptionTier' | 'unlockedExams' | 'history' | 'inProgressQuiz' | 'createdAt' | 'lastActive' | 'monthlyQuestionRemaining' | 'monthlyExamUsage' | 'monthlyResetDate' | 'permissions' | 'subscriptionExpiresAt' | 'isSuspended' | 'paidUnlockSlots'>): User {
    const users = this.getAllUsers();
    if (users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase())) {
        throw new Error('A user with this email already exists.');
    }
    const now = Date.now();
    const user: User = {
      id: `user-${Date.now()}`,
      ...newUser,
      subscriptionTier: 'STARTER',
      paidUnlockSlots: 0,
      subscriptionExpiresAt: null,
      unlockedExams: [],
      history: [],
      createdAt: now,
      lastActive: now,
      monthlyQuestionRemaining: 15,
      monthlyExamUsage: {},
      monthlyResetDate: now + 30 * 24 * 60 * 60 * 1000,
    };
    users.push(user);
    localStorage.setItem(LOCAL_STORAGE_KEYS.USERS, JSON.stringify(users));
    return user;
  }

  async sendPasswordReset(email: string): Promise<void> {
    console.log(`Password reset sent to ${email}`);
    // In a real app, this would trigger a backend service.
    return Promise.resolve();
  }

  exportAllUsersAsCSV() {
    const users = this.getAllUsers();
    const headers = ['id', 'fullName', 'email', 'subscriptionTier', 'role', 'createdAt', 'lastActive'];
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...users.map(u => headers.map(h => JSON.stringify(u[h as keyof User])).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "users_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- Exams ---
  getExams(): Exam[] {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.EXAMS) || '[]');
  }
  addExam(exam: Omit<Exam, 'id'>): Exam {
      const exams = this.getExams();
      const newExam: Exam = { id: `exam-${Date.now()}`, ...exam };
      exams.push(newExam);
      localStorage.setItem(LOCAL_STORAGE_KEYS.EXAMS, JSON.stringify(exams));
      return newExam;
  }
  updateExam(examId: string, updates: Partial<Exam>): Exam {
      let exams = this.getExams();
      let updatedExam: Exam | undefined;
      exams = exams.map(e => {
          if (e.id === examId) {
              updatedExam = { ...e, ...updates };
              return updatedExam;
          }
          return e;
      });
      if (!updatedExam) throw new Error('Exam not found');
      localStorage.setItem(LOCAL_STORAGE_KEYS.EXAMS, JSON.stringify(exams));
      return updatedExam;
  }
  deleteExam(examId: string): void {
      let exams = this.getExams();
      exams = exams.filter(e => e.id !== examId);
      localStorage.setItem(LOCAL_STORAGE_KEYS.EXAMS, JSON.stringify(exams));
  }


  // --- Announcements ---
  getAnnouncements(): Announcement[] {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.ANNOUNCEMENTS) || '[]');
  }
  addAnnouncement(ann: Omit<Announcement, 'id' | 'createdAt'>): Announcement {
      const announcements = this.getAnnouncements();
      const newAnn: Announcement = { id: `ann-${Date.now()}`, createdAt: Date.now(), ...ann };
      announcements.push(newAnn);
      localStorage.setItem(LOCAL_STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
      return newAnn;
  }
  updateAnnouncement(annId: string, updates: Partial<Announcement>): Announcement {
      let announcements = this.getAnnouncements();
      let updatedAnn: Announcement | undefined;
      announcements = announcements.map(a => {
          if (a.id === annId) {
              updatedAnn = { ...a, ...updates };
              return updatedAnn;
          }
          return a;
      });
      if (!updatedAnn) throw new Error('Announcement not found');
      localStorage.setItem(LOCAL_STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
      return updatedAnn;
  }
  deleteAnnouncement(annId: string): void {
      let announcements = this.getAnnouncements();
      announcements = announcements.filter(a => a.id !== annId);
      localStorage.setItem(LOCAL_STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
  }

  // --- Subscriptions ---
  getSubscriptionTiers(): SubscriptionTierDetails[] {
     return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SUBSCRIPTION_TIERS) || '[]');
  }
  
  upgradeSubscription(userId: string, tier: SubscriptionTier, slots: number): User {
    const FOUR_MONTHS_IN_MS = 4 * 30 * 24 * 60 * 60 * 1000;
    const updates = {
      subscriptionTier: tier,
      paidUnlockSlots: slots,
      subscriptionExpiresAt: Date.now() + FOUR_MONTHS_IN_MS,
      unlockedExams: [], // CRITICAL: Reset unlocks on upgrade/renewal
    };
    const user = this.updateUser(userId, updates);
    this.logActivity('upgrade', `upgraded/renewed to ${tier} plan.`, userId, user.email);
    return user;
  }

  purchaseAdditionalUnlock(userId: string): User {
    const currentUser = this.getAllUsers().find(u => u.id === userId);
    if (!currentUser) throw new Error("User not found for purchase");

    const updatedUser = this.updateUser(userId, { paidUnlockSlots: currentUser.paidUnlockSlots + 1 });
    this.logActivity('one_time_unlock', 'purchased an additional exam slot.', userId, updatedUser.email);
    return updatedUser;
  }

  // --- Activity ---
  fetchActivityFeed(): ActivityEvent[] {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.ACTIVITY) || '[]').sort((a: ActivityEvent, b: ActivityEvent) => b.timestamp - a.timestamp);
  }

  logActivity(type: ActivityEvent['type'], message: string, userId: string, userEmail: string) {
    const feed = this.fetchActivityFeed();
    const newEvent: ActivityEvent = {
      id: `act-${Date.now()}`,
      userId,
      userEmail,
      type,
      message,
      timestamp: Date.now(),
    };
    feed.unshift(newEvent);
    localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVITY, JSON.stringify(feed.slice(0, 100))); // Keep last 100 events
  }

  // --- AI Generation ---
  async generateQuestions(examName: string, numQuestions: number, topics?: string): Promise<Question[]> {
    const examData = this.getExams().find(e => e.name === examName);
    if (!examData) {
      throw new Error("Exam data not found.");
    }
    
    const { bodyOfKnowledge, effectivitySheet } = examData;

    const questionSchema = {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING, description: "The question text. Must be challenging and based on the provided documents." },
        type: { type: Type.STRING, enum: ['multiple-choice', 'true-false'], description: "The type of question." },
        options: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING }, 
          description: "An array of 4 strings for multiple-choice options. For true-false questions, this should be an empty array or not present." 
        },
        answer: { type: Type.STRING, description: "The correct answer. For multiple-choice, it must exactly match one of the options. For true-false, it must be 'True' or 'False'." },
        reference: { type: Type.STRING, description: "A specific citation from the source documents (e.g., 'API 510, Section 5.3.2' or 'ASME Section IX, QW-100')." },
        explanation: { type: Type.STRING, description: "A detailed rationale explaining why the answer is correct and the other options are incorrect, citing the reference document." },
        category: { type: Type.STRING, description: "A relevant category from the Body of Knowledge (e.g., 'Welding', 'NDE', 'Corrosion Rates')." },
      },
      required: ['question', 'type', 'answer', 'reference', 'explanation', 'category']
    };

    const prompt = `You are an expert API (American Petroleum Institute) exam author, creating a practice test for the "${examName}" certification. Your task is to generate ${numQuestions} exam-caliber questions based *exclusively* on the provided official documents.

    **Key Instructions for Realism:**
    1.  **Source Adherence:** Your primary goal is to base every question and its answer options strictly on the provided Body of Knowledge and Effectivity Sheet. Do not use outside knowledge.
    2.  **CRITICAL RULE:** Never use the phrases 'Body of Knowledge' or 'Effectivity Sheet' in the text of the questions you generate. The questions must feel authentic, as if they are from a real exam, which would never refer to its own source syllabus documents.
    3.  **Question Style:**
        *   **Tone:** Use formal, direct, and unambiguous language.
        *   **Format:** Prioritize direct recall questions (e.g., "What is...", "Which of the following...") and sentence-completion formats (e.g., "A relief valve begins to open when..."). Avoid long, narrative scenarios.
        *   **Negative Phrasing:** Occasionally, use negative phrasing like "...all of the following are true EXCEPT:".
    4.  **Answer & Distractors:**
        *   For multiple-choice, create four options.
        *   One option must be verifiably correct based on the source text.
        *   The three incorrect "distractor" options must be plausible and use related terminology from the industry or source documents. They should test for precise knowledge.
        *   Ensure all options have a similar length and parallel grammatical structure.
    5.  **Reference & Explanation:** Every question MUST include a specific citation to the source document (e.g., "API 510, 7.4.2") and a detailed explanation for why the correct answer is correct.
    6.  **Topic Focus:** ${topics ? `Prioritize questions related to these topics: ${topics}.` : 'Cover a broad range of topics from the Body of Knowledge.'}
    7.  **Format:** Return the output as a JSON array of question objects.

    **Body of Knowledge:**
    ---
    ${bodyOfKnowledge}
    ---

    **Effectivity Sheet (Referenced Codes & Standards):**
    ---
    ${effectivitySheet}
    ---
    
    Now, generate the ${numQuestions} questions, perfectly matching the style of a real API certification exam.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: questionSchema,
          },
          temperature: 0.8,
        },
      });
      
      const text = response.text?.trim();

      if (!text) {
        throw new Error("The AI model returned an empty response. This might be due to a content filter or temporary API issue. Please try again.");
      }
      
      let questions: Question[];
      try {
        questions = JSON.parse(text);
        if (!Array.isArray(questions)) {
            throw new Error("Response was not in the expected array format.");
        }
      } catch (parseError) {
        console.error("Failed to parse JSON from AI response:", text);
        if (text.toLowerCase().includes("cannot fulfill") || text.toLowerCase().includes("i am unable")) {
             throw new Error("The AI model was unable to generate questions for this topic, possibly due to a safety policy. Please try different topics or a more general quiz.");
        }
        throw new Error("The AI model returned a response that was not in the expected format. Please try generating the quiz again.");
      }

      if (questions.length === 0) {
        return [];
      }

      // Data validation and cleanup
      return questions.map(q => ({
        ...q,
        options: q.type === 'multiple-choice' ? q.options?.slice(0, 4) : undefined,
      })).slice(0, numQuestions);

    } catch (error) {
      console.error("Error generating questions:", error);
      
      // Re-throw our custom, user-friendly errors from the parsing logic
      if (error instanceof Error && error.message.startsWith("The AI model")) {
          throw error; 
      }

      // Check for specific API error messages
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes('api key not valid')) {
          throw new Error("API Key Invalid: The configured API key is not valid. Please contact support to resolve this issue.");
        }
        if (message.includes('billing') || message.includes('quota')) {
          throw new Error("Billing/Quota Issue: The API key has exceeded its quota or is not linked to an active billing account. Please contact support.");
        }
        if (message.includes('resource has been exhausted')) {
           throw new Error("Service Overloaded: The AI model is currently experiencing high demand. Please try again in a few moments.");
        }
      }

      // Generic fallback error
      throw new Error("Failed to generate quiz questions. The AI model may be temporarily unavailable or the request may have timed out. Please try again later.");
    }
  }

  async getFollowUpAnswer(question: Question, query: string): Promise<string> {
    const prompt = `A user is studying for an exam and has a follow-up question about a practice problem.

    **Original Question:**
    ${question.question}
    ${question.options ? `Options: ${question.options.join(', ')}` : ''}
    
    **Correct Answer:**
    ${question.answer}

    **Explanation Provided:**
    ${question.explanation}
    (Reference: ${question.reference})

    **User's Follow-up Query:**
    "${query}"

    Please provide a clear, concise, and helpful answer to the user's query, acting as a friendly and knowledgeable tutor. Base your answer on the context of the original question and its explanation.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error("Error getting follow-up answer:", error);
      throw new Error("Failed to get an answer. The AI model may be temporarily unavailable.");
    }
  }
}

const api = new ApiService();
export default api;