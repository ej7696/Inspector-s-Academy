# Inspector's Academy - Project Structure

## 🏗️ Architecture Overview

This is a **React + TypeScript** application with a **backend API** architecture.

### Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js/Express API (separate from frontend)
- **State Management**: React useState/useEffect (component-level)
- **Storage**: Backend database (not localStorage)
- **Authentication**: Session-based with cookies

---

## 📁 Project Structure

inspector-s-academy/
├── src/
│ ├── components/ # React UI components
│ │ ├── Login.tsx
│ │ ├── HomePage.tsx
│ │ ├── ExamScreen.tsx
│ │ ├── Dashboard.tsx
│ │ ├── AdminDashboard.tsx
│ │ └── ...
│ ├── services/ # API communication layer
│ │ ├── apiService.ts # Main API client
│ │ └── ...
│ ├── types.ts # TypeScript type definitions
│ ├── App.tsx # Main application component
│ └── index.tsx # Application entry point
├── public/ # Static assets
├── .gitignore # Git ignore rules
├── package.json # Dependencies & scripts
├── vite.config.ts # Vite configuration
└── tsconfig.json # TypeScript configuration

---

## 🔑 Key Concepts

### User Roles

- **STARTER**: Free tier (15 questions/month, 3 exams max)
- **PROFESSIONAL**: Paid tier (1 exam unlock)
- **SPECIALIST**: Premium tier (2 exam unlocks)
- **ADMIN**: Full system access
- **SUB_ADMIN**: Limited admin access

### Exam Modes

- **Open Book**: Access to code references during exam
- **Closed Book**: No references allowed
- **Simulation**: Full exam simulation with timer

### Views (Application Screens)

- `loading` - Initial app load
- `login` - Authentication screen
- `home` - Main dashboard
- `exam_mode_selection` - Choose exam mode
- `instructions` - Pre-exam instructions
- `quiz` - Single question view
- `exam` - Full exam interface
- `review` - Review answers before submit
- `score` - Results screen
- `dashboard` - User statistics
- `profile` - User profile management
- `admin` - Admin panel
- `paywall` - Upgrade/payment screen

---

## 🔄 Data Flow

### Quiz Generation Flow

1. User selects exam → `initiateQuizFlow()`
2. Check subscription limits
3. Navigate to `exam_mode_selection`
4. User picks mode → Navigate to `instructions`
5. User clicks "Start" → `handleStartQuizFromInstructions()`
6. Call `api.generateQuiz()` → Backend generates questions
7. Store questions in state → Navigate to `quiz` or `exam` view

### Answer Submission Flow

1. User answers questions → `handleSelectAnswer()`
2. Answers stored in state
3. User clicks "Submit" → Navigate to `review`
4. User confirms → `finishQuiz()`
5. Calculate score → `api.saveQuizResult()`
6. Navigate to `score` view

---

## 🛡️ Security Features

- Session-based authentication (cookies)
- Backend validates all requests
- Subscription tier enforcement
- Usage limits tracked server-side
- Admin impersonation tracking

---

## 🎨 UI Components

### Dialogs

- `InfoDialog` - Information messages
- `ConfirmDialog` - Yes/No confirmations
- `InstructionsModal` - Pre-exam instructions

### Main Components

- `ExamScreen` - Full exam interface with timer
- `QuestionCard` - Single question display
- `ReviewScreen` - Answer review before submit
- `ScoreScreen` - Results with breakdown
- `Dashboard` - User statistics
- `AdminDashboard` - User management

---

## 🔧 Development Notes

### Current State

- ✅ Frontend complete
- ✅ Backend API connected
- ✅ Authentication working
- ✅ Subscription tiers implemented
- ⏳ Payment integration (TODO)
- ⏳ Production deployment (TODO)

### Known Limitations

- No real payment processing yet
- Some features are placeholders
- Backend connection details need configuration

---

## 🚀 Next Steps

1. **Backend**: Ensure API endpoints are fully implemented
2. **Payment**: Integrate Stripe for subscriptions
3. **Testing**: Add unit tests for critical functions
4. **Deployment**: Deploy to production environment
5. **Monitoring**: Add error tracking (Sentry)

---

## 📝 Important Files

- `App.tsx` - Main application logic (800+ lines)
- `types.ts` - All TypeScript interfaces
- `services/apiService.ts` - Backend communication
- `.gitignore` - Protects sensitive files
- `package.json` - Project dependencies

---

## 💡 Tips for Development

1. **Always save** (`Ctrl+S`) before testing
2. **Check console** for errors (F12 in browser)
3. **Read error messages** carefully - they tell you what's wrong
4. **Commit often** - Small, frequent commits are better
5. **Test locally** before pushing to GitHub

---

Last Updated: November 28, 2025
