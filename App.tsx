import React, { useState, useCallback } from 'react';
import HomePage from './components/HomePage';
import QuestionCard from './components/QuestionCard';
import QuizCompleteScreen from './components/ScoreScreen';
import Paywall from './components/Paywall';
import { Question, UserAnswer } from './types';
import { GoogleGenAI, Type } from "@google/genai";

type GameState = 'home' | 'quiz' | 'complete' | 'paywall';

function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gameState, setGameState] = useState<GameState>('home');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quizCount, setQuizCount] = useState(0);

  const startQuiz = useCallback(async (topic: string, numQuestions: number) => {
    if (quizCount >= 3) {
      setGameState('paywall');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      const prompt = `Generate ${numQuestions} multiple-choice questions for the "${topic}" certification exam. The questions should simulate a real exam environment. For each question, provide: a "question" text, an array of 4 "options" (each starting with "A. ", "B. ", "C. ", or "D. "), the correct "answer" string which must be one of the options, a "reference" to the relevant API document section, a direct "quote" from that section that justifies the answer, and a concise "explanation" in simpler terms. Format the output as a JSON array of objects with these keys: "question", "options", "answer", "reference", "quote", "explanation".`;

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
                explanation: { type: Type.STRING },
                reference: { type: Type.STRING },
                quote: { type: Type.STRING },
              },
              required: ["question", "options", "answer", "explanation", "reference", "quote"],
            },
          },
        },
      });
      
      const jsonText = response.text.trim();
      const generatedQuestions = JSON.parse(jsonText);
      setQuestions(generatedQuestions);
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setGameState('quiz');
      setQuizCount(prev => prev + 1);
    } catch (e) {
      console.error(e);
      setError('Failed to generate questions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [quizCount]);

  const handleAnswer = (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    const newUserAnswer: UserAnswer = {
      ...currentQuestion,
      userAnswer: answer,
    };
    setUserAnswers(prev => [...prev, newUserAnswer]);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setGameState('complete');
    }
  };

  const restartQuiz = () => {
    setGameState('home');
    setQuestions([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex items-center justify-center py-8">
      <main className="container mx-auto p-6 max-w-3xl bg-white rounded-xl shadow-lg">
        {gameState === 'home' && (
          <HomePage
            onStartQuiz={startQuiz}
            loading={loading}
            error={error}
          />
        )}
        {gameState === 'quiz' && questions.length > 0 && (
          <>
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-indigo-700">Progress</span>
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
            />
          </>
        )}
        {gameState === 'complete' && (
          <QuizCompleteScreen onRestart={restartQuiz} />
        )}
        {gameState === 'paywall' && <Paywall />}
      </main>
    </div>
  );
}

export default App;