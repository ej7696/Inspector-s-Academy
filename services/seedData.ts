import { User, Announcement, SubscriptionTierDetails, Role, Testimonial, BlogPost } from '../types';

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
        quote: "The Dynamic Question Engine is incredibly realistic. It's like having an infinite supply of practice exams. I never saw the same question twice."
      }
  ] as Testimonial[],
  blogPosts: [
    {
        slug: 'top-5-mistakes-api-510-exam',
        title: 'The 5 Most Common Mistakes on the API 510 Exam (and How to Avoid Them)',
        author: "The Inspector's Academy Team",
        date: 'July 15, 2024',
        excerpt: 'Passing the API 510 Pressure Vessel Inspector exam requires more than just knowing the code; it requires avoiding common pitfalls that trip up even experienced professionals. We break down the top 5 mistakes we see candidates make.',
        tags: ['API 510', 'Exam Prep', 'Tips'],
        content: `
Passing the API 510 Pressure Vessel Inspector exam is a major career milestone. However, the exam is notoriously challenging, and many candidates fail not due to a lack of knowledge, but because they fall into common traps. Here are the five most common mistakes and how our platform helps you avoid them.

**1. Misinterpreting Calculation Questions**
Many questions require you to calculate corrosion rates, remaining life, or MAWP. A simple miscalculation or using the wrong formula can lead to a wrong answer.
*How we help:* Our platform provides detailed, step-by-step explanations for every calculation question, reinforcing the correct formulas and application.

**2. Overlooking Weld Joint Efficiencies**
A frequent point of confusion is applying the correct weld joint efficiency (E-factor) from ASME Section VIII tables. Forgetting to apply it, or using the wrong one, is a common error.
*How we help:* Our Dynamic Question Engine generates numerous scenarios involving different weld types and radiographic testing levels, forcing you to master the application of E-factors.

**3. Confusing Inspection Intervals**
The rules for determining the next inspection interval (internal, external, on-stream) are complex, often involving the "half-life" or "10-year" rules. It's easy to get these mixed up under pressure.
*How we help:* We provide unlimited practice on these specific scenarios, ensuring you can quickly and accurately determine inspection intervals every time.

**4. Neglecting NDE Principles**
While you don't need to be an NDE technician, you must understand the principles and applications of methods like RT, UT, MT, and PT as described in ASME Section V. Candidates often neglect this area.
*How we help:* Our question bank includes targeted questions on NDE principles, ensuring you have the foundational knowledge required.

**5. Relying on Memory Alone**
The open-book portion of the exam tests your ability to navigate the code books quickly and efficiently. Simply trying to memorize everything is a recipe for failure.
*How we help:* Our realistic Simulation Mode replicates the exam pressure, training you to use your reference materials effectively under a ticking clock.

Ready to avoid these mistakes and pass with confidence? **Start practicing for free today!**`
    },
    {
        slug: 'cwi-guide-weld-symbols',
        title: "A CWI's Guide to Understanding Complex Weld Symbols",
        author: "The Inspector's Academy Team",
        date: 'July 10, 2024',
        excerpt: 'Weld symbols are the language of welding. For a Certified Welding Inspector (CWI), fluency is non-negotiable. This guide breaks down some of the most complex symbols you\'ll encounter on the job and on your exam.',
        tags: ['CWI', 'Welding', 'Technical'],
        content: `
For a Certified Welding Inspector (CWI), the ability to accurately read a welding symbol is a fundamental skill. While basic fillet and groove welds are straightforward, the exam and real-world blueprints often feature more complex symbols. Let's break down a few.

**1. The Tail: The Key to Specifics**
The tail of the welding symbol is reserved for special instructions, but its most common and critical use is to specify the welding process. A symbol calling for a groove weld is useless without knowing if it should be done with SMAW, GTAW, or another process. Always check the tail for a process designator (e.g., "GTAW") or a reference to a specific Welding Procedure Specification (WPS).

**2. Melt-Thru vs. Backing**
The symbols for melt-thru and backing are often confused.
*   **Melt-Thru:** A shaded semicircle on the "other" side of the reference line. This indicates the root of the weld is expected to penetrate and fuse completely through to the other side, forming a visible bead.
*   **Backing:** A rectangle on the "other" side. This indicates a physical backing bar is to be placed on the root side of the joint.

**3. Contour and Finish Symbols**
How the final weld bead should look is critical.
*   **Contour:** A straight line above the weld symbol indicates a flush finish. A curved line indicates a convex (most common) or concave finish. This is usually specified for performance or cosmetic reasons.
*   **Finish:** A letter (G for Grinding, M for Machining, C for Chipping) indicates the method to be used to achieve the desired contour.

Mastering these nuances is key to passing your CWI exam. Our platform includes hundreds of practice questions focused on weld symbols to ensure you're prepared. **Sign up for a free Starter account to test your knowledge!**`
    },
    {
        slug: 'free-api-570-practice-quiz',
        title: 'Free API 570 Practice Quiz: Test Your Knowledge Now',
        author: "The Inspector's Academy Team",
        date: 'July 5, 2024',
        excerpt: 'Think you\'re ready for the API 570 Piping Inspector exam? Test your knowledge with these three realistic, exam-style questions generated by our Dynamic Question Engine. The answers and explanations are included below.',
        tags: ['API 570', 'Free Quiz', 'Practice'],
        content: `
The API 570 Piping Inspector certification is one of the most sought-after credentials in the industry. Test your readiness with these three sample questions drawn from our platform.

**Question 1:**
According to ASME B31.3, for a normal fluid service, what is the minimum required thickness of a 6-inch NPS carbon steel pipe with an outside diameter of 6.625 inches, a specified minimum yield strength of 35,000 psi, and a design pressure of 500 psig at 300°F? Assume a seamless pipe (E=1.0) and a corrosion allowance of 0.05 inches.

*   A) 0.134 in
*   B) 0.184 in
*   C) 0.280 in
*   D) 0.334 in

**Answer: B) 0.184 in**
*Explanation:* The formula for minimum required thickness (t) from ASME B31.3 is t = (PD) / (2(SE + PY)). For this scenario, P=500, D=6.625, S=20,000 (allowable stress for common carbon steel), E=1.0, Y=0.4. Plugging in the values gives a pressure design thickness of 0.134 in. You must then add the corrosion allowance: 0.134 + 0.050 = 0.184 in.

---

**Question 2:**
When is a preheating not a mandatory substitute for postweld heat treatment (PWHT) for a P-No. 1 carbon steel pipe?

*   A) When the weld is over 1.5 inches thick.
*   B) When it is required by the engineering design.
*   C) When the preheat is maintained above 300°F.
*   D) When impact testing is required.

**Answer: D) When impact testing is required.**
*Explanation:* API 570 allows preheating as an alternative to PWHT in some cases to control hardness, but this substitution is not permitted if impact testing is required for the material, as PWHT is essential for restoring toughness.

---

**Question 3:**
The responsibility for implementing an effective Management of Change (MOC) process for piping systems falls to the:

*   A) Piping Inspector
*   B) Piping Engineer
*   C) Owner/User
*   D) Repair Organization

**Answer: C) Owner/User**
*Explanation:* Per API 570, the Owner/User is ultimately responsible for establishing, implementing, and executing the MOC process to ensure that all changes to piping systems are properly reviewed and documented.

How did you do? Our full platform gives you access to unlimited questions like these, complete with detailed analytics to pinpoint your weak spots. **Sign up for a free account to continue practicing!**`
    },
] as BlogPost[],
};
