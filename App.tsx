import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import HomePage from './components/HomePage';
import QuestionCard from './components/QuestionCard';
import ScoreScreen from './components/ScoreScreen';
import Dashboard from './components/Dashboard';
import Paywall from './components/Paywall';
import ProgressBar from './components/ProgressBar';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import { Question, UserAnswer, QuizResult, User } from './types';
import * as authService from './services/authService';
import * as userData from './services/userData';

type View = 'home' | 'quiz' | 'score' | 'dashboard' | 'paywall' | 'admin';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('home');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [history, setHistory] = useState<QuizResult[]>([]);
  const [quizCount, setQuizCount] = useState(0); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [examName, setExamName] = useState('');
  const [isTimedMode, setIsTimedMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<number | null>(null);
  const [followUpResponse, setFollowUpResponse] = useState<string | null>(null);
  const [isGettingFollowUp, setIsGettingFollowUp] = useState(false);


  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setHistory(userData.getUserHistory(user.id));
    }
  }, []);

  useEffect(() => {
    if (view === 'quiz' && isTimedMode) {
      const timePerQuestion = 60; // 60 seconds per question
      setTimeLeft(questions.length * timePerQuestion);
      
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            finishQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [view, isTimedMode, questions.length]);

  const handleLogin = () => {
      const user = authService.getCurrentUser();
      setCurrentUser(user);
      if (user) {
        setHistory(userData.getUserHistory(user.id));
      }
      setView('home');
  }

  const handleLogout = () => {
      authService.logout();
      setCurrentUser(null);
      setHistory([]);
  }

  const generateQuestions = async (topic: string, numQuestions: number, isWeaknessQuiz = false) => {
    if (!currentUser) return;

    if (!currentUser.isPro && quizCount >= 3) {
      setView('paywall');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setExamName(topic);

    const prompt = isWeaknessQuiz 
        ? `Generate a multiple-choice quiz with ${numQuestions} questions focused on these topics: ${topic}. These are areas a user is struggling with. For each question, provide 4 options, a correct answer, a brief explanation, a reference (e.g., document section), a direct quote from the reference, and a specific category for the question.`
        : `Generate a multiple-choice quiz with ${numQuestions} questions about ${topic}. For each question, provide 4 options, a correct answer, a brief explanation, a reference (e.g., document section), a direct quote from the reference, and a specific category for the question (e.g., "Weld Inspection", "Corrosion Calculation").`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    answer: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    reference: { type: Type.STRING },
                    quote: { type: Type.STRING },
                    category: { type: Type.STRING, description: "A specific sub-topic for this question." },
                  },
                  required: ['question', 'options', 'answer', 'explanation', 'category']
                },
              },
            },
          },
        },
      });

      const responseText = response.text.trim();
      const generatedData = JSON.parse(responseText);
      const generatedQuestions = generatedData.questions;

      if (!generatedQuestions || generatedQuestions.length === 0) {
        throw new Error("AI failed to generate questions. Please try again.");
      }
      
      setQuestions(generatedQuestions);
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setSelectedAnswer(null);
      setFollowUpResponse(null);
      if (!currentUser.isPro) {
          setQuizCount(prev => prev + 1);
      }
      setView('quiz');

    } catch (e) {
      console.error("Error generating quiz:", e);
      setError("Failed to generate quiz. The AI may be experiencing high demand. Please try again later.");
      setView('home');
    } finally {
      setIsGenerating(false);
    }
  };

  const askFollowUp = async (userFollowUp: string, originalQuestion: Question) => {
      if (!currentUser?.isPro) return;
      setIsGettingFollowUp(true);
      setFollowUpResponse(null);
      try {
          const prompt = `A user is taking a quiz.
          The original question was: "${originalQuestion.question}"
          The correct answer is: "${originalQuestion.answer}"
          The provided explanation was: "${originalQuestion.explanation}"
          
          The user has a follow-up question: "${userFollowUp}"
          
          Please provide a clear, concise answer to the user's follow-up question in the context of the original quiz item.`;

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
          });
          
          setFollowUpResponse(response.text);

      } catch (e) {
          console.error("Error asking follow-up:", e);
          setFollowUpResponse("Sorry, I couldn't process that follow-up question. Please try again.");
      } finally {
          setIsGettingFollowUp(false);
      }
  };

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    const currentQuestion = questions[currentQuestionIndex];
    const newAnswer: UserAnswer = { ...currentQuestion, userAnswer: answer };
    setUserAnswers(prev => [...prev, newAnswer]);
    setFollowUpResponse(null);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setFollowUpResponse(null);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    if (!currentUser) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const answeredQuestions = [...userAnswers];
    const score = answeredQuestions.reduce((acc, ua) => {
      return ua.userAnswer === ua.answer ? acc + 1 : acc;
    }, 0);
    const percentage = Math.round((score / questions.length) * 100);
    const result: QuizResult = {
      id: new Date().toISOString(),
      userId: currentUser.id,
      examName: examName,
      date: Date.now(),
      score,
      percentage,
      totalQuestions: questions.length,
      userAnswers: answeredQuestions,
    };
    
    setQuizResult(result);
    if(currentUser.isPro) {
        userData.saveUserHistory(result);
        const newHistory = [result, ...history];
        setHistory(newHistory);
    }
    setView('score');
  };

  const handleRestart = () => {
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setSelectedAnswer(null);
    setQuizResult(null);
    setError(null);
    setView('home');
  };

  const handleUpgrade = () => {
      if (!currentUser) return;
      const updatedUser = { ...currentUser, isPro: true };
      userData.updateUser(updatedUser);
      authService.updateCurrentUser(updatedUser); // Update session
      setCurrentUser(updatedUser);
      setQuizCount(0);
      setView('home');
  };

  if (!currentUser) {
      return <Login onLoginSuccess={handleLogin} />;
  }

  const renderUserContent = () => {
    switch (view) {
      case 'quiz':
        const currentQuestion = questions[currentQuestionIndex];
        return (
          <div className="max-w-2xl mx-auto">
             <div className="mb-4 flex justify-between items-center">
                <button 
                  onClick={() => setView('home')} 
                  className="text-blue-500 hover:underline"
                >
                  &larr; Back to Home
                </button>
                {isTimedMode && (
                  <div className="bg-blue-100 text-blue-800 font-semibold px-3 py-1 rounded-full text-sm">
                    Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </div>
                )}
            </div>
            <ProgressBar 
              current={currentQuestionIndex + 1}
              total={questions.length}
            />
            <QuestionCard
              question={currentQuestion}
              userAnswer={selectedAnswer}
              onAnswer={handleAnswer}
              onNext={handleNext}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              isLastQuestion={currentQuestionIndex === questions.length - 1}
              isPro={currentUser.isPro}
              onAskFollowUp={askFollowUp}
              followUpResponse={followUpResponse}
              isGettingFollowUp={isGettingFollowUp}
            />
          </div>
        );
      case 'score':
        return (
          quizResult && (
            <ScoreScreen 
              result={quizResult} 
              onRestart={handleRestart}
              onViewDashboard={() => setView('dashboard')}
              isPro={currentUser.isPro}
            />
          )
        );
      case 'dashboard':
        return <Dashboard 
                  history={history} 
                  onGoHome={() => setView('home')} 
                  onStartWeaknessQuiz={(topics) => generateQuestions(topics, 10, true)} 
               />;
      case 'paywall':
        return <Paywall onUpgrade={handleUpgrade} />;
      case 'admin':
         return <AdminDashboard currentUser={currentUser} onGoHome={() => setView('home')} />;
      case 'home':
      default:
        return (
          <>
            {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</p>}
            <HomePage
              onStartQuiz={generateQuestions}
              onViewDashboard={() => setView('dashboard')}
              isPro={currentUser.isPro}
              onUpgrade={() => setView('paywall')}
              isGenerating={isGenerating}
              isTimedMode={isTimedMode}
              setIsTimedMode={setIsTimedMode}
            />
          </>
        );
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
        <header className="bg-white shadow-sm">
            <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">API & SIFE Certification Practice Exams</h1>
                <div className="flex items-center gap-4">
                  <span className="text-gray-600 hidden sm:inline">{currentUser.email}</span>
                  {(currentUser.role === 'ADMIN' || currentUser.role === 'SUB_ADMIN') && (
                      <button onClick={() => setView('admin')} className="font-semibold text-blue-600 hover:underline">Admin Panel</button>
                  )}
                  <button onClick={handleLogout} className="font-semibold text-gray-700 hover:underline">Logout</button>
                </div>
            </div>
        </header>
      <main className="container mx-auto p-4 md:p-8">
        {renderUserContent()}
      </main>
    </div>
  );
};

export default App;