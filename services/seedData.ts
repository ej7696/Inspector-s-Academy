import { User, Announcement, SubscriptionTierDetails, Role, Testimonial } from '../types';

// Password for all demo accounts is 'password123' for simplicity
// except for admin ('admin123') and subadmin ('subadmin123')

const now = Date.now();
const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;
const FOUR_MONTHS_IN_MS = 4 * THIRTY_DAYS_IN_MS;

export const seedData = {
  users: [
    {
      id: 'user-1',
      fullName: 'Admin User',
      email: 'admin@test.com',
      password: 'admin123',
      subscriptionTier: 'SPECIALIST',
      paidUnlockSlots: 2,
      subscriptionExpiresAt: now + FOUR_MONTHS_IN_MS,
      unlockedExams: [],
      history: [],
      role: 'ADMIN',
      createdAt: now - THIRTY_DAYS_IN_MS * 2, // veteran user
      lastActive: now,
      isNewUser: false,
      referralCode: 'ADMINPRO123',
      accountCredit: 100,
    },
    {
      id: 'user-2',
      fullName: 'Sub-Admin User',
      email: 'subadmin@test.com',
      password: 'subadmin123',
      subscriptionTier: 'SPECIALIST',
      paidUnlockSlots: 2,
      subscriptionExpiresAt: now + FOUR_MONTHS_IN_MS,
      unlockedExams: [],
      history: [],
      role: 'SUB_ADMIN',
      permissions: {
        canViewUserList: true, canEditUsers: true, canSendPasswordResets: false, canManageAnnouncements: false,
        canManageExams: false, canAccessPerformanceAnalytics: false, canViewBillingSummary: false,
        canManageSubscriptions: false, canViewActivityLogs: true, canSuspendUsers: false
      },
      createdAt: now - THIRTY_DAYS_IN_MS,
      lastActive: now,
      isNewUser: false,
    },
    {
      id: 'user-3',
      fullName: 'Starter User',
      email: 'cadet@test.com',
      password: 'password123',
      subscriptionTier: 'STARTER',
      paidUnlockSlots: 0,
      subscriptionExpiresAt: null,
      unlockedExams: [],
      history: [],
      role: 'USER',
      createdAt: now - (24 * 60 * 60 * 1000), // signed up yesterday
      lastActive: now,
      isNewUser: true, // For onboarding tour
      referralCode: 'CADETNEWBIE',
      accountCredit: 0,
      monthlyQuestionRemaining: 15,
      monthlyExamUsage: {},
      monthlyResetDate: now + THIRTY_DAYS_IN_MS,
    },
    {
      id: 'user-4',
      fullName: 'Professional User',
      email: 'pro@test.com',
      password: 'password123',
      subscriptionTier: 'PROFESSIONAL',
      paidUnlockSlots: 1,
      subscriptionExpiresAt: now + FOUR_MONTHS_IN_MS,
      unlockedExams: ["API 510 - Pressure Vessel Inspector"],
      history: [],
      role: 'USER',
      createdAt: now - THIRTY_DAYS_IN_MS * 3,
      lastActive: now,
      isNewUser: false,
    },
    {
      id: 'user-5',
      fullName: 'Specialist User',
      email: 'specialist@test.com',
      password: 'password123',
      subscriptionTier: 'SPECIALIST',
      paidUnlockSlots: 2,
      subscriptionExpiresAt: now + FOUR_MONTHS_IN_MS,
      unlockedExams: ["API 570 - Piping Inspector", "API 653 - Aboveground Storage Tank Inspector"],
      history: [],
      role: 'USER',
      createdAt: now - THIRTY_DAYS_IN_MS * 6,
      lastActive: now,
      isNewUser: false,
    },
  ] as User[],
  announcements: [
    { id: 'ann-1', message: 'Welcome to the new Inspector\'s Academy! New content for API 570 has been added.', isActive: true, createdAt: now },
  ] as Announcement[],
  activityFeed: [],
  subscriptionTiers: [
    {
      tier: 'STARTER',
      name: 'Starter',
      price: 'Free',
      description: 'A preview to get you started.',
      features: [
        "15 free practice questions per month",
        "Explore all certifications",
        "Up to 2 practice questions per certification",
        "Upgrade anytime for full access"
      ],
      isDeemphasized: true,
    },
    {
      tier: 'PROFESSIONAL',
      name: 'Professional',
      price: '$350 / 4 months',
      description: 'Master your next certification.',
      features: [
        "Unlock full access to 1 exam track",
        "Unlimited Quizzes & Questions (up to 120)",
        "Timed & Full Simulation Modes",
        "Performance Dashboard & History",
        "All Smart Study Tools"
      ],
      cta: 'Upgrade to Professional',
    },
    {
      tier: 'SPECIALIST',
      name: 'Specialist',
      price: '$650 / 4 months',
      description: 'For the multi-disciplinary inspector.',
      features: [
        "Unlock full access to 2 exam tracks",
        "All features from Professional",
        "Perfect for broader expertise"
      ],
      cta: 'Upgrade to Specialist',
      isPopular: true,
    },
  ] as SubscriptionTierDetails[],
  testimonials: [
      {
        id: 'test-1',
        author: 'John D., Certified API 510',
        quote: "The simulation mode was a game-changer for my API 510 exam. I walked in feeling prepared and confident, and passed on the first try."
      },
      {
        id: 'test-2',
        author: 'Maria S., CWI',
        quote: "The AI-generated questions are incredibly realistic. It's like having an infinite supply of practice exams. I never saw the same question twice."
      }
  ] as Testimonial[],
};
