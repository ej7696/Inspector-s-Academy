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

        // For STARTER plan, the quiz length is always 5, consistent with the plan's features.
        const finalNumQuestions = user.subscriptionTier === 'STARTER' ? 5 : numQuestions;

        const isPaidUser = user.subscriptionTier !== 'STARTER';
        const isUnlocked = user.unlockedExams.includes(examName);

        if (isPaidUser && !isUnlocked) {
            const maxUnlocks = user.subscriptionTier === 'PROFESSIONAL' ? 1 : 2;
            if (user.unlockedExams.length >= maxUnlocks) {
                setUpsellDialogInfo({ examName, numQuestions: finalNumQuestions, isTimed, topics });
                return;
            }

            setPendingUnlock({
                examName,
                message: `You have ${maxUnlocks - user.unlockedExams.length} exam slot(s) available. Do you want to use one to unlock "${examName}"? This choice is permanent for your subscription period.`,
                numQuestions: finalNumQuestions,
                isTimed,
                topics
            });
            return;
        }

        // For STARTER users OR paid users with unlocked exams
        setQuizSettings({ examName, numQuestions: finalNumQuestions, isTimed, examMode: 'open', topics: topics?.trim() });
        
        if (user.subscriptionTier === 'STARTER') {
            // Bypass mode selection for a seamless free preview start
            startQuiz();
        } else {
            setView('exam_mode_selection');
        }
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
        if (user?.subscriptionTier === 'STARTER' && currentQuestionIndex >= 4) {
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
    };

    const handleToggleFlag = () => {
        setCurrentQuizAnswers(prev => {
            const newAnswers = [...prev];
            const currentAnswerState = newAnswers[currentQuestionIndex] || { userAnswer: null, flagged: false, strikethroughOptions: [] };
            newAnswers[currentQuestionIndex] = {
                ...currentAnswerState,
                flagged: !currentAnswerState.flagged,
            };
            return newAnswers;
        });
    };
    
    const handleToggleStrikethrough = (option: string) => {
         setCurrentQuizAnswers(prev => {
            const newAnswers = [...prev];
            const currentAnswer = newAnswers[currentQuestionIndex];
            const currentStrikethroughs = currentAnswer.strikethroughOptions || [];
            
            if (currentStrikethroughs.includes(option)) {
                 currentAnswer.strikethroughOptions = currentStrikethroughs.filter(item => item !== option);
            } else {
                 currentAnswer.strikethroughOptions = [...currentStrikethroughs, option];
            }
            return newAnswers;
        });
    };

    const handleAskFollowUp = async (question: Question, query: string) => {
        setIsFollowUpLoading(true);
        setFollowUpAnswer('');
        try {
            const answer = await api.generateFollowUp(question, query);
            setFollowUpAnswer(answer);
        } catch (err) {
            console.error("Follow-up failed:", err);
            setFollowUpAnswer("Sorry, I couldn't get an answer for that. Please try again.");
        } finally {
            setIsFollowUpLoading(false);
        }
    };

    const finishQuiz = async () => {
        if (!user || !quizSettings) return;
        let finalAnswers = currentQuizAnswers;
        
        const finalUserAnswers: UserAnswer[] = questions.map((q, i) => ({
            question: q.question,
            options: q.options,
            answer: q.answer,
            userAnswer: finalAnswers[i]?.userAnswer || 'Not Answered',
            isCorrect: finalAnswers[i]?.userAnswer === q.answer,
            category: q.category
        }));

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
                isTimed: false,
                examMode: 'open' as const
            };
            setQuizSettings(previousSettings);
            startQuiz();
        }
    };
    
    const saveQuizProgress = async (time?: number) => {
        if (view !== 'quiz' || !user || !quizSettings || questions.length === 0) return;
        
        const progress: InProgressQuizState = {
            questions,
            answers: currentQuizAnswers,
            currentQuestionIndex,
            quizSettings,
            startTime: Date.now(),
            timeRemaining: time || 0,
            isSimulationIntermission,
        };
        try {
            const updatedUser = await api.saveInProgressQuiz(user.id, progress);
            setUser(updatedUser);
        } catch (error) {
            console.error("Failed to save progress:", error);
        }
    };
    
    const handleResumeQuiz = (progress: InProgressQuizState) => {
        setQuizSettings(progress.quizSettings);
        setQuestions(progress.questions);
        setCurrentQuizAnswers(progress.answers);
        setCurrentQuestionIndex(progress.currentQuestionIndex);
        setIsSimulationIntermission(progress.isSimulationIntermission);
        setIsReviewing(false);
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
    
    const impersonateUser = async (targetUser: User) => {
        const adminUser = user;
        if (!adminUser) return;
        sessionStorage.setItem('adminUser', JSON.stringify(adminUser));
        try {
            const impersonatedUser = await api.login(targetUser.email, targetUser.password!);
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

    const handleSaveAndExit = async (time: number) => {
        await saveQuizProgress(time);
        goHome();
    };

    const handleOneTimeUnlock = async () => {
        if (!user || !upsellDialogInfo) return;

        const { examName, numQuestions, isTimed, topics } = upsellDialogInfo;
        
        try {
            const updatedUser = await api.updateUser(user.id, { unlockedExams: [...user.unlockedExams, examName] });
            setUser(updatedUser);
            await api.logActivity(user.id, 'one_time_unlock', `Purchased one-time access to "${examName}" for $250.`);
            
            setUpsellDialogInfo(null);
            
            setQuizSettings({ examName, numQuestions, isTimed, examMode: 'open', topics });
            setView('exam_mode_selection');
        } catch (error) {
            console.error("One-time unlock failed:", error);
            setError("There was an issue unlocking the exam. Please try again.");
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
                    <Logo className="h-32 w-auto mb-4" />
                    <div className="text-xl font-semibold text-gray-700">{loadingMessage}</div>
                    <div className="mt-4 w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 animate-pulse w-full"></div>
                    </div>
                </div>
            );
        }

        switch (view) {
            case 'login':
                return <Login onLoginSuccess={handleLoginSuccess} />;
            case 'home':
                return user && <HomePage 
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
            case 'quiz':
                if (quizSettings && questions.length > 0 && user) {
                    if (isReviewing) {
                        return <ReviewScreen 
                            questions={questions}
                            answers={currentQuizAnswers}
                            onReviewQuestion={(index) => {
                                setCurrentQuestionIndex(index);
                                setIsReviewing(false);
                            }}
                            onFinalSubmit={() => {
                                // You might want a confirmation dialog here
                                finishQuiz();
                            }}
                            onCancel={() => setIsReviewing(false)}
                        />;
                    }
                    return <ExamScreen
                        user={user}
                        questions={questions}
                        quizSettings={quizSettings}
                        currentIndex={currentQuestionIndex}
                        answers={currentQuizAnswers}
                        onSelectAnswer={handleSelectAnswer}
                        onNavigate={handleNavigate}
                        onToggleFlag={handleToggleFlag}
                        onToggleStrikethrough={handleToggleStrikethrough}
                        onSubmit={() => setIsReviewing(true)}
                        onSaveAndExit={handleSaveAndExit}
                        onAskFollowUp={handleAskFollowUp}
                        followUpAnswer={followUpAnswer}
                        isFollowUpLoading={isFollowUpLoading}
                    />;
                }
                return <div>Error: Quiz not loaded correctly. <button onClick={goHome}>Go Home</button></div>;
            case 'score':
                return quizResult && <ScoreScreen 
                    result={quizResult} 
                    onRestart={restartQuiz}
                    onGoHome={goHome}
                    isPro={user?.subscriptionTier !== 'STARTER'}
                    onViewDashboard={() => setView('dashboard')}
                    onRegenerate={() => initiateQuizFlow(quizResult.examName, 120, true)}
                />;
            case 'admin':
                return user && <AdminDashboard 
                    currentUser={user}
                    onGoHome={goHome}
                    onImpersonate={impersonateUser}
                />;
            case 'paywall':
                return user && <Paywall
                    user={user}
                    onUpgrade={async (tier) => {
                        await handleUpdateUser({ subscriptionTier: tier, subscriptionExpiresAt: Date.now() + 4 * 30 * 24 * 60 * 60 * 1000 });
                        await api.logActivity(user.id, 'upgrade', `Upgraded to ${tier} plan.`);
                        setView('home');
                    }}
                    onCancel={goHome} 
                />;
            case 'dashboard':
                return user && <Dashboard 
                    user={user} 
                    onGoHome={goHome} 
                    onStartWeaknessQuiz={(topics) => {
                      const examName = user.unlockedExams[0] || 'API 510 - Pressure Vessel Inspector';
                      initiateQuizFlow(examName, 10, false, topics);
                    }}
                    onUpgrade={() => setView('paywall')}
                />;
            case 'profile':
                return user && <UserProfile
                    user={user}
                    onUpdateUser={handleUpdateUser}
                    onGoHome={goHome}
                    onViewDashboard={() => setView('dashboard')}
                    onManageSubscription={() => setView('paywall')}
                />;
            case 'exam_mode_selection':
                return quizSettings && <ExamModeSelector 
                    examName={quizSettings.examName} 
                    onSelectMode={(mode) => {
                        setQuizSettings(prev => ({ ...prev!, examMode: mode }));
                        setView('instructions');
                    }} 
                    onGoHome={goHome} 
                />;
            case 'instructions':
                return quizSettings && <InstructionsModal 
                    examName={quizSettings.examName}
                    bodyOfKnowledge={api.getExamBodyOfKnowledge(quizSettings.examName)}
                    onStart={startQuiz}
                    onCancel={() => setView('exam_mode_selection')}
                />;
            default:
                return <div>Invalid view state.</div>;
        }
    };

    return (
        <div className="App" onMouseMove={handleUserActivity} onKeyDown={handleUserActivity}>
            {isAdminImpersonating && (
                <div className="bg-yellow-400 text-black text-center p-2 font-semibold">
                    You are impersonating a user. <button onClick={stopImpersonating} className="underline font-bold">Return to Admin</button>
                </div>
            )}
            {renderContent()}
            {pendingUnlock && (
                <ConfirmDialog
                    open={true}
                    title="Unlock New Exam?"
                    message={pendingUnlock.message}
                    onCancel={() => setPendingUnlock(null)}
                    onConfirm={async () => {
                        if (user) {
                           const updatedUser = await api.updateUser(user.id, { unlockedExams: [...user.unlockedExams, pendingUnlock.examName] });
                           setUser(updatedUser);
                           await api.logActivity(user.id, 'unlock', `Unlocked exam: ${pendingUnlock.examName}`);
                           setQuizSettings({ examName: pendingUnlock.examName, numQuestions: pendingUnlock.numQuestions, isTimed: pendingUnlock.isTimed, examMode: 'open', topics: pendingUnlock.topics });
                           setPendingUnlock(null);
                           setView('exam_mode_selection');
                        }
                    }}
                />
            )}
            {upsellDialogInfo && (
                <InfoDialog
                    open={true}
                    title="Exam Slot Limit Reached"
                    message={`You have used all your available exam slots. You can purchase one-time access to "${upsellDialogInfo.examName}" to continue.`}
                    buttons={[
                        { text: 'Unlock Now for $250', onClick: handleOneTimeUnlock, style: 'primary' },
                        { text: 'Back to Homepage', onClick: () => { setUpsellDialogInfo(null); goHome(); }, style: 'neutral' }
                    ]}
                />
            )}
            {quizGenerationError && (
                 <InfoDialog
                    open={true}
                    title="Quiz Generation Failed"
                    message={`There was an error creating your quiz: ${quizGenerationError}. Please try again.`}
                    buttons={[
                        { text: 'Try Again', onClick: () => { setQuizGenerationError(null); startQuiz(); }, style: 'primary' },
                        { text: 'Back to Home', onClick: () => { setQuizGenerationError(null); goHome(); }, style: 'neutral' }
                    ]}
                />
            )}
            {isIdleWarningVisible && (
                <InfoDialog
                    open={true}
                    title="Are you still there?"
                    message={`Your session will automatically be saved and you will be returned to the homepage in ${idleCountdown} seconds due to inactivity.`}
                    buttons={[
                        { text: "I'm still here", onClick: handleUserActivity, style: 'primary' },
                    ]}
                />
            )}
        </div>
    );
};

export default App;