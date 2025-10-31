import React, { useState, useCallback } from 'react';
import HomePage from './components/HomePage';
import QuestionCard from './components/QuestionCard';
import ScoreScreen from './components/ScoreScreen';
import Paywall from './components/Paywall';
import { Question, UserAnswer } from './types';
// FIX: Import GoogleGenAI and Type from @google/genai
import { GoogleGenAI, Type } from "@google/genai";

type GameState = 'home' | 'quiz' | 'score' | 'paywall';

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
      // FIX: Initialize GoogleGenAI with apiKey from environment variables.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      const prompt = `Generate ${numQuestions} multiple-choice questions about ${topic}. Each question should have 4 options. Format the output as a JSON array, where each object has "question", "options" (an array of 4 strings), "answer" (the correct option string), and "explanation".`;

      // FIX: Use ai.models.generateContent to generate content.
      const response = await ai.models.generateContent({
        // FIX: Use a recommended model for complex text tasks.
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
          // FIX: Set responseMimeType to application/json for JSON output.
          responseMimeType: "application/json",
          // FIX: Define a response schema for structured JSON output.
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
              },
              required: ["question", "options", "answer", "explanation"],
            },
          },
        },
      });
      
      // FIX: Extract text from response correctly using response.text and parse it.
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
      setGameState('score');
    }
  };

  const restartQuiz = () => {
    setGameState('home');
    setQuestions([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex items-center justify-center">
      <main className="container mx-auto p-4 max-w-2xl bg-white rounded-xl shadow-lg">
        {gameState === 'home' && (
          <HomePage
            onStartQuiz={startQuiz}
            loading={loading}
            error={error}
          />
        )}
        {gameState === 'quiz' && questions.length > 0 && (
          <QuestionCard
            question={questions[currentQuestionIndex]}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            onAnswer={handleAnswer}
            onNext={handleNextQuestion}
          />
        )}
        {gameState === 'score' && (
          <ScoreScreen userAnswers={userAnswers} onRestart={restartQuiz} />
        )}
        {gameState === 'paywall' && <Paywall />}
      </main>
    </div>
  );
}

export default App;
