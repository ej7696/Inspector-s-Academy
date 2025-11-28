import { User, Question, QuizResult, QuizSettings } from "../types";

class ApiService {
  private baseUrl = "http://localhost:3001/api"; // Your backend URL

  async login(email: string, password: string): Promise<User> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }
    return await response.json();
  }

  async checkSession(): Promise<User | null> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/session`, {
        credentials: "include",
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error("Session check failed:", error);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  async generateQuiz(settings: QuizSettings): Promise<Question[]> {
    const response = await fetch(`${this.baseUrl}/quiz/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error("Failed to generate quiz");
    return await response.json();
  }

  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    const response = await fetch(`${this.baseUrl}/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update user");
    return await response.json();
  }

  async saveQuizResult(
    userId: string,
    result: Omit<QuizResult, "id" | "userId">
  ): Promise<QuizResult> {
    const response = await fetch(`${this.baseUrl}/results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId, ...result }),
    });
    if (!response.ok) throw new Error("Failed to save quiz result");
    return await response.json();
  }

  async clearInProgressQuiz(userId: string): Promise<User> {
    return this.updateUser(userId, { inProgressQuiz: null });
  }

  async saveInProgressQuiz(userId: string, progress: any): Promise<User> {
    return this.updateUser(userId, { inProgressQuiz: progress });
  }

  async generateFollowUp(question: Question, query: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/ai/followup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ question, query }),
    });
    if (!response.ok) throw new Error("Failed to generate follow-up");
    const data = await response.json();
    return data.answer;
  }

  async logActivity(
    userId: string,
    action: string,
    details: string
  ): Promise<void> {
    await fetch(`${this.baseUrl}/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId, action, details }),
    });
  }

  getExamBodyOfKnowledge(examName: string): string {
    // Return exam-specific content
    return `Body of knowledge for ${examName}`;
  }
}

export default new ApiService();
