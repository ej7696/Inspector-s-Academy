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
import ConfirmDialog from './components/ConfirmDialog';
import Logo from './components/Logo';
import UserProfile from './components/UserProfile';
import { Question, QuizResult, User, UserAnswer, SubscriptionTier, InProgressQuizState } from './types';
import { examSourceData } from './services/examData';
import { getCurrentUser, logout as authLogout, updateCurrentUser } from './services/authService';
import { updateUser } from './services/userData';

type View = 'login' | 'home' | 'exam_mode_selection' | 'instructions' | 'quiz' | 'score' | 'dashboard' | 'paywall' | 'admin' | 'intermission' | 'profile';
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
    
    const [pendingUnlock, setPendingUnlock] = useState<null | {
      examName: string;
      message: string;
      numQuestions: number;
      isTimed: boolean;
      topics?: string;
    }>(null);

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
        const isPaidUser = user.subscriptionTier !== 'Cadet';
        const isUnlocked = user.unlockedExams.includes(examName);
    
        if (isPaidUser && !isUnlocked) {
          const maxUnlocks = user.subscriptionTier === 'Professional' ? 1 : 2;
          if (user.unlockedExams.length >= maxUnlocks) {
            alert("You have no exam slots available. Upgrade your plan to unlock more exams.");
            setView('paywall');
            return;
          }

          setPendingUnlock({
            examName,
            message: `You have ${maxUnlocks - user.unlockedExams.length} exam slot(s) available. 
            Do you want to use one to unlock "${examName}"? This choice is permanent for your subscription period.`,
            numQuestions,
            isTimed,
            topics
          });
          return;
        } else {
            // Handle the standard start flow for free users or already unlocked exams
            setQuizSettings(settings);
            if (user.subscriptionTier === 'Cadet') {
                setView('instructions');
            } else {
                setView('exam_mode_selection');
            }
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
        setLoadingMessage('Generating your personalized mock exam...');
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
              You are a certified API/AWS/NDT exam instructor creating official-style mock questions.
              Generate ${numQs} unique, high-quality multiple-choice questions for the "${quizSettings.examName}" certification exam (${modeForPrompt} mode).
              Use the official latest Body of Knowledge and Effectivity Sheet, ensuring the same difficulty and structure as the real certification. The questions must be strictly based on these source materials:

              EFFECTIVITY SHEET:
              ${examData.effectivitySheet}

              BODY OF KNOWLEDGE:
              ${examData.bodyOfKnowledge}
              
              - For open-book style, emphasize clause lookups and calculations (show formula or step-based logic).
              - For closed-book, emphasize conceptual recall and judgment.
              - Each question must be a JSON object following this exact pattern:
                {
                  "question": "A concise question text.",
                  "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
                  "answer": "The full text of the correct option, exactly matching one of the four options.",
                  "reference": "The specific code reference, e.g., 'API 510 Section 5.3.2'.",
                  "explanation": "A short, clear reason why the answer is correct.",
                  "category": "A relevant category from the Body of Knowledge, e.g., 'Inspection, Repairs, Corrosion'."
                }

              ${quizSettings.topics ? `Focus specifically on these topics: ${quizSettings.topics}` : ''}
              
              Format the final output as a valid JSON array of these question objects.
            `;

            const response = await ai.models.generateContent({
              model: 'gemini-2.5-pro',
              contents: prompt,
              config: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      answer: { type: Type.STRING },
                      reference: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                      category: { type: Type.STRING },
                    },
                    required: ['question', 'options', 'answer', 'reference', 'explanation', 'category'],
                  },
                }
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
    };

    const restartQuiz = () => {
        if (quizSettings) {
            startQuiz();
        }
    };

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

        let numQs = quizSettings.numQuestions - closedBookResults.questions.length;
        setSimulationPhase('open_book');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const examData = examSourceData[quizSettings.examName];
            if (!examData) throw new Error("Exam data not found.");
            
            const prompt = `
              You are a certified API/AWS/NDT exam instructor creating the SECOND HALF (open book portion) of a simulation exam.
              Generate ${numQs} unique, high-quality multiple-choice questions for the "${quizSettings.examName}" certification exam (open book mode).
              These questions must NOT repeat topics or concepts from the initial closed book portion.
              Use the official latest Body of Knowledge and Effectivity Sheet. The questions must be strictly based on these source materials:
              EFFECTIVITY SHEET: ${examData.effectivitySheet}
              BODY OF KNOWLEDGE: ${examData.bodyOfKnowledge}
              Focus on clause lookups and calculations.
              Format the output as a JSON array of question objects. Ensure the JSON is valid.
              Each question must be a JSON object following this exact pattern:
              {
                "question": "A concise question text.",
                "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
                "answer": "The full text of the correct option, exactly matching one of the four options.",
                "reference": "The specific code reference, e.g., 'API 510 Section 5.3.2'.",
                "explanation": "A short, clear reason why the answer is correct.",
                "category": "A relevant category from the Body of Knowledge, e.g., 'Inspection, Repairs, Corrosion'."
              }
            `;

            const response = await ai.models.generateContent({
              model: 'gemini-2.5-pro',
              contents: prompt,
              config: { 
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      answer: { type: Type.STRING },
                      reference: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                      category: { type: Type.STRING },
                    },
                    required: ['question', 'options', 'answer', 'reference', 'explanation', 'category'],
                  },
                }
              }
            });
            const text = response.text;
            const generatedQuestions = JSON.parse(text);
            
            if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
                throw new Error("AI did not return valid questions for the open book section.");
            }
            
            setQuestions(generatedQuestions);
            setCurrentQuestionIndex(0);
            setUserAnswers(new Array(generatedQuestions.length).fill(null));
            
            if (quizSettings.isTimed && timeLeft !== null) {
                setTimeLeft(timeLeft + (generatedQuestions.length * 90));
            } else if (quizSettings.isTimed) {
                setTimeLeft(generatedQuestions.length * 90);
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

    const handleAbandonQuiz = () => {
        if (!user) return;
        const updatedUser = { ...user, inProgressQuiz: null };
        setUser(updatedUser);
        updateCurrentUser(updatedUser);
        updateUser(updatedUser);
    };
    
    const handleAskFollowUp = async (question: Question, query: string) => {
        setIsFollowUpLoading(true);
        setFollowUpAnswer('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `
                You are an expert AI Tutor for certification exams. A student is asking a follow-up question about a specific mock exam question.
                
                Original Question: "${question.question}"
                Correct Answer: "${question.answer}"
                Explanation: "${question.explanation}"
                Reference: "${question.reference}"
                
                Student's Query: "${query}"
                
                Provide a clear, concise, and helpful answer to the student's query. Address their question directly, referencing the original context. Do not just repeat the explanation. If the query is vague like "explain more", elaborate on the core concept.
            `;
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-pro',
              contents: prompt,
            });
            setFollowUpAnswer(response.text);

        } catch (e: any) {
            setFollowUpAnswer(`Sorry, I couldn't get an answer for that. Error: ${e.message}`);
        } finally {
            setIsFollowUpLoading(false);
        }
    };
    
    const handleUpdateUser = (updatedFields: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...updatedFields };
        setUser(updatedUser);
        updateCurrentUser(updatedUser);
        updateUser(updatedUser);
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

            {isLoading && (
                <div className="text-center p-10">
                    <p className="text-xl font-semibold text-gray-700">{loadingMessage}</p>
                    <div className="mt-4 w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin mx-auto"></div>
                </div>
            )}

            {!isLoading && error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">{error}</div>}

            {!isLoading && !error && (
                <>
                    {view === 'login' && <Login onLoginSuccess={handleLoginSuccess} />}
                    
                    {view === 'home' && user && (
                        <HomePage 
                            user={user} 
                            onStartQuiz={initiateQuizFlow} 
                            onViewDashboard={() => setView('dashboard')}
                            onUpgrade={() => setView('paywall')}
                            onResumeQuiz={handleResumeQuiz}
                            onAbandonQuiz={handleAbandonQuiz}
                        />
                    )}

                    {view === 'exam_mode_selection' && quizSettings && (
                        <ExamModeSelector 
                            examName={quizSettings.examName} 
                            onSelectMode={handleModeSelected}
                            onGoHome={goHome}
                        />
                    )}

                    {view === 'instructions' && quizSettings && (
                        <InstructionsModal 
                            examName={quizSettings.examName}
                            bodyOfKnowledge={examSourceData[quizSettings.examName]?.bodyOfKnowledge || "No details available."}
                            onStart={startQuiz}
                            onCancel={() => user?.subscriptionTier === 'Cadet' ? goHome() : setView('exam_mode_selection')}
                        />
                    )}
                    
                    {view === 'quiz' && questions.length > 0 && quizSettings && user && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold">{quizSettings.examName} ({simulationPhase ? simulationPhase.replace('_', ' ') : quizSettings.examMode} mode)</h2>
                                {timeLeft !== null && (
                                    <div className="text-lg font-semibold bg-gray-200 px-4 py-2 rounded-lg">
                                        Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                    </div>
                                )}
                            </div>
                            <ProgressBar current={currentQuestionIndex + 1} total={questions.length} />
                            <QuestionCard 
                                questionNum={currentQuestionIndex + 1}
                                totalQuestions={questions.length}
                                question={questions[currentQuestionIndex]}
                                onSelectAnswer={handleAnswerSelect}
                                selectedAnswer={userAnswers[currentQuestionIndex]}
                                onNext={handleNextQuestion}
                                isLastQuestion={currentQuestionIndex === questions.length - 1}
                                isSimulationClosedBook={simulationPhase === 'closed_book'}
                                isPro={user.subscriptionTier !== 'Cadet'}
                                onAskFollowUp={handleAskFollowUp}
                                followUpAnswer={followUpAnswer}
                                isFollowUpLoading={isFollowUpLoading}
                                onGoHome={() => {
                                  saveQuizProgress();
                                  setView('home');
                                }}
                            />
                        </div>
                    )}
                    
                    {view === 'intermission' && (
                        <div className="max-w-2xl mx-auto my-10 p-8 bg-white rounded-lg shadow-xl text-center">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Closed Book Section Complete</h2>
                            <p className="text-gray-600 mb-6">You will now proceed to the open book section of the exam.</p>
                            <button onClick={proceedFromIntermission} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700">
                                Start Open Book Section
                            </button>
                        </div>
                    )}

                    {view === 'score' && quizResult && user && (
                        <ScoreScreen
                            result={quizResult}
                            onRestart={restartQuiz}
                            onGoHome={goHome}
                            isPro={user.subscriptionTier !== 'Cadet'}
                            onViewDashboard={() => setView('dashboard')}
                            onRegenerate={() => {
                                if (!quizSettings) return;
                                startQuiz(); 
                            }}
                        />
                    )}

                    {view === 'dashboard' && user && (
                        <Dashboard 
                            history={user.history} 
                            onGoHome={goHome}
                            onStartWeaknessQuiz={handleStartWeaknessQuiz}
                        />
                    )}

                    {view === 'profile' && user && (
                        <UserProfile
                            user={user}
                            onGoHome={goHome}
                            onUpdateUser={handleUpdateUser}
                            onViewDashboard={() => setView('dashboard')}
                            onManageSubscription={() => setView('paywall')}
                        />
                    )}

                    {view === 'paywall' && <Paywall onUpgrade={handleUpgradeSuccess} onCancel={() => setView('home')} />}
                    
                    {view === 'admin' && user && <AdminDashboard currentUser={user} onGoHome={goHome} />}
                </>
            )}
            
            {pendingUnlock && user && (
              <ConfirmDialog
                open={true}
                title="Unlock Exam?"
                message={pendingUnlock.message}
                onCancel={() => setPendingUnlock(null)}
                onConfirm={() => {
                  const { examName, numQuestions, isTimed, topics } = pendingUnlock;
                  const updatedUser = { ...user, unlockedExams: [...user.unlockedExams, examName] };
                  setUser(updatedUser);
                  updateCurrentUser(updatedUser);
                  updateUser(updatedUser);
                  setPendingUnlock(null);
                  setQuizSettings({ examName, numQuestions, isTimed, examMode: 'open', topics });
                  setView('exam_mode_selection');
                }}
              />
            )}
        </main>
    );
};

export default App;