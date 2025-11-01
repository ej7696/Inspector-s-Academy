import React, { useState, useEffect, useRef } from 'react';
import { Question, QuizResult, User, UserAnswer } from './types';
import HomePage from './components/HomePage';
import QuestionCard from './components/QuestionCard';
import ScoreScreen from './components/ScoreScreen';
import ProgressBar from './components/ProgressBar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import { getCurrentUser, logout, updateCurrentUser } from './services/authService';
import Paywall from './components/Paywall';
import ExamModeSelector from './components/ExamModeSelector';
import { examSourceData } from './services/examData';

// Correct imports from @google/genai according to guidelines
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

type AppView = 'login' | 'home' | 'exam_mode_selection' | 'loading' | 'active' | 'complete' | 'dashboard' | 'admin_dashboard' | 'paywall';

const App: React.FC = () => {
    const [view, setView] = useState<AppView>('login');
    const [user, setUser] = useState<User | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [quizSettings, setQuizSettings] = useState({ examName: '', numQuestions: 10, isTimed: false, topics: '', effectivityInfo: '' });
    const [timeLeft, setTimeLeft] = useState(0);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        const loggedInUser = getCurrentUser();
        if (loggedInUser) {
            setUser(loggedInUser);
            setView('home');
        }
    }, []);

    useEffect(() => {
        if (view === 'active' && quizSettings.isTimed) {
            timerRef.current = window.setInterval(() => {
                setTimeLeft(prevTime => {
                    if (prevTime <= 1) {
                        clearInterval(timerRef.current!);
                        finishQuiz();
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [view, quizSettings.isTimed]);

    const handleLogin = (loggedInUser: User) => {
        setUser(loggedInUser);
        setView('home');
    }

    const handleLogout = () => {
        logout();
        setUser(null);
        setView('login');
    }
    
    const handleUpgrade = () => {
        if (user) {
            const upgradedUser = { ...user, isPro: true };
            setUser(upgradedUser);
            updateCurrentUser(upgradedUser); // Persist change
            setView('home');
        }
    }

    const initiateQuizFlow = (examName: string, numQuestions: number, isTimed: boolean, topics?: string) => {
        if (user && !user.isPro && user.history.length >= 3) {
             setView('paywall');
             return;
        }
        const effectivityInfo = examSourceData[examName]?.effectivitySheet || "Standard industry knowledge.";
        setQuizSettings({ examName, numQuestions, isTimed, topics: topics || '', effectivityInfo });
        setView('exam_mode_selection');
    };

    const startQuiz = async (examMode: 'Open Book' | 'Closed Book') => {
        setView('loading');
        setError(null);

        if (quizSettings.isTimed) {
            setTimeLeft(quizSettings.numQuestions * 60); // 60 seconds per question
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

            const examData = examSourceData[quizSettings.examName];
            if (!examData) {
                throw new Error(`Exam data for "${quizSettings.examName}" not found.`);
            }

            let modeInstructions = '';
            if (examMode === 'Open Book') {
                modeInstructions = `The questions should be in an "Open Book" format. This means they must test the user's ability to navigate the code book to find specific answers. Focus on questions that require table lookups, chart interpretation, and applying specific clauses to scenarios. Each question MUST have a highly specific "reference" pointing to the exact section, paragraph, table, or figure (e.g., "API 653, Section 4.3.3.1, Paragraph 2") and an exact "quote" from that location.`;
            } else { // Closed Book
                modeInstructions = `The questions should be in a "Closed Book" format. This means they must test foundational knowledge that should be memorized. Focus on definitions, safety principles, and general procedures. These questions should NOT require a code book. References can be more general (e.g., "API 653, General Knowledge").`;
            }
            
            const prompt = `You are an expert exam question writer for API certifications.
            Generate ${quizSettings.numQuestions} multiple-choice questions for a mock exam on "${quizSettings.examName}".
            
            You MUST base your questions STRICTLY on the following provided documents:
            ---
            **Publications Effectivity Sheet (Applicable Code Editions):**
            ${examData.effectivitySheet}
            ---
            **Body of Knowledge (Topics to Cover):**
            ${examData.bodyOfKnowledge}
            ---

            ${quizSettings.topics ? `The questions should focus specifically on these topics from the Body of Knowledge: ${quizSettings.topics}.` : ''}
            
            The exam session format is: **${examMode}**.
            ${modeInstructions}
            
            For each question, provide:
            1.  A "question" text.
            2.  An array of 4 "options".
            3.  The correct "answer" string.
            4.  A "category" string from the Body of Knowledge (e.g., "Welding Procedures", "Corrosion Calculation").
            5.  A highly specific "reference" string pointing to the exact location in the relevant API code from the Effectivity Sheet. It must be precise enough for a user to find it. For example: "API 653, Section 4.3.3.1, Paragraph 2" or "ASME V, Article 2, T-271.1".
            6.  A "quote" string with the exact text from the reference that justifies the answer.
            7.  A concise "explanation" string.
            
            Return the output as a valid JSON array of objects.`;

            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: "application/json",
                     responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                answer: { type: Type.STRING },
                                category: { type: Type.STRING },
                                reference: { type: Type.STRING },
                                quote: { type: Type.STRING },
                                explanation: { type: Type.STRING },
                            },
                            required: ["question", "options", "answer", "category", "reference", "quote", "explanation"]
                        }
                    }
                }
            });
            
            const generatedJson = response.text;
            const parsedQuestions = JSON.parse(generatedJson);
            
            if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
                throw new Error("AI did not return valid question data.");
            }

            setQuestions(parsedQuestions);
            setCurrentQuestionIndex(0);
            setUserAnswers([]);
            setView('active');
        } catch (e) {
            console.error(e);
            setError("Failed to generate quiz questions. Please try again.");
            setView('home');
        }
    };
    
    const handleAnswer = (answer: string, isCorrect: boolean) => {
        const currentQ = questions[currentQuestionIndex];
        const newAnswer: UserAnswer = {
            question: currentQ.question,
            options: currentQ.options,
            answer: currentQ.answer,
            userAnswer: answer,
            isCorrect,
            category: currentQ.category,
            reference: currentQ.reference,
            quote: currentQ.quote,
            explanation: currentQ.explanation
        };
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = newAnswer;
        setUserAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            finishQuiz();
        }
    };
    
    const handleFollowUp = async (followUpQuestion: string, context: Question): Promise<string> => {
        try {
            const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});
            const prompt = `The user is asking a follow-up question about a quiz answer.
            Context:
            - Question: "${context.question}"
            - Correct Answer: "${context.answer}"
            - Explanation: "${context.explanation}"
            
            User's follow-up question: "${followUpQuestion}"
            
            Provide a clear and concise answer to the user's follow-up question based on the provided context.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ parts: [{ text: prompt }] }],
            });

            return response.text;
        } catch (e) {
            console.error(e);
            return "Sorry, I couldn't process your question at the moment.";
        }
    };

    const finishQuiz = () => {
        if (!user) return;
        
        // Ensure all questions have an answer, even if unanswered (e.g. timer runs out)
        const finalAnswers = questions.map((q, index) => {
            if (userAnswers[index]) return userAnswers[index];
            return {
                 question: q.question,
                 options: q.options,
                 answer: q.answer,
                 userAnswer: "Not Answered",
                 isCorrect: false,
                 category: q.category,
                 reference: q.reference,
                 quote: q.quote,
                 explanation: q.explanation,
            }
        });

        const score = finalAnswers.filter(a => a.isCorrect).length;

        const result: QuizResult = {
            id: new Date().toISOString(),
            examName: quizSettings.examName,
            score,
            totalQuestions: questions.length,
            percentage: (score / questions.length) * 100,
            date: Date.now(),
            userAnswers: finalAnswers,
        };
        
        const updatedUser = { ...user, history: [...user.history, result] };
        setUser(updatedUser);
        updateCurrentUser(updatedUser);
        setView('complete');
    };

    const restartQuiz = () => {
        initiateQuizFlow(quizSettings.examName, quizSettings.numQuestions, quizSettings.isTimed);
    };

    const goHome = () => {
        setQuestions([]);
        setView('home');
    };
    
    const renderHeader = () => (
        <header className="bg-white shadow-sm">
            <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
                <div className="text-xl font-bold text-gray-800">Inspector Academy</div>
                {user && (
                    <div className="flex items-center gap-4">
                        <span className="text-gray-600 hidden sm:inline">Welcome, {user.email}!</span>
                        {user.role !== 'USER' && (
                             <button onClick={() => setView('admin_dashboard')} className="text-sm font-semibold text-gray-700 hover:text-blue-600">Admin Panel</button>
                        )}
                        <button onClick={handleLogout} className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg">Logout</button>
                    </div>
                )}
            </nav>
        </header>
    );

    const renderContent = () => {
        switch (view) {
            case 'login':
                return <Login onLoginSuccess={handleLogin} />;
            case 'home':
                return user ? <HomePage user={user} onStartQuiz={initiateQuizFlow} onViewDashboard={() => setView('dashboard')} onUpgrade={() => setView('paywall')} /> : null;
            case 'paywall':
                return <Paywall onUpgrade={handleUpgrade} onCancel={() => setView('home')} />;
            case 'exam_mode_selection':
                 return <ExamModeSelector examName={quizSettings.examName} effectivityInfo={quizSettings.effectivityInfo} onSelectMode={startQuiz} onBack={goHome} />;
            case 'loading':
                return (
                    <div className="text-center p-10">
                        <h2 className="text-2xl font-semibold text-gray-700">Generating your quiz...</h2>
                        <p className="text-gray-500 mt-2">The AI is crafting your questions. This may take a moment.</p>
                    </div>
                );
            case 'active':
                const currentQ = questions[currentQuestionIndex];
                return currentQ ? (
                    <div className="flex flex-col items-center">
                         <div className="w-full max-w-3xl mb-4">
                             <button onClick={goHome} className="text-blue-600 hover:underline mb-2">&larr; Back to Home</button>
                             <ProgressBar current={currentQuestionIndex + 1} total={questions.length} />
                             {quizSettings.isTimed && <div className="text-center font-mono text-2xl text-red-500 my-2">Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>}
                        </div>
                        <QuestionCard 
                            key={currentQuestionIndex}
                            question={currentQ}
                            onAnswer={handleAnswer}
                            onNext={handleNext}
                            isLastQuestion={currentQuestionIndex === questions.length - 1}
                            onFollowUp={handleFollowUp}
                            isPro={user?.isPro || false}
                        />
                    </div>
                ) : null;
            case 'complete':
                const lastResult = user?.history[user.history.length - 1];
                return lastResult ? <ScoreScreen result={lastResult} onRestart={restartQuiz} onGoHome={goHome} isPro={user?.isPro || false} onViewDashboard={() => setView('dashboard')} /> : null;
            case 'dashboard':
                 return user ? <Dashboard history={user.history} onGoHome={goHome} onStartWeaknessQuiz={(topics) => initiateQuizFlow("Weakness-focused quiz", 10, false, topics)}/> : null;
            case 'admin_dashboard':
                return user && user.role !== 'USER' ? <AdminDashboard currentUser={user} onGoHome={() => setView('home')} /> : null;
            default:
                return null;
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            {view !== 'login' && renderHeader()}
            <main className="container mx-auto p-4">
                {error && <div className="text-center text-red-500 p-4 bg-red-100 rounded-lg max-w-3xl mx-auto my-4" role="alert">{error}</div>}
                {renderContent()}
            </main>
        </div>
    );
};

export default App;