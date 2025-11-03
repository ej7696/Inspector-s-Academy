
import React, { useState, useEffect, useCallback } from 'react';
import api from './services/apiService';
import { User, QuizSettings, Question, QuizResult, InProgressQuizState, SubscriptionTier } from './types';
import { examSourceData } from './services/examData';

import Login from './components/Login';
import HomePage from './components/HomePage';
import AdminDashboard from './components/AdminDashboard';
import Dashboard from './components/Dashboard';
import UserProfile from './components/UserProfile';
import Paywall from './components/Paywall';
import ExamModeSelector from './components/ExamModeSelector';
import InstructionsModal from './components/InstructionsModal';
import ProgressBar from './components/ProgressBar';
import QuestionCard from './components/QuestionCard';
import ScoreScreen from './components/ScoreScreen';
import Logo from './components/Logo';
import ConfirmDialog from './components/ConfirmDialog';
import InfoDialog from './components/InfoDialog';

type AppState = 'login' | 'home' | 'quiz' | 'score' | 'dashboard' | 'admin' | 'profile' | 'paywall' | 'selecting_mode' | 'generating_quiz' | 'instructions';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appState, setAppState] = useState<AppState>('login');
  
  const [inProgressQuiz, setInProgressQuiz] = useState<InProgressQuizState | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [quizSettingsForGeneration, setQuizSettingsForGeneration] = useState<QuizSettings | null>(null);

  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
  
  const [error, setError] = useState('');

  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void; } | null>(null);
  const [infoDialog, setInfoDialog] = useState<{ open: boolean; title: string; message: string; buttons: any[] } | null>(null);

  const checkSession = useCallback(async () => {
    const currentUser = await api.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      if (currentUser.inProgressQuiz) {
        setInProgressQuiz(currentUser.inProgressQuiz);
        setAppState('quiz');
      } else {
        setAppState('home');
      }
    } else {
      setAppState('login');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const updateUserState = async (updatedUser: User) => {
      setUser(updatedUser);
      await api.updateCurrentUserSession(updatedUser);
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    if (loggedInUser.role === 'ADMIN' || loggedInUser.role === 'SUB_ADMIN') {
        // Default admin to their dashboard
        setAppState('admin');
    } else if (loggedInUser.inProgressQuiz) {
      setInProgressQuiz(loggedInUser.inProgressQuiz);
      setAppState('quiz');
    } else {
      setAppState('home');
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setInProgressQuiz(null);
    setAppState('login');
  };
  
  const saveQuizProgress = async (shouldGoHome = false) => {
    if (user && inProgressQuiz) {
        const updatedUser = { ...user, inProgressQuiz };
        await api.updateUser(updatedUser);
        await updateUserState(updatedUser);
        if(shouldGoHome) {
            setInProgressQuiz(null);
            setAppState('home');
        }
    }
  };
  
  const abandonQuiz = async (shouldGoHome = false) => {
    if (user) {
        const updatedUser = { ...user, inProgressQuiz: null };
        await api.updateUser(updatedUser);
        await updateUserState(updatedUser);
        setInProgressQuiz(null);
        if(shouldGoHome) {
            setAppState('home');
        }
    }
  };

  const handleGoHome = () => {
    if (inProgressQuiz && user) {
        setConfirmDialog({
            open: true,
            title: "Leave Quiz?",
            message: "Do you want to save your progress or abandon this quiz session? If you abandon, progress will be lost.",
            onConfirm: () => {
                saveQuizProgress(true);
                setConfirmDialog(null);
            },
            onCancel: () => {
                abandonQuiz(true);
                setConfirmDialog(null);
            }
        });
    } else {
        setQuizResult(null);
        setAppState('home');
    }
  };

  const handleAbandonQuiz = () => {
     setConfirmDialog({
        open: true,
        title: "Abandon Quiz?",
        message: "Are you sure you want to abandon your current quiz? All progress will be lost.",
        onConfirm: () => {
            abandonQuiz(true);
            setConfirmDialog(null);
        },
        onCancel: () => setConfirmDialog(null),
     });
  };

  const handleStartQuiz = (examName: string, numQuestions: number, isTimed: boolean, topics?: string) => {
    if (!user) return;
    const isPaidUser = user.subscriptionTier === 'Professional' || user.subscriptionTier === 'Specialist';
    const isUnlocked = user.unlockedExams.includes(examName);

    if (isPaidUser && !isUnlocked) {
        const maxUnlocks = user.subscriptionTier === 'Professional' ? 1 : 2;
        if (user.unlockedExams.length >= maxUnlocks) {
            setInfoDialog({
                open: true,
                title: "Exam Slot Limit Reached",
                message: "You have used all your available exam slots. You can purchase a single exam unlock or upgrade your plan for more slots.",
                buttons: [
                    { 
                        text: 'Unlock for $250', 
                        onClick: async () => {
                            const updatedUser: User = { ...user, unlockedExams: [...user.unlockedExams, examName] };
                            await api.updateUser(updatedUser);
                            await api.logActivity(user.email, `purchased a one-time unlock for "${examName}".`, 'one_time_unlock');
                            await updateUserState(updatedUser);
                            setQuizSettingsForGeneration({ examName, numQuestions, isTimed, examMode: 'open', topics });
                            setAppState('selecting_mode');
                            setInfoDialog(null);
                        }, 
                        style: 'primary' 
                    },
                    {
                        text: 'Upgrade Plan',
                        onClick: () => { setInfoDialog(null); setAppState('paywall') },
                        style: 'secondary'
                    },
                    { 
                        text: 'Maybe Later', 
                        onClick: () => setInfoDialog(null), 
                        style: 'neutral' 
                    }
                ]
            });
            return;
        }

        setConfirmDialog({
            open: true,
            title: "Unlock New Exam?",
            message: `This will use one of your ${maxUnlocks - user.unlockedExams.length} remaining exam slots to unlock "${examName}". This action is permanent for your subscription period. Do you wish to proceed?`,
            onConfirm: async () => {
                const updatedUser: User = { ...user, unlockedExams: [...user.unlockedExams, examName] };
                await api.updateUser(updatedUser);
                await api.logActivity(user.email, `unlocked the "${examName}" exam.`, 'exam_unlock');
                await updateUserState(updatedUser);
                setQuizSettingsForGeneration({ examName, numQuestions, isTimed, examMode: 'open', topics });
                setAppState('selecting_mode');
                setConfirmDialog(null);
            },
            onCancel: () => setConfirmDialog(null)
        });
    } else {
        setQuizSettingsForGeneration({ examName, numQuestions, isTimed, examMode: 'open', topics });
        setAppState('selecting_mode');
    }
  };

  const handleSelectMode = (mode: 'open' | 'closed' | 'simulation') => {
    if (quizSettingsForGeneration) {
      const settings: QuizSettings = { ...quizSettingsForGeneration, examMode: mode };
      setQuizSettingsForGeneration(settings);
      setAppState('generating_quiz');

      // Kick off generation
      generateQuestions(settings);
    }
  };
  
  const generateQuestions = async (settings: QuizSettings) => {
    setError('');
    try {
        const questions = await api.generateQuiz(settings);
        if (questions.length === 0) {
            throw new Error("No questions were generated. Please try again.");
        }
        
        const newQuizState: InProgressQuizState = {
            quizSettings: settings,
            questions: questions,
            currentQuestionIndex: 0,
            userAnswers: new Array(questions.length).fill(null),
            timeLeft: settings.isTimed ? settings.numQuestions * 2.25 * 60 : null, // 2.25 mins per question
            simulationPhase: settings.examMode === 'simulation' ? 'closed_book' : null,
            closedBookResults: null
        };
        setInProgressQuiz(newQuizState);
        setAppState('instructions');
    } catch (e: any) {
        console.error("Failed to generate quiz:", e);
        setError(`Failed to generate quiz: ${e.message}. Please check your connection or API key and try again.`);
        setAppState('home');
    }
  };
  
  const handleStartQuizFromInstructions = () => {
      setAppState('quiz');
  };

  const handleSelectAnswer = (answer: string) => {
    if (inProgressQuiz) {
        const newUserAnswers = [...inProgressQuiz.userAnswers];
        newUserAnswers[inProgressQuiz.currentQuestionIndex] = answer;
        setInProgressQuiz({ ...inProgressQuiz, userAnswers: newUserAnswers });
    }
  };
  
  const finishQuiz = async () => {
    if (!user || !inProgressQuiz) return;
    const { questions, userAnswers, quizSettings } = inProgressQuiz;

    let finalQuestions = questions;
    let finalUserAnswers = userAnswers;
    
    // Handle simulation mode transition
    if(quizSettings.examMode === 'simulation' && inProgressQuiz.simulationPhase === 'closed_book' && inProgressQuiz.closedBookResults === null) {
      // Store closed book results and generate open book questions
      const closedBookState = {
        questions: questions,
        userAnswers: userAnswers
      };
      
      const openBookSettings: QuizSettings = {
        ...quizSettings,
        numQuestions: quizSettings.numQuestions - questions.length, // The rest of the questions
        examMode: 'open'
      };

      setInProgressQuiz({
        ...inProgressQuiz,
        closedBookResults: closedBookState,
        simulationPhase: 'open_book'
      });

      setAppState('generating_quiz');
      setInfoDialog({ open: true, title: "Part 1 Complete", message: "The closed book session is complete. Now generating the open book session.", buttons: [{ text: "Continue", onClick: () => setInfoDialog(null), style: 'primary' }] });
      
      try {
        const openBookQuestions = await api.generateQuiz(openBookSettings);
        setInProgressQuiz(prevState => {
          if(!prevState) return null;
          return {
            ...prevState,
            questions: openBookQuestions,
            currentQuestionIndex: 0,
            userAnswers: new Array(openBookQuestions.length).fill(null),
          };
        });
        setAppState('quiz');
      } catch(e: any) {
         console.error("Failed to generate open book part:", e);
         setError(`Failed to generate open book part: ${e.message}.`);
         handleGoHome();
      }
      return;
    }
    
    // Combine simulation results for final scoring
    if (quizSettings.examMode === 'simulation' && inProgressQuiz.closedBookResults) {
        finalQuestions = [...inProgressQuiz.closedBookResults.questions, ...questions];
        finalUserAnswers = [...inProgressQuiz.closedBookResults.userAnswers, ...userAnswers];
    }

    let score = 0;
    const detailedUserAnswers = finalQuestions.map((q, i) => {
        const userAnswer = finalUserAnswers[i] ?? "Not Answered";
        const isCorrect = userAnswer === q.answer;
        if (isCorrect) score++;
        return {
            question: q.question,
            options: q.options,
            answer: q.answer,
            userAnswer,
            isCorrect,
            category: q.category,
            reference: q.reference,
            explanation: q.explanation
        };
    });

    const result: QuizResult = {
        id: new Date().toISOString(),
        examName: quizSettings.examName,
        score,
        totalQuestions: finalQuestions.length,
        percentage: (score / finalQuestions.length) * 100,
        date: Date.now(),
        userAnswers: detailedUserAnswers
    };

    setQuizResult(result);

    const updatedUser: User = {
        ...user,
        history: [...user.history, result],
        inProgressQuiz: null,
    };
    await api.updateUser(updatedUser);
    await api.logActivity(user.email, `completed a quiz for "${quizSettings.examName}" with a score of ${result.percentage.toFixed(1)}%.`, 'quiz_completion');
    await updateUserState(updatedUser);
    setInProgressQuiz(null);
    setAppState('score');
  };

  const handleNextQuestion = () => {
    if (inProgressQuiz) {
        if (inProgressQuiz.currentQuestionIndex < inProgressQuiz.questions.length - 1) {
            setInProgressQuiz({ ...inProgressQuiz, currentQuestionIndex: inProgressQuiz.currentQuestionIndex + 1 });
            setFollowUpAnswer('');
        } else {
            finishQuiz();
        }
    }
  };

  const handleRestartQuiz = () => {
      if(quizResult) {
          const settings: QuizSettings = {
              examName: quizResult.examName,
              numQuestions: quizResult.totalQuestions,
              isTimed: false, // Can add logic to preserve this later
              examMode: 'open' // Default to open for a simple restart
          };
          setQuizResult(null);
          setQuizSettingsForGeneration(settings);
          setAppState('selecting_mode');
      }
  };

  const handleRegenerateExam = () => {
    if (user && quizResult) {
        handleStartQuiz(quizResult.examName, 120, true);
    }
  };

  const handleAskFollowUp = async (question: Question, query: string) => {
    setIsFollowUpLoading(true);
    setFollowUpAnswer('');
    try {
        const answer = await api.generateFollowUp(question, query);
        setFollowUpAnswer(answer);
    } catch (e: any) {
        setFollowUpAnswer(`Sorry, I couldn't get an answer. Error: ${e.message}`);
    } finally {
        setIsFollowUpLoading(false);
    }
  };

  const handleStartWeaknessQuiz = (topics: string) => {
    if(user) {
        const examName = user.history.length > 0 ? user.history[user.history.length - 1].examName : "General Knowledge";
        handleStartQuiz(examName, 10, false, topics);
    }
  };

  const handleUpdateUser = async (updatedFields: Partial<User>) => {
      if (user) {
          const updatedUser = { ...user, ...updatedFields };
          const savedUser = await api.updateUser(updatedUser);
          await updateUserState(savedUser);
      }
  };

  const handleUpgradeTier = async (tier: SubscriptionTier) => {
    if(user) {
        const updatedUser: User = { 
            ...user, 
            subscriptionTier: tier,
            subscriptionExpiresAt: Date.now() + 4 * 30 * 24 * 60 * 60 * 1000 // 4 months
        };
        await api.updateUser(updatedUser);
        await api.logActivity(user.email, `upgraded to the ${tier} plan.`, 'upgrade');
        await updateUserState(updatedUser);
        setAppState('home');
    }
  };

  // Render Logic
  const renderHeader = () => {
      if (!user) return null;
      return (
          <header className="bg-white shadow-md p-4 sticky top-0 z-40">
              <div className="max-w-7xl mx-auto flex justify-between items-center">
                  <button onClick={handleGoHome}>
                    <Logo className="h-12 w-auto" />
                  </button>
                  <nav className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
                      {user.role !== 'USER' && <button onClick={() => setAppState('admin')} className="font-semibold text-gray-600 hover:text-blue-600 px-2 py-1 rounded-md">Admin</button>}
                      <button onClick={() => setAppState('home')} className="font-semibold text-gray-600 hover:text-blue-600 px-2 py-1 rounded-md">Home</button>
                      {user.subscriptionTier !== 'Cadet' && <button onClick={() => setAppState('dashboard')} className="font-semibold text-gray-600 hover:text-blue-600 px-2 py-1 rounded-md">Dashboard</button>}
                      <button onClick={() => setAppState('profile')} className="font-semibold text-gray-600 hover:text-blue-600 px-2 py-1 rounded-md">Profile</button>
                      <button onClick={handleLogout} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-lg text-sm font-semibold">Logout</button>
                  </nav>
              </div>
          </header>
      );
  };

  const renderContent = () => {
    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><p className="text-xl">Initializing App...</p></div>;
    }

    if (appState === 'login' || !user) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }
    
    // Main content for logged-in user
    switch(appState) {
        case 'home':
            return <HomePage user={user} onStartQuiz={handleStartQuiz} onViewDashboard={() => setAppState('dashboard')} onUpgrade={() => setAppState('paywall')} onResumeQuiz={() => setAppState('quiz')} onAbandonQuiz={handleAbandonQuiz}/>;
        case 'selecting_mode':
            return quizSettingsForGeneration && <ExamModeSelector examName={quizSettingsForGeneration.examName} onSelectMode={handleSelectMode} onGoHome={handleGoHome} />;
        case 'generating_quiz':
            return <div className="text-center p-10"><p className="text-xl animate-pulse">Generating your custom exam, please wait...</p><p className="text-sm text-gray-500 mt-2">This may take up to 30 seconds.</p></div>;
        case 'instructions':
            return inProgressQuiz && <InstructionsModal examName={inProgressQuiz.quizSettings.examName} bodyOfKnowledge={examSourceData[inProgressQuiz.quizSettings.examName]?.bodyOfKnowledge || 'No details available.'} onStart={handleStartQuizFromInstructions} onCancel={handleGoHome} />;
        case 'quiz':
            if (!inProgressQuiz) {
              handleGoHome();
              return <p>Error: No quiz in progress. Returning home...</p>;
            }
            const currentQuestion = inProgressQuiz.questions[inProgressQuiz.currentQuestionIndex];
            return (
                <div className="max-w-4xl mx-auto p-4 md:p-6">
                    <ProgressBar current={inProgressQuiz.currentQuestionIndex + 1} total={inProgressQuiz.questions.length} />
                    {inProgressQuiz.quizSettings.examMode === 'simulation' && <p className="text-center font-bold text-indigo-600 mb-4 bg-indigo-100 p-2 rounded-md">SIMULATION MODE: {inProgressQuiz.simulationPhase === 'closed_book' ? 'Part 1 - Closed Book' : 'Part 2 - Open Book'}</p>}
                    <QuestionCard 
                        questionNum={inProgressQuiz.currentQuestionIndex + 1} 
                        totalQuestions={inProgressQuiz.questions.length} 
                        question={currentQuestion}
                        onSelectAnswer={handleSelectAnswer}
                        selectedAnswer={inProgressQuiz.userAnswers[inProgressQuiz.currentQuestionIndex]}
                        onNext={handleNextQuestion}
                        isLastQuestion={inProgressQuiz.currentQuestionIndex === inProgressQuiz.questions.length - 1}
                        isSimulationClosedBook={inProgressQuiz.simulationPhase === 'closed_book'}
                        isPro={user.subscriptionTier !== 'Cadet'}
                        onAskFollowUp={handleAskFollowUp}
                        followUpAnswer={followUpAnswer}
                        isFollowUpLoading={isFollowUpLoading}
                        onGoHome={handleGoHome}
                    />
                </div>
            );
        case 'score':
            return quizResult && <ScoreScreen result={quizResult} onRestart={handleRestartQuiz} onGoHome={handleGoHome} isPro={user.subscriptionTier !== 'Cadet'} onViewDashboard={() => setAppState('dashboard')} onRegenerate={handleRegenerateExam} />;
        case 'dashboard':
            return <Dashboard history={user.history} onGoHome={handleGoHome} onStartWeaknessQuiz={handleStartWeaknessQuiz} />;
        case 'admin':
            return <AdminDashboard currentUser={user} onGoHome={handleGoHome} />;
        case 'profile':
            return <UserProfile user={user} onUpdateUser={handleUpdateUser} onGoHome={handleGoHome} onViewDashboard={() => setAppState('dashboard')} onManageSubscription={() => setAppState('paywall')} />;
        case 'paywall':
            return <Paywall user={user} onUpgrade={handleUpgradeTier} onCancel={() => setAppState('home')} />;
        default:
            return <HomePage user={user} onStartQuiz={handleStartQuiz} onViewDashboard={() => setAppState('dashboard')} onUpgrade={() => setAppState('paywall')} onResumeQuiz={() => setAppState('quiz')} onAbandonQuiz={handleAbandonQuiz}/>;
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
        {appState !== 'login' && renderHeader()}
        <main className="pb-10">
            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 m-4 rounded-md" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>}
            {renderContent()}
        </main>
        {confirmDialog && confirmDialog.open && <ConfirmDialog open={true} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={confirmDialog.onCancel}/>}
        {infoDialog && infoDialog.open && <InfoDialog open={true} title={infoDialog.title} message={infoDialog.message} buttons={infoDialog.buttons}/>}
    </div>
  );
}

export default App;
