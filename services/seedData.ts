import { User, Announcement, SubscriptionTierDetails, Role } from '../types';

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
      createdAt: now,
      lastActive: now,
      monthlyQuestionRemaining: null,
      monthlyExamUsage: null,
      monthlyResetDate: null,
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
      createdAt: now,
      lastActive: now,
      monthlyQuestionRemaining: null,
      monthlyExamUsage: null,
      monthlyResetDate: null,
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
      createdAt: now,
      lastActive: now,
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
      unlockedExams: [],
      history: [],
      role: 'USER',
      createdAt: now,
      lastActive: now,
      monthlyQuestionRemaining: null,
      monthlyExamUsage: null,
      monthlyResetDate: null,
    },
    {
      id: 'user-5',
      fullName: 'Specialist User',
      email: 'specialist@test.com',
      password: 'password123',
      subscriptionTier: 'SPECIALIST',
      paidUnlockSlots: 2,
      subscriptionExpiresAt: now + FOUR_MONTHS_IN_MS,
      unlockedExams: [],
      history: [],
      role: 'USER',
      createdAt: now,
      lastActive: now,
      monthlyQuestionRemaining: null,
      monthlyExamUsage: null,
      monthlyResetDate: null,
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
};