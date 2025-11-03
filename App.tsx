import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { User, Question, QuizSettings, QuizResult, UserAnswer, InProgressQuizState } from './types';
import api from './services/apiService';

// Components
import Login from './components/Login';
import HomePage from './components/HomePage';
import QuestionCard from './components/QuestionCard';
import ScoreScreen from './components/ScoreScreen';
import AdminDashboard from './components/AdminDashboard';
import Paywall from './components/Paywall';
import Dashboard from './components/Dashboard';
import ExamModeSelector from './components/ExamModeSelector';
import InstructionsModal from './components/InstructionsModal';
import ConfirmDialog from './components/ConfirmDialog';
import Logo from './components/Logo';
import UserProfile from './components/UserProfile';
import InfoDialog from './components/InfoDialog';


type View = 'login' | 'home' | 'quiz' | 'score' | 'admin' | 'paywall' | 'dashboard' | 'exam_mode_selection' | 'instructions' | 'profile';

const App: React.FC = () => {
    const [view, setView] = useState<View>('login');
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Initializing Academy...');
    const [error, setError] = useState('');

    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
    const [quizSettings, setQuizSettings] = useState<QuizSettings | null>(null);
    const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
    const [isSimulationIntermission, setIsSimulationIntermission] = useState(false);
    
    // For Virtual Tutor
    const [followUpAnswer, setFollowUpAnswer] = useState('');
    const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);

    // For Modals
    const [pendingUnlock, setPendingUnlock] = useState<null | {
        examName: string;
        message: string;
        numQuestions: number;
        isTimed: boolean;
        topics?: string;
    }>(null);
    const [slotLimitInfo, setSlotLimitInfo] = useState<null | { examName: string }>(null);
    const [quizGenerationError, setQuizGenerationError] = useState<string | null>(null);


    // Idle Timer State
    const [isIdleWarningVisible, setIsIdleWarningVisible] = useState(false);
    const [idleCountdown, setIdleCountdown] = useState(60);
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Fix: Moved isAdminImpersonating to component scope to be accessible by the header in the return statement.
    const isAdminImpersonating = sessionStorage.getItem('adminUser') !== null;


    const resetIdleTimer = useCallback(() => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
        setIsIdleWarningVisible(false);

        if (view === 'quiz') {
            idleTimerRef.current = setTimeout(() => {
                setIsIdleWarningVisible(true);
            }, 15 * 60 * 1000); // 15 minutes
        }
    }, [view]);

    useEffect(() => {
        if (isIdleWarningVisible) {
            setIdleCountdown(60);
            countdownTimerRef.current = setInterval(() => {
                setIdleCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownTimerRef.current!);
                        handleIdleLogout();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        }
        return () => {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        };
    }, [isIdleWarningVisible]);

    const handleIdleLogout = async () => {
        if (view === 'quiz') {
            await saveQuizProgress();
            setView('home');
        }
        setIsIdleWarningVisible(false);
    };

    useEffect(() => {
        const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
        events.forEach(event => window.addEventListener(event, resetIdleTimer));
        resetIdleTimer();
        return () => {
            events.forEach(event => window.removeEventListener(event, resetIdleTimer));
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
        };
    }, [resetIdleTimer, view]);

    const handleUserActivity = () => {
        resetIdleTimer();
    };


    const goHome = useCallback(() => {
        setView('home');
        setError('');
        setQuizResult(null);
    }, []);

    const handleLoginSuccess = async (loggedInUser: User) => {
        setUser(loggedInUser);
        if (loggedInUser.role === 'ADMIN' || loggedInUser.role === 'SUB_ADMIN') {
            setView('admin');
        } else {
            goHome();
        }
        setIsLoading(false);
    };

    useEffect(() => {
        const checkSession = async () => {
            try {
                const sessionUser = await api.checkSession();
                if (sessionUser) {
                    handleLoginSuccess(sessionUser);
                } else {
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Session check failed:", error);
                setIsLoading(false);
            }
        };
        checkSession();
    }, []);

    const handleLogout = async () => {
        await saveQuizProgress();
        await api.logout();
        setUser(null);
        setView('login');
    };

    const handleUpdateUser = async (updatedData: Partial<User>) => {
        if (!user) return;
        try {
            const updatedUser = await api.updateUser(user.id, updatedData);
            setUser(updatedUser);
        } catch (error) {
            console.error("Failed to update user:", error);
        }
    };
    
    const initiateQuizFlow = async (examName: string, numQuestions: number, isTimed: boolean, topics?: string) => {
        if (!user) return;
        const isPaidUser = user.subscriptionTier !== 'Cadet';
        const isUnlocked = user.unlockedExams.includes(examName);
    
        if (isPaidUser && !isUnlocked) {
            const maxUnlocks = user.subscriptionTier === 'Professional' ? 1 : 2;
            if (user.unlockedExams.length >= maxUnlocks) {
                setSlotLimitInfo({ examName }); // Show custom dialog
                return;
            }
    
            setPendingUnlock({
                examName,
                message: `You have ${maxUnlocks - user.unlockedExams.length} exam slot(s) available. Do you want to use one to unlock "${examName}"? This choice is permanent for your subscription period.`,
                numQuestions,
                isTimed,
                topics
            });
            return;
        }
    
        setQuizSettings({ examName, numQuestions, isTimed, examMode: 'open', topics: topics?.trim() });
        setView('exam_mode_selection');
    };

    const startQuiz = async () => {
        if (!quizSettings || !user) return;
        setLoadingMessage('Generating your personalized mock exam...');
        setIsLoading(true);
        setError('');
        setQuizGenerationError(null);
        try {
            const newQuestions = await api.generateQuiz(quizSettings);
            setQuestions(newQuestions);
            setCurrentQuestionIndex(0);
            setUserAnswers([]);
            setIsSimulationIntermission(false);
            setView('quiz');
        } catch (err: any) {
            console.error("Quiz generation failed:", err);
            setQuizGenerationError(err.message || 'An unknown error occurred while generating the quiz.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const proceedFromIntermission = async () => {
        if (!quizSettings || !user) return;
        setLoadingMessage('Generating Open Book section...');
        setIsLoading(true);
        setError('');
        setQuizGenerationError(null);
        try {
            const newQuestions = await api.generateQuiz({ ...quizSettings, examMode: 'open' });
            setQuestions(newQuestions);
            setCurrentQuestionIndex(0);
            setIsSimulationIntermission(false);
            setView('quiz');
        } catch (err: any) {
            console.error("Quiz generation failed:", err);
            setQuizGenerationError(err.message || 'An unknown error occurred while generating the quiz.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectAnswer = (answer: string) => {
        setUserAnswers(prev => {
            const newAnswers = [...prev];
            newAnswers[currentQuestionIndex] = {
                ...newAnswers[currentQuestionIndex], // It should already have question, options, answer
                userAnswer: answer,
                isCorrect: answer === questions[currentQuestionIndex].answer
            };
            return newAnswers;
        });
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
             if (quizSettings?.examMode === 'simulation' && !isSimulationIntermission) {
                setIsSimulationIntermission(true);
             } else {
                finishQuiz();
             }
        }
        setFollowUpAnswer('');
    };

    const finishQuiz = async () => {
        if (!user || !quizSettings) return;
        let finalUserAnswers = userAnswers;
        if (quizSettings.examMode === 'simulation') {
            const inProgress = user.inProgressQuiz;
            if (inProgress && inProgress.isSimulationIntermission) {
                // This is the end of the OPEN book section, combine with closed book answers.
                finalUserAnswers = [...inProgress.userAnswers, ...userAnswers];
            }
        }

        const score = finalUserAnswers.filter(a => a.isCorrect).length;
        const total = finalUserAnswers.length;
        const percentage = total > 0 ? (score / total) * 100 : 0;
    
        const result: Omit<QuizResult, 'id' | 'userId'> = {
            examName: quizSettings.examName,
            score,
            totalQuestions: total,
            percentage,
            date: Date.now(),
            userAnswers: finalUserAnswers,
        };
        
        try {
            const savedResult = await api.saveQuizResult(user.id, result);
            setQuizResult(savedResult);
            const updatedUser = await api.clearInProgressQuiz(user.id);
            setUser(updatedUser);
            setView('score');
            await api.logActivity(user.id, 'quiz_complete', `Completed "${result.examName}" with ${percentage.toFixed(1)}%`);
        } catch (error) {
            console.error("Failed to save quiz result:", error);
            setError("Could not save your quiz result. Please try again.");
        }
    };
    
    const restartQuiz = () => {
        if (quizResult) {
            const previousSettings = {
                examName: quizResult.examName,
                numQuestions: quizResult.totalQuestions,
                isTimed: false, // Default to not timed on restart
                examMode: 'open' as const // Default to open book on restart
            };
            setQuizSettings(previousSettings);
            startQuiz();
        }
    };
    
    const saveQuizProgress = async () => {
        if (view !== 'quiz' || !user || !quizSettings || questions.length === 0) return;
        
        const progress: InProgressQuizState = {
            questions,
            userAnswers,
            currentQuestionIndex,
            quizSettings,
            startTime: Date.now(),
            timeRemaining: 0, // Placeholder
            isSimulationIntermission,
        };
        try {
            await api.saveInProgressQuiz(user.id, progress);
        } catch (error) {
            console.error("Failed to save progress:", error);
        }
    };
    
    const handleResumeQuiz = (progress: InProgressQuizState) => {
        setQuizSettings(progress.quizSettings);
        setQuestions(progress.questions);
        setUserAnswers(progress.userAnswers);
        setCurrentQuestionIndex(progress.currentQuestionIndex);
        setIsSimulationIntermission(progress.isSimulationIntermission);
        setView('quiz');
    };
    
    const handleAbandonQuiz = async () => {
        if (!user) return;
        try {
            const updatedUser = await api.clearInProgressQuiz(user.id);
            setUser(updatedUser);
        } catch (error) {
            console.error("Failed to abandon quiz:", error);
        }
    };
    
    const handleAskFollowUp = async (question: Question, query: string) => {
        if (!user || user.subscriptionTier === 'Cadet') return;
        setIsFollowUpLoading(true);
        setFollowUpAnswer('');
        try {
            const answer = await api.generateFollowUp(question, query);
            setFollowUpAnswer(answer);
        } catch (error) {
            console.error("Failed to get follow-up answer:", error);
            setFollowUpAnswer("Sorry, I couldn't get an answer for that. Please try again.");
        } finally {
            setIsFollowUpLoading(false);
        }
    };

    const impersonateUser = async (targetUser: User) => {
        const adminUser = user;
        if (!adminUser) return;
        sessionStorage.setItem('adminUser', JSON.stringify(adminUser));
        try {
            const impersonatedUser = await api.login(targetUser.email, targetUser.password!); // Note: This assumes password is available, which is only true in this mock setup.
            setUser(impersonatedUser);
            setView('home');
        } catch (error) {
            console.error("Impersonation failed", error);
        }
    };

    const stopImpersonating = async () => {
        const adminUserStr = sessionStorage.getItem('adminUser');
        if (adminUserStr) {
            const adminUser = JSON.parse(adminUserStr);
            sessionStorage.removeItem('adminUser');
            try {
                const user = await api.login(adminUser.email, adminUser.password);
                setUser(user);
                setView('admin');
            } catch (error) {
                console.error("Failed to stop impersonating", error);
                handleLogout(); // Fallback to logout
            }
        }
    };


    const renderView = () => {
        if (isLoading) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
                    <Logo className="h-40 w-auto" />
                    <p className="text-xl text-gray-600 mt-4">{loadingMessage}</p>
                </div>
            );
        }
    
        if (!user) {
            return <Login onLoginSuccess={handleLoginSuccess} />;
        }
        
        // RBAC for admin dashboard
        if (view === 'admin' && user.role !== 'ADMIN' && user.role !== 'SUB_ADMIN') {
            goHome(); // Redirect non-admins
            return null;
        }

        switch (view) {
            case 'home':
                return <HomePage 
                    user={user} 
                    onStartQuiz={initiateQuizFlow} 
                    onViewDashboard={() => setView('dashboard')}
                    onViewProfile={() => setView('profile')}
                    onViewAdmin={() => setView('admin')}
                    onLogout={handleLogout}
                    onUpgrade={() => setView('paywall')}
                    onResumeQuiz={handleResumeQuiz}
                    onAbandonQuiz={handleAbandonQuiz}
                />;
            case 'exam_mode_selection':
                return <ExamModeSelector 
                    examName={quizSettings!.examName}
                    onSelectMode={(mode) => {
                        setQuizSettings(prev => ({ ...prev!, examMode: mode }));
                        setView('instructions');
                    }}
                    onGoHome={goHome}
                />;
            case 'instructions':
                return <InstructionsModal
                    examName={quizSettings!.examName}
                    bodyOfKnowledge={api.getExamBodyOfKnowledge(quizSettings!.examName)}
                    onStart={startQuiz}
                    onCancel={() => setView('exam_mode_selection')}
                />;
            case 'quiz':
                if (isSimulationIntermission) {
                    return (
                        <div className="max-w-2xl mx-auto my-10 p-8 text-center bg-white rounded-lg shadow-xl">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Closed Book Section Complete</h2>
                            <p className="text-gray-600 mb-6">You will now proceed to the timed Open Book section of the exam. The questions will be different.</p>
                            <button onClick={proceedFromIntermission} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors">
                                Start Open Book Section
                            </button>
                        </div>
                    );
                }
                return <QuestionCard
                    questionNum={currentQuestionIndex + 1}
                    totalQuestions={questions.length}
                    question={questions[currentQuestionIndex]}
                    selectedAnswer={userAnswers[currentQuestionIndex]?.userAnswer || null}
                    onSelectAnswer={handleSelectAnswer}
                    onNext={handleNextQuestion}
                    isLastQuestion={currentQuestionIndex === questions.length - 1}
                    isSimulationClosedBook={quizSettings?.examMode === 'simulation' && !isSimulationIntermission}
                    isPro={user.subscriptionTier !== 'Cadet'}
                    onAskFollowUp={handleAskFollowUp}
                    followUpAnswer={followUpAnswer}
                    isFollowUpLoading={isFollowUpLoading}
                    onGoHome={() => {
                        saveQuizProgress();
                        setView('home');
                    }}
                />;
            case 'score':
                return <ScoreScreen 
                    result={quizResult!} 
                    onRestart={restartQuiz} 
                    onGoHome={goHome}
                    isPro={user.subscriptionTier !== 'Cadet'}
                    onViewDashboard={() => setView('dashboard')}
                    onRegenerate={() => {
                        if (!quizSettings) return;
                        startQuiz();
                    }}
                />;
            case 'dashboard':
                return <Dashboard 
                    user={user}
                    onGoHome={goHome}
                    onStartWeaknessQuiz={(topics) => {
                        initiateQuizFlow( "Weakness Practice", 10, false, topics);
                    }}
                />;
            case 'admin':
                return <AdminDashboard onGoHome={goHome} currentUser={user} onImpersonate={impersonateUser} />;
            case 'paywall':
                return <Paywall 
                    user={user}
                    onUpgrade={async (tier) => {
                        await handleUpdateUser({ subscriptionTier: tier, subscriptionExpiresAt: Date.now() + 4 * 30 * 24 * 60 * 60 * 1000 });
                        await api.logActivity(user.id, 'upgrade', `Upgraded to ${tier} plan.`);
                        goHome();
                    }}
                    onCancel={goHome}
                />;
            case 'profile':
                return <UserProfile 
                    user={user} 
                    onUpdateUser={handleUpdateUser} 
                    onGoHome={goHome}
                    onViewDashboard={() => setView('dashboard')}
                    onManageSubscription={() => setView('paywall')}
                />;
            default:
                return <Login onLoginSuccess={handleLoginSuccess} />;
        }
    };

    return (
        <main className="bg-gray-100 min-h-screen" onClick={handleUserActivity} onKeyDown={handleUserActivity} onMouseMove={handleUserActivity}>
             {user && view !== 'login' && (
                 <header className="bg-white shadow-md p-4 flex justify-between items-center">
                    <div onClick={goHome} className="cursor-pointer">
                        <Logo className="h-16 w-auto" />
                    </div>
                     <div className="flex items-center gap-4">
                        <span className="text-gray-600 hidden sm:inline">Welcome, {user.fullName || user.email}!</span>
                        {isAdminImpersonating ? (
                             <button onClick={stopImpersonating} className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-red-600">
                                 Stop Impersonating
                             </button>
                        ) : (
                            <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-blue-600 font-semibold">Logout</button>
                        )}
                     </div>
                 </header>
             )}
            {renderView()}
            {pendingUnlock && (
                <ConfirmDialog
                    open={true}
                    title="Unlock Exam?"
                    message={pendingUnlock.message}
                    onCancel={() => setPendingUnlock(null)}
                    onConfirm={async () => {
                        const { examName, numQuestions, isTimed, topics } = pendingUnlock;
                        const updatedUser = { ...user!, unlockedExams: [...user!.unlockedExams, examName] };
                        await handleUpdateUser({ unlockedExams: updatedUser.unlockedExams });
                        await api.logActivity(user!.id, 'unlock', `Unlocked exam: ${examName}`);
                        setPendingUnlock(null);
                        setQuizSettings({ examName, numQuestions, isTimed, examMode: 'open', topics });
                        setView('exam_mode_selection');
                    }}
                />
            )}
            {slotLimitInfo && (
                <InfoDialog
                    open={true}
                    title="Exam Slot Limit Reached"
                    message="You have used all available exam slots for your plan."
                    buttons={[
                        { text: 'Unlock for $250', onClick: async () => {
                             const { examName } = slotLimitInfo;
                             await handleUpdateUser({ unlockedExams: [...user!.unlockedExams, examName] });
                             await api.logActivity(user!.id, 'one_time_unlock', `Purchased and unlocked: ${examName}`);
                             setSlotLimitInfo(null);
                             // Directly use current quiz settings if available
                             const settings = quizSettings || { examName, numQuestions: 120, isTimed: true, examMode: 'open' };
                             setQuizSettings(settings);
                             setView('exam_mode_selection');
                        }, style: 'primary' },
                        { text: 'Maybe Later', onClick: () => setSlotLimitInfo(null), style: 'neutral' }
                    ]}
                />
            )}
             {quizGenerationError && (
                 <InfoDialog
                    open={true}
                    title="Quiz Generation Failed"
                    message={`We couldn't create your quiz at this moment. ${quizGenerationError}`}
                    buttons={[
                        { text: 'Try Again', onClick: () => { setQuizGenerationError(null); startQuiz(); }, style: 'primary' },
                        { text: 'Contact Support', onClick: () => { window.location.href = 'mailto:support@inspectors.academy'; }, style: 'secondary' },
                        { text: 'Back to Home', onClick: () => { setQuizGenerationError(null); goHome(); }, style: 'neutral' }
                    ]}
                />
            )}
             {isIdleWarningVisible && (
                <InfoDialog
                    open={true}
                    title="Are you still there?"
                    message={`Your session will be saved and you will be returned to the homepage in ${idleCountdown} seconds due to inactivity.`}
                    buttons={[
                        { text: "I'm still here", onClick: handleUserActivity, style: 'primary' }
                    ]}
                />
             )}
        </main>
    );
};

export default App;