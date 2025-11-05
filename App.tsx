import React, { useState, useEffect } from "react";
import {
  User,
  Question,
  QuizSettings,
  InProgressQuizState,
  QuizResult,
  InProgressAnswer,
  SubscriptionTier,
} from "./types";
import api from "./services/apiService";

// Import all the components
import Login from "./components/Login";
import HomePage from "./components/HomePage";
import ExamModeSelector from "./components/ExamModeSelector";
import InstructionsModal from "./components/InstructionsModal";
import QuestionCard from "./components/QuestionCard";
import ExamScreen from "./components/ExamScreen";
import ReviewScreen from "./components/ReviewScreen";
import ScoreScreen from "./components/ScoreScreen";
import Dashboard from "./components/Dashboard";
import UserProfile from "./components/UserProfile";
import AdminDashboard from "./components/AdminDashboard";
import Paywall from "./components/Paywall";
import InfoDialog from "./components/InfoDialog";
import ConfirmDialog from "./components/ConfirmDialog";

type View =
  | "loading"
  | "login"
  | "home"
  | "exam_mode_selection"
  | "instructions"
  | "quiz"
  | "exam"
  | "review"
  | "score"
  | "dashboard"
  | "profile"
  | "admin"
  | "paywall";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [originalUser, setOriginalUser] = useState<User | null>(null); // For impersonation
  const [view, setView] = useState<View>("loading");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState("");

  // Quiz-related state
  const [quizSettings, setQuizSettings] = useState<QuizSettings | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<InProgressAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  // AI follow-up state
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);

  // Modal states
  const [infoDialog, setInfoDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    buttons: any[];
  }>({ open: false, title: "", message: "", buttons: [] });
  const [pendingUnlock, setPendingUnlock] = useState<null | {
    examName: string;
    message: string;
    numQuestions: number;
    isTimed: boolean;
    topics?: string;
  }>(null);
  const [upsellDialogInfo, setUpsellDialogInfo] = useState<any>(null);
  const [limitReachedDialogInfo, setLimitReachedDialogInfo] = useState<
    string | null
  >(null);

  // --- Effects ---
  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await api.checkSession();
        if (user) {
          setUser(user);
          setView(
            user.role === "ADMIN" || user.role === "SUB_ADMIN"
              ? "admin"
              : "home"
          );
        } else {
          setView("login");
        }
      } catch (err) {
        console.error("Session check failed:", err);
        setView("login");
      }
    };
    checkSession();
  }, []);

  // --- Handlers ---
  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setView(
      loggedInUser.role === "ADMIN" || loggedInUser.role === "SUB_ADMIN"
        ? "admin"
        : "home"
    );
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setOriginalUser(null);
    setView("login");
  };

  const handleGoHome = () => {
    setQuizSettings(null);
    setQuestions([]);
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setQuizResult(null);
    setView("home");
  };

  const handleStartQuizFromInstructions = async () => {
    if (!quizSettings || !user) return;

    setLoadingMessage(`Generating your ${quizSettings.examMode} exam...`);
    setIsLoading(true);
    setInfoDialog({ open: false, title: "", message: "", buttons: [] }); // Close any open dialogs

    try {
      const generatedQuestions = await api.generateQuiz(quizSettings);

      // Deduct allowance only after successful generation for STARTER users
      if (user.subscriptionTier === "STARTER") {
        const updatedUser = await api.updateUser(user.id, {
          monthlyQuestionRemaining:
            (user.monthlyQuestionRemaining || 0) - quizSettings.numQuestions,
          monthlyExamUsage: {
            ...user.monthlyExamUsage,
            [quizSettings.examName]:
              (user.monthlyExamUsage?.[quizSettings.examName] || 0) +
              quizSettings.numQuestions,
          },
        });
        setUser(updatedUser);
      }

      setQuestions(generatedQuestions);
      const initialAnswers: InProgressAnswer[] = generatedQuestions.map(() => ({
        userAnswer: null,
        flagged: false,
        strikethroughOptions: [],
      }));
      setAnswers(initialAnswers);
      setCurrentQuestionIndex(0);

      setView(quizSettings.examMode === "simulation" ? "exam" : "quiz");
    } catch (e: any) {
      setInfoDialog({
        open: true,
        title: "Quiz Generation Failed",
        message:
          "We couldn't generate your quiz. Your free question allowance has NOT been deducted.",
        buttons: [
          {
            text: "Retry",
            style: "primary",
            onClick: () => {
              setInfoDialog({
                open: false,
                title: "",
                message: "",
                buttons: [],
              });
              handleStartQuizFromInstructions(); // ✅ Retry generation
            },
          },
          {
            text: "Cancel",
            style: "neutral",
            onClick: () => {
              setInfoDialog({
                open: false,
                title: "",
                message: "",
                buttons: [],
              });
              handleGoHome(); // ✅ Go home safely
            },
          },
        ],
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleResumeQuiz = (progress: InProgressQuizState) => {
    setQuestions(progress.questions);
    setAnswers(progress.answers);
    setCurrentQuestionIndex(progress.currentQuestionIndex);
    setQuizSettings(progress.quizSettings);
    setView(progress.quizSettings.examMode === "simulation" ? "exam" : "quiz");
  };

  const handleAbandonQuiz = async () => {
    if (user) {
      const updatedUser = await api.clearInProgressQuiz(user.id);
      setUser(updatedUser);
    }
    handleGoHome();
  };

  const initiateQuizFlow = async (
    examName: string,
    numQuestions: number,
    isTimed: boolean,
    topics?: string
  ) => {
    if (!user) return;

    if (user.subscriptionTier === "STARTER") {
      const remainingQuestions = user.monthlyQuestionRemaining ?? 0;
      const usage = user.monthlyExamUsage ?? {};
      const usageForThisExam = usage[examName] || 0;
      const usedExams = Object.keys(usage);
      const isNewExam = !usedExams.includes(examName);

      if (remainingQuestions <= 0) {
        setLimitReachedDialogInfo(
          "You’ve used all 15 free questions for this month. Upgrade to continue practicing."
        );
        return;
      }
      if (usageForThisExam >= 5) {
        setLimitReachedDialogInfo(
          "You’ve used your 5 free questions for this certification. Upgrade to keep practicing."
        );
        return;
      }
      if (isNewExam && usedExams.length >= 3) {
        setLimitReachedDialogInfo(
          "You’ve reached your limit of 3 certifications for this month. Upgrade to explore more exams."
        );
        return;
      }

      const allowedQuestions = Math.min(
        numQuestions, // User's requested amount
        5 - usageForThisExam,
        remainingQuestions
      );

      setQuizSettings({
        examName,
        numQuestions: allowedQuestions,
        isTimed,
        examMode: "open",
        topics: topics?.trim(),
      });
      setView("exam_mode_selection");
      return;
    }

    // Paid User Logic (PROFESSIONAL / SPECIALIST)
    const isUnlocked = user.unlockedExams.includes(examName);
    if (!isUnlocked) {
      const maxUnlocks = user.subscriptionTier === "PROFESSIONAL" ? 1 : 2;
      if (user.unlockedExams.length >= maxUnlocks) {
        setUpsellDialogInfo({ examName, numQuestions, isTimed, topics });
        return;
      }

      setPendingUnlock({
        examName,
        message: `You have ${
          maxUnlocks - user.unlockedExams.length
        } exam slot(s) available. Do you want to use one to unlock "${examName}"? This choice is permanent for your subscription period.`,
        numQuestions,
        isTimed,
        topics,
      });
      return;
    }

    // If already unlocked, proceed to mode selection
    setQuizSettings({
      examName,
      numQuestions,
      isTimed,
      examMode: "open",
      topics: topics?.trim(),
    });
    setView("exam_mode_selection");
  };

  const handleSelectAnswer = (answer: string) => {
    setAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = {
        ...newAnswers[currentQuestionIndex],
        userAnswer: answer,
      };
      return newAnswers;
    });
  };

  const handleNavigate = (
    destination: "next" | "prev" | number | "intermission" | "submit"
  ) => {
    if (typeof destination === "number") {
      setCurrentQuestionIndex(destination);
    } else if (destination === "next") {
      const nextIndex = currentQuestionIndex + 1;
      if (user?.subscriptionTier === "STARTER" && nextIndex === 5) {
        setView("paywall");
        return;
      }
      if (nextIndex < questions.length) {
        setCurrentQuestionIndex(nextIndex);
      }
    } else if (destination === "prev") {
      setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
    } else if (destination === "submit") {
      setView("review");
    }
  };

  const handleToggleFlag = () => {
    setAnswers((prev) => {
      const newAnswers = [...prev];
      const current = newAnswers[currentQuestionIndex];
      newAnswers[currentQuestionIndex] = {
        ...current,
        flagged: !current.flagged,
      };
      return newAnswers;
    });
  };

  const handleToggleStrikethrough = (option: string) => {
    setAnswers((prev) => {
      const newAnswers = [...prev];
      const current = newAnswers[currentQuestionIndex];
      const struckOptions = current.strikethroughOptions || [];
      const newStruckOptions = struckOptions.includes(option)
        ? struckOptions.filter((o) => o !== option)
        : [...struckOptions, option];
      newAnswers[currentQuestionIndex] = {
        ...current,
        strikethroughOptions: newStruckOptions,
      };
      return newAnswers;
    });
  };

  const handleSaveAndExit = async (time: number) => {
    if (!user || !quizSettings) return;
    const progress: InProgressQuizState = {
      questions,
      answers,
      currentQuestionIndex,
      quizSettings,
      startTime: Date.now(),
      timeRemaining: time,
      isSimulationIntermission: false,
    }; // a
    const updatedUser = await api.saveInProgressQuiz(user.id, progress);
    setUser(updatedUser);
    handleGoHome();
  };

  const finishQuiz = async () => {
    if (!user || !quizSettings) return;

    const userAnswers = questions.map((q, i) => ({
      question: q.question,
      options: q.options,
      answer: q.answer,
      userAnswer: answers[i]?.userAnswer || "Not answered",
      isCorrect: q.answer === answers[i]?.userAnswer,
      category: q.category,
    }));
    const score = userAnswers.filter((ua) => ua.isCorrect).length;
    const totalQuestions = questions.length;
    const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

    const result: Omit<QuizResult, "id" | "userId"> = {
      examName: quizSettings.examName,
      score,
      totalQuestions,
      percentage,
      date: Date.now(),
      userAnswers,
    };

    setIsLoading(true);
    setLoadingMessage("Calculating your score...");
    try {
      const savedResult = await api.saveQuizResult(user.id, result);
      if (user.inProgressQuiz) {
        await api.clearInProgressQuiz(user.id);
      }
      const updatedUser = await api.checkSession();
      if (updatedUser) setUser(updatedUser);

      setQuizResult(savedResult);
      setView("score");
    } catch (err: any) {
      setError("Could not save your quiz result. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleAskFollowUp = async (question: Question, query: string) => {
    setIsFollowUpLoading(true);
    setFollowUpAnswer("");
    try {
      const answer = await api.generateFollowUp(question, query);
      setFollowUpAnswer(answer);
    } catch (e: any) {
      setFollowUpAnswer(`Error: ${e.message}`);
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  const handleRestartQuiz = () => {
    if (quizSettings) {
      initiateQuizFlow(
        quizSettings.examName,
        quizSettings.numQuestions,
        quizSettings.isTimed,
        quizSettings.topics
      );
    } else {
      handleGoHome();
    }
  };

  const handleUpdateUser = async (updatedData: Partial<User>) => {
    if (!user) return;
    try {
      const updatedUser = await api.updateUser(user.id, updatedData);
      setUser(updatedUser);
      if (originalUser && originalUser.id === updatedUser.id) {
        setOriginalUser(updatedUser);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleImpersonate = (userToImpersonate: User) => {
    setOriginalUser(user);
    setUser(userToImpersonate);
    setView("home");
  };

  const handleStopImpersonating = () => {
    if (originalUser) {
      setUser(originalUser);
      setOriginalUser(null);
      setView("admin");
    }
  };

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (!user) return;
    const fourMonths = 120 * 24 * 60 * 60 * 1000;
    const updatedData: Partial<User> = {
      subscriptionTier: tier,
      subscriptionExpiresAt: Date.now() + fourMonths,
      monthlyQuestionRemaining: null,
      monthlyExamUsage: null,
      monthlyResetDate: null,
    };
    if (tier === "PROFESSIONAL" && user.unlockedExams.length > 1) {
      updatedData.unlockedExams = [];
    }
    if (tier === "SPECIALIST" && user.unlockedExams.length > 2) {
      updatedData.unlockedExams = user.unlockedExams.slice(0, 2);
    }

    const updatedUser = await api.updateUser(user.id, updatedData);
    await api.logActivity(user.id, "upgrade", `Upgraded to ${tier} plan.`);
    setUser(updatedUser);
    setView("home");
  };

  const renderContent = () => {
    if (isLoading)
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-10 font-semibold">
            {loadingMessage || "Loading..."}
          </div>
        </div>
      );
    if (view === "loading")
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-10 font-semibold">Initializing...</div>
        </div>
      );
    if (view === "login" || !user)
      return <Login onLoginSuccess={handleLoginSuccess} />;

    switch (view) {
      case "home":
        return (
          <HomePage
            user={user}
            onStartQuiz={initiateQuizFlow}
            onViewDashboard={() => setView("dashboard")}
            onViewProfile={() => setView("profile")}
            onViewAdmin={() => setView("admin")}
            onLogout={handleLogout}
            onUpgrade={() => setView("paywall")}
            onResumeQuiz={handleResumeQuiz}
            onAbandonQuiz={handleAbandonQuiz}
          />
        );
      case "exam_mode_selection":
        return (
          <ExamModeSelector
            examName={quizSettings!.examName}
            onSelectMode={(mode) => {
              if (quizSettings) {
                setQuizSettings({ ...quizSettings, examMode: mode });
                setView("instructions");
              }
            }}
            onGoHome={handleGoHome}
          />
        );
      case "instructions":
        return (
          <InstructionsModal
            examName={quizSettings!.examName}
            bodyOfKnowledge={api.getExamBodyOfKnowledge(quizSettings!.examName)}
            onStart={handleStartQuizFromInstructions}
            onCancel={() => setView("exam_mode_selection")}
          />
        );
      case "quiz":
        return (
          <div className="max-w-4xl mx-auto my-10">
            <QuestionCard
              questionNum={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              question={questions[currentQuestionIndex]}
              onSelectAnswer={handleSelectAnswer}
              selectedAnswer={answers[currentQuestionIndex]?.userAnswer || null}
              onNext={() => handleNavigate("next")}
              isLastQuestion={currentQuestionIndex === questions.length - 1}
              isSimulationClosedBook={false}
              isPro={
                user.subscriptionTier === "PROFESSIONAL" ||
                user.subscriptionTier === "SPECIALIST"
              }
              onAskFollowUp={handleAskFollowUp}
              followUpAnswer={followUpAnswer}
              isFollowUpLoading={isFollowUpLoading}
              onGoHome={handleGoHome}
            />
          </div>
        );
      case "exam":
        return (
          <ExamScreen
            user={user}
            questions={questions}
            quizSettings={quizSettings!}
            currentIndex={currentQuestionIndex}
            answers={answers}
            onSelectAnswer={handleSelectAnswer}
            onNavigate={handleNavigate}
            onToggleFlag={handleToggleFlag}
            onToggleStrikethrough={handleToggleStrikethrough}
            onSubmit={() => setView("review")}
            onSaveAndExit={handleSaveAndExit}
            onAskFollowUp={handleAskFollowUp}
            followUpAnswer={followUpAnswer}
            isFollowUpLoading={isFollowUpLoading}
          />
        );
      case "review":
        return (
          <ReviewScreen
            questions={questions}
            answers={answers}
            onReviewQuestion={(index) => {
              setCurrentQuestionIndex(index);
              setView("exam");
            }}
            onFinalSubmit={finishQuiz}
            onCancel={() => setView("exam")}
          />
        );
      case "score":
        return (
          <ScoreScreen
            result={quizResult!}
            onRestart={handleRestartQuiz}
            onGoHome={handleGoHome}
            isPro={user.subscriptionTier !== "STARTER"}
            onViewDashboard={() => setView("dashboard")}
            onRegenerate={handleRestartQuiz}
          />
        );
      case "dashboard":
        return (
          <Dashboard
            user={user}
            onGoHome={handleGoHome}
            onStartWeaknessQuiz={(topics) =>
              initiateQuizFlow("Weakness Practice", 10, false, topics)
            }
            onUpgrade={() => setView("paywall")}
          />
        );
      case "profile":
        return (
          <UserProfile
            user={user}
            onUpdateUser={handleUpdateUser}
            onGoHome={handleGoHome}
            onViewDashboard={() => setView("dashboard")}
            onManageSubscription={() => setView("paywall")}
          />
        );
      case "admin":
        return (
          <AdminDashboard
            onGoHome={handleGoHome}
            currentUser={user}
            onImpersonate={handleImpersonate}
          />
        );
      case "paywall":
        return (
          <Paywall
            user={user}
            onUpgrade={handleUpgrade}
            onCancel={handleGoHome}
          />
        );
      default:
        return (
          <HomePage
            user={user}
            onStartQuiz={initiateQuizFlow}
            onViewDashboard={() => setView("dashboard")}
            onViewProfile={() => setView("profile")}
            onViewAdmin={() => setView("admin")}
            onLogout={handleLogout}
            onUpgrade={() => setView("paywall")}
            onResumeQuiz={handleResumeQuiz}
            onAbandonQuiz={handleAbandonQuiz}
          />
        );
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {originalUser && (
        <div className="bg-yellow-400 text-black text-center p-2 font-semibold sticky top-0 z-50">
          You are impersonating {user?.email}.
          <button
            onClick={handleStopImpersonating}
            className="ml-4 underline font-bold"
          >
            Return to Admin
          </button>
        </div>
      )}
      {error && (
        <div className="bg-red-500 text-white p-2 text-center sticky top-0 z-50">
          Error: {error}
          <button onClick={() => setError("")} className="ml-4 font-bold">
            X
          </button>
        </div>
      )}

      {infoDialog.open && (
        <InfoDialog
          open={infoDialog.open}
          title={infoDialog.title}
          message={infoDialog.message}
          buttons={infoDialog.buttons}
        />
      )}

      {pendingUnlock && (
        <ConfirmDialog
          open={true}
          title="Unlock Exam?"
          message={pendingUnlock.message}
          onCancel={() => setPendingUnlock(null)}
          onConfirm={async () => {
            if (!user) return;
            const { examName, numQuestions, isTimed, topics } = pendingUnlock;
            const updatedUser = await api.updateUser(user.id, {
              unlockedExams: [...user.unlockedExams, examName],
            });
            await api.logActivity(
              user.id,
              "unlock",
              `Unlocked exam: ${examName}.`
            );
            setUser(updatedUser);
            setPendingUnlock(null);
            setQuizSettings({
              examName,
              numQuestions,
              isTimed,
              examMode: "open",
              topics: topics?.trim(),
            });
            setView("exam_mode_selection");
          }}
        />
      )}

      {upsellDialogInfo && (
        <InfoDialog
          open={true}
          title="All Slots Used"
          message="You have used all your available exam slots for this subscription period."
          buttons={[
            {
              text: "Unlock for $250",
              onClick: async () => {
                if (!user) return;
                const { examName, numQuestions, isTimed, topics } =
                  upsellDialogInfo;
                const updatedUser = await api.updateUser(user.id, {
                  unlockedExams: [...user.unlockedExams, examName],
                });
                await api.logActivity(
                  user.id,
                  "one_time_unlock",
                  `Purchased one-time unlock for exam: ${examName}.`
                );
                setUser(updatedUser);
                setUpsellDialogInfo(null);
                setQuizSettings({
                  examName,
                  numQuestions,
                  isTimed,
                  examMode: "open",
                  topics: topics?.trim(),
                });
                setView("exam_mode_selection");
              },
              style: "primary",
            },
            {
              text: "View Upgrade Plans",
              onClick: () => {
                setUpsellDialogInfo(null);
                setView("paywall");
              },
              style: "secondary",
            },
            {
              text: "Maybe Later",
              onClick: () => setUpsellDialogInfo(null),
              style: "neutral",
            },
          ]}
        />
      )}

      {limitReachedDialogInfo && (
        <InfoDialog
          open={true}
          title="Free Limit Reached"
          message={limitReachedDialogInfo}
          buttons={[
            {
              text: "Upgrade Plan",
              onClick: () => {
                setLimitReachedDialogInfo(null);
                setView("paywall");
              },
              style: "primary",
            },
            {
              text: "Maybe Later",
              onClick: () => setLimitReachedDialogInfo(null),
              style: "neutral",
            },
          ]}
        />
      )}

      {renderContent()}
    </div>
  );
};

export default App;
