import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { User, Question, QuizSettings, QuizResult, UserAnswer, InProgressQuizState, InProgressAnswer } from './types';
import api from './services/apiService';

// Components
import Login from './components/Login';
import HomePage from './components/HomePage';
import ExamScreen from './components/ExamScreen';
import ReviewScreen from './components/ReviewScreen';
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

    // Quiz State
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentQuizAnswers, setCurrentQuizAnswers] = useState<InProgressAnswer[]>([]);
    const [quizSettings, setQuizSettings] = useState<QuizSettings | null>(null);
    const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
    const [isSimulationIntermission, setIsSimulationIntermission] = useState(false);
    const [isReviewing, setIsReviewing] = useState(false);
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
    const [upsellDialogInfo, setUpsellDialogInfo] = useState<null | { examName: string; numQuestions: number; isTimed: boolean; topics?: string; }>(null);
    const [quizGenerationError, setQuizGenerationError] = useState<string | null>(null);
    const [limitReachedDialogInfo, setLimitReachedDialogInfo] = useState<string | null>(null);


    // Idle Timer State
    const [isIdleWarningVisible, setIsIdleWarningVisible] = useState(false);
    const [idleCountdown, setIdleCountdown] = useState(60);
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const isAdminImpersonating = sessionStorage.getItem('adminUser') !== null;


    const resetIdleTimer = useCallback(() => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
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
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
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

    useEffect(() => {
        setFollowUpAnswer('');
    }, [currentQuestionIndex]);

    const handleLogout = async () => {
        if (view === 'quiz') {
            await saveQuizProgress();
        }
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

        if (user.subscriptionTier === 'STARTER') {
            const remainingQuestions = user.monthlyQuestionRemaining ?? 0;
            const usage = user.monthlyExamUsage ?? {};
            const usageForThisExam = usage[examName] || 0;
            const usedExams = Object.keys(usage);
            const isNewExam = !usedExams.includes(examName);

            if (remainingQuestions <= 0) {
                setLimitReachedDialogInfo("You’ve used all 15 free questions for this month. Upgrade to continue practicing.");
                return;
            }
            if (usageForThisExam >= 5) {
                setLimitReachedDialogInfo("You’ve used your 5 free questions for this certification. Upgrade to keep practicing.");
                return;
            }
            if (isNewExam && usedExams.length >= 3) {
                setLimitReachedDialogInfo("You’ve reached your limit of 3 certifications for this month. Upgrade to explore more exams.");
                return;
            }

            const allowedQuestions = Math.min(
                5 - usageForThisExam,
                remainingQuestions
            );

            const finalNumQuestions = Math.min(numQuestions, allowedQuestions);

            const newUsage = { ...usage, [examName]: usageForThisExam + finalNumQuestions };
            const updatedUser = await api.updateUser(user.id, {
                monthlyQuestionRemaining: remainingQuestions - finalNumQuestions,
                monthlyExamUsage: newUsage
            });
            setUser(updatedUser);

            setQuizSettings({ examName, numQuestions: finalNumQuestions, isTimed: false, examMode: 'open', topics: topics?.trim() });
            startQuiz();
            return;
        }

        // Paid User Logic
        const isUnlocked = user.unlockedExams.includes(examName);
        if (!isUnlocked) {
            const maxUnlocks = user.subscriptionTier === 'PROFESSIONAL' ? 1 : 2;
            if (user.unlockedExams.length >= maxUnlocks) {
                setUpsellDialogInfo({ examName, numQuestions, isTimed, topics });
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
            const finalNumQuestions = Math.min(quizSettings.numQuestions, 170);

            const newQuestions = await api.generateQuiz({...quizSettings, numQuestions: finalNumQuestions});
            setQuestions(newQuestions);
            setCurrentQuestionIndex(0);
            setCurrentQuizAnswers(Array(newQuestions.length).fill(null).map(() => ({
                userAnswer: null,
                flagged: false,
                strikethroughOptions: [],
            })));
            setIsSimulationIntermission(false);
            setIsReviewing(false);
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
        setCurrentQuizAnswers(prev => {
            const newAnswers = [...prev];
            newAnswers[currentQuestionIndex] = {
                ...newAnswers[currentQuestionIndex],
                userAnswer: answer,
            };
            return newAnswers;
        });
    };
    
    const handleNavigate = (destination: 'next' | 'prev' | number) => {
        if (user?.subscriptionTier === 'STARTER' && currentQuestionIndex === 4 && destination === 'next') {
            setView('paywall');
            return;
        }

        if (destination === 'next') {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            }
        } else if (destination === 'prev') {
            if (currentQuestionIndex > 0) {
                setCurrentQuestionIndex(prev => prev - 1);
            }
        } else {
            if (destination >= 0 && destination < questions.length) {
                setCurrentQuestionIndex(destination);
            }
        }
        setIsReviewing(false);
    };

     const handleToggleFlag = () => {
        setCurrentQuizAnswers(prev => {
            const newAnswers = [...prev];
            newAnswers[currentQuestionIndex] = {
                ...newAnswers[currentQuestionIndex],
                flagged: !newAnswers[currentQuestionIndex].flagged,
            };
            return newAnswers;
        });
    };
    
    const handleToggleStrikethrough = (option: string) => {
        setCurrentQuizAnswers(prev => {
            const newAnswers = [...prev];
            const currentStrikethroughs = newAnswers[currentQuestionIndex].strikethroughOptions || [];
            if (currentStrikethroughs.includes(option)) {
                newAnswers[currentQuestionIndex].strikethroughOptions = currentStrikethroughs.filter(o => o !== option);
            } else {
                newAnswers[currentQuestionIndex].strikethroughOptions = [...currentStrikethroughs, option];
            }
            return newAnswers;
        });
    };


    const finishQuiz = async () => {
        if (!user) return;
        let score = 0;
        const userAnswers: UserAnswer[] = questions.map((q, index) => {
            const userAnswer = currentQuizAnswers[index]?.userAnswer || 'Not Answered';
            const isCorrect = userAnswer === q.answer;
            if (isCorrect) {
                score++;
            }
            return {
                question: q.question,
                options: q.options,
                answer: q.answer,
                userAnswer,
                isCorrect,
                category: q.category,
            };
        });

        const result: Omit<QuizResult, 'id'|'userId'> = {
            examName: quizSettings!.examName,
            score,
            totalQuestions: questions.length,
            percentage: (score / questions.length) * 100,
            date: Date.now(),
            userAnswers,
        };

        try {
            const savedResult = await api.saveQuizResult(user.id, result);
            setQuizResult(savedResult);
            // Clear in-progress quiz after successful save
            const updatedUser = await api.clearInProgressQuiz(user.id);
            setUser(updatedUser);
            setView('score');
        } catch (error) {
            console.error("Failed to save quiz result:", error);
            setError("Could not save your quiz result. Please try again.");
            // Don't clear progress if save fails
            setQuizResult({ ...result, id: `local_${Date.now()}`, userId: user.id }); // Show local result
            setView('score');
        }
    };
    
    const saveQuizProgress = async () => {
        if (!user || !quizSettings || questions.length === 0) return;

        const progress: InProgressQuizState = {
            questions,
            answers: currentQuizAnswers,
            currentQuestionIndex,
            quizSettings,
            startTime: Date.now(), // This could be improved to persist start time
            timeRemaining: 90 * questions.length, // This should persist actual time
            isSimulationIntermission,
        };
        try {
            const updatedUser = await api.saveInProgressQuiz(user.id, progress);
            setUser(updatedUser);
        } catch(error) {
            console.error("Failed to save progress:", error);
        }
    };

    const handleResumeQuiz = (progress: InProgressQuizState) => {
        setQuestions(progress.questions);
        setCurrentQuizAnswers(progress.answers);
        setCurrentQuestionIndex(progress.currentQuestionIndex);
        setQuizSettings(progress.quizSettings);
        setIsSimulationIntermission(progress.isSimulationIntermission);
        setView('quiz');
    };

    const handleAbandonQuiz = async () => {
        if (!user) return;
        if(window.confirm('Are you sure you want to abandon this quiz? Your progress will be lost.')) {
            try {
                const updatedUser = await api.clearInProgressQuiz(user.id);
                setUser(updatedUser);
            } catch(e) {
                console.error("Failed to abandon quiz:", e);
            }
        }
    };

    const handleAskFollowUp = async (question: Question, query: string) => {
        setIsFollowUpLoading(true);
        setFollowUpAnswer('');
        try {
            const answer = await api.generateFollowUp(question, query);
            setFollowUpAnswer(answer);
        } catch (err) {
            setFollowUpAnswer("Sorry, I couldn't get an answer for that. Please try again.");
        } finally {
            setIsFollowUpLoading(false);
        }
    };

    if (isLoading) {
        return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 space-y-4">
            <Logo className="h-40 w-auto" />
            <p className="text-gray-600 font-semibold">{loadingMessage}</p>
        </div>;
    }

    const renderHeader = () => (
        <header className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <Logo className="h-full w-auto" />
                    <div className="flex items-center gap-4">
                         {user && (
                            <span className="text-gray-600 font-medium hidden sm:block">
                                Welcome, <button onClick={() => setView('profile')} className="font-bold text-blue-600 hover:underline">{user.fullName || user.email}</button>
                            </span>
                         )}
                         {user && (user.role === 'ADMIN' || user.role === 'SUB_ADMIN') && (
                            <button onClick={() => setView('admin')} className="text-sm font-semibold text-yellow-600 hover:underline">Admin Panel</button>
                         )}
                         {user && !isAdminImpersonating && (
                            <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors">
                                LogOut
                            </button>
                         )}
                          {isAdminImpersonating && user && (
                            <button onClick={() => {
                                const adminUser = JSON.parse(sessionStorage.getItem('adminUser')!);
                                sessionStorage.removeItem('adminUser');
                                handleLoginSuccess(adminUser);
                            }} className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold">
                                Exit Impersonation
                            </button>
                          )}
                    </div>
                </div>
            </div>
        </header>
    );
    
    const MainContent = () => {
        if (view === 'login') return <Login onLoginSuccess={handleLoginSuccess} />;
        if (!user) return <Login onLoginSuccess={handleLoginSuccess} />;

        switch (view) {
            case 'home': return <HomePage user={user} onStartQuiz={initiateQuizFlow} onViewDashboard={() => setView('dashboard')} onViewProfile={() => setView('profile')} onViewAdmin={() => setView('admin')} onLogout={handleLogout} onUpgrade={() => setView('paywall')} onResumeQuiz={handleResumeQuiz} onAbandonQuiz={handleAbandonQuiz} />;
            case 'exam_mode_selection': return <ExamModeSelector examName={quizSettings!.examName} onSelectMode={(mode) => { setQuizSettings(prev => ({ ...prev!, examMode: mode })); setView('instructions'); }} onGoHome={goHome} />;
            case 'instructions': return <InstructionsModal examName={quizSettings!.examName} bodyOfKnowledge={api.getExamBodyOfKnowledge(quizSettings!.examName)} onStart={startQuiz} onCancel={() => setView('exam_mode_selection')} />
            case 'quiz': return <ExamScreen user={user} questions={questions} quizSettings={quizSettings!} currentIndex={currentQuestionIndex} answers={currentQuizAnswers} onSelectAnswer={handleSelectAnswer} onNavigate={handleNavigate} onToggleFlag={handleToggleFlag} onToggleStrikethrough={handleToggleStrikethrough} onSubmit={() => setIsReviewing(true)} onSaveAndExit={async (time) => { await saveQuizProgress(); goHome(); }} onAskFollowUp={handleAskFollowUp} followUpAnswer={followUpAnswer} isFollowUpLoading={isFollowUpLoading} />;
            case 'score': return <ScoreScreen result={quizResult!} onRestart={() => { if(quizSettings) setView('exam_mode_selection'); }} onGoHome={goHome} isPro={user.subscriptionTier !== 'STARTER'} onViewDashboard={() => setView('dashboard')} onRegenerate={startQuiz} />;
            case 'admin': return <AdminDashboard onGoHome={goHome} currentUser={user} onImpersonate={async (impersonatedUser) => { sessionStorage.setItem('adminUser', JSON.stringify(user)); handleLoginSuccess(impersonatedUser); }} />;
            case 'paywall': return <Paywall user={user} onUpgrade={async (tier) => { const fourMonths = 4 * 30.44 * 24 * 60 * 60 * 1000; await handleUpdateUser({ subscriptionTier: tier, subscriptionExpiresAt: Date.now() + fourMonths }); await api.logActivity(user.id, 'upgrade', `Upgraded to ${tier}`); goHome(); }} onCancel={goHome} />;
            case 'dashboard': return <Dashboard user={user} onGoHome={goHome} onStartWeaknessQuiz={(topics) => { const exam = user.unlockedExams[0] || 'API 510 - Pressure Vessel Inspector'; initiateQuizFlow(exam, 10, false, topics); }} onUpgrade={() => setView('paywall')} />;
            case 'profile': return <UserProfile user={user} onUpdateUser={handleUpdateUser} onGoHome={goHome} onViewDashboard={() => setView('dashboard')} onManageSubscription={() => setView('paywall')} />;
            default: return <div>Not Found</div>;
        }
    };


    return (
        <div onMouseMove={handleUserActivity} onKeyDown={handleUserActivity}>
            {view !== 'login' && renderHeader()}
            <main>
                <MainContent />
            </main>
            {pendingUnlock && (
                <ConfirmDialog
                    open={true}
                    title="Unlock Exam?"
                    message={pendingUnlock.message}
                    onCancel={() => setPendingUnlock(null)}
                    onConfirm={async () => {
                        const { examName, numQuestions, isTimed, topics } = pendingUnlock;
                        const updatedUser = await api.updateUser(user!.id, { unlockedExams: [...user!.unlockedExams, examName] });
                        setUser(updatedUser);
                        await api.logActivity(user!.id, 'unlock', `Unlocked exam: ${examName}.`);
                        setPendingUnlock(null);
                        setQuizSettings({ examName, numQuestions, isTimed, examMode: 'open', topics });
                        setView('exam_mode_selection');
                    }}
                />
            )}
             {upsellDialogInfo && (
                <InfoDialog
                    open={true}
                    title="All Exam Slots Used"
                    message="You have used all your available exam slots for your current plan."
                    buttons={[
                        { text: 'Unlock for $250', onClick: async () => {
                            const { examName, numQuestions, isTimed, topics } = upsellDialogInfo;
                            const updatedUser = await api.updateUser(user!.id, { unlockedExams: [...user!.unlockedExams, examName] });
                            setUser(updatedUser);
                            await api.logActivity(user!.id, 'one_time_unlock', `Unlocked additional exam for $250: ${examName}.`);
                            setUpsellDialogInfo(null);
                            setQuizSettings({ examName, numQuestions, isTimed, examMode: 'open', topics });
                            setView('exam_mode_selection');
                        }, style: 'primary' },
                        { text: 'View Upgrade Plans', onClick: () => { setUpsellDialogInfo(null); setView('paywall'); }, style: 'secondary' },
                        { text: 'Maybe Later', onClick: () => setUpsellDialogInfo(null), style: 'neutral' },
                    ]}
                />
            )}
             {quizGenerationError && (
                <InfoDialog
                    open={true}
                    title="Quiz Generation Failed"
                    message={quizGenerationError}
                    buttons={[
                        { text: 'Try Again', onClick: () => { setQuizGenerationError(null); startQuiz(); }, style: 'primary' },
                        { text: 'Contact Support', onClick: () => { setQuizGenerationError(null); alert('Please contact support at support@inspector.academy'); }, style: 'secondary' },
                        { text: 'Back to Home', onClick: () => { setQuizGenerationError(null); goHome(); }, style: 'neutral' },
                    ]}
                />
             )}
             {limitReachedDialogInfo && (
                <InfoDialog
                    open={true}
                    title="Free Limit Reached"
                    message={limitReachedDialogInfo}
                    buttons={[
                         { text: 'View Upgrade Options', onClick: () => { setLimitReachedDialogInfo(null); setView('paywall'); }, style: 'primary' },
                         { text: 'Maybe Later', onClick: () => setLimitReachedDialogInfo(null), style: 'neutral' },
                    ]}
                />
             )}
            {isReviewing && (
                <ReviewScreen
                    questions={questions}
                    answers={currentQuizAnswers}
                    onReviewQuestion={(index) => {
                        setCurrentQuestionIndex(index);
                        setIsReviewing(false);
                    }}
                    onFinalSubmit={finishQuiz}
                    onCancel={() => setIsReviewing(false)}
                />
            )}
             {isIdleWarningVisible && (
                <InfoDialog
                    open={true}
                    title="Are you still there?"
                    message={`Your session will automatically save and exit in ${idleCountdown} seconds due to inactivity.`}
                    buttons={[
                        { text: "I'm still here", onClick: handleUserActivity, style: 'primary' }
                    ]}
                />
            )}
        </div>
    );
};

export default App;