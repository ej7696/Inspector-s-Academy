import React, { useState, useEffect, useRef } from 'react';
import HomePage from './components/HomePage';
import QuestionCard from './components/QuestionCard';
import ScoreScreen from './components/ScoreScreen';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Paywall from './components/Paywall';
import AdminDashboard from './components/AdminDashboard';
import ProgressBar from './components/ProgressBar';
import ExamModeSelector from './components/ExamModeSelector';
import InstructionsModal from './components/InstructionsModal';
import ConfirmDialog from './components/ConfirmDialog';
import Logo from './components/Logo';
import UserProfile from './components/UserProfile';
import api from './services/apiService';
import { Question, QuizResult, User, UserAnswer, SubscriptionTier, InProgressQuizState, QuizSettings } from './types';
import { examSourceData } from './services/examData';
import InfoDialog from './components/InfoDialog';


type View = 'login' | 'home' | 'exam_mode_selection' | 'instructions' | 'quiz' | 'score' | 'dashboard' | 'paywall' | 'admin' | 'intermission' | 'profile';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [view, setView] = useState<View>('login');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
    const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Checking session...');
    const [error, setError] = useState('');
    const [quizSettings, setQuizSettings] = useState<QuizSettings | null>(null);
    
    const [simulationPhase, setSimulationPhase] = useState<'closed_book' | 'open_book' | null>(null);
    const [closedBookResults, setClosedBookResults] = useState<{ questions: Question[], userAnswers: (string|null)[] } | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const timerRef = useRef<number | null>(null);
    const [followUpAnswer, setFollowUpAnswer] = useState<string>('');
    const [isFollowUpLoading, setIsFollowUpLoading] = useState<boolean>(false);
    
    const [pendingUnlock, setPendingUnlock] = useState<null | {
      examName: string;
      message: string;
      numQuestions: number;
      isTimed: boolean;
      topics?: string;
    }>(null);
    
    const [slotLimitInfo, setSlotLimitInfo] = useState<null | {
        examName: string;
        numQuestions: number;
        isTimed: boolean;
        topics?: string;
    }>(null);

    useEffect(() => {
        const checkSession = async () => {
            const currentUser = await api.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                setView('home');
            }
            setIsLoading(false);
            setLoadingMessage('');
        };
        checkSession();
    }, []);

    const quizStateForSave: InProgressQuizState | null = quizSettings ? {
        quizSettings, questions, currentQuestionIndex, userAnswers, timeLeft, simulationPhase, closedBookResults
    } : null;

    useEffect(() => {
        const handleBeforeUnload = () => {
            if (view === 'quiz' && questions.length > 0) {
                saveQuizProgress();
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [view, user, quizStateForSave]);


    useEffect(() => {
      if (timerRef.current) clearInterval(timerRef.current);
  
      if (timeLeft !== null && timeLeft > 0) {
        timerRef.current = window.setInterval(() => {
          setTimeLeft(prev => (prev !== null ? prev - 1 : null));
        }, 1000);
      } else if (timeLeft === 0) {
        handleFinishQuiz();
      }
  
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [timeLeft]);

    const saveQuizProgress = async () => {
        if (view !== 'quiz' || !user || !quizStateForSave) return;
        try {
            const updatedUser = { ...user, inProgressQuiz: quizStateForSave };
            await api.updateUser(updatedUser);
            await api.updateCurrentUserSession(updatedUser);
            setUser(updatedUser);
        } catch (e) { console.error("Failed to save progress:", e); }
    };

    const handleLoginSuccess = (loggedInUser: User) => {
        setUser(loggedInUser);
        setView('home');
    };

    const handleLogout = async () => {
        if (view === 'quiz') await saveQuizProgress();
        await api.logout();
        setUser(null);
        setView('login');
    };
    
    const handleUpgradeSuccess = async (tier: SubscriptionTier) => {
        if(user) {
            const FOUR_MONTHS_IN_MS = 120 * 24 * 60 * 60 * 1000;
            const updatedUser = { ...user, subscriptionTier: tier, subscriptionExpiresAt: Date.now() + FOUR_MONTHS_IN_MS, unlockedExams: [] };
            await handleUpdateUser(updatedUser);
            await api.logActivity(user.email, `upgraded to the ${tier} plan.`, 'upgrade');
            setView('home');
        }
    }

    const initiateQuizFlow = (examName: string, numQuestions: number, isTimed: boolean, topics?: string) => {
        if (!user) return;
        const settings: QuizSettings = { examName, numQuestions, isTimed, examMode: 'open', topics };
        const isPaidUser = user.subscriptionTier !== 'Cadet';
        const isUnlocked = user.unlockedExams.includes(examName);
    
        if (isPaidUser && !isUnlocked) {
          const maxUnlocks = user.subscriptionTier === 'Professional' ? 1 : 2;
          if (user.unlockedExams.length >= maxUnlocks) {
            setSlotLimitInfo({ examName, numQuestions, isTimed, topics });
            return;
          }
          setPendingUnlock({ examName, message: `You have ${maxUnlocks - user.unlockedExams.length} exam slot(s) available. Do you want to use one to unlock "${examName}"? This choice is permanent for your subscription period.`, numQuestions, isTimed, topics });
        } else {
            setQuizSettings(settings);
            if (user.subscriptionTier === 'Cadet') setView('instructions');
            else setView('exam_mode_selection');
        }
    };

    const handleModeSelected = (mode: 'open' | 'closed' | 'simulation') => {
        if (quizSettings) {
            setQuizSettings(prev => ({...prev!, examMode: mode}));
            setView('instructions');
        }
    }

    const startQuiz = async () => {
        if (!quizSettings) return;

        setError('');
        setIsLoading(true);
        setLoadingMessage('Generating your personalized mock exam...');
        setView('quiz');
        
        if (quizSettings.examMode === 'simulation') {
            setSimulationPhase('closed_book');
        } else {
            setSimulationPhase(null);
        }

        try {
            const generatedQuestions = await api.generateQuiz(quizSettings);
            setQuestions(generatedQuestions);
            setCurrentQuestionIndex(0);
            setUserAnswers(new Array(generatedQuestions.length).fill(null));
            if (quizSettings.isTimed) setTimeLeft(generatedQuestions.length * 90);
            else setTimeLeft(null);

        } catch (e: any) {
            setError(`Failed to generate quiz: ${e.message}. Please try again.`);
            setView('home');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };
    
    const handleStartWeaknessQuiz = (topics: string) => {
        const settings: QuizSettings = { examName: "Targeted Practice", numQuestions: 10, isTimed: false, topics: topics, examMode: 'open' as const };
        setQuizSettings(settings);
        setView('exam_mode_selection');
    };

    const handleAnswerSelect = (answer: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = answer;
        setUserAnswers(newAnswers);
    };

    const handleNextQuestion = () => {
        if (user?.subscriptionTier === 'Cadet' && currentQuestionIndex === 4) {
            setView('paywall');
            return;
        }
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setFollowUpAnswer('');
        } else {
            handleFinishQuiz();
        }
    };

    const handleFinishQuiz = async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (simulationPhase === 'closed_book') {
            setClosedBookResults({ questions, userAnswers });
            setView('intermission');
            return;
        }

        let finalQuestions = questions;
        let finalUserAnswers = userAnswers;
        if (simulationPhase === 'open_book' && closedBookResults) {
            finalQuestions = [...closedBookResults.questions, ...questions];
            finalUserAnswers = [...closedBookResults.userAnswers, ...userAnswers];
        }

        const score = finalUserAnswers.reduce((acc, ua, i) => acc + (ua === finalQuestions[i].answer ? 1 : 0), 0);
        const detailedAnswers: UserAnswer[] = finalQuestions.map((q, i) => ({ question: q.question, options: q.options, answer: q.answer, userAnswer: finalUserAnswers[i] || 'Not answered', isCorrect: finalUserAnswers[i] === q.answer, category: q.category, reference: q.reference, explanation: q.explanation }));

        const result: QuizResult = { id: new Date().toISOString(), examName: quizSettings?.examName || 'Quiz', score, totalQuestions: finalQuestions.length, percentage: (score / finalQuestions.length) * 100, date: Date.now(), userAnswers: detailedAnswers };
        setQuizResult(result);
        
        if (user && user.subscriptionTier !== 'Cadet') {
            const updatedUser = { ...user, history: [...user.history, result], inProgressQuiz: null };
            await handleUpdateUser(updatedUser);
            const message = `finished the "${result.examName}" exam with ${result.percentage.toFixed(1)}%.`;
            await api.logActivity(user.email, message, 'quiz_completion');
        }
        setView('score');
    };

    const restartQuiz = () => { if (quizSettings) startQuiz(); };
    const goHome = () => {
        setQuizSettings(null);
        setQuizResult(null);
        setQuestions([]);
        setView('home');
    };
    
    const proceedFromIntermission = async () => {
        if (!quizSettings || !closedBookResults) return;
        setError('');
        setIsLoading(true);
        setLoadingMessage('Generating Open Book portion...');
        setView('quiz');
        setSimulationPhase('open_book');

        try {
            const openBookSettings: QuizSettings = { ...quizSettings, examMode: 'open', numQuestions: quizSettings.numQuestions - closedBookResults.questions.length };
            const generatedQuestions = await api.generateQuiz(openBookSettings);
            
            setQuestions(generatedQuestions);
            setCurrentQuestionIndex(0);
            setUserAnswers(new Array(generatedQuestions.length).fill(null));
            
            if (quizSettings.isTimed) {
                const newTime = (timeLeft || 0) + (generatedQuestions.length * 90);
                setTimeLeft(newTime > 0 ? newTime : generatedQuestions.length * 90);
            }

        } catch (e: any) {
            setError(`Failed to generate open book quiz: ${e.message}.`);
            setView('home');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleResumeQuiz = () => {
        if (!user?.inProgressQuiz) return;
        const saved = user.inProgressQuiz;
        setQuizSettings(saved.quizSettings);
        setQuestions(saved.questions);
        setCurrentQuestionIndex(saved.currentQuestionIndex);
        setUserAnswers(saved.userAnswers);
        setTimeLeft(saved.timeLeft);
        setSimulationPhase(saved.simulationPhase);
        setClosedBookResults(saved.closedBookResults);
        setView('quiz');
    };

    const handleAbandonQuiz = async () => {
        if (!user) return;
        const updatedUser = { ...user, inProgressQuiz: null };
        await handleUpdateUser(updatedUser);
    };
    
    const handleAskFollowUp = async (question: Question, query: string) => {
        setIsFollowUpLoading(true);
        setFollowUpAnswer('');
        try {
            const answer = await api.generateFollowUp(question, query);
            setFollowUpAnswer(answer);
        } catch (e: any) {
            setFollowUpAnswer(`Sorry, I couldn't get an answer for that. Error: ${e.message}`);
        } finally {
            setIsFollowUpLoading(false);
        }
    };
    
    const handleUpdateUser = async (updatedFields: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...updatedFields };
        const savedUser = await api.updateUser(updatedUser);
        await api.updateCurrentUserSession(savedUser);
        setUser(savedUser);
    };

    const onConfirmUnlock = async () => {
        if (!pendingUnlock || !user) return;
        const { examName, numQuestions, isTimed, topics } = pendingUnlock;
        const updatedUser = { ...user, unlockedExams: [...user.unlockedExams, examName] };
        
        await handleUpdateUser(updatedUser);
        await api.logActivity(user.email, `unlocked the "${examName}" exam.`, 'exam_unlock');

        setPendingUnlock(null);
        setQuizSettings({ examName, numQuestions, isTimed, examMode: 'open', topics });
        setView('exam_mode_selection');
    }

    const handleOneTimeUnlock = async () => {
        if (!slotLimitInfo || !user) return;
        const { examName, numQuestions, isTimed, topics } = slotLimitInfo;

        const updatedUser = { ...user, unlockedExams: [...user.unlockedExams, examName] };
        await handleUpdateUser(updatedUser);
        await api.logActivity(user.email, `purchased and unlocked the "${examName}" exam for $250.`, 'one_time_unlock');

        setSlotLimitInfo(null);
        setQuizSettings({ examName, numQuestions, isTimed, examMode: 'open', topics });
        setView('exam_mode_selection');
    };

    return (
        <main className="container mx-auto p-4">
            {view !== 'login' && (
              <header className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b gap-4">
                  <Logo className="h-24 w-auto"/>
                  {user && (
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                          <div className="text-center sm:text-right">
                            <span className="text-gray-600">Welcome, {user.email} ({user.subscriptionTier})</span>
                            <button onClick={() => setView('profile')} className="font-semibold text-blue-600 hover:underline ml-2">(Profile)</button>
                          </div>
                          <div className="flex gap-4">
                              {user.role !== 'USER' && <button onClick={() => setView('admin')} className="font-semibold text-indigo-600 hover:underline">Admin Panel</button>}
                              <button onClick={handleLogout} className="font-semibold text-blue-600 hover:underline">Logout</button>
                          </div>
                      </div>
                  )}
              </header>
            )}

            {isLoading && (<div className="text-center p-10"><p className="text-xl font-semibold text-gray-700">{loadingMessage}</p><div className="mt-4 w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin mx-auto"></div></div>)}
            {!isLoading && error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">{error}</div>}

            {!isLoading && !error && (
                <>
                    {view === 'login' && <Login onLoginSuccess={handleLoginSuccess} />}
                    {view === 'home' && user && (<HomePage user={user} onStartQuiz={initiateQuizFlow} onViewDashboard={() => setView('dashboard')} onUpgrade={() => setView('paywall')} onResumeQuiz={handleResumeQuiz} onAbandonQuiz={handleAbandonQuiz} />)}
                    {view === 'exam_mode_selection' && quizSettings && (<ExamModeSelector examName={quizSettings.examName} onSelectMode={handleModeSelected} onGoHome={goHome} />)}
                    {view === 'instructions' && quizSettings && (<InstructionsModal examName={quizSettings.examName} bodyOfKnowledge={examSourceData[quizSettings.examName]?.bodyOfKnowledge || "No details available."} onStart={startQuiz} onCancel={() => user?.subscriptionTier === 'Cadet' ? goHome() : setView('exam_mode_selection')} />)}
                    {view === 'quiz' && questions.length > 0 && quizSettings && user && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold">{quizSettings.examName} ({simulationPhase ? simulationPhase.replace('_', ' ') : quizSettings.examMode} mode)</h2>
                                {timeLeft !== null && (<div className="text-lg font-semibold bg-gray-200 px-4 py-2 rounded-lg">Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>)}
                            </div>
                            <ProgressBar current={currentQuestionIndex + 1} total={questions.length} />
                            <QuestionCard questionNum={currentQuestionIndex + 1} totalQuestions={questions.length} question={questions[currentQuestionIndex]} onSelectAnswer={handleAnswerSelect} selectedAnswer={userAnswers[currentQuestionIndex]} onNext={handleNextQuestion} isLastQuestion={currentQuestionIndex === questions.length - 1} isSimulationClosedBook={simulationPhase === 'closed_book'} isPro={user.subscriptionTier !== 'Cadet'} onAskFollowUp={handleAskFollowUp} followUpAnswer={followUpAnswer} isFollowUpLoading={isFollowUpLoading} onGoHome={() => { saveQuizProgress(); setView('home'); }} />
                        </div>
                    )}
                    {view === 'intermission' && (<div className="max-w-2xl mx-auto my-10 p-8 bg-white rounded-lg shadow-xl text-center"><h2 className="text-2xl font-bold text-gray-800 mb-2">Closed Book Section Complete</h2><p className="text-gray-600 mb-6">You will now proceed to the open book section of the exam.</p><button onClick={proceedFromIntermission} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700">Start Open Book Section</button></div>)}
                    {view === 'score' && quizResult && user && (<ScoreScreen result={quizResult} onRestart={restartQuiz} onGoHome={goHome} isPro={user.subscriptionTier !== 'Cadet'} onViewDashboard={() => setView('dashboard')} onRegenerate={() => { if (quizSettings) startQuiz(); }} />)}
                    {view === 'dashboard' && user && (<Dashboard history={user.history} onGoHome={goHome} onStartWeaknessQuiz={handleStartWeaknessQuiz} />)}
                    {view === 'profile' && user && (<UserProfile user={user} onGoHome={goHome} onUpdateUser={handleUpdateUser} onViewDashboard={() => setView('dashboard')} onManageSubscription={() => setView('paywall')} />)}
                    {view === 'paywall' && user && <Paywall user={user} onUpgrade={handleUpgradeSuccess} onCancel={() => setView('home')} />}
                    {view === 'admin' && user && ((user.role === 'ADMIN' || user.role === 'SUB_ADMIN') ? (<AdminDashboard currentUser={user} onGoHome={goHome} />) : (<HomePage user={user} onStartQuiz={initiateQuizFlow} onViewDashboard={() => setView('dashboard')} onUpgrade={() => setView('paywall')} onResumeQuiz={handleResumeQuiz} onAbandonQuiz={handleAbandonQuiz} />))}
                </>
            )}
            
            {pendingUnlock && user && (<ConfirmDialog open={true} title="Unlock Exam?" message={pendingUnlock.message} onCancel={() => setPendingUnlock(null)} onConfirm={onConfirmUnlock} />)}
            {slotLimitInfo && (
                <InfoDialog
                    open={true}
                    title="Exam Slot Limit Reached"
                    message="You have used all available exam slots for your plan. You can unlock this single exam for a one-time fee of $250, or upgrade your plan for more benefits."
                    buttons={[
                        { text: 'Unlock for $250', onClick: handleOneTimeUnlock, style: 'primary' },
                        { text: 'Upgrade Plan', onClick: () => { setSlotLimitInfo(null); setView('paywall'); }, style: 'secondary' },
                        { text: 'Maybe Later', onClick: () => setSlotLimitInfo(null), style: 'neutral' },
                    ]}
                />
            )}
        </main>
    );
};

export default App;