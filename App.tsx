import React, { useState, useCallback, useEffect, useRef } from 'react';
import HomePage from './components/HomePage';
import QuestionCard from './components/QuestionCard';
import ScoreScreen from './components/ScoreScreen';
import Paywall from './components/Paywall';
import Dashboard from './components/Dashboard';
import { Question, UserAnswer, QuizResult } from './types';
import { GoogleGenAI, Type } from "@google/genai";
import { getHistory, saveHistory, getProStatus, saveProStatus } from './services/storage';

type GameState = 'home' | 'quiz' | 'complete' | 'paywall' | 'dashboard';

function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gameState, setGameState] = useState<GameState>('home');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Pro features state
  const [isPro, setIsPro] = useState(getProStatus());
  const [quizCount, setQuizCount] = useState(0); // This now tracks quizzes per session for free users
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>(getHistory());

  // Timer state
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  // FIX: Replaced NodeJS.Timeout with `number` because `setInterval` in the browser returns a number, not a NodeJS.Timeout object.
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (gameState === 'quiz' && timeLeft !== null && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeLeft === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      setGameState('complete');
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, timeLeft]);


  const startQuiz = useCallback(async (topic: string, numQuestions: number, isTimed: boolean, weakTopics: string[] = []) => {
    if (!isPro && quizCount >= 3) {
      setGameState('paywall');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      
      let prompt = `Generate ${numQuestions} multiple-choice questions for the "${topic}" certification exam.`;
      if (weakTopics.length > 0) {
        prompt += ` Focus specifically on these topics: ${weakTopics.join(', ')}.`;
      }
      prompt += ` The questions should simulate a real exam environment. For each question, provide: a "question" text, an array of 4 "options" (each starting with "A. ", "B. ", "C. ", or "D. "), the correct "answer" string which must be one of the options, a relevant "category" or sub-topic (e.g., "Weld Inspection", "Corrosion Calculation"), a "reference" to the relevant API document section, a direct "quote" from that section that justifies the answer, and a concise "explanation" in simpler terms. Format the output as a JSON array of objects with these keys: "question", "options", "answer", "category", "reference", "quote", "explanation".`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
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
                category: { type: Type.STRING },
                explanation: { type: Type.STRING },
                reference: { type: Type.STRING },
                quote: { type: Type.STRING },
              },
              required: ["question", "options", "answer", "category", "explanation", "reference", "quote"],
            },
          },
        },
      });
      
      const jsonText = response.text.trim();
      const generatedQuestions: Question[] = JSON.parse(jsonText);
      
      setQuestions(generatedQuestions);
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setGameState('quiz');
      if (isTimed) {
        setTimeLeft(numQuestions * 90); // 90 seconds per question
      } else {
        setTimeLeft(null);
      }
      if (!isPro) {
        setQuizCount(prev => prev + 1);
      }
    } catch (e) {
      console.error(e);
      setError('Failed to generate questions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [quizCount, isPro]);

  const handleAnswer = (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    const newUserAnswer: UserAnswer = {
      ...currentQuestion,
      userAnswer: answer,
    };
    setUserAnswers(prev => [...prev, newUserAnswer]);
  };

  const handleQuizCompletion = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (isPro) {
        const score = userAnswers.filter(ua => ua.userAnswer === ua.answer).length;
        const totalQuestions = questions.length;
        const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
        
        const newResult: QuizResult = {
            id: new Date().toISOString(),
            examName: questions[0] ? `Practice Exam for ${questions[0].category.split(' ')[0]}` : 'General Practice',
            date: Date.now(),
            score,
            percentage,
            totalQuestions,
            userAnswers: userAnswers
        };
        const updatedHistory = [...quizHistory, newResult];
        setQuizHistory(updatedHistory);
        saveHistory(updatedHistory);
    }
    setGameState('complete');
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleQuizCompletion();
    }
  };

  const goToHome = () => {
    setGameState('home');
    setQuestions([]);
    setTimeLeft(null);
  };
  
  const handleUpgrade = () => {
    setIsPro(true);
    saveProStatus(true);
    setQuizCount(0);
    setGameState('home');
  };

  const handleAskFollowUp = async (context: { question: string, explanation: string }, followUpQuestion: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        const prompt = `In the context of the question "${context.question}" and its explanation "${context.explanation}", please answer the following user question: "${followUpQuestion}". Be clear and concise.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (e) {
        console.error("Follow-up question failed:", e);
        return "Sorry, I couldn't process your question right now.";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex items-center justify-center py-8">
      <main className="container mx-auto p-6 max-w-3xl bg-white rounded-xl shadow-lg">
        {gameState === 'home' && (
          <HomePage
            onStartQuiz={startQuiz}
            loading={loading}
            error={error}
            isPro={isPro}
            onNavigateToDashboard={() => setGameState('dashboard')}
          />
        )}
        {gameState === 'dashboard' && (
          <Dashboard
            history={quizHistory}
            onGoBack={() => setGameState('home')}
            onStartTargetedQuiz={startQuiz}
          />
        )}
        {gameState === 'quiz' && questions.length > 0 && (
          <>
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-indigo-700">Progress</span>
                    {timeLeft !== null && (
                      <span className="text-sm font-semibold text-red-600">
                        Time Left: {Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-gray-600">
                        {currentQuestionIndex + 1} / {questions.length}
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                    ></div>
                </div>
            </div>
            <QuestionCard
              question={questions[currentQuestionIndex]}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              onAnswer={handleAnswer}
              onNext={handleNextQuestion}
              isPro={isPro}
              onAskFollowUp={handleAskFollowUp}
            />
          </>
        )}
        {gameState === 'complete' && (
          <ScoreScreen 
            userAnswers={userAnswers} 
            onRestart={goToHome} 
            onNavigateToDashboard={() => setGameState('dashboard')}
            isPro={isPro}
          />
        )}
        {gameState === 'paywall' && <Paywall onUpgrade={handleUpgrade} />}
      </main>
    </div>
  );
}

export default App;