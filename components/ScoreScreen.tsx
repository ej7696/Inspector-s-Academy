import React from 'react';
import { QuizResult } from '../types';

interface Props {
  result: QuizResult;
  onRestart: () => void;
  onGoHome: () => void;
  isPro: boolean;
  onViewDashboard: () => void;
  onRegenerate: () => void;
}

const ScoreScreen: React.FC<Props> = ({ result, onRestart, onGoHome, isPro, onViewDashboard, onRegenerate }) => {
  const scoreColor = result.percentage >= 70 ? 'text-green-600' : 'text-red-600';

  return (
    <div className="max-w-4xl mx-auto my-10 p-8 bg-white rounded-lg shadow-xl">
      <div className="text-center border-b pb-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Quiz Complete!</h1>
        <p className="text-gray-600 mb-6">Here's how you did on the "{result.examName}" exam.</p>
        
        <div className="mb-8">
          <p className="text-lg text-gray-700">Your Score:</p>
          <p className={`text-6xl font-bold ${scoreColor}`}>{result.percentage.toFixed(1)}%</p>
          <p className="text-gray-500 mt-2">({result.score} out of {result.totalQuestions} correct)</p>
        </div>

        <div className="flex justify-center gap-4 flex-wrap">
          <button 
            onClick={onRestart}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-blue-600 transition-colors"
          >
            Try This Quiz Again
          </button>
          {isPro && (
             <button 
                onClick={onViewDashboard}
                className="bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-indigo-600 transition-colors"
            >
                View Performance Dashboard
            </button>
          )}
          <button 
            onClick={onGoHome}
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold text-lg hover:bg-gray-300 transition-colors"
          >
            Back to Home
          </button>
        </div>
        {isPro && (
            <button
                onClick={onRegenerate}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold text-lg transition-colors mt-6"
            >
                🔁 Regenerate Exam (120 New Questions)
            </button>
        )}
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Review Your Answers</h2>
        <ul className="space-y-4">
          {result.userAnswers.map((ua, index) => (
            <li key={index} className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-800 mb-2">{index + 1}. {ua.question}</p>
              <p className={`font-medium ${ua.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                Your answer: {ua.userAnswer} {ua.isCorrect ? ' (Correct)' : ' (Incorrect)'}
              </p>
              {!ua.isCorrect && (
                <p className="font-medium text-green-700">Correct answer: {ua.answer}</p>
              )}
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
};

export default ScoreScreen;