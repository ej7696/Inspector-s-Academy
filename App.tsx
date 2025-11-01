
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import HomePage from './components/HomePage';
import QuestionCard from './components/QuestionCard';
import ScoreScreen from './components/ScoreScreen';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Paywall from './components/Paywall';
import AdminDashboard from './components/AdminDashboard';
import ProgressBar from './components/ProgressBar';
import ExamModeSelector from './components/ExamModeSelector'; // Import the new component
import { Question, QuizResult, User, UserAnswer } from './types';
import { examSourceData } from './services/examData';
import { getCurrentUser, logout as authLogout, updateCurrentUser } from './services/authService';
import { updateUser } from './services/userData';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [view, setView] = useState<'login' | 'home' | 'exam_mode_selection' | 'quiz' | 'score' | 'dashboard' | 'paywall' | 'admin'>('login');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<string[]>([]);
    const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Checking session...');
    const [error, setError] = useState('');
    const [quizSettings, setQuizSettings] = useState<{ examName: string, numQuestions: number, isTimed: boolean, topics?: string } | null>(null);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
            setView('home');
        }
        setIsLoading(false);
        setLoadingMessage('');
    }, []);

    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

    const startQuiz = async (mode: 'open' | 'closed') => {
        if (!quizSettings) return;
        const { examName, numQuestions, isTimed, topics } = quizSettings;

        setIsLoading(true);
        setLoadingMessage(`Generating ${numQuestions} ${mode}-book questions for ${topics ? topics : examName}... This may take a moment.`);
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
            Based on the provided 'Effectivity Sheet' and 'Body of Knowledge' for the "${examName}" certification, generate a challenging, multiple-choice quiz with exactly ${numQuestions} questions.
            ${topics ? `The quiz should focus specifically on these topics: ${topics}.` : ''}

            **IMPORTANT STYLE REQUIREMENT:** ${modeSpecificInstructions}

            For each question:
            1.  Ensure it is directly relevant to the provided source documents.
            2.  Create four plausible options, with only one being correct.
            3.  Provide the correct answer.
            4.  Provide a brief 'explanation' for why the answer is correct.
            5.  Provide a specific 'reference' to the exact section, paragraph, or table in the source document where the answer can be found. This is mandatory.
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

            setQuestions(generatedQuestions);
            setUserAnswers(new Array(generatedQuestions.length).fill(''));
            setCurrentQuestionIndex(0);
            setView('quiz');
        } catch (e) {
            console.error(e);
            setError('Failed to generate the quiz. The AI may be experiencing high demand or an error occurred. Please try again in a moment.');
            setView('home'); // Go back home on error
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
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
        setQuizSettings({ examName, numQuestions, isTimed });
        setView('exam_mode_selection');
    };

    const handleStartWeaknessQuiz = (topics: string) => {
        const lastExamName = user?.history[0]?.examName || "API 653 - Aboveground Storage Tank Inspector";
        // Weakness quiz defaults to open-book for review purposes
        setQuizSettings({ examName: lastExamName, numQuestions: 10, isTimed: false, topics });
        startQuiz('open'); 
    };

    const handleSelectAnswer = (answer: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = answer;
        setUserAnswers(newAnswers);
    };
    
    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            handleSubmitQuiz();
        }
    };

    const handleSubmitQuiz = () => {
        if (!user || !quizSettings) return;

        let score = 0;
        const processedAnswers: UserAnswer[] = questions.map((q, index) => {
            const userAnswer = userAnswers[index];
            const isCorrect = userAnswer === q.answer;
            if (isCorrect) score++;
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
            score,
            totalQuestions: questions.length,
            percentage: (score / questions.length) * 100,
            date: Date.now(),
            userAnswers: processedAnswers,
        };
        
        const updatedUser = { ...user, history: [result, ...user.history] };
        updateUser(updatedUser); 
        updateCurrentUser(updatedUser); 
        setUser(updatedUser);
        setQuizResult(result);
        setView('score');
    };
    
    const handleRestartQuiz = () => {
        // Since we don't know the mode, we go back to the mode selection screen
        if (quizSettings) {
             setView('exam_mode_selection');
        }
    };

    const handleGoHome = () => setView('home');
    const handleViewDashboard = () => setView('dashboard');
    const handleUpgrade = () => setView('paywall');
    const handleGoToAdmin = () => setView('admin');

    const handleUpgradeSuccess = () => {
        if (user) {
            const updatedUser = { ...user, isPro: true };
            updateUser(updatedUser);
            updateCurrentUser(updatedUser);
            setUser(updatedUser);
            setView('home');
        }
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
                return <HomePage user={user} onStartQuiz={initiateQuizFlow} onViewDashboard={handleViewDashboard} onUpgrade={handleUpgrade} />;
            case 'exam_mode_selection':
                 if (!quizSettings) return <p>Error: Quiz settings not found.</p>;
                 return <ExamModeSelector onSelectMode={startQuiz} examName={quizSettings.examName} onGoHome={handleGoHome} />;
            case 'quiz':
                const currentQuestion = questions[currentQuestionIndex];
                if (!currentQuestion) return <p>Question not found.</p>;
                return (
                    <div className="max-w-4xl mx-auto my-10 p-4 md:p-8">
                        <ProgressBar current={currentQuestionIndex + 1} total={questions.length} />
                        <QuestionCard 
                            question={currentQuestion}
                            onSelectAnswer={handleSelectAnswer}
                            selectedAnswer={userAnswers[currentQuestionIndex]}
                        />
                         <div className="mt-6 text-right">
                            <button
                                onClick={handleNextQuestion}
                                disabled={!userAnswers[currentQuestionIndex]}
                                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Submit Quiz'}
                            </button>
                        </div>
                    </div>
                );
            case 'score':
                if (!quizResult || !user) return null;
                return <ScoreScreen result={quizResult} onRestart={handleRestartQuiz} onGoHome={handleGoHome} isPro={user.isPro} onViewDashboard={handleViewDashboard} />;
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
                    <div>
                        {user && view !== 'login' && (
                            <div className="flex items-center gap-4">
                                <span className="text-gray-700 hidden sm:inline">Welcome, {user.email}</span>
                                {(user.role === 'ADMIN' || user.role === 'SUB_ADMIN') && (
                                     <button onClick={handleGoToAdmin} className="text-sm text-gray-600 hover:text-blue-600 font-semibold">Admin Panel</button>
                                )}
                                <button onClick={handleLogout} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300">Logout</button>
                            </div>
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
