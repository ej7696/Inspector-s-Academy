import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
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
import { Question, QuizResult, User, UserAnswer, SubscriptionTier, InProgressQuizState } from './types';
import { examSourceData } from './services/examData';
import { getCurrentUser, logout as authLogout, updateCurrentUser } from './services/authService';
import { updateUser } from './services/userData';

type View = 'login' | 'home' | 'exam_mode_selection' | 'instructions' | 'quiz' | 'score' | 'dashboard' | 'paywall' | 'admin' | 'intermission';
export type QuizSettings = { examName: string, numQuestions: number, isTimed: boolean, examMode: 'open' | 'closed' | 'simulation', topics?: string };

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

    const quizStateForSave = {
        quizSettings, questions, currentQuestionIndex, userAnswers, timeLeft, simulationPhase, closedBookResults
    };

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
            setView('home');
        }
        setIsLoading(false);
        setLoadingMessage('');
    }, []);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (view === 'quiz' && questions.length > 0) {
                saveQuizProgress();
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [view, user, quizStateForSave]);


    useEffect(() => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
  
      if (timeLeft !== null && timeLeft > 0) {
        timerRef.current = window.setInterval(() => {
          setTimeLeft(prev => (prev !== null ? prev - 1 : null));
        }, 1000);
      } else if (timeLeft === 0) {
        handleFinishQuiz();
      }
  
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }, [timeLeft]);

    const saveQuizProgress = () => {
        if (view !== 'quiz' || !user || questions.length === 0) return;

        const inProgressQuiz: InProgressQuizState = {
            quizSettings: quizSettings!,
            questions,
            currentQuestionIndex,
            userAnswers,
            timeLeft,
            simulationPhase,
            closedBookResults,
        };
        const updatedUser = { ...user, inProgressQuiz };
        setUser(updatedUser);
        updateCurrentUser(updatedUser);
        updateUser(updatedUser);
    };

    const handleLoginSuccess = (loggedInUser: User) => {
        setUser(loggedInUser);
        setView('home');
    };

    const handleLogout = () => {
        if (view === 'quiz') saveQuizProgress();
        authLogout();
        setUser(null);
        setView('login');
    };
    
    const handleUpgradeSuccess = (tier: SubscriptionTier) => {
        if(user) {
            const FOUR_MONTHS_IN_MS = 120 * 24 * 60 * 60 * 1000;
            const updatedUser = { 
                ...user, 
                subscriptionTier: tier,
                subscriptionExpiresAt: Date.now() + FOUR_MONTHS_IN_MS,
                unlockedExams: [], // Reset unlocked exams on new subscription
            };
            setUser(updatedUser);
            updateCurrentUser(updatedUser);
            updateUser(updatedUser);
            setView('home');
        }
    }

    const initiateQuizFlow = (examName: string, numQuestions: number, isTimed: boolean, topics?: string) => {
        if (!user) return;

        const settings: QuizSettings = { examName, numQuestions, isTimed, examMode: 'open', topics };

        const proceedToQuiz = () => {
            setQuizSettings(settings);
            if (user.subscriptionTier === 'Cadet') {
                setView('instructions');
            } else {
                setView('exam_mode_selection');
            }
        };

        const isPaidUser = user.subscriptionTier !== 'Cadet';
        const isUnlocked = user.unlockedExams.includes(examName);

        if (isPaidUser && !isUnlocked) {
            const maxUnlocks = user.subscriptionTier === 'Professional' ? 1 : 2;
            if (user.unlockedExams.length >= maxUnlocks) {
                alert("You have no exam slots available. Upgrade your plan to unlock more exams.");
                setView('paywall');
                return;
            }

            const confirmUnlock = window.confirm(`You have ${maxUnlocks - user.unlockedExams.length} exam slot(s) available. Are you sure you want to use one to unlock '${examName}'? This choice is permanent for your subscription period.`);
            
            if (confirmUnlock) {
                const updatedUser = { ...user, unlockedExams: [...user.unlockedExams, examName] };
                setUser(updatedUser);
                updateCurrentUser(updatedUser);
                updateUser(updatedUser);
                proceedToQuiz();
            }
        } else {
            proceedToQuiz();
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
        const { examMode } = quizSettings;

        setError('');
        setIsLoading(true);
        setLoadingMessage('Generating your personalized mock exam with AI...');
        setView('quiz');

        let numQs = quizSettings.numQuestions;
        let phase: 'closed_book' | 'open_book' | null = null;
        let modeForPrompt = examMode;
        
        if (examMode === 'simulation') {
            numQs = Math.floor(quizSettings.numQuestions / 2);
            phase = 'closed_book';
            modeForPrompt = 'closed';
            setSimulationPhase('closed_book');
        } else {
            setSimulationPhase(null);
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            const examData = examSourceData[quizSettings.examName];
            if (!examData) throw new Error("Exam data not found for the selected certification.");
            
            const prompt = `
              You are an expert trainer for the "${quizSettings.examName}" certification.
              Generate ${numQs} unique, high-quality multiple-choice questions for a ${modeForPrompt} mock exam session.
              The questions must be strictly based on the following official source materials:
              
              EFFECTIVITY SHEET:
              ${examData.effectivitySheet}

              BODY OF KNOWLEDGE:
              ${examData.bodyOfKnowledge}

              For each question, provide:
              - A "question" text.
              - An array of four string "options".
              - The correct "answer" text, which must exactly match one of the options.
              - A "reference" string pointing to the exact section, paragraph, table, or figure (e.g., "API 653, Section 4.3.3.1, Paragraph 2").
              - A concise "explanation" (1-3 sentences).
              - A "category" string based on the Body of Knowledge.
              
              Adhere to a realistic blend for a ${modeForPrompt} session. For 'open' or 'simulation' modes, focus more on calculation and clause-lookup. For 'closed', focus on conceptual recall.
              
              ${quizSettings.topics ? `Focus specifically on these topics: ${quizSettings.topics}` : ''}
              
              Format the output as a JSON array of question objects.
            `;

            const response = await ai.models.generateContent({
              model: 'gemini-2.5-pro',
              contents: prompt,
              config: {
                responseMimeType: 'application/json'
              }
            });
            const text = response.text;
            const generatedQuestions = JSON.parse(text);
            
            if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
                throw new Error("AI did not return valid questions. Please try again.");
            }
            
            setQuestions(generatedQuestions);
            setCurrentQuestionIndex(0);
            setUserAnswers(new Array(generatedQuestions.length).fill(null));
            
            if (quizSettings.isTimed) {
                setTimeLeft(generatedQuestions.length * 90); // 90 seconds per question
            } else {
                setTimeLeft(null);
            }

        } catch (e: any) {
            setError(`Failed to generate quiz: ${e.message}. Please check your API key and try again.`);
            setView('home');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };
    
    const handleStartWeaknessQuiz = (topics: string) => {
        const settings: QuizSettings = {
            examName: "Targeted Practice",
            numQuestions: 10,
            isTimed: false,
            topics: topics,
            examMode: 'open' as const
        };
        setQuizSettings(settings);
        setView('exam_mode_selection');
    };

    const handleAnswerSelect = (answer: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = answer;
        setUserAnswers(newAnswers);
    };

    const handleNextQuestion = () => {
        // Implement the paywall for free users after the 5th question
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

    const handleFinishQuiz = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;

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

        let score = 0;
        const detailedAnswers: UserAnswer[] = finalQuestions.map((q, index) => {
            const userAnswer = finalUserAnswers[index];
            const isCorrect = userAnswer === q.answer;
            if (isCorrect) score++;
            return {
                question: q.question,
                options: q.options,
                answer: q.answer,
                userAnswer: userAnswer || 'Not answered',
                isCorrect,
                category: q.category,
                reference: q.reference,
                explanation: q.explanation
            };
        });

        const result: QuizResult = {
            id: new Date().toISOString(),
            examName: quizSettings?.examName || 'Quiz',
            score,
            totalQuestions: finalQuestions.length,
            percentage: (score / finalQuestions.length) * 100,
            date: Date.now(),
            userAnswers: detailedAnswers,
        };
        
        setQuizResult(result);
        
        if (user && user.subscriptionTier !== 'Cadet') {
            const updatedUser = { 
                ...user, 
                history: [...user.history, result],
                inProgressQuiz: null // Clear saved progress on finish
            };
            setUser(updatedUser);
            updateCurrentUser(updatedUser);
            updateUser(updatedUser);
        }
        
        setView('score');
        setSimulationPhase(null);
        setClosedBookResults(null);
    };

    const handleStartOpenBookPhase = () => {
        if (!quizSettings || !closedBookResults) return;
        const numOpenBookQs = quizSettings.numQuestions - closedBookResults.questions.length;
        
        const openBookSettings: QuizSettings = {
            ...quizSettings,
            numQuestions: numOpenBookQs,
        };
        setQuizSettings(openBookSettings);
        setSimulationPhase('open_book');
        startQuiz();
    };

    const handleResumeQuiz = () => {
        if (user && user.inProgressQuiz) {
            const {
                quizSettings: savedSettings,
                questions: savedQuestions,
                currentQuestionIndex: savedIndex,
                userAnswers: savedAnswers,
                timeLeft: savedTime,
                simulationPhase: savedPhase,
                closedBookResults: savedResults,
            } = user.inProgressQuiz;

            setQuizSettings(savedSettings);
            setQuestions(savedQuestions);
            setCurrentQuestionIndex(savedIndex);
            setUserAnswers(savedAnswers);
            setTimeLeft(savedTime);
            setSimulationPhase(savedPhase);
            setClosedBookResults(savedResults);
            
            setView('quiz');
        }
    };
    
    const handleAbandonQuiz = () => {
        if (user) {
            const updatedUser = { ...user, inProgressQuiz: null };
            setUser(updatedUser);
            updateCurrentUser(updatedUser);
            updateUser(updatedUser);
        }
    };


    const restartQuiz = () => {
        if (quizSettings) {
            startQuiz();
        }
    };

    const goHome = () => {
        if(view === 'quiz') saveQuizProgress();
        setView('home');
        setQuizResult(null);
        setQuestions([]);
        setUserAnswers([]);
        setCurrentQuestionIndex(0);
    };

    const handleAskFollowUp = async (question: Question, query: string) => {
        setFollowUpAnswer('');
        setIsFollowUpLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `
                CONTEXT: A user is taking a mock exam. They just answered the following question:
                Question: "${question.question}"
                Correct Answer: "${question.answer}"
                Explanation: "${question.explanation}"
                Reference: "${question.reference}"

                The user has a follow-up question. Answer it concisely (2-4 sentences) in your role as an expert tutor.
                USER'S QUESTION: "${query}"

                YOUR ANSWER:
            `;

            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt
            });
            setFollowUpAnswer(response.text);

        } catch (e: any) {
            setFollowUpAnswer(`Sorry, I couldn't get an answer for that. Error: ${e.message}`);
        } finally {
            setIsFollowUpLoading(false);
        }
    };

    if (isLoading && view !== 'quiz') {
        return <div className="min-h-screen flex items-center justify-center"><div className="text-xl font-semibold">{loadingMessage}</div></div>;
    }
    
    const renderHeader = () => {
        if(view === 'login') return null;
        return (
            <header className="bg-white shadow-md">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                         <div className="flex items-center">
                            <span className="font-bold text-xl text-gray-800">Inspector Academy Pro</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            {user && <span className="text-sm font-medium text-gray-600">Welcome, {user.email}</span>}
                            {(user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN') && view !== 'admin' && (
                                <button onClick={() => setView('admin')} className="text-sm font-semibold text-blue-600 hover:underline">Admin Panel</button>
                            )}
                            <button onClick={handleLogout} className="text-sm font-semibold text-gray-600 hover:underline">Logout</button>
                        </div>
                    </div>
                </nav>
                {(view === 'quiz' || view === 'intermission') && (
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                        {quizSettings?.isTimed && timeLeft !== null && (
                            <div className="text-center font-bold text-lg text-red-600">
                                TIME LEFT: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                            </div>
                        )}
                        <ProgressBar current={currentQuestionIndex + (closedBookResults?.questions.length || 0)} total={quizSettings?.numQuestions || 0} />
                    </div>
                )}
            </header>
        );
    }

    return (
        <div>
            {renderHeader()}
            <main>
                {view === 'login' && <Login onLoginSuccess={handleLoginSuccess} />}
                {view === 'home' && user && <HomePage user={user} onStartQuiz={initiateQuizFlow} onViewDashboard={() => setView('dashboard')} onUpgrade={() => setView('paywall')} onResumeQuiz={handleResumeQuiz} onAbandonQuiz={handleAbandonQuiz} />}
                {view === 'exam_mode_selection' && quizSettings && <ExamModeSelector examName={quizSettings.examName} onSelectMode={handleModeSelected} onGoHome={goHome}/>}
                {view === 'instructions' && quizSettings && (
                    <InstructionsModal
                        examName={quizSettings.examName}
                        bodyOfKnowledge={examSourceData[quizSettings.examName]?.bodyOfKnowledge || 'No specific instructions available.'}
                        onStart={startQuiz}
                        onCancel={() => user?.subscriptionTier === 'Cadet' ? goHome() : setView('exam_mode_selection')}
                    />
                )}
                {view === 'quiz' && isLoading && (
                     <div className="min-h-screen flex flex-col items-center justify-center">
                        <div className="text-xl font-semibold mb-4">{loadingMessage}</div>
                        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-600"></div>
                    </div>
                )}
                {view === 'quiz' && !isLoading && questions.length > 0 && (
                    <div className="max-w-4xl mx-auto py-8 px-4">
                        <QuestionCard
                            questionNum={currentQuestionIndex + 1 + (closedBookResults?.questions.length || 0)}
                            totalQuestions={quizSettings?.numQuestions || 0}
                            question={questions[currentQuestionIndex]}
                            onSelectAnswer={handleAnswerSelect}
                            selectedAnswer={userAnswers[currentQuestionIndex]}
                            onNext={handleNextQuestion}
                            isLastQuestion={currentQuestionIndex === questions.length - 1}
                            isSimulationClosedBook={simulationPhase === 'closed_book'}
                            isPro={user?.subscriptionTier !== 'Cadet'}
                            onAskFollowUp={handleAskFollowUp}
                            followUpAnswer={followUpAnswer}
                            isFollowUpLoading={isFollowUpLoading}
                        />
                    </div>
                )}
                {view === 'intermission' && (
                    <div className="max-w-2xl mx-auto my-10 p-8 text-center bg-white rounded-lg shadow-xl">
                        <h1 className="text-2xl font-bold text-gray-800 mb-4">Closed Book Session Complete</h1>
                        <p className="text-gray-600 mb-6">Take a moment to prepare for the timed open book session. You will be tested on your ability to navigate the code books.</p>
                        <button onClick={handleStartOpenBookPhase} className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-colors">
                            Start Open Book Session
                        </button>
                    </div>
                )}
                {view === 'score' && quizResult && <ScoreScreen result={quizResult} onRestart={restartQuiz} onGoHome={goHome} isPro={user?.subscriptionTier !== 'Cadet'} onViewDashboard={() => setView('dashboard')} />}
                {view === 'dashboard' && user && <Dashboard history={user.history} onGoHome={goHome} onStartWeaknessQuiz={handleStartWeaknessQuiz} />}
                {view === 'admin' && user && <AdminDashboard currentUser={user} onGoHome={goHome} />}
                {view === 'paywall' && <Paywall onUpgrade={handleUpgradeSuccess} onCancel={goHome} />}
                 {error && (
                    <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;