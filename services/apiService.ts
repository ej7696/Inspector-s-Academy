import { GoogleGenAI, Type } from "@google/genai";
import { 
  User, Question, ActivityEvent, ActivityEventType, Exam, Announcement, SubscriptionTierDetails, 
  Role, QuizResult, InProgressQuizState, InProgressAnswer, UserAnswer, 
  SubscriptionTier, Testimonial, BlogPost 
} from '../types';

import { seedData } from './seedData';
import { examSourceData } from './examData';

/**
 * Initialize the Google GenAI client.
 * Uses process.env.API_KEY which is polyfilled in vite.config.ts to work
 * with both local .env files and cloud provider environment variables.
 */
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const LOCAL_STORAGE_KEYS = {
  USERS: 'inspectors_academy_users',
  ANNOUNCEMENTS: 'inspectors_academy_announcements',
  EXAMS: 'inspectors_academy_exams',
  ACTIVITY: 'inspectors_academy_activity',
  LOGGED_IN_USER: 'inspectors_academy_logged_in_user',
  SUBSCRIPTION_TIERS: 'inspectors_academy_subscription_tiers',
  TESTIMONIALS: 'inspectors_academy_testimonials',
  LEADS: 'inspectors_academy_leads',
  BLOG_POSTS: 'inspectors_academy_blog_posts',
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
    if (!localStorage.getItem(LOCAL_STORAGE_KEYS.TESTIMONIALS)) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.TESTIMONIALS, JSON.stringify(seedData.testimonials));
    }
    if (!localStorage.getItem(LOCAL_STORAGE_KEYS.LEADS)) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.LEADS, JSON.stringify([]));
    }
    if (!localStorage.getItem(LOCAL_STORAGE_KEYS.BLOG_POSTS)) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.BLOG_POSTS, JSON.stringify(seedData.blogPosts));
    }
  }

  // ———————————————————————————————
  // LOGIN / REGISTER / AUTH
  // ———————————————————————————————

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

  async registerUser(fullName: string, email: string, password: string): Promise<User> {
    const users = this.getAllUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists.');
    }

    const newUser = this.addUser({ fullName, email, password, role: 'USER' });
    localStorage.setItem(LOCAL_STORAGE_KEYS.LOGGED_IN_USER, newUser.id);
    this.logActivity('user_signup', 'created a new account.', newUser.id, newUser.email);

    return newUser;
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

  // ———————————————————————————————
  // USER MANAGEMENT
  // ———————————————————————————————

  getAllUsers(): User[] {
    const usersFromStorage = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.USERS) || '[]') as Partial<User>[];

    return usersFromStorage.map(user => ({
      ...user,
      history: Array.isArray(user.history) ? user.history : [],
      unlockedExams: Array.isArray(user.unlockedExams) ? user.unlockedExams : [],
    })) as User[];
  }

  updateUser(userId: string, updates: Partial<User>, skipLog = false): User {
    let users = this.getAllUsers();
    let updatedUser: User | undefined;

    users = users.map(u => {
      if (u.id === userId) {
        updatedUser = { ...u, ...updates };
        return updatedUser;
      }
      return u;
    });

    if (!updatedUser) throw new Error('User not found');

    localStorage.setItem(LOCAL_STORAGE_KEYS.USERS, JSON.stringify(users));
    return updatedUser;
  }

  addUser(newUser: { fullName: string; email: string; password: string; role: Role }): User {
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
      isNewUser: true,
      mustChangePassword: false,
      referralCode: `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      accountCredit: 0,
      monthlyQuestionRemaining: 15,
      monthlyExamUsage: {},
      monthlyResetDate: now + 30 * 24 * 60 * 60 * 1000,
    };

    users.push(user);
    localStorage.setItem(LOCAL_STORAGE_KEYS.USERS, JSON.stringify(users));

    return user;
  }

  // ———————————————————————————————
  // EXAM & CONTENT MANAGEMENT
  // ———————————————————————————————

  getExams(): Exam[] {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.EXAMS) || '[]');
  }

  addExam(exam: Omit<Exam, 'id'>): Exam {
    const exams = this.getExams();
    const newExam = { ...exam, id: `exam-${Date.now()}` };
    exams.push(newExam);
    localStorage.setItem(LOCAL_STORAGE_KEYS.EXAMS, JSON.stringify(exams));
    return newExam;
  }

  updateExam(id: string, updates: Partial<Exam>): Exam {
    const exams = this.getExams();
    const index = exams.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Exam not found');
    exams[index] = { ...exams[index], ...updates };
    localStorage.setItem(LOCAL_STORAGE_KEYS.EXAMS, JSON.stringify(exams));
    return exams[index];
  }

  deleteExam(id: string): void {
    const exams = this.getExams().filter(e => e.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEYS.EXAMS, JSON.stringify(exams));
  }

  // ———————————————————————————————
  // ANNOUNCEMENTS
  // ———————————————————————————————
  
  getAnnouncements(): Announcement[] {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.ANNOUNCEMENTS) || '[]');
  }

  addAnnouncement(announcement: Omit<Announcement, 'id' | 'createdAt'>): Announcement {
    const list = this.getAnnouncements();
    const newAnn = { ...announcement, id: `ann-${Date.now()}`, createdAt: Date.now() };
    list.push(newAnn);
    localStorage.setItem(LOCAL_STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(list));
    return newAnn;
  }

  updateAnnouncement(id: string, updates: Partial<Announcement>): void {
    const list = this.getAnnouncements();
    const index = list.findIndex(a => a.id === id);
    if (index !== -1) {
        list[index] = { ...list[index], ...updates };
        localStorage.setItem(LOCAL_STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(list));
    }
  }

  deleteAnnouncement(id: string): void {
      const list = this.getAnnouncements().filter(a => a.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(list));
  }

  // ———————————————————————————————
  // ACTIVITY & LOGGING
  // ———————————————————————————————

  fetchActivityFeed(): ActivityEvent[] {
    const feed = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.ACTIVITY) || '[]');
    return feed.sort((a: ActivityEvent, b: ActivityEvent) => b.timestamp - a.timestamp).slice(0, 50);
  }

  logActivity(type: ActivityEventType, message: string, userId: string, userEmail: string) {
    const feed = this.fetchActivityFeed();
    const newEvent = {
        id: `evt-${Date.now()}-${Math.random()}`,
        type,
        message,
        userId,
        userEmail,
        timestamp: Date.now()
    };
    feed.unshift(newEvent); // Add to beginning
    // Keep only last 100 events to prevent LS overflow
    const trimmedFeed = feed.slice(0, 100);
    localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVITY, JSON.stringify(trimmedFeed));
  }

  // ———————————————————————————————
  // SUBSCRIPTION TIERS & PAYMENT
  // ———————————————————————————————
  
  getSubscriptionTiers(): SubscriptionTierDetails[] {
      return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SUBSCRIPTION_TIERS) || '[]');
  }
  
  upgradeSubscription(userId: string, tier: SubscriptionTier, slots: number): User {
      // In a real app, this would process payment.
      // Here we simulate a successful upgrade.
      const now = Date.now();
      const fourMonths = 4 * 30 * 24 * 60 * 60 * 1000;
      
      const user = this.updateUser(userId, {
          subscriptionTier: tier,
          paidUnlockSlots: slots,
          subscriptionExpiresAt: now + fourMonths,
          // If they are upgrading, we can reset their monthly starter limits (optional choice)
          monthlyQuestionRemaining: null 
      });
      
      this.logActivity('upgrade', `upgraded to ${tier} plan.`, userId, user.email);
      return user;
  }
  
  purchaseAdditionalUnlock(userId: string): User {
       // Simulate payment for 1 slot
       const user = this.getAllUsers().find(u => u.id === userId);
       if (!user) throw new Error("User not found");
       
       const newSlots = user.paidUnlockSlots + 1;
       const updated = this.updateUser(userId, { paidUnlockSlots: newSlots });
       this.logActivity('one_time_unlock', 'purchased an additional exam slot.', userId, user.email);
       return updated;
  }

  // ———————————————————————————————
  // STARTER PLAN LIMITS
  // ———————————————————————————————

  checkAndResetMonthlyLimits(user: User): User {
      if (user.subscriptionTier !== 'STARTER') return user;

      const now = Date.now();
      if (!user.monthlyResetDate || now > user.monthlyResetDate) {
          // Reset limits
          return this.updateUser(user.id, {
              monthlyQuestionRemaining: 15,
              monthlyExamUsage: {},
              monthlyResetDate: now + 30 * 24 * 60 * 60 * 1000 // Next reset in 30 days
          }, true);
      }
      return user;
  }

  recordStarterUsage(userId: string, examName: string, questionCount: number): User {
      const user = this.getAllUsers().find(u => u.id === userId);
      if (!user) throw new Error("User not found");

      const currentUsage = user.monthlyExamUsage || {};
      const currentExamCount = currentUsage[examName] || 0;
      const currentRemaining = user.monthlyQuestionRemaining ?? 15;

      const newUsage = { ...currentUsage, [examName]: currentExamCount + questionCount };
      const newRemaining = Math.max(0, currentRemaining - questionCount);

      return this.updateUser(userId, {
          monthlyExamUsage: newUsage,
          monthlyQuestionRemaining: newRemaining
      }, true);
  }
  
  // ———————————————————————————————
  // ADMIN FUNCTIONS
  // ———————————————————————————————
  
  adminSetPassword(userId: string, newPass: string) {
      this.updateUser(userId, { password: newPass, mustChangePassword: true });
  }

  exportAllUsersAsCSV() {
      const users = this.getAllUsers();
      const headers = ['ID', 'Full Name', 'Email', 'Role', 'Tier', 'Created At', 'Last Active'];
      const csvContent = [
          headers.join(','),
          ...users.map(u => [
              u.id, 
              `"${u.fullName || ''}"`, 
              u.email, 
              u.role, 
              u.subscriptionTier, 
              new Date(u.createdAt).toISOString(), 
              new Date(u.lastActive).toISOString()
          ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'users_export.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }

  // ———————————————————————————————
  // AI QUESTION GENERATION
  // ———————————————————————————————

  async generateQuestions(examName: string, numQuestions: number, topics?: string): Promise<Question[]> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error("No user is logged in.");
    }

    const examData = this.getExams().find(e => e.name === examName);
    if (!examData) throw new Error("Exam data not found.");

    const { bodyOfKnowledge, effectivitySheet } = examData;

    // Use a simpler model for generation to ensure availability
    const modelName = 'gemini-2.5-flash';

    const prompt = `
      You are an expert exam question generator for the ${examName} certification.
      Generate ${numQuestions} multiple-choice questions.
      
      Context:
      ${topics ? `Focus strictly on these topics: ${topics}` : `Cover a representative mix of topics from the Body of Knowledge.`}
      
      Reference Material Context (Do not strictly limit to this, but use as guide):
      ${bodyOfKnowledge.substring(0, 500)}...
      
      Format: Return ONLY a JSON array. Each object must have:
      - question (string)
      - type (string: "multiple-choice" or "true-false")
      - options (array of 4 strings)
      - answer (string, must match one option exactly)
      - reference (string, cite specific code section if possible)
      - explanation (string, brief rationale)
      - category (string, topic area)
    `;

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                type: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING }},
                answer: { type: Type.STRING },
                reference: { type: Type.STRING },
                explanation: { type: Type.STRING },
                category: { type: Type.STRING },
              },
              required: ['question','type','options','answer','reference','explanation','category']
            }
          }
        }
      });

      const text = response.text?.trim();
      if (!text) {
        throw new Error("Empty response from AI.");
      }

      const questions = JSON.parse(text);
      return questions.map((q: any) => ({
        ...q,
        // Ensure options don't exceed 4 for MC
        options: q.type === 'multiple-choice' ? q.options?.slice(0, 4) : undefined,
      })).slice(0, numQuestions);

    } catch (err: any) {
      console.error("AI Generation Error:", err);
      // Fallback message if AI fails (e.g., quota or network)
      throw new Error(`Failed to generate questions: ${err.message || 'Unknown error'}`);
    }
  }

  async getFollowUpAnswer(question: Question, query: string): Promise<string> {
      try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `
                Context: A user is taking a quiz for a certification exam.
                Original Question: "${question.question}"
                Correct Answer: "${question.answer}"
                Explanation: "${question.explanation}"
                
                User Query: "${query}"
                
                Please provide a helpful, concise answer to the user's query to help them understand the concept. Act as a supportive tutor.
            `
        });
        return response.text || "I couldn't generate an answer at this time.";
      } catch (err) {
          console.error(err);
          return "Sorry, I encountered an error trying to answer that.";
      }
  }

  // ———————————————————————————————
  // PUBLIC CONTENT (BLOG, TESTIMONIALS)
  // ———————————————————————————————

  getTestimonials(): Testimonial[] {
      return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.TESTIMONIALS) || '[]');
  }
  
  addTestimonial(author: string, quote: string) {
      const list = this.getTestimonials();
      list.push({ id: `t-${Date.now()}`, author, quote });
      localStorage.setItem(LOCAL_STORAGE_KEYS.TESTIMONIALS, JSON.stringify(list));
  }
  
  captureLead(email: string) {
      const leads = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.LEADS) || '[]');
      leads.push({ email, date: Date.now() });
      localStorage.setItem(LOCAL_STORAGE_KEYS.LEADS, JSON.stringify(leads));
      this.logActivity('lead_captured', 'captured a new lead magnet download.', 'visitor', email);
  }
  
  getBlogPosts(): BlogPost[] {
      return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.BLOG_POSTS) || '[]');
  }
  
  getBlogPostBySlug(slug: string): BlogPost | undefined {
      const posts = this.getBlogPosts();
      return posts.find(p => p.slug === slug);
  }
}

const api = new ApiService();
export default api;