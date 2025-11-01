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
import { Question, QuizResult, User, UserAnswer, SubscriptionTier } from './types';
import { examSourceData } from './services/examData';
import { getCurrentUser, logout as authLogout, updateCurrentUser } from './services/authService';
import { updateUser } from './services/userData';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [view, setView] = useState<'login' | 'home' | 'exam_mode_selection' | 'quiz' | 'score' | 'dashboard' | 'paywall' | 'admin' | 'intermission'>('login');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
    const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Checking session...');
    const [error, setError] = useState('');
    const [quizSettings, setQuizSettings] = useState<{ examName: string, numQuestions: number, isTimed: boolean, topics?: string } | null>(null);
    
    const [simulationPhase, setSimulationPhase] = useState<'closed_book' | 'open_book' | null>(null);
    const [closedBookResults, setClosedBookResults] = useState<{ questions: Question[], userAnswers: (string|null)[] } | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const timerRef = useRef<number | null>(null);
    const [followUpAnswer, setFollowUpAnswer] = useState<string>('');
    const [isFollowUpLoading, setIsFollowUpLoading] = useState<boolean>(false);

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
      if (timeLeft === null || timerRef.current !== null) return;
  
      if (timeLeft > 0) {
        timerRef.current = window.setInterval(() => {
          setTimeLeft((prevTime) => (prevTime ? prevTime - 1 : 0));
        }, 1000);
      } else if (timeLeft === 0) {
        handleSubmitQuiz();
      }
  
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }, [timeLeft]);

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setTimeLeft(null);
    };

    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

    const generateQuestions = async (mode: 'open' | 'closed', isSimulation: boolean) => {
        if (!quizSettings) return;
        const { examName, numQuestions, isTimed } = quizSettings;
        
        const questionsToGenerate = isSimulation ? Math.ceil(numQuestions / 2) : numQuestions;

        setIsLoading(true);
        setLoadingMessage(`Generating ${questionsToGenerate} ${mode}-book questions for ${quizSettings.topics ? quizSettings.topics : examName}... This may take a moment.`);
        setError('');

        const examData = examSourceData[examName];
        if (!examData) {
            setError(`Exam data not found for ${examName}`);
            setIsLoading(false);
            return;
        }
        
        const modeSpecificInstructions = mode === 'open' 
            ? "The questions should be in an 'open-book' style, requiring the user to find specific information, interpret clauses, and perform calculations based on the provided source documents. The 'reference' and 'quote' fields are critical."
            : "The questions should be in a 'closed-book' style, testing foundational knowledge, definitions, and core concepts that an inspector should have memorized. While a reference might exist, the question should be answerable without looking it up.";

        const prompt = `
            You are an expert curriculum developer specializing in creating certification exam questions.
            Based on the provided 'Effectivity Sheet' and 'Body of Knowledge' for the "${examName}" certification, generate a challenging, multiple-choice quiz with exactly ${questionsToGenerate} questions.
            ${quizSettings.topics ? `The quiz should focus specifically on these topics: ${quizSettings.topics}.` : ''}

            **IMPORTANT STYLE REQUIREMENT:** ${modeSpecificInstructions}

            For each question:
            1.  Ensure it is directly relevant to the provided source documents.
            2.  Create four plausible options, with only one being correct.
            3.  Provide the correct answer.
            4.  Provide a brief 'explanation' for why the answer is correct.
            5.  Provide a highly specific 'reference' to the exact section, paragraph, table, or figure in the source document where the answer can be found (e.g., "API 653, Section 4.3.3.1, Paragraph 2"). This is mandatory.
            6.  Categorize the question based on the 'Body of Knowledge' sections (e.g., "Welding", "Nondestructive Examination", "Calculations").

            Source Documents:
            ---
            Effectivity Sheet:
            ${examData.effectivitySheet}
            ---
            Body of Knowledge:
            ${examData.bodyOfKnowledge}
            ---

            Return the quiz as a JSON object. Do not include any introductory text or code block formatting.
        `;
        
        const questionSchema = {
            type: Type.OBJECT,
            properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                answer: { type: Type.STRING },
                explanation: { type: Type.STRING },
                reference: { type: Type.STRING },
                category: { type: Type.STRING },
            },
            required: ["question", "options", "answer", "explanation", "reference", "category"],
        };

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: questionSchema,
                    },
                },
            });
            
            const jsonText = response.text.trim();
            const generatedQuestions = JSON.parse(jsonText);
            
            if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
                throw new Error("API returned an invalid or empty set of questions.");
            }

            if (isTimed) {
              const timePerQuestion = 90;
              setTimeLeft(generatedQuestions.length * timePerQuestion);
            }

            setQuestions(generatedQuestions);
            setUserAnswers(new Array(generatedQuestions.length).fill(null));
            setCurrentQuestionIndex(0);
            setView('quiz');
        } catch (e) {
            console.error(e);
            setError('Failed to generate the quiz. The AI may be experiencing high demand or an error occurred. Please try again in a moment.');
            setView('home');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };
    
    const handleSelectMode = (mode: 'open' | 'closed' | 'simulation') => {
        if (mode === 'simulation') {
            setSimulationPhase('closed_book');
            generateQuestions('closed', true);
        } else {
            setSimulationPhase(null);
            generateQuestions(mode, false);
        }
    };

    const handleLoginSuccess = (loggedInUser: User) => {
        setUser(loggedInUser);
        setView('home');
    };

    const handleLogout = () => {
        authLogout();
        setUser(null);
        setView('login');
    };
    
    const initiateQuizFlow = (examName: string, numQuestions: number, isTimed: boolean) => {
        if (!user) return;
    
        const hasAccess = user.subscriptionTier !== 'Cadet' && (user.unlockedExams.includes(examName) || user.role === 'ADMIN');
        const canUnlock = (user.subscriptionTier === 'Professional' && user.unlockedExams.length < 1) || (user.subscriptionTier === 'Specialist' && user.unlockedExams.length < 2);
    
        if (hasAccess || user.subscriptionTier === 'Cadet' /* Free users can start */) {
            setQuizSettings({ examName, numQuestions, isTimed });
            setView('exam_mode_selection');
        } else if (canUnlock) {
            if (window.confirm(`Unlock "${examName}"? This will use one of your available slots for the ${user.subscriptionTier} plan.`)) {
                const updatedUser = { ...user, unlockedExams: [...user.unlockedExams, examName] };
                updateUser(updatedUser);
                updateCurrentUser(updatedUser);
                setUser(updatedUser);
                // Immediately start the quiz after unlocking
                setQuizSettings({ examName, numQuestions, isTimed });
                setView('exam_mode_selection');
            }
        } else {
             alert("You have reached your exam track limit. Please upgrade your plan to access more certifications.");
             setView('paywall');
        }
    };

    const handleStartWeaknessQuiz = (topics: string) => {
        const lastExamName = user?.history[0]?.examName || "API 653 - Aboveground Storage Tank Inspector";
        setQuizSettings({ examName: lastExamName, numQuestions: 10, isTimed: false, topics });
        handleSelectMode('open'); 
    };

    const handleSelectAnswer = (answer: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = answer;
        setUserAnswers(newAnswers);
    };
    
    const handleNextQuestion = () => {
        setFollowUpAnswer('');

        // Paywall check for free users
        if(user?.subscriptionTier === 'Cadet' && currentQuestionIndex >= 4) {
            setView('paywall');
            return;
        }

        const isLastQuestion = currentQuestionIndex === questions.length - 1;
        if (isLastQuestion) {
            if (simulationPhase === 'closed_book') {
                stopTimer();
                setClosedBookResults({ questions, userAnswers });
                setView('intermission');
            } else {
                handleSubmitQuiz();
            }
        } else {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const startOpenBookPhase = () => {
        setSimulationPhase('open_book');
        generateQuestions('open', true);
    };

    const handleSubmitQuiz = () => {
        if (!user || !quizSettings) return;
        stopTimer();

        let finalQuestions = questions;
        let finalUserAnswers = userAnswers;
        let finalScore = 0;

        if (simulationPhase === 'open_book' && closedBookResults) {
            finalQuestions = [...closedBookResults.questions, ...questions];
            finalUserAnswers = [...closedBookResults.userAnswers, ...userAnswers];
        }

        const processedAnswers: UserAnswer[] = finalQuestions.map((q, index) => {
            const userAnswer = finalUserAnswers[index];
            const isCorrect = userAnswer === q.answer;
            if (isCorrect) finalScore++;
            return {
                question: q.question,
                answer: q.answer,
                userAnswer: userAnswer || "Not Answered",
                isCorrect,
                options: q.options,
                explanation: q.explanation,
                reference: q.reference,
                quote: q.quote,
                category: q.category,
            };
        });

        const result: QuizResult = {
            id: new Date().toISOString(),
            examName: quizSettings.topics ? `Weakness Drill: ${quizSettings.topics}` : quizSettings.examName,
            score: finalScore,
            totalQuestions: finalQuestions.length,
            percentage: (finalScore / finalQuestions.length) * 100,
            date: Date.now(),
            userAnswers: processedAnswers,
        };
        
        if (user.subscriptionTier !== 'Cadet') {
            const updatedUser = { ...user, history: [result, ...user.history] };
            updateUser(updatedUser); 
            updateCurrentUser(updatedUser); 
            setUser(updatedUser);
        }
        setQuizResult(result);
        setView('score');
        
        setSimulationPhase(null);
        setClosedBookResults(null);
    };
    
    const handleRestartQuiz = () => {
        if (quizSettings) {
             setView('exam_mode_selection');
        }
    };

    const handleGoHome = () => {
        stopTimer();
        setView('home');
    }
    const handleViewDashboard = () => setView('dashboard');
    
    const handleUpgradeSuccess = (tier: SubscriptionTier) => {
        if (user) {
            const updatedUser = { ...user, subscriptionTier: tier, unlockedExams: tier === 'Specialist' ? user.unlockedExams : [] };
            if(tier === 'Professional') updatedUser.unlockedExams = [];
            
            updateUser(updatedUser);
            updateCurrentUser(updatedUser);
            setUser(updatedUser);
            setView('home');
            alert(`Upgrade to ${tier} successful! You can now choose your exam tracks.`);
        }
    };

    const handleAskFollowUp = async (originalQuestion: Question, followUpQuery: string) => {
        if (!followUpQuery) return;
        setIsFollowUpLoading(true);
        setFollowUpAnswer('');
    
        const prompt = `
          You are an expert tutor. A user was asked the following question:
          "**${originalQuestion.question}**"
    
          The correct answer is: **${originalQuestion.answer}**
          The provided explanation is: "${originalQuestion.explanation}"
    
          The user has a follow-up question: "**${followUpQuery}**"
    
          Please provide a concise, helpful, and direct answer to the user's follow-up question in the context of the original problem.
        `;
    
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
          });
          setFollowUpAnswer(response.text);
        } catch (e) {
          console.error(e);
          setFollowUpAnswer("Sorry, I couldn't generate an answer at this moment. Please try again.");
        } finally {
          setIsFollowUpLoading(false);
        }
      };
      
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen">
                    <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
                    <p className="mt-4 text-lg text-gray-600">{loadingMessage}</p>
                </div>
            );
        }

        switch (view) {
            case 'login':
                return <Login onLoginSuccess={handleLoginSuccess} />;
            case 'home':
                if (!user) return <Login onLoginSuccess={handleLoginSuccess} />;
                return <HomePage user={user} onStartQuiz={initiateQuizFlow} onViewDashboard={handleViewDashboard} onUpgrade={() => setView('paywall')} />;
            case 'exam_mode_selection':
                 if (!quizSettings) return <p>Error: Quiz settings not found.</p>;
                 return <ExamModeSelector onSelectMode={handleSelectMode} examName={quizSettings.examName} onGoHome={handleGoHome} />;
            case 'intermission':
                return (
                    <div className="max-w-2xl mx-auto my-10 p-8 text-center bg-white rounded-lg shadow-xl">
                        <h2 className="text-2xl font-bold text-gray-800">Closed-Book Session Complete</h2>
                        <p className="text-gray-600 my-4">You may now use your approved reference materials.</p>
                        <button 
                            onClick={startOpenBookPhase}
                            className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors"
                        >
                            Start Timed Open-Book Session
                        </button>
                    </div>
                );
            case 'quiz':
                const currentQuestion = questions[currentQuestionIndex];
                if (!currentQuestion || !user) return <p>Question not found.</p>;
                return (
                    <div className="max-w-4xl mx-auto my-10 p-4 md:p-8">
                        <div className="flex justify-between items-center mb-4">
                           <div className="flex-1">
                                <ProgressBar current={currentQuestionIndex + 1} total={questions.length} />
                           </div>
                           {timeLeft !== null && (
                                <div className="ml-4 px-3 py-1 bg-gray-200 text-gray-800 font-semibold rounded-md">
                                    Time: {formatTime(timeLeft)}
                                </div>
                           )}
                        </div>
                        <QuestionCard 
                            questionNum={currentQuestionIndex + 1}
                            totalQuestions={questions.length}
                            question={currentQuestion}
                            onSelectAnswer={handleSelectAnswer}
                            selectedAnswer={userAnswers[currentQuestionIndex]}
                            onNext={handleNextQuestion}
                            isLastQuestion={currentQuestionIndex === questions.length - 1}
                            isSimulationClosedBook={simulationPhase === 'closed_book'}
                            isPro={user.subscriptionTier !== 'Cadet'}
                            onAskFollowUp={handleAskFollowUp}
                            followUpAnswer={followUpAnswer}
                            isFollowUpLoading={isFollowUpLoading}
                        />
                    </div>
                );
            case 'score':
                if (!quizResult || !user) return null;
                return <ScoreScreen result={quizResult} onRestart={handleRestartQuiz} onGoHome={handleGoHome} isPro={user.subscriptionTier !== 'Cadet'} onViewDashboard={handleViewDashboard} />;
            case 'dashboard':
                if (!user) return null;
                return <Dashboard history={user.history} onGoHome={handleGoHome} onStartWeaknessQuiz={handleStartWeaknessQuiz} />;
             case 'paywall':
                return <Paywall onUpgrade={handleUpgradeSuccess} onCancel={handleGoHome} />;
            case 'admin':
                if (!user) return null;
                return <AdminDashboard currentUser={user} onGoHome={handleGoHome} />;
            default:
                return <p>Invalid view state.</p>;
        }
    };
    
    return (
        <div className="bg-gray-100 min-h-screen font-sans">
             <header className="bg-white shadow-md">
                <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-blue-600">InspectorPrep AI</h1>
                    <div className="flex items-center gap-4">
                        {user && view !== 'login' && (
                            <>
                                <button onClick={handleGoHome} className="text-sm text-gray-600 hover:text-blue-600 font-semibold">Home</button>
                                {(user.role === 'ADMIN' || user.role === 'SUB_ADMIN') && (
                                     <button onClick={() => setView('admin')} className="text-sm text-gray-600 hover:text-blue-600 font-semibold">Admin Panel</button>
                                )}
                                <span className="text-gray-700 hidden sm:inline">| Welcome, {user.email}</span>
                                <button onClick={handleLogout} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300">Logout</button>
                            </>
                        )}
                    </div>
                </nav>
            </header>
            <main>
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 m-4 rounded-md" role="alert">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                )}
                {renderContent()}
            </main>
        </div>
    );
};

export default App;